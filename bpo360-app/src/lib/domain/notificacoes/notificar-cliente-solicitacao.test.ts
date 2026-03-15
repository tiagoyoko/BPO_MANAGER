import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

const {
  notificacoesEmailAtivas,
  obterEmailsDestino,
  clienteQuerNotificacaoEmail,
  enviarNotificacaoSolicitacaoAtualizada,
  notificarClienteSolicitacaoAtualizada,
} = await import("./notificar-cliente-solicitacao");

describe("notificacoesEmailAtivas", () => {
  let orig: string | undefined;
  beforeEach(() => {
    orig = process.env.NOTIFICACOES_EMAIL_ATIVO;
  });
  afterEach(() => {
    process.env.NOTIFICACOES_EMAIL_ATIVO = orig;
  });

  it("retorna false quando NOTIFICACOES_EMAIL_ATIVO é false", () => {
    process.env.NOTIFICACOES_EMAIL_ATIVO = "false";
    expect(notificacoesEmailAtivas()).toBe(false);
  });

  it("retorna false quando NOTIFICACOES_EMAIL_ATIVO é 0", () => {
    process.env.NOTIFICACOES_EMAIL_ATIVO = "0";
    expect(notificacoesEmailAtivas()).toBe(false);
  });

  it("retorna true quando não definido ou true", () => {
    delete process.env.NOTIFICACOES_EMAIL_ATIVO;
    expect(notificacoesEmailAtivas()).toBe(true);
    process.env.NOTIFICACOES_EMAIL_ATIVO = "true";
    expect(notificacoesEmailAtivas()).toBe(true);
  });
});

describe("obterEmailsDestino", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("retorna lista de emails únicos de usuarios cliente_final do cliente", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockResolvedValue({
        data: [
          { email: "c1@cliente.com" },
          { email: "c2@cliente.com" },
          { email: "c1@cliente.com" },
        ],
        error: null,
      }),
    });

    const emails = await obterEmailsDestino(mockSupabase as never, "cliente-1");
    expect(emails).toEqual(["c1@cliente.com", "c2@cliente.com"]);
  });

  it("retorna array vazio em caso de erro", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockResolvedValue({ data: null, error: new Error("DB") }),
    });

    const emails = await obterEmailsDestino(mockSupabase as never, "cliente-1");
    expect(emails).toEqual([]);
  });
});

describe("clienteQuerNotificacaoEmail", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("retorna true quando não existe linha (default)", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const want = await clienteQuerNotificacaoEmail(mockSupabase as never, "cliente-1");
    expect(want).toBe(true);
  });

  it("retorna valor da coluna notificar_por_email quando existe", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn()
        .mockResolvedValueOnce({ data: { notificar_por_email: false }, error: null })
        .mockResolvedValueOnce({ data: { notificar_por_email: true }, error: null }),
    });

    expect(await clienteQuerNotificacaoEmail(mockSupabase as never, "c1")).toBe(false);
    expect(await clienteQuerNotificacaoEmail(mockSupabase as never, "c2")).toBe(true);
  });
});

describe("enviarNotificacaoSolicitacaoAtualizada", () => {
  it("não lança (no-op em test)", () => {
    expect(() => {
      enviarNotificacaoSolicitacaoAtualizada({
        clienteId: "c1",
        solicitacaoId: "sol1",
        tipoEvento: "comentario",
        destinatarioEmails: ["a@b.com"],
      });
    }).not.toThrow();
  });
});

describe("notificarClienteSolicitacaoAtualizada", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("não faz nada quando origem não é cliente", async () => {
    await notificarClienteSolicitacaoAtualizada(mockSupabase as never, {
      clienteId: "c1",
      solicitacaoId: "sol1",
      tipoEvento: "comentario",
      origemSolicitacao: "interno",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
