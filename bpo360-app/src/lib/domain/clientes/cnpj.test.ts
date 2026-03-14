import { describe, it, expect } from "vitest";
import { normalizarCnpj, validarFormatoCnpj } from "./cnpj";

describe("normalizarCnpj", () => {
  it("remove pontuação e retorna apenas dígitos", () => {
    expect(normalizarCnpj("11.222.333/0001-81")).toBe("11222333000181");
  });

  it("mantém string que já é só dígitos", () => {
    expect(normalizarCnpj("11222333000181")).toBe("11222333000181");
  });
});

describe("validarFormatoCnpj", () => {
  // CNPJs válidos reais (gerados com algoritmo oficial)
  const validos = [
    "11222333000181",
    "11.222.333/0001-81",
    "45997418000153",
    "45.997.418/0001-53",
  ];

  // CNPJs inválidos
  const invalidos = [
    "00000000000000", // sequência homogênea
    "11111111111111", // sequência homogênea
    "12345678901234", // dígitos verificadores errados
    "1234567890123",  // menos de 14 dígitos
    "123456789012345",// mais de 14 dígitos
    "",
    "abc",
  ];

  it.each(validos)("aceita CNPJ válido: %s", (cnpj) => {
    expect(validarFormatoCnpj(cnpj)).toBe(true);
  });

  it.each(invalidos)("rejeita CNPJ inválido: %s", (cnpj) => {
    expect(validarFormatoCnpj(cnpj)).toBe(false);
  });
});
