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

const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);

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
        portalPath: "/portal/solicitacoes/sol1",
        resumo: "Sua solicitacao #sol1 recebeu uma nova resposta.",
      });
    }).not.toThrow();
  });
});

describe("notificarClienteSolicitacaoAtualizada", () => {
  beforeEach(() => {
    mockFrom.mockReset();
    infoSpy.mockClear();
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

  it("não envia quando notificações globais estão desativadas", async () => {
    const orig = process.env.NOTIFICACOES_EMAIL_ATIVO;
    process.env.NOTIFICACOES_EMAIL_ATIVO = "false";

    await notificarClienteSolicitacaoAtualizada(mockSupabase as never, {
      clienteId: "c1",
      solicitacaoId: "sol1",
      tipoEvento: "comentario",
      origemSolicitacao: "cliente",
    });

    expect(mockFrom).not.toHaveBeenCalled();
    process.env.NOTIFICACOES_EMAIL_ATIVO = orig;
  });

  it("não envia quando cliente desabilitou notificações", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { notificar_por_email: false },
        error: null,
      }),
    });

    await notificarClienteSolicitacaoAtualizada(mockSupabase as never, {
      clienteId: "c1",
      solicitacaoId: "sol1",
      tipoEvento: "comentario",
      origemSolicitacao: "cliente",
    });

    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("gera payload com resumo e link do portal quando deve notificar", async () => {
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let call = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "cliente_preferencias") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }

      if (table === "usuarios") {
        call += 1;
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockResolvedValue({
            data: [{ email: "cliente@empresa.com" }],
            error: null,
          }),
        };
      }

      return {};
    });

    await notificarClienteSolicitacaoAtualizada(mockSupabase as never, {
      clienteId: "c1",
      solicitacaoId: "sol1",
      tipoEvento: "status_alterado",
      origemSolicitacao: "cliente",
    });

    expect(call).toBe(1);
    expect(infoSpy).toHaveBeenCalledWith("[notificacoes] solicitacao_atualizada", {
      clienteId: "c1",
      solicitacaoId: "sol1",
      tipoEvento: "status_alterado",
      destinatarioEmails: ["cliente@empresa.com"],
      portalPath: "/portal/solicitacoes/sol1",
      resumo: "Sua solicitacao #sol1 teve o status atualizado.",
    });
    process.env.NODE_ENV = origNodeEnv;
  });
});
