export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border border-[#fecdd3] bg-[#fff1f2] px-3.5 py-2.5 text-sm text-[#9f1239]">
      {children}
    </div>
  );
}
