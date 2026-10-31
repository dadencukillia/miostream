import { Static, Type } from "@sinclair/typebox";
import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
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
  private _statusCode: number;
  private _details: readonly any[] = [];
  
  /**
   * Creates an instance of CustomError.
   * 
   * @param collection - The error collection this error belongs to.
   * @param statusCode - The HTTP status code to return to the client.
   * @param message - The static, stable error message.
   */
  public constructor(collection: ErrorsCollection, statusCode: number, message: string) {
    super(message);

    Object.setPrototypeOf(this, CustomError.prototype);

    this._collection = collection;
    this._statusCode = statusCode;
  }

  /**
   * Gets the collection instance associated with this error.
   */
  public get collection(): ErrorsCollection {
    return this._collection;
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
  public get details(): readonly any[] {
    return this._details;
  }

  /**
   * Returns a new error instance with an updated status code while preserving existing details.
   * 
   * @param statusCode - The new HTTP status code.
   */
  public withStatusCode(statusCode: number) {
    const error = new CustomError(this._collection, statusCode, this.message);
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
    const error = new CustomError(this._collection, this._statusCode, message);
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
  public withDetails(...details: any[]) {
    const error = new CustomError(this._collection, this._statusCode, this.message);
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
  ok: Type.Boolean(),
  message: Type.String()
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
   * @param statusCode - HTTP status code.
   * @param message - Static error message.
   */
  public createError(statusCode: number, message: string) {
    return new CustomError(this, statusCode, message);
  }

  /**
   * Sets up the Fastify error handling hook for this collection or a group of safe collections.
   * 
   * @param fastify - The Fastify application instance.
   * @param safeCollections - Array of collections allowed to be handled by this error handler.
   */
  public setupErrorHandler(
    fastify: FastifyInstance,
    safeCollections: ErrorsCollection[] = [this]
  ) {
    fastify.setErrorHandler((
      error: unknown,
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      const collectionIds = safeCollections.map(c => c.id);

      request.log.error(error);

      if (error instanceof CustomError) {
        if (
          collectionIds.length > 0 && 
          collectionIds.includes(error.collection.id)
        ) {
          return reply
            .status(error.statusCode)
            .send({
              ok: false,
              message: error.message
            } as ErrorResponseReturnType);
        }
      }

      return reply
        .status(500)
        .send({
          ok: false,
          message: "unknown error"
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
export class ErrorsSet<T extends {[Key: string]: [number, string]}> extends ErrorsCollection {
  private _errors: Map<keyof T, CustomError> = new Map();

  /**
   * Creates an instance of ErrorsSet.
   * 
   * @param name - Name of the errors collection.
   * @param errors - A record object mapping error slugs to [statusCode, message] tuples.
   */
  public constructor(name: string, errors: T) {
    super(name);

    for (const msg in errors) {
      const slug = msg;
      const [ statusCode, message ] = errors[slug]!;
      this._errors.set(slug, super.createError(statusCode, message));
    }
  }

  /**
   * Retrieves a fresh CustomError instance by its slug key.
   * 
   * @param slug - Key of the error definition.
   */
  public error(slug: keyof T): CustomError {
    const error = this._errors.get(slug)!;

    return super.createError(error.statusCode, error.message);
  }
}
