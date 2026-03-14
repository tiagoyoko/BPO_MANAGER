/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConfirmarEncerramentoDialog } from "./confirmar-encerramento-dialog";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function close() {
    this.removeAttribute("open");
  });
});

describe("ConfirmarEncerramentoDialog", () => {
  it("mantem o foco preso entre cancelar e confirmar", async () => {
    render(
      <ConfirmarEncerramentoDialog open onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    const cancelar = await screen.findByRole("button", { name: /cancelar/i });
    const confirmar = screen.getByRole("button", {
      name: /confirmar encerramento/i,
    });

    expect(document.activeElement).toBe(cancelar);

    fireEvent.keyDown(cancelar, { key: "Tab" });
    expect(document.activeElement).toBe(confirmar);

    fireEvent.keyDown(confirmar, { key: "Tab" });
    expect(document.activeElement).toBe(cancelar);

    fireEvent.keyDown(cancelar, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirmar);
  });
});
