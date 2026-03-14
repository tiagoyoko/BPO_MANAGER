"use client";

export type UsuarioListItem = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string;
  clienteId: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type ClienteOption = {
  id: string;
  nome: string;
  cnpj: string;
};

type Props = {
  usuarios: UsuarioListItem[];
  onEdit: (u: UsuarioListItem) => void;
  scope: "interno" | "cliente";
  clientes?: ClienteOption[];
};

const ROLES_LABEL: Record<string, string> = {
  admin_bpo: "Admin BPO",
  gestor_bpo: "Gestor",
  operador_bpo: "Operador",
};

export function UsuariosTable({
  usuarios,
  onEdit,
  scope,
  clientes = [],
}: Props) {
  if (usuarios.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        {scope === "cliente"
          ? "Nenhum usuário de cliente cadastrado."
          : "Nenhum usuário interno cadastrado."}
      </p>
    );
  }

  const clientesMap = new Map(clientes.map((cliente) => [cliente.id, cliente]));

  return (
    <div
      role="region"
      aria-label={scope === "cliente" ? "Lista de usuários de clientes" : "Lista de usuários internos"}
    >
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th scope="col" className="py-2 pr-4 font-medium">
              Nome
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              E-mail
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Papel
            </th>
            {scope === "cliente" && (
              <th scope="col" className="py-2 pr-4 font-medium">
                Cliente
              </th>
            )}
            <th scope="col" className="py-2 pr-4 font-medium">
              Criado em
            </th>
            <th scope="col" className="py-2 font-medium">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-b hover:bg-muted/50">
              <td className="py-2 pr-4">{u.nome ?? "—"}</td>
              <td className="py-2 pr-4">{u.email ?? "—"}</td>
              <td className="py-2 pr-4">{ROLES_LABEL[u.role] ?? u.role}</td>
              {scope === "cliente" && (
                <td className="py-2 pr-4">
                  {u.clienteId
                    ? `${clientesMap.get(u.clienteId)?.nome ?? u.clienteId} · ${clientesMap.get(u.clienteId)?.cnpj ?? "CNPJ não carregado"}`
                    : "—"}
                </td>
              )}
              <td className="py-2 pr-4">
                {u.criadoEm ? new Date(u.criadoEm).toLocaleDateString("pt-BR") : "—"}
              </td>
              <td className="py-2">
                <button
                  type="button"
                  onClick={() => onEdit(u)}
                  className="text-primary hover:underline text-left"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
