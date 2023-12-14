declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
      PORT: string;
      CLIENT_BASE_URL: string;

      DATABASE_URL: string;
      JWT_SECRET: string;
      PASSWORD_SALT: string;
    }
  }
}
