/**
 * Utilitários de validação de CNPJ.
 * Story 1.2: validação de formato e verificação de duplicidade.
 */

/** Remove pontuação (./- e espaços) do CNPJ, retornando apenas os 14 dígitos. */
export function normalizarCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

/**
 * Valida o formato do CNPJ:
 * - 14 dígitos após normalização
 * - Não pode ser sequência de dígitos repetidos (00000000000000, etc.)
 * - Dígitos verificadores corretos (algoritmo oficial Receita Federal)
 */
export function validarFormatoCnpj(cnpj: string): boolean {
  const digits = normalizarCnpj(cnpj);

  if (digits.length !== 14) return false;

  // Rejeita sequências homogêneas (ex.: 00000000000000)
  if (/^(\d)\1+$/.test(digits)) return false;

  // Calcula e verifica os dois dígitos verificadores
  return verificarDigitos(digits);
}

function verificarDigitos(digits: string): boolean {
  const calc = (slice: string, weights: number[]): number => {
    const sum = slice
      .split("")
      .reduce((acc, d, i) => acc + parseInt(d, 10) * (weights[i] ?? 0), 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calc(digits.slice(0, 12), w1);
  const digit12 = digits[12];
  if (digit12 === undefined || d1 !== parseInt(digit12, 10)) return false;

  const d2 = calc(digits.slice(0, 13), w2);
  const digit13 = digits[13];
  return digit13 !== undefined && d2 === parseInt(digit13, 10);
}
