import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { JwtPayload, verify as JwtVerify } from "jsonwebtoken";
import crypto from "crypto";
import ms from "ms";
import catchAsync from "../utils/catchAsync";
import {
  customErrorFormatter,
  exclude,
  hashPasswordHandler,
} from "../utils/helper";
import prisma from "../db";
import AppError from "../utils/appError";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import {
  sendOtpMail,
  sendPasswordResetMail,
  sendWelcomeMail,
} from "../utils/email";
import { JWT_SECRET } from "../env";

const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).formatWith(customErrorFormatter);
    if (!errors.isEmpty()) {
      return next(new AppError("Invalid request data", 400, errors.array()));
    }

    const { username, email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username: username,
          },
          {
            email: email,
          },
        ],
      },
    });

    if (user) {
      return next(new AppError("User already exist", 400));
    }

    const hashedPassword = await hashPasswordHandler(password);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        profile: {
          create: {},
        },
      },
    });

    const otp = await prisma.oTP.create({
      data: {
        code: Math.floor(100000 + Math.random() * 900000),
        expiresAt: new Date(Date.now() + ms("5m")),
        user: {
          connect: {
            id: newUser.id,
          },
        },
      },
    });

    try {
      await sendOtpMail({
        email: newUser?.email,
        name: newUser?.username,
        code: otp.code,
      });
    } catch (error) {
      console.log(error);
      return next(new AppError("Failed to send otp email", 500));
    }

    res.status(200).json({
      status: "success",
      message: "User signedup successfully",
    });
  }
);

const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).formatWith(customErrorFormatter);
    if (!errors.isEmpty()) {
      return next(new AppError("Invalid request data", 400, errors.array()));
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return next(new AppError("User does not exist", 404));
    }

    if (!user.password) {
      return next(new AppError("Invalid credentials", 400));
    }

    if (!user.isVerified) {
      return next(new AppError("User not verified", 400));
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return next(new AppError("Invalid credentials", 400));
    }

    const updatedUser = exclude(
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          lastLogin: new Date(),
        },
      }),
      ["password"]
    );

    const accessToken = signAccessToken(updatedUser.id);
    const refreshToken = signRefreshToken(updatedUser.id);

    res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      data: {
        ...updatedUser,
        accessToken,
        refreshToken,
      },
    });
  }
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).formatWith(customErrorFormatter);
    if (!errors.isEmpty()) {
      return next(new AppError("Invalid request data", 400, errors.array()));
    }

    const { refreshToken } = req.body;

    try {
      JwtVerify(refreshToken, JWT_SECRET);
    } catch (error) {
      return next(new AppError("Invalid token", 400));
    }

    try {
      await prisma.blacklistedToken.create({
        data: {
          token: refreshToken,
        },
      });
    } catch (error) {
      return next(new AppError("Token already blacklisted", 400));
    }

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  }
);

const refreshAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).formatWith(customErrorFormatter);
    if (!errors.isEmpty()) {
      return next(new AppError("Invalid request data", 400, errors.array()));
    }

    const { refreshToken } = req.body;

    let decoded: JwtPayload | string;
    try {
      decoded = JwtVerify(refreshToken, JWT_SECRET);
    } catch (error) {
      return next(new AppError("Invalid token", 400));
    }

    const blacklistedToken = await prisma.blacklistedToken.findUnique({
      where: {
        token: refreshToken,
      },
    });
    if (blacklistedToken) {
      return next(new AppError("Not authorized", 401));
    }

    const { userId } = decoded as { userId: string; iat: number; exp: number };

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return next(new AppError("Invalid token", 400));
    }

    const accessToken = signAccessToken(user.id);

    res.status(200).json({
      status: "success",
      message: "Access token refreshed successfully",
      data: {
        accessToken,
      },
    });
  }
);

const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).formatWith(customErrorFormatter);
    if (!errors.isEmpty()) {
      return next(new AppError("Invalid request data", 400, errors.array()));
    }

    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return next(new AppError("User does not exist", 404));
    }

    const token = crypto.randomBytes(32).toString("hex");

    const tokenExpiration = Date.now() + ms("2h");

    const resetPasswordToken = await prisma.resetPasswordToken.create({
      data: {
        token,
        expiresAt: new Date(tokenExpiration),
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    const resetPasswordUrl = `${req.headers.referer}reset-password?token=${resetPasswordToken.token}&userId=${user.id}`;

    try {
      await sendPasswordResetMail(email, resetPasswordUrl);
    } catch (error) {
      return next(new AppError("Failed to send email", 500));
    }

    res.status(200).json({
      status: "success",
      message: "Reset token sent successfully",
    });
  }
);

const resetPasswordConfirm = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).formatWith(customErrorFormatter);
    if (!errors.isEmpty()) {
      return next(new AppError("Invalid request data", 400, errors.array()));
    }

    const { userId, token, newPassword } = req.body;

    const resetPasswordToken = await prisma.resetPasswordToken.findUnique({
      where: {
        token,
      },
      include: {
        user: true,
      },
    });

    if (!resetPasswordToken) {
      return next(new AppError("Invalid token", 400));
    }

    if (resetPasswordToken.expiresAt < new Date()) {
      return next(new AppError("Token expired", 400));
    }

    const hashedPassword = await hashPasswordHandler(newPassword);

    try {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password: hashedPassword,
        },
      });
    } catch (error) {
      return next(new AppError("User not found", 404));
    }

    await prisma.resetPasswordToken.delete({
      where: {
        id: resetPasswordToken.id,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  }
);

const verifyOtp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).formatWith(customErrorFormatter);
    if (!errors.isEmpty()) {
      return next(new AppError("Invalid request data", 400, errors.array()));
    }

    const { code } = req.body;

    const otpRecord = await prisma.oTP.findUnique({
      where: {
        code,
      },
    });

    if (!otpRecord) {
      return next(new AppError("Invalid code", 400));
    }

    if (otpRecord.expiresAt < new Date()) {
      return next(new AppError("Code expired", 400));
    }

    await prisma.oTP.delete({
      where: {
        id: otpRecord.id,
      },
    });

    const updatedUser = await prisma.user.update({
      where: {
        id: otpRecord.userId,
      },
      data: {
        isVerified: true,
      },
    });

    try {
      await sendWelcomeMail({
        email: updatedUser.email,
        name: updatedUser.username,
      });
    } catch (error) {
      console.log(error);
      return next(new AppError("Failed to send welcome email", 500));
    }

    res.status(200).json({
      status: "success",
      message: "User verified successfully",
    });
  }
);

const requestNewOtp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).formatWith(customErrorFormatter);
    if (!errors.isEmpty()) {
      return next(new AppError("Invalid request data", 400, errors.array()));
    }

    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return next(new AppError("User does not exist", 404));
    }

    if (user.isVerified) {
      return next(new AppError("User already verified", 400));
    }

    const otp = await prisma.oTP.create({
      data: {
        code: Math.floor(100000 + Math.random() * 900000),
        expiresAt: new Date(Date.now() + ms("5m")),
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    try {
      await sendOtpMail({
        email: user.email,
        name: user.username,
        code: otp.code,
      });
    } catch (error) {
      console.log(error);
      return next(new AppError("Failed to send otp email", 500));
    }

    res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
    });
  }
);

export {
  signup,
  login,
  logout,
  refreshAccessToken,
  resetPassword,
  resetPasswordConfirm,
  verifyOtp,
  requestNewOtp,
};
