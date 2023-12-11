import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

export const PORT = process.env.PORT || 3000;

export const NODE_ENV = process.env.NODE_ENV || "development";

export const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL;

export const DATABASE_URL = process.env.DATABASE_URL;

export const JWT_SECRET = process.env.JWT_SECRET || "";

export const PASSWORD_SALT = process.env.PASSWORD_SALT;

//? SMTP
export const AUTH_EMAIL = process.env.AUTH_EMAIL;
export const EMAIL_HOST = process.env.EMAIL_HOST;
export const EMAIL_PORT = process.env.EMAIL_PORT;
export const EMAIL_USERNAME = process.env.EMAIL_USERNAME;
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

//? Gmail
export const GMAIL_EMAIL = process.env.GMAIL_EMAIL;
export const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;
