"use client";

import { useState, useEffect, useCallback } from "react";
import type { StatusCliente } from "@/lib/domain/clientes/types";

const STATUS_OPCOES: { value: "" | StatusCliente; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "Ativo", label: "Ativo" },
  { value: "Em implantação", label: "Em implantação" },
  { value: "Pausado", label: "Pausado" },
  { value: "Encerrado", label: "Encerrado" },
];

export type FiltrosClientes = {
  search: string;
  status: string;
  tags: string[];
  responsavelInternoId: string;
};

type ResponsavelOption = {
  id: string;
  nome: string | null;
};

type Props = {
  onFiltrosChange: (filtros: FiltrosClientes) => void;
  responsaveis?: ResponsavelOption[];
  tagsDisponiveis?: string[];
};

const DEBOUNCE_MS = 300;

export function ClientesFiltros({
  onFiltrosChange,
  responsaveis = [],
  tagsDisponiveis = [],
}: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [responsavelInternoId, setResponsavelInternoId] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filtros: FiltrosClientes = {
    search: debouncedSearch,
    status,
    tags: [...tags],
    responsavelInternoId,
  };

  useEffect(() => {
    onFiltrosChange(filtros);
  }, [debouncedSearch, status, responsavelInternoId, tags.join(",")]);

  const temFiltrosAtivos =
    debouncedSearch !== "" ||
    status !== "" ||
    responsavelInternoId !== "" ||
    tags.length > 0;

  const limparFiltros = useCallback(() => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatus("");
    setResponsavelInternoId("");
    setTags([]);
  }, []);

  return (
    <div className="flex flex-wrap items-end gap-3 mb-4" role="search" aria-label="Filtros da lista de clientes">
      <div className="min-w-[200px]">
        <label htmlFor="clientes-search" className="sr-only">
          Buscar por nome ou CNPJ
        </label>
        <input
          id="clientes-search"
          type="search"
          placeholder="Buscar por nome ou CNPJ"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          aria-label="Buscar por nome ou CNPJ"
        />
      </div>

      <div>
        <label htmlFor="clientes-status" className="sr-only">
          Status
        </label>
        <select
          id="clientes-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[160px]"
          aria-label="Filtrar por status"
        >
          {STATUS_OPCOES.map((op) => (
            <option key={op.value || "todos"} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      {responsaveis.length > 0 && (
        <div>
          <label htmlFor="clientes-responsavel" className="sr-only">
            Responsável interno
          </label>
          <select
            id="clientes-responsavel"
            value={responsavelInternoId}
            onChange={(e) => setResponsavelInternoId(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[180px]"
            aria-label="Filtrar por responsável interno"
          >
            <option value="">Todos os responsáveis</option>
            {responsaveis.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome ?? r.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {tagsDisponiveis.length > 0 && (
        <div>
          <label htmlFor="clientes-tags" className="sr-only">
            Tags
          </label>
          <select
            id="clientes-tags"
            value={tags[0] ?? ""}
            onChange={(e) => setTags(e.target.value ? [e.target.value] : [])}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[140px]"
            aria-label="Filtrar por tag"
          >
            <option value="">Todas as tags</option>
            {tagsDisponiveis.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      {temFiltrosAtivos && (
        <button
          type="button"
          onClick={limparFiltros}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted"
          aria-label="Limpar filtros"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
