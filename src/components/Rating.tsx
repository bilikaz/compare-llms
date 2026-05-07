interface Props {
  value: number | undefined;
  onChange: (v: number) => void;
}

export function Rating({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-neutral-400 mr-1">rate:</span>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-7 h-7 rounded border ${value === n ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}
        >{n}</button>
      ))}
      {value != null && (
        <button
          className="ml-2 text-neutral-500 hover:text-neutral-300"
          onClick={() => onChange(0)}
          title="Clear"
        >×</button>
      )}
    </div>
  );
}
