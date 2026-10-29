const escapeCell = (value) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// columns: [{ key, label }]. A BOM keeps Bangla text readable when opened in Excel.
export function downloadCsv(filename, columns, rows) {
  const lines = [
    columns.map((column) => escapeCell(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => escapeCell(row[column.key])).join(",")),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
