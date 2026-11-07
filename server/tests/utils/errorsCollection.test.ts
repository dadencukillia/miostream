import { describe, expect, test } from "bun:test";
import Fastify, { type FastifyError } from "fastify";
import pino from "pino";
import { Value } from "typebox/value";
import {
  ErrorResponse,
  ErrorsCollection,
  ErrorsSet,
  fastifyErrSerializer,
} from "../../src/utils/errorsCollection";

describe("ErrorsCollection", () => {
  test("identifies collections by instance even when their names match", () => {
    const first = new ErrorsCollection("users");
    const second = new ErrorsCollection("users");
    expect(first.name).toBe("users");
    expect(Number.isInteger(first.id)).toBe(true);
    expect(second.id).not.toBe(first.id);
    const error = first.createError(404, "User not found");
    expect(error).toBeInstanceOf(Error);
    expect(error.collection).toBe(first);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("User not found");
    expect(error.details).toEqual([]);
  });

  test("copies errors without changing the original or losing context and stack", () => {
    const collection = new ErrorsCollection("users");
    const original = collection.createError(404, "User not found");
    const context = { userId: "missing" };
    const detailed = original.withDetails(context);
    const changedStatus = detailed.withStatusCode(410);
    const changedMessage = detailed.withMessage("User removed");
    const appended = detailed.withDetails("lookup failed", null);

    expect(original.details).toEqual([]);
    expect(detailed.details).toEqual([context]);
    expect(detailed.statusCode).toBe(404);
    expect(detailed.message).toBe("User not found");
    expect(changedStatus.statusCode).toBe(410);
    expect(changedStatus.message).toBe("User not found");
    expect(changedMessage.message).toBe("User removed");
    expect(changedMessage.statusCode).toBe(404);
    expect(appended.details).toEqual([context, "lookup failed", null]);
    for (const copy of [detailed, changedStatus, changedMessage, appended]) {
      expect(copy).not.toBe(original);
      expect(copy.collection).toBe(collection);
      expect(copy.stack).toBe(original.stack);
      expect(Object.isFrozen(copy.details)).toBe(true);
    }
    expect(changedStatus.details).toEqual(detailed.details);
    expect(changedStatus.details).not.toBe(detailed.details);
    expect(changedMessage.details).toEqual(detailed.details);
    expect(changedMessage.details).not.toBe(detailed.details);
  });

  test("supports chained overrides, empty details, and an empty message", () => {
    const error = new ErrorsCollection("users").createError(400, "Invalid")
      .withDetails().withStatusCode(422).withMessage("").withDetails(0, false, undefined);
    expect(error.statusCode).toBe(422);
    expect(error.message).toBe("");
    expect(error.details).toEqual([0, false, undefined]);
    expect(() => (error.details as unknown[]).push("extra")).toThrow();
  });
});

describe("error serialization", () => {
  test("serializes nested Error causes while preserving non-error metadata", () => {
    const cause = new TypeError("invalid input", { cause: { field: "email" } });
    const detail = new Error("lookup failed", { cause });
    const metadata = { userId: "missing" };
    const error = new ErrorsCollection("users").createError(404, "User not found")
      .withDetails(detail, metadata, null, false, 0, "context");
    expect(error.toLog()).toEqual({
      type: "CustomError", message: "User not found", statusCode: 404,
      collection: "users", stack: error.stack,
      details: [{
        type: "Error", message: "lookup failed", stack: detail.stack,
        cause: {
          type: "TypeError", message: "invalid input", stack: cause.stack,
          cause: { field: "email" },
        },
      }, metadata, null, false, 0, "context"],
    });
    expect(error.details[0]).toBe(detail);
    expect(error.toLog().details[1]).toBe(metadata);
    expect(fastifyErrSerializer(error as FastifyError)).toEqual(error.toLog());
  });

  test("uses empty stack strings when errors have no stack", () => {
    const detail = new Error("detail");
    delete detail.stack;
    const error = new ErrorsCollection("users").createError(500, "failed").withDetails(detail);
    delete error.stack;
    expect(error.toLog().stack).toBe("");
    expect(error.toLog().details).toEqual([{ type: "Error", message: "detail", stack: "" }]);
  });

  test("delegates ordinary Fastify errors to the standard Pino serializer", () => {
    const error = Object.assign(new Error("database unavailable", { cause: new Error("connection refused") }), {
      code: "DB_UNAVAILABLE", statusCode: 503,
    });
    expect(fastifyErrSerializer(error)).toEqual(pino.stdSerializers.err(error));
  });

  test("exposes structured context to the custom Node inspector", () => {
    const error = new ErrorsCollection("users").createError(409, "Conflict").withDetails({ id: 1 });
    const inspect = (error as unknown as Record<symbol, () => unknown>)[Symbol.for("nodejs.util.inspect.custom")]!;
    expect(inspect.call(error)).toEqual({
      name: error.name, message: "Conflict", statusCode: 409,
      collection: "users", details: [{ id: 1 }], stack: error.stack,
    });
  });
});

describe("ErrorsSet", () => {
  test("looks up each catalog entry and returns independent errors", () => {
    const errors = new ErrorsSet("users", {
      missing: [404, "User not found"], conflict: [409, "User exists"],
    });
    const first = errors.error("missing");
    const second = errors.error("missing");
    expect(first).not.toBe(second);
    expect(first.collection).toBe(errors);
    expect([first.statusCode, first.message]).toEqual([404, "User not found"]);
    first.message = "mutated by caller";
    expect(errors.error("missing").message).toBe("User not found");
    expect(second.details).toEqual([]);
    expect([second.statusCode, second.message]).toEqual([404, "User not found"]);
    const conflict = errors.error("conflict");
    expect(conflict.collection).toBe(errors);
    expect([conflict.statusCode, conflict.message]).toEqual([409, "User exists"]);
  });
});

describe("ErrorResponse schema", () => {
  test.each([
    [{ ok: false, message: "unknown error" }, true],
    [{ ok: false, message: "" }, true],
    [{ ok: true, message: "error" }, false],
    [{ ok: false }, false],
    [{ message: "error" }, false],
    [{ ok: false, message: 500 }, false],
    [null, false],
  ])("validates %j", (response, valid) => {
    expect(Value.Check(ErrorResponse, response)).toBe(valid);
  });
});

describe("Fastify error handler", () => {
  test.each([true, false])("logs private error context without including it in the response (custom=%s)", async (custom) => {
    const collection = new ErrorsCollection("users");
    const entries: Record<string, unknown>[] = [];
    const logger = pino({ level: "error" }, {
      write(line: string) { entries.push(JSON.parse(line)); },
    });
    const app = Fastify({ loggerInstance: logger });
    collection.setupErrorHandler(app);
    const error = custom
      ? collection.createError(503, "Service unavailable").withDetails("private context")
      : new Error("private context");
    app.get("/", () => { throw error; });
    try {
      const response = await app.inject("/");
      expect(response.statusCode).toBe(custom ? 503 : 500);
      expect(response.json()).toEqual({ ok: false, message: custom ? "Service unavailable" : "unknown error" });
      expect(entries).toHaveLength(1);
      if (custom) {
        expect(entries[0]).toMatchObject({
          level: 50, type: "CustomError", collection: "users",
          statusCode: 503, details: ["private context"],
        });
      } else {
        expect(entries[0]).toMatchObject({ level: 50, err: { message: "private context", stack: error.stack } });
      }
    } finally {
      await app.close();
    }
  });

  test.each(["default", "multiple", "same name", "empty", "explicit exclusion"])(
    "enforces collection permissions: %s", async (mode) => {
      const owner = new ErrorsCollection("users");
      const other = new ErrorsCollection("users");
      const app = Fastify();
      if (mode === "default" || mode === "same name") owner.setupErrorHandler(app);
      else owner.setupErrorHandler(app, mode === "multiple" ? [owner, other] : mode === "empty" ? [] : [other]);
      const source = mode === "same name" || mode === "multiple" ? other : owner;
      app.get("/", () => { throw source.createError(409, "Conflict").withDetails("private detail"); });
      try {
        const response = await app.inject("/");
        const allowed = mode === "default" || mode === "multiple";
        expect(response.statusCode).toBe(allowed ? 409 : 500);
        expect(response.json()).toEqual({ ok: false, message: allowed ? "Conflict" : "unknown error" });
      } finally {
        await app.close();
      }
    },
  );

  test.each([true, false])("handles real request validation with passValidationErrors=%s", async (passValidationErrors) => {
    const app = Fastify();
    new ErrorsCollection("users").setupErrorHandler(app, [], passValidationErrors);
    let handled = false;
    app.post("/", {
      schema: { body: { type: "object", required: ["email"], properties: { email: { type: "string" } } } },
    }, () => { handled = true; return { ok: true }; });
    try {
      const response = await app.inject({ method: "POST", url: "/", payload: {} });
      expect(handled).toBe(false);
      expect(response.statusCode).toBe(passValidationErrors ? 400 : 500);
      expect(response.json()).toEqual({
        ok: false,
        message: passValidationErrors ? "body must have required property 'email'" : "unknown error",
      });
    } finally {
      await app.close();
    }
  });

  test.each([undefined, null, {}, "invalid"])("does not mistake validation=%j for a validation error", async (validation) => {
    const app = Fastify();
    new ErrorsCollection("users").setupErrorHandler(app);
    app.get("/", () => { throw Object.assign(new Error("private database details"), { statusCode: 401, validation }); });
    try {
      const response = await app.inject("/");
      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ ok: false, message: "unknown error" });
    } finally {
      await app.close();
    }
  });

  test("treats an empty validation array as a validation error", async () => {
    const app = Fastify();
    new ErrorsCollection("users").setupErrorHandler(app);
    app.get("/", () => { throw Object.assign(new Error("Invalid input"), { validation: [] }); });
    try {
      const response = await app.inject("/");
      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ ok: false, message: "Invalid input" });
    } finally {
      await app.close();
    }
  });
});
