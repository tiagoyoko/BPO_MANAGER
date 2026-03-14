"use client";

import { useEffect, useRef, useState } from "react";
import type { Cliente, NovoClienteInput, StatusCliente } from "@/lib/domain/clientes/types";
import { ConfirmarEncerramentoDialog } from "./confirmar-encerramento-dialog";

const STATUS_OPCOES: StatusCliente[] = ["Ativo", "Em implantação", "Pausado", "Encerrado"];

type Props = {
  onSuccess: (cliente: Cliente) => void;
  onCancel: () => void;
  onFeedback?: (feedback: { type: "success" | "error"; title: string; message?: string }) => void;
  clienteInicial?: Cliente;
};

const CAMPOS_INICIAIS: NovoClienteInput = {
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  email: "",
  telefone: "",
  responsavelInternoId: null,
  receitaEstimada: null,
  tags: [],
};

function formatarCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function NovoClienteForm({ onSuccess, onCancel, onFeedback, clienteInicial }: Props) {
  const isEditMode = !!clienteInicial;
  const [campos, setCampos] = useState<NovoClienteInput>(() =>
    clienteInicial
      ? {
          cnpj: clienteInicial.cnpj,
          razaoSocial: clienteInicial.razaoSocial,
          nomeFantasia: clienteInicial.nomeFantasia,
          email: clienteInicial.email,
          telefone: clienteInicial.telefone ?? "",
          responsavelInternoId: clienteInicial.responsavelInternoId ?? null,
          receitaEstimada: clienteInicial.receitaEstimada ?? null,
          tags: clienteInicial.tags ?? [],
        }
      : CAMPOS_INICIAIS
  );
  const [status, setStatus] = useState<StatusCliente>(clienteInicial?.status ?? "Ativo");
  const [tagsInput, setTagsInput] = useState(
    clienteInicial?.tags?.join(", ") ?? ""
  );
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [erroForm, setErroForm] = useState<{ code: string; message: string } | null>(null);
  const [showConfirmEncerramento, setShowConfirmEncerramento] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap + foco inicial ao abrir o modal (WCAG 2.1 AA — 2.1.2 e 3.2.2)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      if (focusable.length === 0) { e.preventDefault(); return; }
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }

    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const camposComErro = erroForm ? camposAfetadosPorErro(erroForm.code) : [];

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setCampos((prev) => ({ ...prev, [name]: value }));
  }

  async function doSubmit() {
    setErroForm(null);
    setIsSubmittingForm(true);
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const payload = {
      razaoSocial: campos.razaoSocial.trim(),
      nomeFantasia: campos.nomeFantasia.trim(),
      email: campos.email.trim().toLowerCase(),
      telefone: campos.telefone?.trim() || null,
      responsavelInternoId: campos.responsavelInternoId?.trim() || null,
      receitaEstimada:
        campos.receitaEstimada !== undefined &&
        campos.receitaEstimada !== null
          ? Number(campos.receitaEstimada)
          : null,
      tags,
      ...(isEditMode ? { status } : {}),
    };

    try {
      if (isEditMode && clienteInicial) {
        const res = await fetch(`/api/clientes/${clienteInicial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json: { data: Cliente | null; error: { code: string; message: string } | null } =
          await res.json();
        if (!res.ok || json.error) {
          const error = json.error ?? {
            code: "UNKNOWN",
            message: "Erro inesperado. Tente novamente.",
          };
          setErroForm(error);
          onFeedback?.({
            type: "error",
            title: "Não foi possível salvar o cliente",
            message: mensagemErro(error.code, error.message),
          });
          return;
        }
        onFeedback?.({
          type: "success",
          title: "Cliente atualizado",
          message: "As alterações foram salvas com sucesso.",
        });
        onSuccess(json.data!);
      } else {
        const res = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...campos, ...payload }),
        });
        const json: { data: Cliente | null; error: { code: string; message: string } | null } =
          await res.json();
        if (!res.ok || json.error) {
          const error = json.error ?? {
            code: "UNKNOWN",
            message: "Erro inesperado. Tente novamente.",
          };
          setErroForm(error);
          onFeedback?.({
            type: "error",
            title: "Não foi possível cadastrar o cliente",
            message: mensagemErro(error.code, error.message),
          });
          return;
        }
        onFeedback?.({
          type: "success",
          title: "Cliente cadastrado",
          message: "O cliente foi salvo com sucesso.",
        });
        onSuccess(json.data!);
      }
    } catch {
      const error = { code: "NETWORK_ERROR", message: "Erro de conexão. Tente novamente." };
      setErroForm(error);
      onFeedback?.({
        type: "error",
        title: "Erro de conexao",
        message: mensagemErro(error.code, error.message),
      });
    } finally {
      setIsSubmittingForm(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isEditMode && status === "Encerrado") {
      setShowConfirmEncerramento(true);
      return;
    }
    await doSubmit();
  }

  async function handleConfirmarEncerramento() {
    setShowConfirmEncerramento(false);
    await doSubmit();
  }

  return (
    <>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="novo-cliente-titulo"
        className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
      >
        <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
          <h2 id="novo-cliente-titulo" className="text-lg font-semibold mb-4">
            {isEditMode ? "Editar cliente" : "Novo cliente"}
          </h2>

          {erroForm && (
            <div
              id="novo-cliente-form-erro"
              role="alert"
              aria-live="assertive"
              className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {mensagemErro(erroForm.code, erroForm.message)}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <fieldset disabled={isSubmittingForm} className="space-y-4">
              <legend className="sr-only">Dados do cliente</legend>

              {/* Obrigatórios */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {isEditMode ? (
                  <div>
                    <label htmlFor="cnpj" className="block text-sm font-medium mb-1">
                      CNPJ (não editável)
                    </label>
                    <input
                      id="cnpj"
                      name="cnpj"
                      value={formatarCnpj(campos.cnpj)}
                      readOnly
                      disabled
                      aria-label="CNPJ (não editável)"
                      className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-60 cursor-not-allowed"
                    />
                  </div>
                ) : (
                  <Field
                    label="CNPJ *"
                    id="cnpj"
                    name="cnpj"
                    value={campos.cnpj}
                    onChange={handleChange}
                    placeholder="XX.XXX.XXX/XXXX-XX"
                    required
                    autoComplete="off"
                    inputMode="numeric"
                    hasError={camposComErro.includes("cnpj")}
                  />
                )}
              <Field
                label="E-mail *"
                id="email"
                name="email"
                value={campos.email}
                onChange={handleChange}
                type="email"
                placeholder="contato@empresa.com"
                required
                autoComplete="email"
                hasError={camposComErro.includes("email")}
              />
            </div>

            <Field
              label="Razão Social *"
              id="razaoSocial"
              name="razaoSocial"
              value={campos.razaoSocial}
              onChange={handleChange}
              placeholder="Empresa Ltda."
              required
              hasError={camposComErro.includes("razaoSocial")}
            />

            <Field
              label="Nome Fantasia *"
              id="nomeFantasia"
              name="nomeFantasia"
              value={campos.nomeFantasia}
              onChange={handleChange}
              placeholder="Marca comercial"
              required
              hasError={camposComErro.includes("nomeFantasia")}
            />

            {/* Opcionais */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Telefone"
                id="telefone"
                name="telefone"
                value={campos.telefone ?? ""}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                inputMode="tel"
                hasError={camposComErro.includes("telefone")}
              />
              {/* TODO: substituir por combobox/select de usuários do BPO quando API de usuários estiver disponível (AI-Review follow-up) */}
              <div>
                <label htmlFor="responsavelInternoId" className="block text-sm font-medium mb-1">
                  Responsável interno
                </label>
                <input
                  id="responsavelInternoId"
                  name="responsavelInternoId"
                  type="text"
                  value={campos.responsavelInternoId ?? ""}
                  onChange={handleChange}
                  placeholder="UUID do usuário responsável"
                  autoComplete="off"
                  aria-invalid={camposComErro.includes("responsavelInternoId")}
                  aria-describedby={
                    camposComErro.includes("responsavelInternoId")
                      ? "novo-cliente-form-erro"
                      : "responsavelInternoId-desc"
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <p id="responsavelInternoId-desc" className="mt-1 text-xs text-muted-foreground">
                  Informe o UUID do responsável. Em breve: seletor de usuários do BPO.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="receitaEstimada" className="block text-sm font-medium mb-1">
                  Receita estimada (R$)
                </label>
                <input
                  id="receitaEstimada"
                  name="receitaEstimada"
                  type="number"
                  min="0"
                  step="0.01"
                  value={campos.receitaEstimada ?? ""}
                  onChange={(e) =>
                    setCampos((prev) => ({
                      ...prev,
                      receitaEstimada: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="0,00"
                  aria-invalid={camposComErro.includes("receitaEstimada")}
                  aria-describedby={
                    camposComErro.includes("receitaEstimada")
                      ? "novo-cliente-form-erro"
                      : undefined
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="tags" className="block text-sm font-medium mb-1">
                  Tags
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="financeiro, vip, onboarding"
                  aria-invalid={camposComErro.includes("tags")}
                  aria-describedby={
                    camposComErro.includes("tags")
                      ? "novo-cliente-form-erro"
                      : undefined
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Separe as tags por vírgula.
                </p>
              </div>
            </div>

            {isEditMode && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusCliente)}
                  aria-describedby={status === "Encerrado" ? "aviso-encerramento" : undefined}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUS_OPCOES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {status === "Encerrado" && (
                  <p id="aviso-encerramento" className="mt-1 text-xs text-amber-600" role="status">
                    Encerrar este cliente o tornará inativo.
                  </p>
                )}
              </div>
            )}
          </fieldset>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmittingForm}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingForm}
              aria-disabled={isSubmittingForm}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmittingForm ? "Salvando…" : isEditMode ? "Salvar alterações" : "Salvar cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
    <ConfirmarEncerramentoDialog
      open={showConfirmEncerramento}
      onConfirm={handleConfirmarEncerramento}
      onCancel={() => setShowConfirmEncerramento(false)}
    />
    </>
  );
}

// ─── Componente Field auxiliar ────────────────────────────────────────────────

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  label: string;
  id: string;
};

function Field({ label, id, hasError = false, ...props }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={hasError}
        aria-describedby={hasError ? "novo-cliente-form-erro" : undefined}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      />
    </div>
  );
}

// ─── Mensagens de erro amigáveis ──────────────────────────────────────────────

function mensagemErro(code: string, fallback: string): string {
  const msgs: Record<string, string> = {
    CNPJ_INVALIDO: "O CNPJ informado é inválido. Verifique os dígitos e tente novamente.",
    CNPJ_DUPLICADO: "Já existe um cliente com este CNPJ na sua carteira.",
    CNPJ_NAO_EDITAVEL: "O CNPJ não pode ser alterado.",
    CAMPOS_OBRIGATORIOS: "Preencha todos os campos obrigatórios (CNPJ, Razão Social, Nome Fantasia e E-mail).",
    EMAIL_INVALIDO: "O e-mail informado é inválido. Verifique o formato e tente novamente.",
    STATUS_INVALIDO: "Status inválido. Escolha Ativo, Em implantação, Pausado ou Encerrado.",
    UNAUTHORIZED: "Sua sessão expirou. Faça login novamente.",
    FORBIDDEN: "Acesso negado. Apenas gestores e administradores podem editar clientes.",
    NOT_FOUND: "Cliente não encontrado.",
    NETWORK_ERROR: "Erro de conexão. Verifique sua internet e tente novamente.",
  };
  return msgs[code] ?? fallback;
}

function camposAfetadosPorErro(code: string): string[] {
  const mapa: Record<string, string[]> = {
    CNPJ_INVALIDO: ["cnpj"],
    CNPJ_DUPLICADO: ["cnpj"],
    CAMPOS_OBRIGATORIOS: ["cnpj", "razaoSocial", "nomeFantasia", "email"],
    EMAIL_INVALIDO: ["email"],
    STATUS_INVALIDO: ["status"],
  };
  return mapa[code] ?? [];
}
