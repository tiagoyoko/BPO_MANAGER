"use client";

import { useCallback, useState } from "react";
import {
  UsuariosTable,
  type ClienteOption,
  type UsuarioListItem,
} from "./usuarios-table";
import { UsuarioForm } from "./usuario-form";

type Props = {
  usuariosIniciais: UsuarioListItem[];
  usuariosClientesIniciais: UsuarioListItem[];
  clientes: ClienteOption[];
  canManageInternal: boolean;
};

export function AdminUsuariosClient({
  usuariosIniciais,
  usuariosClientesIniciais,
  clientes,
  canManageInternal,
}: Props) {
  const [usuariosInternos, setUsuariosInternos] = useState<UsuarioListItem[]>(usuariosIniciais);
  const [usuariosClientes, setUsuariosClientes] =
    useState<UsuarioListItem[]>(usuariosClientesIniciais);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioListItem | null>(null);
  const [scope, setScope] = useState<"interno" | "cliente">(
    canManageInternal ? "interno" : "cliente"
  );
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const refreshList = useCallback(async () => {
    try {
      if (canManageInternal) {
        const internosRes = await fetch("/api/admin/usuarios");
        const internosJson = await internosRes.json();
        if (internosRes.ok && internosJson.data) {
          setUsuariosInternos(internosJson.data);
        }
      }

      const clientesRes = await fetch("/api/admin/usuarios?tipo=cliente");
      const clientesJson = await clientesRes.json();
      if (clientesRes.ok && clientesJson.data) {
        setUsuariosClientes(clientesJson.data);
      }
    } catch {
      setFeedback({ type: "error", message: "Erro ao atualizar lista." });
    }
  }, [canManageInternal]);

  function handleSuccess() {
    setShowForm(false);
    setEditingUser(null);
    refreshList();
    setFeedback({
      type: "success",
      message:
        scope === "cliente"
          ? editingUser
            ? "Usuário de cliente atualizado."
            : "Usuário de cliente criado com sucesso."
          : editingUser
            ? "Usuário atualizado."
            : "Usuário criado com sucesso.",
    });
    setTimeout(() => setFeedback(null), 4000);
  }

  function openCreate(nextScope: "interno" | "cliente") {
    setScope(nextScope);
    setEditingUser(null);
    setShowForm(true);
  }

  function openEdit(nextScope: "interno" | "cliente", usuario: UsuarioListItem) {
    setScope(nextScope);
    setEditingUser(usuario);
    setShowForm(true);
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestão segregada entre usuários internos e usuários de clientes.
        </p>
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

      {canManageInternal && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Usuários internos</h2>
              <p className="text-sm text-muted-foreground">
                Apenas admin_bpo pode criar ou editar perfis internos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCreate("interno")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              aria-haspopup="dialog"
            >
              Novo usuário interno
            </button>
          </div>

          <UsuariosTable
            usuarios={usuariosInternos}
            onEdit={(usuario) => openEdit("interno", usuario)}
            scope="interno"
          />
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Usuários de clientes</h2>
            <p className="text-sm text-muted-foreground">
              Acesso restrito ao `clienteId` do usuário final.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreate("cliente")}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            aria-haspopup="dialog"
          >
            Novo usuário de cliente
          </button>
        </div>

        <UsuariosTable
          usuarios={usuariosClientes}
          onEdit={(usuario) => openEdit("cliente", usuario)}
          scope="cliente"
          clientes={clientes}
        />
      </section>

      {showForm && (
        <UsuarioForm
          editingUser={editingUser}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          scope={scope}
          clientes={clientes}
        />
      )}
    </>
  );
}
