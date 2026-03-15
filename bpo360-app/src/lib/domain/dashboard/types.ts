export type ResumoDashboard = {
  totalClientes: number;
  clientesPorStatus: {
    ativo: number;
    emImplantacao: number;
    pausado: number;
    encerrado: number;
  };
  clientesPorErpStatus: {
    naoConfigurado: number;
    configBasicaSalva: number;
    integracaoAtiva: number;
  };
};

/** Códigos de erro conhecidos do endpoint de resumo (não expor outros ao usuário). */
export const RESUMO_ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "DB_ERROR",
] as const;

export type ResumoErrorCode = (typeof RESUMO_ERROR_CODES)[number];

export function isResumoErrorCode(code: string): code is ResumoErrorCode {
  return RESUMO_ERROR_CODES.includes(code as ResumoErrorCode);
}
