import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt } from "./crypto";

const VALID_KEY = "a".repeat(64);

describe("crypto", () => {
  beforeEach(() => {
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", VALID_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("encrypt → decrypt roundtrip retorna o plaintext original", () => {
    const plain = "meu-token-secreto-123";
    const cipher = encrypt(plain);
    expect(decrypt(cipher)).toBe(plain);
  });

  it("ciphertext é diferente do plaintext", () => {
    const plain = "token";
    const cipher = encrypt(plain);
    expect(cipher).not.toBe(plain);
    expect(cipher).not.toContain(plain);
  });

  it("ciphertexts do mesmo valor são diferentes (IV aleatório)", () => {
    const plain = "same";
    const c1 = encrypt(plain);
    const c2 = encrypt(plain);
    expect(c1).not.toBe(c2);
    expect(decrypt(c1)).toBe(plain);
    expect(decrypt(c2)).toBe(plain);
  });

  it("lança erro descritivo quando TOKEN_ENCRYPTION_KEY não está configurada", () => {
    const orig = process.env.TOKEN_ENCRYPTION_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    try {
      expect(() => encrypt("x")).toThrow(/TOKEN_ENCRYPTION_KEY/);
    } finally {
      if (orig !== undefined) process.env.TOKEN_ENCRYPTION_KEY = orig;
    }
  });

  it("lança quando TOKEN_ENCRYPTION_KEY tem tamanho inválido", () => {
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", "short");
    expect(() => encrypt("x")).toThrow(/TOKEN_ENCRYPTION_KEY/);
  });

  it("lança quando TOKEN_ENCRYPTION_KEY não é hex válido", () => {
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", "z".repeat(64));
    expect(() => encrypt("x")).toThrow(/TOKEN_ENCRYPTION_KEY/);
  });

  it("decrypt lança em formato inválido", () => {
    expect(() => decrypt("invalid")).toThrow(/Formato de ciphertext inválido/);
    expect(() => decrypt("a:b")).toThrow(/Formato de ciphertext inválido/);
  });
});
