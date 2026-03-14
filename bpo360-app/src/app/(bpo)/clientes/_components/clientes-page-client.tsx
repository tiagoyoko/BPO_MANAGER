"use client";

import { useEffect, useState, useCallback } from "react";
import { FeedbackToast } from "@/components/feedback/feedback-toast";
import type { Cliente } from "@/lib/domain/clientes/types";
import type { CurrentUser } from "@/types/domain";
import { UserProvider } from "@/lib/auth/user-context";
import { ClientesList } from "./clientes-list";
import { ClientesFiltros, type FiltrosClientes } from "./clientes-filtros";
import { NovoClienteForm } from "./novo-cliente-form";

const LIMIT = 20;

type ResponsavelOption = { id: string; nome: string | null };

type Props = {
  user: CurrentUser;
  responsaveis: ResponsavelOption[];
  tagsDisponiveis: string[];
};

export function ClientesPageClient({ user, responsaveis, tagsDisponiveis }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtros, setFiltros] = useState<FiltrosClientes>({
    search: "",
    status: "",
    tags: [],
    responsavelInternoId: "",
    erpStatus: "",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoadingClientes, setIsLoadingClientes] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    message?: string;
  }>({
    open: false,
    type: "success",
    title: "",
  });
  const podeCriar = user.role !== "cliente_final";

  const fetchClientes = useCallback(async () => {
    setIsLoadingClientes(true);
    const params = new URLSearchParams();
    if (filtros.search) params.set("search", filtros.search);
    if (filtros.status) params.set("status", filtros.status);
    if (filtros.tags.length > 0) params.set("tags", filtros.tags.join(","));
    if (filtros.responsavelInternoId) params.set("responsavelInternoId", filtros.responsavelInternoId);
    if (filtros.erpStatus) params.set("erpStatus", filtros.erpStatus);
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    const res = await fetch(`/api/clientes?${params.toString()}`);
    const json = await res.json();
    if (!res.ok) {
      setClientes([]);
      setTotal(0);
      setIsLoadingClientes(false);
      return;
    }
    setClientes(json.data?.clientes ?? []);
    setTotal(json.data?.total ?? 0);
    setIsLoadingClientes(false);
  }, [filtros, page]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    if (!feedback.open) return;

    const timeoutId = window.setTimeout(() => {
      setFeedback((current) => ({ ...current, open: false }));
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [feedback.open]);

  const handleFiltrosChange = useCallback((next: FiltrosClientes) => {
    setFiltros(next);
    setPage(1);
  }, []);

  function handleClienteSalvo(cliente: Cliente) {
    setClientes((prev) => {
      const idx = prev.findIndex((c) => c.id === cliente.id);
      if (idx >= 0) {
        const nextList = [...prev];
        nextList[idx] = cliente;
        return nextList.sort((a, b) =>
          a.razaoSocial.localeCompare(b.razaoSocial, "pt-BR")
        );
      }
      return [...prev, cliente].sort((a, b) =>
        a.razaoSocial.localeCompare(b.razaoSocial, "pt-BR")
      );
    });
    setMostrarFormulario(false);
    setClienteEditando(null);
    fetchClientes();
  }

  function handleEditar(cliente: Cliente) {
    setClienteEditando(cliente);
  }

  const mostrarForm = mostrarFormulario || clienteEditando !== null;

  return (
    <UserProvider user={user}>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button
          type="button"
          onClick={() => {
            setClienteEditando(null);
            setMostrarFormulario(true);
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          aria-haspopup="dialog"
          hidden={!podeCriar}
        >
          + Novo cliente
        </button>
      </header>

      <ClientesFiltros
        onFiltrosChange={handleFiltrosChange}
        responsaveis={responsaveis}
        tagsDisponiveis={tagsDisponiveis}
      />

      <ClientesList
        clientes={clientes}
        onEditar={handleEditar}
        total={total}
        page={page}
        limit={LIMIT}
        onPageChange={setPage}
        isLoadingClientes={isLoadingClientes}
        filtrosAtivos={!!(filtros.search || filtros.status || filtros.tags.length || filtros.responsavelInternoId || filtros.erpStatus)}
        responsaveis={responsaveis}
      />

      {mostrarForm && (
        <NovoClienteForm
          clienteInicial={clienteEditando ?? undefined}
          onSuccess={handleClienteSalvo}
          onFeedback={({ type, title, message }) =>
            setFeedback({
              open: true,
              type,
              title,
              message,
            })
          }
          onCancel={() => {
            setMostrarFormulario(false);
            setClienteEditando(null);
          }}
        />
      )}

      <FeedbackToast
        open={feedback.open}
        variant={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback((current) => ({ ...current, open: false }))}
      />
    </UserProvider>
  );
}
