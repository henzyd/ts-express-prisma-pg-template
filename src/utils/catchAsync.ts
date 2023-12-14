import { NextFunction, Request, Response } from "express";

/**
 * Wraps an asynchronous route handler function and catches any asynchronous errors,
 * passing them to the Express error handler middleware.
 * @param fn - Asynchronous route handler function.
 * @returns Express middleware function.
 */
const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): ((req: Request, res: Response, next: NextFunction) => void) => {
  /**
   * Express middleware function that wraps the asynchronous route handler function.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next function.
   */
  return (req, res, next) => {
    fn(req, res, next).catch((err: any) => next(err));
  };
};

export default catchAsync;
