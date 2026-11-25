import type { FastifyReply, FastifyRequest, preHandlerAsyncHookHandler, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault } from "fastify";
import { timingSafeEqual } from "node:crypto";
import * as config from "@config";
import { ErrorResponse } from "@lib/errorsCollection";
import Type, { Static } from "typebox";

const KEY_LENGTH = 16;
const KEY_PREFIX_LENGTH = 8;
const HEADER_SIZE = 26;

// Helpers

type AnyRoutePreHandler = preHandlerAsyncHookHandler<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  any
>;

function b64uDecode(s: string): Uint8Array | null {
  try {
    const bytes = Uint8Array.fromBase64(s, { alphabet: "base64url" });
    // відсікаємо неканонічні кодування
    if (bytes.toBase64({ alphabet: "base64url", omitPadding: true }) !== s) return null;
    return bytes;
  } catch {
    return null;
  }
}

function hmac(data: Uint8Array): Buffer {
  return Buffer.from(
    new Bun.CryptoHasher("sha256", config.CHALLENGE_HMAC_SECRET).update(data).digest()
  );
}

// Interfaces

export interface ChallengeOptions {
  scopeSlug: string,
  challengeDeadlineSeconds: number,
  hardLevel: number
}

export interface ChallengeTokenPayload {
  challengeId: Uint8Array, // 16 bytes
  expiresAt: bigint, // 8 bytes
  keyLength: number, // 1 byte
  hashPrefix: Uint8Array, // variable + 1 byte
  keyPrefix: Uint8Array // variable
}

export const ChallengeErrorResponse = Type.Interface([ErrorResponse], {
  challengeToken: Type.String({ description: "Challenge token" })
});

export type ChallengeErrorResponseType = Static<typeof ChallengeErrorResponse>;

export function generateChallengeToken(opts: ChallengeOptions): string {
  if (!Number.isInteger(opts.hardLevel) || opts.hardLevel < 1 || opts.hardLevel > 32)
    throw new RangeError("hardLevel must be an integer in 1..32");
  if (!(opts.challengeDeadlineSeconds > 0))
    throw new RangeError("challengeDeadlineSeconds must be > 0");

  const payload: ChallengeTokenPayload = {
    challengeId: crypto.getRandomValues(new Uint8Array(16)),
    expiresAt: BigInt(Math.floor(Date.now() / 1_000 + opts.challengeDeadlineSeconds)),
    hashPrefix: crypto.getRandomValues(new Uint8Array(opts.hardLevel)),
    keyPrefix: crypto.getRandomValues(new Uint8Array(KEY_PREFIX_LENGTH)),
    keyLength: KEY_LENGTH,
  };

  const token = serializeChallengeTokenPayload(payload);
  const signature = hmac(token).toBase64({ alphabet: "base64url", omitPadding: true });
  return `${token.toBase64({ alphabet: "base64url", omitPadding: true })}.${signature}`;
}

export function verifyChallengeToken(challengeToken: string): ChallengeTokenPayload | false {
  const split = challengeToken.split(".");
  if (split.length !== 2) return false;
  const [payloadPart, signaturePart] = split;
  if (!payloadPart || !signaturePart) return false;

  const payloadBytes = b64uDecode(payloadPart);
  const signatureBytes = b64uDecode(signaturePart);
  if (!payloadBytes || !signatureBytes || payloadBytes.byteLength < HEADER_SIZE) return false;

  const expected = hmac(payloadBytes);
  if (signatureBytes.byteLength !== expected.byteLength) return false;
  if (!timingSafeEqual(signatureBytes, expected)) return false;

  const buffer = Buffer.from(payloadBytes);
  const expiresAt = buffer.readBigUInt64BE(16);
  if (BigInt(Math.floor(Date.now() / 1_000)) >= expiresAt) return false;

  const keyLength = buffer.readUInt8(24);
  const hashPrefixLength = buffer.readUInt8(25);
  if (hashPrefixLength === 0 || hashPrefixLength > 32) return false;

  const keyPrefixStart = HEADER_SIZE + hashPrefixLength;
  const keyPrefixLength = buffer.byteLength - keyPrefixStart;
  if (keyPrefixLength <= 0 || keyPrefixLength >= keyLength) return false;

  return {
    challengeId: payloadBytes.slice(0, 16),
    expiresAt,
    keyLength,
    hashPrefix: payloadBytes.slice(HEADER_SIZE, keyPrefixStart),
    keyPrefix: payloadBytes.slice(keyPrefixStart),
  };
}

export function verifySolutionToken(solutionToken: string): ChallengeTokenPayload | false {
  const split = solutionToken.split(".");
  if (split.length !== 3) return false;
  const [solutionPart, payloadPart, signaturePart] = split;
  if (!solutionPart || !payloadPart || !signaturePart) return false;

  const challenge = verifyChallengeToken(`${payloadPart}.${signaturePart}`);
  if (!challenge) return false;

  const solution = b64uDecode(solutionPart);
  if (!solution || solution.byteLength !== challenge.keyLength - challenge.keyPrefix.byteLength)
    return false;

  const key = Buffer.alloc(challenge.keyLength);
  key.set(challenge.keyPrefix, 0);
  key.set(solution, challenge.keyPrefix.byteLength);

  const hash = Buffer.from(new Bun.CryptoHasher("sha256").update(key).digest());
  const n = challenge.hashPrefix.byteLength;
  if (hash.byteLength < n) return false;
  if (!timingSafeEqual(hash.subarray(0, n), challenge.hashPrefix)) return false;

  return challenge;
}

function serializeChallengeTokenPayload(payload: ChallengeTokenPayload): Uint8Array {
  const token = Buffer.allocUnsafe(16 + 8 + 1 + 1 + payload.hashPrefix.byteLength + payload.keyPrefix.byteLength);
  token.set(payload.challengeId, 0);
  token.writeBigUInt64BE(payload.expiresAt, 16);
  token.writeUInt8(payload.keyLength, 24);
  token.writeUInt8(payload.hashPrefix.byteLength, 25);
  token.set(payload.hashPrefix, 26);
  token.set(payload.keyPrefix, 26 + payload.hashPrefix.byteLength);

  return token;
}

export const challengeMiddleware = (opts: ChallengeOptions): AnyRoutePreHandler => async (request: FastifyRequest, reply: FastifyReply) => {
  const fallback = async (_request: FastifyRequest, reply: FastifyReply) => {
    const body: ChallengeErrorResponseType = {
      ok: false,
      error: "challenge-required",
      message: "provide challenge solution token",
      challengeToken: generateChallengeToken(opts)
    };
    reply
      .header("Cache-Control", "no-store")
      .status(403)
      .send(body);
  };

  const solutionToken = (request.query as { solutionToken?: unknown }).solutionToken ?? "";
  if (typeof solutionToken !== "string" || solutionToken.length === 0) return await fallback(request, reply);

  const payload = verifySolutionToken(solutionToken);
  if (!payload) return await fallback(request, reply);

  // TODO: add redis denylist
};
