/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserProvider } from "@/lib/auth/user-context";
import type { Cliente } from "@/lib/domain/clientes/types";
import type { CurrentUser } from "@/types/domain";
import { ClientesList } from "./clientes-list";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

const USER: CurrentUser = {
  id: "user-1",
  email: "gestor@bpo.com",
  bpoId: "bpo-1",
  role: "gestor_bpo",
  clienteId: null,
  nome: "Gestor",
};

const CLIENTE: Cliente = {
  id: "cliente-1",
  bpoId: "bpo-1",
  cnpj: "11222333000181",
  razaoSocial: "Empresa Teste Ltda",
  nomeFantasia: "Empresa Teste",
  email: "contato@empresa.com",
  telefone: null,
  responsavelInternoId: "resp-1",
  receitaEstimada: 12345.67,
  status: "Ativo",
  tags: ["Financeiro"],
  createdAt: "2026-03-13T00:00:00Z",
  updatedAt: "2026-03-13T00:00:00Z",
};

function renderList() {
  return render(
    <UserProvider user={USER}>
      <ClientesList
        clientes={[CLIENTE]}
        total={1}
        page={1}
        limit={20}
        onPageChange={vi.fn()}
        responsaveis={[{ id: "resp-1", nome: "Ana Responsavel" }]}
      />
    </UserProvider>
  );
}

describe("ClientesList", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("renderiza as colunas exigidas e exibe responsavel interno e receita estimada", () => {
    renderList();

    expect(screen.getByRole("columnheader", { name: "Cliente" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Responsável interno" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Receita estimada" })).toBeDefined();
    expect(screen.getByText("Empresa Teste")).toBeDefined();
    expect(screen.getByText("Empresa Teste Ltda")).toBeDefined();
    expect(screen.getByText("Ana Responsavel")).toBeDefined();
    expect(screen.getByText("R$ 12.345,67")).toBeDefined();
  });

  it("navega para o painel do cliente ao clicar na linha", () => {
    renderList();

    fireEvent.click(screen.getByLabelText("Abrir linha do cliente Empresa Teste"));

    expect(pushMock).toHaveBeenCalledWith("/clientes/cliente-1");
  });

  it("exibe coluna ERP/Integração com badge Não configurado quando erpStatus undefined", () => {
    renderList();
    expect(screen.getByRole("columnheader", { name: "ERP/Integração" })).toBeDefined();
    expect(screen.getByText("Não configurado")).toBeDefined();
  });

  it("exibe badge F360 – config básica salva quando erpStatus é config_basica_salva", () => {
    const clienteComErp = { ...CLIENTE, erpStatus: "config_basica_salva" as const, erpDetalhes: { tipoErp: "F360", ultimaAlteracao: null } };
    render(
      <UserProvider user={USER}>
        <ClientesList
          clientes={[clienteComErp]}
          total={1}
          page={1}
          limit={20}
          onPageChange={vi.fn()}
          responsaveis={[]}
        />
      </UserProvider>
    );
    expect(screen.getByText("F360 – config básica salva")).toBeDefined();
  });

  it("exibe badge F360 – ativo quando erpStatus é integracao_ativa", () => {
    const clienteAtivo = { ...CLIENTE, id: "cliente-ativo-1", nomeFantasia: "Cliente F360 Ativo", erpStatus: "integracao_ativa" as const, erpDetalhes: { tipoErp: "F360", ultimaAlteracao: "2026-03-14T10:00:00Z" } };
    render(
      <UserProvider user={USER}>
        <ClientesList
          clientes={[clienteAtivo]}
          total={1}
          page={1}
          limit={20}
          onPageChange={vi.fn()}
          responsaveis={[]}
        />
      </UserProvider>
    );
    expect(screen.getByText("F360 – ativo")).toBeDefined();
  });

  it("link do badge ERP aponta para /clientes/[clienteId]/config", () => {
    renderList();
    const link = screen.getByRole("link", { name: /Status ERP do cliente Empresa Teste/i });
    expect(link.getAttribute("href")).toBe("/clientes/cliente-1/config");
  });
});
