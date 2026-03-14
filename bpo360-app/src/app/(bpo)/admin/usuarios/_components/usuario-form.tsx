"use client";

import { useState, useEffect } from "react";
import type { ClienteOption, UsuarioListItem } from "./usuarios-table";

type Papel = "admin_bpo" | "gestor_bpo" | "operador_bpo";

type Props = {
  editingUser: UsuarioListItem | null;
  onSuccess: () => void;
  onCancel: () => void;
  scope: "interno" | "cliente";
  clientes: ClienteOption[];
};

export function UsuarioForm({
  editingUser,
  onSuccess,
  onCancel,
  scope,
  clientes,
}: Props) {
  const isEdit = !!editingUser;
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Papel>("operador_bpo");
  const [clienteId, setClienteId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const isClienteScope = scope === "cliente";

  useEffect(() => {
    if (editingUser) {
      setNome(editingUser.nome ?? "");
      setEmail(editingUser.email ?? "");
      setRole((editingUser.role === "cliente_final" ? "operador_bpo" : editingUser.role) as Papel);
      setClienteId(editingUser.clienteId ?? "");
    } else {
      setNome("");
      setEmail("");
      setRole("operador_bpo");
      setClienteId(clientes[0]?.id ?? "");
    }
    setError(null);
  }, [clientes, editingUser]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEdit && editingUser) {
        const res = await fetch(`/api/admin/usuarios/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nome.trim(),
            role: isClienteScope ? "cliente_final" : role,
            clienteId: isClienteScope
              ? clienteId.trim()
              : role === "operador_bpo" && clienteId.trim()
                ? clienteId.trim()
                : null,
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          setError(json.error ?? { code: "UNKNOWN", message: "Erro ao salvar." });
          return;
        }
      } else {
        const res = await fetch("/api/admin/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            role: isClienteScope ? "cliente_final" : role,
            clienteId: isClienteScope
              ? clienteId.trim()
              : role === "operador_bpo" && clienteId.trim()
                ? clienteId.trim()
                : undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          setError(json.error ?? { code: "UNKNOWN", message: "Erro ao criar usuário." });
          return;
        }
      }
      onSuccess();
    } catch {
      setError({ code: "NETWORK_ERROR", message: "Erro de conexão. Tente novamente." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="usuario-form-titulo"
      className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
    >
      <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
        <h2 id="usuario-form-titulo" className="text-lg font-semibold mb-4">
          {isEdit
            ? isClienteScope
              ? "Editar usuário de cliente"
              : "Editar usuário"
            : isClienteScope
              ? "Novo usuário de cliente"
              : "Novo usuário"}
        </h2>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error.message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <fieldset disabled={isSubmitting} className="space-y-4">
            <div>
              <label htmlFor="usuario-nome" className="block text-sm font-medium mb-1">
                {isClienteScope ? "Nome" : "Nome *"}
              </label>
              <input
                id="usuario-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required={!isClienteScope}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="usuario-email" className="block text-sm font-medium mb-1">
                E-mail *
              </label>
              <input
                id="usuario-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isEdit}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
              />
              {isEdit && (
                <p className="text-xs text-muted-foreground mt-1">E-mail não pode ser alterado.</p>
              )}
            </div>

            {isClienteScope ? (
              <div>
                <label htmlFor="usuario-cliente-id" className="block text-sm font-medium mb-1">
                  Cliente *
                </label>
                <select
                  id="usuario-cliente-id"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome} · {cliente.cnpj}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="usuario-role" className="block text-sm font-medium mb-1">
                  Papel *
                </label>
                <select
                  id="usuario-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Papel)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="admin_bpo">Admin BPO</option>
                  <option value="gestor_bpo">Gestor</option>
                  <option value="operador_bpo">Operador</option>
                </select>
              </div>
            )}

            {!isClienteScope && role === "operador_bpo" && (
              <div>
                <label htmlFor="usuario-cliente-id" className="block text-sm font-medium mb-1">
                  Cliente (opcional)
                </label>
                <input
                  id="usuario-cliente-id"
                  type="text"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  placeholder="UUID do cliente"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Salvando…" : isEdit ? "Salvar" : "Criar"}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
