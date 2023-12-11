import jwt from "jsonwebtoken";
import { JWT_SECRET, NODE_ENV } from "../env";

/**
 * @param {String} id
 * @description Sign an access token
 */
function signAccessToken(id: string) {
  return jwt.sign({ userId: id }, JWT_SECRET, {
    expiresIn: NODE_ENV === "production" ? "5m" : "1d",
  });
}

/**
 * @param {String} id
 * @description Sign an refresh token
 */
function signRefreshToken(id: string) {
  return jwt.sign({ userId: id }, JWT_SECRET, {
    expiresIn: "14d",
  });
}

export { signAccessToken, signRefreshToken };
