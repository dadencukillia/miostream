import { type Static, Type } from "typebox";
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import pino from "pino";

/** An err serializer for Fastify tailored to custom errors from this module
  *
  * @example
  * ```ts
  * const fastify = Fastify({
  *   logger: {
  *     enabled: true,
  *     serializers: {
  *       err: fastifyErrSerializer
  *     }
  *   }
  * });
  * ```
  */
export function fastifyErrSerializer(e: FastifyError): {
    type: string;
    message: string;
    stack: string;
    [key: string]: unknown;
} {
  return e instanceof CustomError ? e.toLog() : pino.stdSerializers.err(e);
}

function isFastifyValidationError(error: unknown): error is FastifyError {
  return (
    typeof error === "object" &&
    error !== null &&
    Array.isArray((error as FastifyError).validation)
  );
}

const serializeDetail = (d: unknown): unknown =>
  d instanceof Error ? {
    type: d.constructor.name,
    message: d.message,
    stack: d.stack ?? "",
    ...(d.cause ? { cause: serializeDetail(d.cause) } : {}),
  } : d;

/**
 * Represents a custom domain error with status code, error collection context,
 * and immutable structured details for logging.
 */
class CustomError extends Error {
  private _collection: ErrorsCollection;
  private _slug: string;
  private _statusCode: number;
  private _details: readonly unknown[] = [];
  
  /**
   * Creates an instance of CustomError.
   * 
   * @param collection - The error collection this error belongs to.
   * @param statusCode - The HTTP status code to return to the client.
   * @param message - The static, stable error message.
   */
  public constructor(collection: ErrorsCollection, slug: string, statusCode: number, message: string) {
    super(message);

    Object.setPrototypeOf(this, CustomError.prototype);

    this._slug = slug;
    this._collection = collection;
    this._statusCode = statusCode;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }

  /**
   * Gets the collection instance associated with this error.
   */
  public get collection(): ErrorsCollection {
    return this._collection;
  }

  /**
   * Gets the error slug.
   */
  public get slug(): string {
    return this._slug;
  }

  /**
   * Gets the HTTP status code.
   */
  public get statusCode(): number {
    return this._statusCode;
  }

  /**
   * Gets immutable structured details attached to the error for logging purposes.
   */
  public get details(): readonly unknown[] {
    return this._details;
  }

  /**
   * Returns a new error instance with an updated error slug while preserving existing details.
   * 
   * @param statusCode - The new HTTP status code.
   */
  public withSlug(slug: string) {
    const error = new CustomError(this._collection, slug, this._statusCode, this.message);
    const details = Object.freeze([...this._details]);
    error.stack = this.stack;
    error._details = details;
    return error;
  }

  /**
   * Returns a new error instance with an updated status code while preserving existing details.
   * 
   * @param statusCode - The new HTTP status code.
   */
  public withStatusCode(statusCode: number) {
    const error = new CustomError(this._collection, this._slug, statusCode, this.message);
    const details = Object.freeze([...this._details]);
    error.stack = this.stack;
    error._details = details;
    return error;
  }

  /**
   * Returns a new error instance with an updated message while preserving existing details.
   * 
   * @param message - The new error message.
   */
  public withMessage(message: string) {
    const error = new CustomError(this._collection, this._slug, this._statusCode, message);
    const details = Object.freeze([...this._details]);
    error.stack = this.stack;
    error._details = details;
    return error;
  }

  /**
   * Returns a new error instance with additional context/details appended.
   * 
   * @param details - Additional details or metadata payload.
   */
  public withDetails(...details: unknown[]) {
    const error = new CustomError(this._collection, this._slug, this._statusCode, this.message);
    const detailValues = Object.freeze([...this._details, ...details]);
    error.stack = this.stack;
    error._details = detailValues;
    return error;
  }

  public toLog() {
    return {
      type: "CustomError",
      message: this.message,
      statusCode: this._statusCode,
      slug: this._slug,
      collection: this._collection.name,
      details: this._details.map(serializeDetail),
      stack: this.stack ?? "",
    };
  }

  /**
   * Custom inspector for Node.js console and logging utilities to produce a clean JSON-like output.
   */
  public [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this._statusCode,
      slug: this._slug,
      collection: this._collection.name,
      details: this._details,
      stack: this.stack
    };
  }
}

/**
 * TypeBox schema definition for standardized API error responses.
 */
export const ErrorResponse = Type.Object({
  ok: Type.Literal(false),
  message: Type.String({ description: "error message" }),
  error: Type.String({ description: "slug helpful to differ errors" })
}, {
  examples: [{
    ok: false,
    message: "something went wrong",
    error: "unexpected-error"
  }],
});

/**
 * TypeScript type inferred from the ErrorResponse schema.
 */
export type ErrorResponseReturnType = Static<typeof ErrorResponse>;

/**
 * Manages a namespace collection of errors and provides a Fastify error handler middleware.
 */
export class ErrorsCollection {
  private _name: string;
  private _id: number;
  private static futureInstanceId = 0;

  /**
   * Creates an instance of ErrorsCollection.
   * 
   * @param name - Human-readable name of the error collection.
   */
  public constructor(name: string) {
    this._name = name;
    this._id = ErrorsCollection.futureInstanceId++;
  }

  /**
   * Gets the collection name.
   */
  public get name(): string {
    return this._name;
  }

  /**
   * Gets the unique numeric ID of the collection.
   */
  public get id(): number {
    return this._id;
  }

  /**
   * Creates a new CustomError bound to this collection.
   * 
   * @param slug - Error slug useful to differ different errors.
   * @param statusCode - HTTP status code.
   * @param message - Static error message.
   */
  public createError(slug: string, statusCode: number, message: string) {
    const error = new CustomError(this, slug, statusCode, message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, this.createError);
    }


    return error;
  }

  /**
   * Sets up the Fastify error handling hook for this collection or a group of safe collections.
   * 
   * @param fastify - The Fastify application instance.
   * @param safeCollections - Array of collections allowed to be handled by this error handler.
   * @param passValidationErrors - Whether to expose request validation errors.
   * @param passFrameworkErrors - Whether to preserve Fastify framework 4xx errors.
   */
  public setupErrorHandler(
    fastify: FastifyInstance,
    safeCollections: ErrorsCollection[] = [this],
    passValidationErrors: boolean = true,
    passFrameworkErrors: boolean = false
  ) {
    fastify.setErrorHandler((
      error: unknown,
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      const collectionIds = safeCollections.map(c => c.id);


      if (error instanceof CustomError) {
        request.log.error(error.toLog());

        if (
          collectionIds.length > 0 && 
          collectionIds.includes(error.collection.id)
        ) {
          return reply
            .status(error.statusCode)
            .send({
              ok: false,
              message: error.message,
              error: error.slug
            } as ErrorResponseReturnType);
        }
      } else {
        request.log.error(error);
      }

      if (passValidationErrors) {
        if (isFastifyValidationError(error) && error.validation) {
          return reply
            .status(400)
            .send({
              ok: false,
              message: error.message,
              error: "validation"
            } as ErrorResponseReturnType);
        }
      }

      if (
        passFrameworkErrors &&
        error instanceof Error &&
        !(error instanceof CustomError) &&
        !isFastifyValidationError(error)
      ) {
        const frameworkError = error as FastifyError;
        if (
          frameworkError.code?.startsWith("FST_ERR_") &&
          Number.isInteger(frameworkError.statusCode) &&
          frameworkError.statusCode! >= 400 && frameworkError.statusCode! < 500
        ) {
          return reply.status(frameworkError.statusCode!).send({
            ok: false,
            message: frameworkError.message,
            error: "fastify"
          } as ErrorResponseReturnType);
        }
      }

      return reply
        .status(500)
        .send({
          ok: false,
          message: "something went wrong",
          error: "unexpected-error"
        } as ErrorResponseReturnType);
    });
  }
}

/**
 * A typed dictionary/catalog of errors extending ErrorsCollection for convenient slug-based lookup.
 *
 * @example
 * ```ts
 * const UserErrors = new ErrorsSet("user_errors", {
 *  "user_not_found": [404, "user is not found"],
 * });
 *
 * // autocompletion is present
 * throw UserErrors.error("user_not_found"); 
 * ```
 */
export class ErrorsSet<T extends { [K in keyof T]-?: [number, string] }> extends ErrorsCollection {
  private _errors: T;

  /**
   * Creates an instance of ErrorsSet.
   * 
   * @param name - Name of the errors collection.
   * @param errors - A record object mapping error slugs to [statusCode, message] tuples.
   */
  public constructor(name: string, errors: T) {
    super(name);

    this._errors = errors;
  }

  /**
   * Retrieves a fresh CustomError instance by its slug key.
   * 
   * @param slug - Key of the error definition.
   */
  public error<S extends keyof T & string>(slug: S): CustomError {
    const error = this._errors[slug];
    const errorInstance = super.createError(slug, error[0], error[1]);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(errorInstance, this.error);
    }

    return errorInstance;
  }
}

