"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const TITULO_ID = "confirmar-encerramento-titulo";
const DESCRICAO_ID = "confirmar-encerramento-descricao";

/**
 * Dialog de confirmação para status "Encerrado" (Story 1.3 — AC 4).
 * role="alertdialog", foco preso, Cancelar como ação padrão de teclado.
 */
export function ConfirmarEncerramentoDialog({ open, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      cancelRef.current?.focus();
    } else {
      dialog.close();
      previousFocusRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key !== "Tab") return;

      const first = cancelRef.current;
      const last = confirmRef.current;
      if (!first || !last) return;

      if (e.shiftKey) {
        e.preventDefault();
        if (document.activeElement === first) {
          last.focus();
        } else {
          first.focus();
        }
      } else {
        e.preventDefault();
        if (document.activeElement === last) {
          first.focus();
        } else {
          last.focus();
        }
      }
    };
    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={TITULO_ID}
      aria-describedby={DESCRICAO_ID}
      aria-modal="true"
      className="rounded-lg border border-border bg-background p-6 shadow-lg backdrop:bg-black/40"
    >
      <h2 id={TITULO_ID} className="text-lg font-semibold mb-2">
        Encerrar cliente?
      </h2>
      <p id={DESCRICAO_ID} className="text-sm text-muted-foreground mb-6">
        Encerrar este cliente o tornará inativo. Rotinas e integrações ativas serão pausadas.
      </p>
      <div className="flex justify-end gap-3">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
        >
          Confirmar encerramento
        </button>
      </div>
    </dialog>
  );
}
