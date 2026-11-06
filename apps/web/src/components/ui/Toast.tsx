export function Toast({
  tone,
  message,
  onClose,
}: {
  tone: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  const styles = tone === "success"
    ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
    : "border-[#fecdd3] bg-[#fff1f2] text-[#9f1239]";

  return (
    <div className={`fixed right-5 top-5 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-card ${styles}`} role="status">
      <p className="font-medium">{message}</p>
      <button type="button" className="font-semibold" onClick={onClose} aria-label="Tutup pemberitahuan">
        ×
      </button>
    </div>
  );
}
