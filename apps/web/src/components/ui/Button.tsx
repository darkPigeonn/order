import { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-pine text-white shadow-sm hover:bg-[#1e40af]",
  copper: "bg-copper text-white shadow-sm hover:bg-[#881337]",
  ghost: "bg-white text-slate-700 border border-line hover:bg-slate-50 hover:text-ink",
  danger: "bg-copper text-white shadow-sm hover:bg-[#881337]",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
