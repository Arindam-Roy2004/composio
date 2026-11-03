// Ported from Sagewell backend/shared/libs/errors.js, plus RateLimitError and UpstreamError.

export type ErrorDetails = unknown;

export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational = true;
  readonly details?: ErrorDetails;

  constructor(message: string, statusCode = 500, details?: ErrorDetails) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    if (details !== undefined) this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: ErrorDetails) {
    super(message, 400, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: ErrorDetails) {
    super(message, 422, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "Request body too large") {
    super(message, 413);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = "Content-Type must be application/json") {
    super(message, 415);
  }
}

export class RateLimitError extends AppError {
  readonly retryAfter: number;

  /** retryAfter is in seconds. */
  constructor(message = "Too many requests", retryAfter = 60) {
    super(message, 429, { retryAfter });
    this.retryAfter = retryAfter;
  }
}

export class UpstreamError extends AppError {
  readonly provider: string;

  /** The message must be safe to show users: no upstream bodies, no keys. */
  constructor(provider: string, message = "An upstream service failed", readonly upstreamStatus?: number) {
    super(message, 502, { provider });
    this.provider = provider;
  }
}
