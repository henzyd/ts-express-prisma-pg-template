import type { Response, Request, NextFunction } from "express";
import AppError from "../utils/appError";
import { NODE_ENV } from "../env";

function handleDuplicateFieldDB(err: any) {
  const value = err.meta.target[err.meta.target.length - 1]; //? Get the last element of the target array
  const message = `Duplicate field value: ${value}.`;
  return new AppError(message, 400);
}

function handleMultipleFileUploadError(err: any) {
  return new AppError(
    `File upload for the '${err.field}' field has exceeded the allowed limit.`,
    400
  );
}

function handleJWTError(err: any) {
  return new AppError("Invalid Token", 401);
}

function handleJWTExpiredError(err: any) {
  return new AppError("Token has expired", 401);
}

function sendErrorDev(err: AppError, prodError: AppError, res: Response) {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
    productionError: prodError.isOperational
      ? {
          status: prodError.status,
          statusCode: prodError.statusCode,
          message: prodError.message,
          validationErrors: prodError.validationErrors,
        }
      : {
          status: "error",
          statusCode: 500,
          message: "Something went very wrong!",
        },
  });
}

function sendErrorProd(err: AppError, res: Response) {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      validationErrors: err.validationErrors,
    });
  } else {
    //? Programming or other unknown error: don't leak error details
    console.error("ERROR: \n", err);
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
}

function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  let prodError = JSON.parse(JSON.stringify(err));

  if (prodError.code === "P2002") {
    prodError = handleDuplicateFieldDB(prodError);
  }

  if (prodError.name === "MulterError") {
    if (prodError.code === "LIMIT_UNEXPECTED_FILE") {
      prodError = handleMultipleFileUploadError(prodError);
    }
  }

  if (err.name === "JsonWebTokenError") {
    prodError = handleJWTError(err);
  }

  if (err.name === "TokenExpiredError") {
    prodError = handleJWTExpiredError(err);
  }

  if (NODE_ENV === "development") {
    return sendErrorDev(err, prodError, res);
  } else if (NODE_ENV === "production") {
    return sendErrorProd(prodError, res);
  }
}

export default globalErrorHandler;
