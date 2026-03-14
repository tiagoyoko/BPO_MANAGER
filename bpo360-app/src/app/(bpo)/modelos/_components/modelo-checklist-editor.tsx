"use client";

import { useState } from "react";
import type { NovoItemChecklistInput } from "@/lib/domain/rotinas/types";

type Props = {
  itens: NovoItemChecklistInput[];
  onChange: (itens: NovoItemChecklistInput[]) => void;
  disabled?: boolean;
};

export function ModeloChecklistEditor({ itens, onChange, disabled }: Props) {
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");

  function addItem() {
    const titulo = novoTitulo.trim();
    if (!titulo) return;
    onChange([
      ...itens,
      { titulo, descricao: novaDescricao.trim() || undefined, obrigatorio: true },
    ]);
    setNovoTitulo("");
    setNovaDescricao("");
  }

  function removeAt(index: number) {
    onChange(itens.filter((_, i) => i !== index));
  }

  function setItemAt(index: number, patch: Partial<NovoItemChecklistInput>) {
    const next = [...itens];
    next[index] = { ...next[index]!, ...patch };
    onChange(next);
  }

  function moveUp(index: number) {
    if (index <= 0) return;
    const next = [...itens];
    [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
    onChange(next);
  }

  function moveDown(index: number) {
    if (index >= itens.length - 1) return;
    const next = [...itens];
    [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Itens do checklist</p>
      <ul className="space-y-2">
        {itens.map((item, index) => (
          <li
            key={`checklist-item-${index}-${String(item.titulo).slice(0, 50)}`}
            className="flex flex-wrap items-center gap-2 rounded border bg-muted/30 p-2"
          >
            <span className="text-muted-foreground w-6 text-sm">{index + 1}.</span>
            <input
              type="text"
              value={item.titulo}
              onChange={(e) => setItemAt(index, { titulo: e.target.value })}
              placeholder="Título"
              className="min-w-[120px] flex-1 rounded border px-2 py-1 text-sm"
              disabled={disabled}
            />
            <input
              type="text"
              value={item.descricao ?? ""}
              onChange={(e) => setItemAt(index, { descricao: e.target.value || undefined })}
              placeholder="Descrição (opcional)"
              className="min-w-[140px] flex-1 rounded border px-2 py-1 text-sm"
              disabled={disabled}
            />
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={item.obrigatorio !== false}
                onChange={(e) => setItemAt(index, { obrigatorio: e.target.checked })}
                disabled={disabled}
              />
              Obrigatório
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={disabled || index === 0}
                className="rounded border px-2 py-0.5 text-xs hover:bg-muted"
                aria-label="Subir item"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={disabled || index === itens.length - 1}
                className="rounded border px-2 py-0.5 text-xs hover:bg-muted"
                aria-label="Descer item"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled}
                className="rounded border border-destructive/50 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10"
                aria-label="Remover item"
              >
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={novoTitulo}
          onChange={(e) => setNovoTitulo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          placeholder="Título do novo item"
          className="rounded border px-2 py-1 text-sm"
          disabled={disabled}
        />
        <input
          type="text"
          value={novaDescricao}
          onChange={(e) => setNovaDescricao(e.target.value)}
          placeholder="Descrição (opcional)"
          className="rounded border px-2 py-1 text-sm"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={addItem}
          disabled={disabled || !novoTitulo.trim()}
          className="rounded border bg-muted px-3 py-1 text-sm hover:bg-muted/80"
        >
          Adicionar item
        </button>
      </div>
    </div>
  );
}
