"use client";

import { useState, useCallback } from "react";
import { UsuariosTable, type UsuarioListItem } from "./usuarios-table";
import { UsuarioForm } from "./usuario-form";

type Props = {
  usuariosIniciais: UsuarioListItem[];
};

export function AdminUsuariosClient({ usuariosIniciais }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>(usuariosIniciais);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioListItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/usuarios");
      const json = await res.json();
      if (res.ok && json.data) setUsuarios(json.data);
    } catch {
      setFeedback({ type: "error", message: "Erro ao atualizar lista." });
    }
  }, []);

  function handleSuccess() {
    setShowForm(false);
    setEditingUser(null);
    refreshList();
    setFeedback({
      type: "success",
      message: editingUser ? "Usuário atualizado." : "Usuário criado com sucesso.",
    });
    setTimeout(() => setFeedback(null), 4000);
  }

  function openCreate() {
    setEditingUser(null);
    setShowForm(true);
  }

  function openEdit(u: UsuarioListItem) {
    setEditingUser(u);
    setShowForm(true);
  }

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Usuários internos</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          aria-haspopup="dialog"
        >
          Novo usuário
        </button>
      </header>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={
            feedback.type === "success"
              ? "mb-4 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-800"
              : "mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          }
        >
          {feedback.message}
        </div>
      )}

      <UsuariosTable usuarios={usuarios} onEdit={openEdit} />

      {showForm && (
        <UsuarioForm
          editingUser={editingUser}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}
    </>
  );
}
