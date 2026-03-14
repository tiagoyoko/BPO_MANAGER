import { vi } from "vitest";

// jsdom não implementa os métodos nativos do <dialog> HTML.
// A guarda evita erro em testes com ambiente Node (que não têm HTMLDialogElement).
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
}
