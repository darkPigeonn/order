import path from "path";

export interface AppConfig {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  webOrigins: string[];
  publicBaseUrl: string;
  uploadDir: string;
  seedOnBoot: boolean;
}

export function configuration(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 4000),
    mongodbUri: process.env.MONGODB_URI ?? "",
    jwtSecret: process.env.JWT_SECRET ?? "",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
    webOrigins: (process.env.WEB_ORIGIN ?? "http://localhost:3000,http://localhost:3001")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:4000",
    uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "uploads"),
    seedOnBoot: process.env.SEED_ON_BOOT === "true",
  };
}
