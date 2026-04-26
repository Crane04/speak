import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "./cn";

type Variant = "primary" | "outline" | "ghost" | "subtle" | "danger" | "link";
type Size = "sm" | "md" | "lg" | "xl";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-sky-500/85 hover:bg-sky-500 text-slate-950 border border-sky-500/30",
  outline:
    "bg-transparent hover:bg-white/2 text-slate-200 border border-white/10 hover:border-white/15",
  ghost:
    "bg-transparent hover:bg-white/2 text-slate-200 border border-transparent",
  subtle:
    "bg-white/2 hover:bg-white/3 text-slate-200 border border-white/6 hover:border-white/10",
  danger:
    "bg-red-500/10 hover:bg-red-500/15 text-red-200 border border-red-500/25",
  link: "bg-transparent hover:bg-transparent text-sky-300 hover:text-sky-200 border border-transparent p-0",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-2 text-sm rounded-xl",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-5 py-3 text-base rounded-xl",
  xl: "px-6 py-5 text-xl rounded-2xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "outline", size = "md", type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-display transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] select-none",
        variantClasses[variant],
        variant !== "link" && sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});

export default Button;

