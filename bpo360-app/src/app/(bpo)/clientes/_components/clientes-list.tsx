"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth/user-context";
import type { Cliente, ErpDetalhesCliente, ErpStatusCliente } from "@/lib/domain/clientes/types";

type ResponsavelOption = {
  id: string;
  nome: string | null;
};

type Props = {
  clientes: Cliente[];
  onEditar?: (cliente: Cliente) => void;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  isLoadingClientes?: boolean;
  filtrosAtivos?: boolean;
  responsaveis?: ResponsavelOption[];
};

export function ClientesList({
  clientes,
  onEditar,
  total,
  page,
  limit,
  onPageChange,
  isLoadingClientes = false,
  filtrosAtivos = false,
  responsaveis = [],
}: Props) {
  const user = useUser();
  const router = useRouter();
  const podeEditar = user.role === "admin_bpo" || user.role === "gestor_bpo";
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const responsavelPorId = new Map(
    responsaveis.map((responsavel) => [responsavel.id, responsavel.nome ?? "Sem nome"])
  );

  if (isLoadingClientes) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center" role="status" aria-live="polite">
        Carregando clientes…
      </p>
    );
  }

  if (clientes.length === 0) {
    return (
      <div role="region" aria-label="Lista de clientes">
        <p className="text-sm text-muted-foreground py-8 text-center">
          {filtrosAtivos ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
        </p>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Lista de clientes">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th scope="col" className="py-2 pr-4 font-medium">Cliente</th>
            <th scope="col" className="py-2 pr-4 font-medium">CNPJ</th>
            <th scope="col" className="py-2 pr-4 font-medium">Status</th>
            <th scope="col" className="py-2 pr-4 font-medium">Responsável interno</th>
            <th scope="col" className="py-2 pr-4 font-medium">ERP/Integração</th>
            <th scope="col" className="py-2 pr-4 font-medium">Receita estimada</th>
            {podeEditar && <th scope="col" className="py-2 w-20 font-medium">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr
              key={c.id}
              className="border-b cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              tabIndex={0}
              onClick={() => router.push(`/clientes/${c.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/clientes/${c.id}`);
                }
              }}
              aria-label={`Abrir linha do cliente ${c.nomeFantasia}`}
            >
              <td className="py-2 pr-4">
                <Link
                  href={`/clientes/${c.id}`}
                  className="text-primary hover:underline block"
                  aria-label={`Abrir painel do cliente ${c.nomeFantasia}`}
                >
                  <span className="block font-medium">{c.nomeFantasia}</span>
                  <span className="block text-xs text-muted-foreground">{c.razaoSocial}</span>
                </Link>
              </td>
              <td className="py-2 pr-4 font-mono">{formatarCnpj(c.cnpj)}</td>
              <td className="py-2 pr-4">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${statusBadgeClass(c.status)}`}>
                  {c.status}
                </span>
              </td>
              <td className="py-2 pr-4">
                {c.responsavelInternoId
                  ? (responsavelPorId.get(c.responsavelInternoId) ?? "Responsável não encontrado")
                  : "Não definido"}
              </td>
              <td className="py-2 pr-4">
                <Link
                  href={`/clientes/${c.id}/config`}
                  className="inline-block"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Status ERP do cliente ${c.nomeFantasia}`}
                >
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs ${erpBadgeClass(c.erpStatus)}`}
                    title={erpTooltipText(c.erpDetalhes)}
                  >
                    {erpStatusLabel(c.erpStatus)}
                  </span>
                </Link>
              </td>
              <td className="py-2 pr-4">{formatarMoeda(c.receitaEstimada)}</td>
              {podeEditar && (
                <td className="py-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEditar?.(c);
                    }}
                    className="text-primary hover:underline text-sm font-medium"
                    aria-label={`Editar cliente ${c.razaoSocial}`}
                  >
                    Editar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between gap-4 mt-4 pt-4 border-t"
          aria-label="Paginação da lista de clientes"
        >
          <p className="text-sm text-muted-foreground">
            {total} resultado{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm disabled:opacity-50 hover:enabled:bg-muted"
              aria-label="Página anterior"
            >
              Anterior
            </button>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm disabled:opacity-50 hover:enabled:bg-muted"
              aria-label="Próxima página"
            >
              Próximo
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

function erpBadgeClass(status?: ErpStatusCliente): string {
  switch (status) {
    case "integracao_ativa":
      return "bg-green-100 text-green-800";
    case "config_basica_salva":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function erpStatusLabel(status?: ErpStatusCliente): string {
  switch (status) {
    case "integracao_ativa":
      return "F360 – ativo";
    case "config_basica_salva":
      return "F360 – config básica salva";
    default:
      return "Não configurado";
  }
}

function erpTooltipText(detalhes?: ErpDetalhesCliente | null): string {
  if (!detalhes) return "Nenhum ERP configurado";
  const data = detalhes.ultimaAlteracao
    ? new Date(detalhes.ultimaAlteracao).toLocaleDateString("pt-BR")
    : "Token não configurado";
  return `ERP: ${detalhes.tipoErp}\nÚltima alteração: ${data}`;
}

/** Classe Tailwind do badge de status conforme valor. */
function statusBadgeClass(status: string): string {
  switch (status) {
    case "Ativo":          return "bg-green-100 text-green-800";
    case "Em implantação": return "bg-blue-100 text-blue-800";
    case "Pausado":        return "bg-yellow-100 text-yellow-800";
    case "Encerrado":      return "bg-gray-100 text-gray-600";
    default:               return "bg-gray-100 text-gray-600";
  }
}

/** Formata CNPJ normalizado para exibição: XX.XXX.XXX/XXXX-XX */
function formatarCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function formatarMoeda(valor: number | null): string {
  if (valor === null) return "Não informada";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}
