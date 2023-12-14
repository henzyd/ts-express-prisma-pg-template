import express from "express";
import { body } from "express-validator";
import {
  login,
  signup,
  logout,
  refreshAccessToken,
  resetPassword,
  resetPasswordConfirm,
  verifyOtp,
  requestNewOtp,
} from "../controllers/auth";
import { authorization } from "../middleware/auth";

const router = express.Router();

const emailVaidator = () =>
  body("email").trim().isEmail().withMessage("Invalid email address");

const passwordValidator = () =>
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long");

const refreshTokenValidator = () =>
  body("refreshToken")
    .trim()
    .notEmpty()
    .withMessage("Refresh token is required");

router.post(
  "/signup",
  [
    body("username").trim().notEmpty().withMessage("Username is required"),
    emailVaidator(),
    passwordValidator(),
  ],
  signup
);
router.post("/login", [emailVaidator(), passwordValidator()], login);
router.post("/logout", authorization, [refreshTokenValidator()], logout);
router.post("/refresh-token", [refreshTokenValidator()], refreshAccessToken);
router.post("/reset-password", [emailVaidator()], resetPassword);
router.post(
  "/reset-password-confirm",
  [
    body("userId").trim().notEmpty().withMessage("User id is required"),
    body("token").trim().notEmpty().withMessage("Token is required"),
    body("newPassword")
      .trim()
      .isLength({ min: 8 })
      .withMessage("New Password must be at least 8 characters long"),
  ],
  resetPasswordConfirm
);
router.post(
  "/verify-otp",
  [
    body("code")
      .notEmpty()
      .isInt()
      .isLength({ min: 6, max: 6 })
      .withMessage("Invalid OTP code, must be 6 digits long"),
  ],
  verifyOtp
);
router.post("/resend-otp", [emailVaidator()], requestNewOtp);

export default router;
