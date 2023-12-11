import bcrypt from "bcryptjs";
import { PASSWORD_SALT } from "../env";

/**
 * Formats the express-validator error message
 * @param {object} error - The error object
 * @returns {CustomError} - The formatted error object
 * @example
 * const errors = validationResult(req).formatWith(customErrorFormatter);
 * if (!errors.isEmpty()) {
 *   return next(new AppError("Invalid request data", 400, errors.array()));
 * }
 */
const customErrorFormatter = ({ path, msg }: any): CustomError => {
  return {
    field: path,
    message: msg,
  };
};

/**
 * Hashes the password using bcrypt
 * @param {string} password - The password to be hashed
 * @returns {Promise<string>} - The hashed password
 */
const hashPasswordHandler = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, Number(PASSWORD_SALT));
};

/**
 * Creates a new object by excluding specified keys from the original object.
 *
 * @template T - The type of the original object.
 * @template Key - The type of keys to exclude.
 * @param {T} user - The original object from which keys will be excluded.
 * @param {Key[]} keys - An array of keys to exclude from the original object.
 * @returns {Omit<T, Key>} A new object that is a copy of the original object with specified keys excluded.
 */
function exclude<T extends Record<string, any>, Key extends keyof T>(
  user: T,
  keys: Key[]
): Omit<T, Key> {
  return Object.fromEntries(
    Object.entries(user).filter(([key]) => !keys.includes(key as Key))
  ) as Omit<T, Key>;
}

export { customErrorFormatter, hashPasswordHandler, exclude };
