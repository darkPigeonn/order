import { formatNominal, parseNominal } from "@/lib/format";

export function MoneyInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="field-affix">
      <span className="text-sm text-slate-500">Rp</span>
      <input
        inputMode="numeric"
        disabled={disabled}
        value={formatNominal(value)}
        onChange={(event) => onChange(parseNominal(event.target.value))}
      />
    </div>
  );
}
