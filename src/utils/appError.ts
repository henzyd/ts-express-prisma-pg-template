/**
 * Custom error class for application-specific errors.
 * Extends the built-in Error class.
 */
class AppError extends Error {
  /**
   * HTTP status code associated with the error.
   */
  statusCode: number;

  /**
   * Status string indicating the type of error.
   * `fail` for 4xx status codes, `error` for others.
   */
  status: string;

  /**
   * Flag indicating whether the error is operational or not.
   * Operational errors are trusted errors or errors caused by client that can be sent to the client.
   */
  isOperational: boolean;

  /**
   * Array of errors.
   * Used to send multiple errors to the client mustly used for sending validation error.
   */
  validationErrors?: CustomError[];

  /**
   * Creates a new instance of AppError.
   * @param {string} message - The error message.
   * @param {number} statusCode - The HTTP status code.
   * @param {CustomError[]} validationErrors - Array of errors.
   */
  constructor(
    message: string,
    statusCode: number,
    validationErrors?: CustomError[]
  ) {
    super();
    this.message = message;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.validationErrors = validationErrors;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
