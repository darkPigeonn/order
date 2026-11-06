export function validateEnv(config: Record<string, unknown>) {
  const mongodbUri = String(config.MONGODB_URI ?? "");
  const jwtSecret = String(config.JWT_SECRET ?? "");

  if (!mongodbUri.startsWith("mongodb")) {
    throw new Error("MONGODB_URI wajib diisi dengan connection string MongoDB");
  }

  if (jwtSecret.length < 16) {
    throw new Error("JWT_SECRET wajib diisi minimal 16 karakter");
  }

  return config;
}
