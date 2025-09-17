import {z} from "zod"

export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  public errors: Record<string, string>;

  constructor(errors: Record<string, string>) {
    super('Validation failed', 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class AuthError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN_ERROR');
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

 if (error instanceof z.ZodError) {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    if (issue.path.length > 0) {
      errors[issue.path[0].toString()] = issue.message;
    }
  });
  return new ValidationError(errors);
}


  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError('An unexpected error occurred');
};