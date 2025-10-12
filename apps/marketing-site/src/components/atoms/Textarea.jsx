export default function Textarea({
  label,
  id,
  rows = 4,
  helpText,
  error,
  className = "",
  ...props
}) {
  return (
    <label className="block">
      {label && (
        <span className="block mb-1 text-sm font-medium text-slate-700">
          {label}
        </span>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`block w-full rounded-md border px-3 py-2 text-sm placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? "border-red-500" : "border-slate-300"} ${className}`}
        {...props}
      />
      {helpText && !error && (
        <span className="mt-1 block text-xs text-slate-500">{helpText}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}
