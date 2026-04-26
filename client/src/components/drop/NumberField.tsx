type NumberFieldProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  min: number;
  max: number;
};

export default function NumberField({
  value,
  onChange,
  placeholder,
  min,
  max,
}: NumberFieldProps) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step="any"
      className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-base text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/35 transition-all font-display"
    />
  );
}

