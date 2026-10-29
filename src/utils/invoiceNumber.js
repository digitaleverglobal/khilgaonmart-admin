export function formatInvoiceNumber(orderOrValue, fallback = "KM-0000") {
  const rawValue =
    orderOrValue && typeof orderOrValue === "object"
      ? orderOrValue.invoiceId || orderOrValue.orderId || orderOrValue.Id
      : orderOrValue;
  const raw = String(rawValue || "").trim();
  if (!raw) return fallback;

  const prefixed = raw.match(/^(?:WZ|TJ)-?(\d+)$/i);
  if (prefixed) return `KM-${prefixed[1].padStart(4, "0")}`;

  if (/^\d+$/.test(raw)) return `KM-${raw.padStart(4, "0")}`;
  return raw;
}
