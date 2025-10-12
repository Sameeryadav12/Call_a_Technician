// src/lib/csv.js
export function exportCSV(filename, columns, rows) {
  // columns: [{key:'number', label:'Number'}, ...]
  const header = columns.map(c => csvEscape(c.label)).join(',');
  const body = rows.map(r => columns.map(c => csvEscape(valueOf(r, c.key))).join(',')).join('\r\n');
  const blob = new Blob([header + '\r\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function valueOf(obj, path) {
  // supports nested keys like "customer.name"
  return path.split('.').reduce((v, k) => (v?.[k]), obj);
}

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
