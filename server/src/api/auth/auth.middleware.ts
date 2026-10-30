import { FastifyReply, FastifyRequest } from "fastify";
import "../../context";

export class AuthContext {
  private _sessionId: number;
  private _userId: string;
  private _nickname: string;
  private _fullName: string;
  private _avatarUrl: string;
  private _role: string;
  private _status: string;

  public constructor(sessionId: number, userId: string, nickname: string, fullName: string, avatarUrl: string, role: string, status: string) {
    this._sessionId = sessionId;
    this._userId = userId.trim().toLowerCase();
    this._nickname = nickname.trim();
    this._fullName = fullName.trim();
    this._avatarUrl = avatarUrl.trim();
    this._role = role.trim().toLowerCase();
    this._status = status.trim().toLowerCase();
  }

  public get userId(): string {
    return this._userId;
  }

  public get nickname(): string {
    return this._nickname;
  }

  public get fullName(): string {
    return this._fullName;
  }

  public get avatarUrl(): string {
    return this._avatarUrl;
  }

  public get role(): string {
    return this._role;
  }

  public get status(): string {
    return this._status;
  }

  public syncUser() {
    // TODO: update class fields according
    // to the database's state
  }

  public generateAccessToken() {
    // TODO: replace onto the real token generation
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJoZWxsbyI6IndvcmxkIn0.E-kYKw8QcPqfOLmuT6IW5KZ7qytQQkh4YSC1c-0HWGU";
  }

  public logout(req: FastifyRequest, resp: FastifyReply) {
    // TODO: real session deletion, cookies cleaning
  }
};

export function authMiddleware(req: FastifyRequest, _resp: FastifyReply, done: () => void) {
  // TODO: replace onto the real auth operations
  req.auth = new AuthContext(
    Math.round(Date.now()),
    "00000000-0000-0000-0000-000000000000",
    "exampleUser", "Jack Jackson",
    "https://i.pravatar.cc/256",
    "admin", "active"
  );

  done();
}
