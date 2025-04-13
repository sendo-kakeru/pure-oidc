import crypto from "crypto";

export function generateCodeVerifier(): string {
  return crypto.randomBytes(64).toString("hex");
}

