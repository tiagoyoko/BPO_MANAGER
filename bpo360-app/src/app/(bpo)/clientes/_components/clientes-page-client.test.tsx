/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClientesPageClient } from "./clientes-page-client";
import type { CurrentUser } from "@/types/domain";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/components/feedback/feedback-toast", () => ({
  FeedbackToast: () => null,
}));

vi.mock("./novo-cliente-form", () => ({
  NovoClienteForm: () => null,
}));

const USER: CurrentUser = {
  id: "user-1",
  email: "gestor@bpo.com",
  bpoId: "bpo-1",
  role: "gestor_bpo",
  clienteId: null,
  nome: "Gestor",
};

describe("ClientesPageClient", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { clientes: [], total: 0, page: 1, limit: 20 },
          error: null,
        }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("repassa tagsDisponiveis para os filtros e exibe o select de tag", async () => {
    render(
      <ClientesPageClient
        user={USER}
        responsaveis={[{ id: "resp-1", nome: "Ana Responsavel" }]}
        tagsDisponiveis={["Financeiro"]}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Filtrar por tag/i)).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText(/Filtrar por tag/i), {
      target: { value: "Financeiro" },
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("/api/clientes?tags=Financeiro&page=1&limit=20")
      );
    });
  });
});
