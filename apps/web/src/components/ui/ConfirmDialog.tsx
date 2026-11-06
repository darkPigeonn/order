import { Button } from "./Button";
import { Modal } from "./Modal";

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  pending,
  tone = "danger",
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  pending?: boolean;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm leading-6 text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
          Batal
        </Button>
        <Button type="button" variant={tone === "danger" ? "copper" : "primary"} onClick={onConfirm} disabled={pending}>
          {pending ? "Memproses..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
