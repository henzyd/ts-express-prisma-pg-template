import { Request, NextFunction } from "express";
import { verify as JwtVerify, JwtPayload } from "jsonwebtoken";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import prisma from "../db";
import { JWT_SECRET } from "../env";

/**
 * Authorization middleware function to authenticate and authorize requests.
 * Checks the presence and validity of a JWT token, verifies if it's blacklisted,
 * decodes the token, and retrieves the associated user from the database.
 * If successful, assigns the user to the _currentUser property in the request object.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next function.
 * @returns {Promise<void>} - Promise that resolves when the middleware finishes execution.
 */
const authorization = catchAsync(
  async (req: Request, _, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Not authorized", 401));
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next(new AppError("No token provided", 401));
    }

    const blacklistedToken = await prisma.blacklistedToken.findUnique({
      where: {
        token,
      },
    });

    if (blacklistedToken) {
      return next(new AppError("Not authorized", 401));
    }

    let decoded: JwtPayload | string;
    try {
      decoded = JwtVerify(token, JWT_SECRET);
    } catch (error) {
      return next(error);
    }

    const { userId } = decoded as { userId: string; iat: number; exp: number };

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return next(new AppError("Invalid token", 401));
    }

    if (!user.isVerified) {
      return next(
        new AppError(
          "Email not verified. Please verify your email to continue",
          401
        )
      );
    }

    if (user.isBlocked) {
      return next(new AppError("Your account has been blocked", 403));
    }

    if (user.isDeleted) {
      return next(new AppError("Your account has been deleted", 403));
    }

    req._currentUser = user;

    next();
  }
);

export { authorization };
