export const PORT = Number.parseInt(Bun.env.PORT || "4444");
export const DATABASE_URL =
  Bun.env.DATABASE_URL || "mongodb://[::1]:27017/rules";
export const TOKEN = Bun.env.TOKEN || "1234";
export const ALLOWED_DOMAINS =
  Bun.env.ALLOWED_DOMAINS || "example.com google.com";

export const isDev = Bun.env.NODE_ENV === "development";
