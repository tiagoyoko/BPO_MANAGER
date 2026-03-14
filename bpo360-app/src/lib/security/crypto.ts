/**
 * Criptografia de aplicação para tokens F360 (AES-256-GCM).
 * Story 1.6: configurar parâmetros básicos de integração F360.
 * NUNCA logar plaintext ou derivados; em falha retornar erro genérico.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_HEX_LENGTH = 64;

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== KEY_HEX_LENGTH) {
    throw new Error("TOKEN_ENCRYPTION_KEY inválida ou ausente (deve ter 64 hex chars)");
  }
  return Buffer.from(hex, "hex");
}

/**
 * Criptografa e retorna string no formato "iv:authTag:encrypted" (tudo em hex).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Descriptografa string no formato "iv:authTag:encrypted". Uso exclusivo server-side.
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");
  const ivHex = parts[0];
  const authTagHex = parts[1];
  const encryptedHex = parts[2];
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Formato de ciphertext inválido");
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
