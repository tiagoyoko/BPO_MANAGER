"use client";

type FeedbackToastProps = {
  open: boolean;
  title: string;
  message?: string;
  variant?: "success" | "error";
  onClose: () => void;
};

export function FeedbackToast({
  open,
  title,
  message,
  variant = "success",
  onClose,
}: FeedbackToastProps) {
  if (!open) return null;

  const palette =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-destructive/40 bg-destructive/10 text-destructive";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-[60] w-full max-w-sm rounded-lg border p-4 shadow-lg backdrop-blur-sm"
    >
      <div className={["rounded-md border p-4", palette].join(" ")}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold">{title}</p>
            {message ? <p className="text-sm opacity-90">{message}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs font-medium hover:bg-black/5"
            aria-label="Fechar notificação"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
