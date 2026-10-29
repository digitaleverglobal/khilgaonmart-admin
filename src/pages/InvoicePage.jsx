import { useEffect } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import {
  getLogo,
  getSiteName,
  normalizeSettingData,
} from "../utils/siteBranding";
import { imageUrl } from "../utils/assetUrl";
import { formatInvoiceNumber } from "../utils/invoiceNumber";
import { weightAdjustText } from "../utils/variants";

function parseOrderNote(note) {
  if (!note || typeof note !== "string") return {};
  try {
    const parsed = JSON.parse(note);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function invoiceNumber(order) {
  return formatInvoiceNumber(order);
}

function money(value) {
  return `${Number(value || 0).toLocaleString()}৳`;
}

function formatDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function formatPaymentMethod(value) {
  const normalized = String(value || "cod").trim();
  const key = normalized.toLowerCase().replace(/[\s_-]+/g, "_");
  const labels = {
    cod: "Cash on Delivery",
    cash_on_delivery: "Cash on Delivery",
    bkash: "Bkash",
    nagad: "Nagad",
    rocket: "Rocket",
    sslcommerz: "SSLCommerz",
    card: "Card",
    bank_transfer: "Bank Transfer",
  };
  return (
    labels[key] ||
    normalized
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function getItemImage(item) {
  if (item.image || item.productImage) return item.image || item.productImage;
  if (Array.isArray(item.images) && item.images[0]) return item.images[0];
  if (typeof item.images === "string") {
    try {
      const parsed = JSON.parse(item.images);
      if (Array.isArray(parsed) && parsed[0]) return parsed[0];
    } catch {
      return item.images;
    }
  }
  return "";
}

function getItems(order, meta) {
  const source = Array.isArray(order.items)
    ? order.items
    : Array.isArray(meta.items)
      ? meta.items
      : [];

  if (source.length) {
    return source.map((item, index) => {
      const qty = Number(item.qty || item.quantity || 1) || 1;
      const unitPrice = Number(item.price || item.salePrice || 0);
      const total = Number(item.total || item.lineTotal || unitPrice * qty);
      return {
        id: item.id || item.productId || index,
        name: `${item.name || item.productName || "Product"}${item.variant ? ` (${item.variant})` : ""}${weightAdjustText(item)}`,
        qty,
        unitPrice: unitPrice || Math.round(total / qty),
        total,
        image: getItemImage(item),
      };
    });
  }

  const qty = Number(order.quantity || 1) || 1;
  const total = Number(order.totalBill || order.total || 0);
  return [
    {
      id: order.Id || "single",
      name: order.productName || "Product",
      qty,
      unitPrice: Math.round(total / qty),
      total,
      image: order.productImage || "",
    },
  ];
}

function buildBarcode(seed) {
  const text = String(seed || "000000");
  const values = Array.from({ length: 58 }, (_, index) => {
    const code = text.charCodeAt(index % text.length) || 48;
    return 18 + ((code + index * 7) % 36);
  });
  return values;
}

export default function InvoicePage({
  order,
  onBack,
  siteSettings,
  autoPrint = false,
}) {
  useEffect(() => {
    if (!autoPrint || !order) return undefined;
    const timer = window.setTimeout(() => window.print(), 150);
    return () => window.clearTimeout(timer);
  }, [autoPrint, order?.Id]);

  if (!order) return null;

  const meta = parseOrderNote(order.note);
  const settings = normalizeSettingData(siteSettings);
  const items = getItems(order, meta);
  const subtotal =
    Number(order.subtotal ?? meta.subtotal) ||
    items.reduce((sum, item) => sum + item.total, 0);
  const shipping = Number(order.deliveryCharge ?? meta.deliveryCharge ?? 0);
  const discount = Number(meta.discount || order.discount || 0);
  const finalTotal =
    Number(order.totalBill || order.total || meta.total) ||
    Math.max(0, subtotal + shipping - discount);
  const paid = Number(order.advance || order.paid || meta.paid || 0);
  const due = Math.max(0, finalTotal - paid);
  const customerAddress =
    order.customerAddress ||
    meta.customerAddress ||
    [order.customerArea, order.customerDistrict].filter(Boolean).join(", ");
  const sellerName =
    getSiteName(settings) || settings.companyName || "Khilgaon Mart";
  const sellerPhone =
    settings.phone || settings.phoneNumber || "+8809647-222999";
  const sellerEmail = settings.email || "holydeenbd@gmail.com";
  const sellerAddress =
    settings.address || "500/3 Khilgaon Niribili Society, Dhaka Bangladesh";
  const logo = getLogo(settings) || "/homzify-logo.jpeg";
  const invoiceNo = invoiceNumber(order);
  const orderDate = order.orderDate || order.createdAt || meta.orderDate;
  const paymentMethod = formatPaymentMethod(
    order.paymentMethod || meta.paymentMethod,
  );
  const barcodeBars = buildBarcode(invoiceNo);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 min-h-full">
      <div className="no-print mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
        >
          <ArrowLeft size={15} />
          Back To Order
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex h-8 w-8 items-center justify-center rounded bg-teal-500 text-white transition hover:bg-teal-600"
          title="Print Invoice"
        >
          <Printer size={15} />
        </button>
        <span className="w-24" />
      </div>

      <div className="mx-auto flex max-w-5xl justify-center overflow-x-auto px-4 pb-10 sm:px-6">
        <div className="invoice-page min-w-[720px] bg-white px-8 py-8 text-[16px] text-gray-900 shadow-sm">
          <header className="grid grid-cols-2 gap-8">
            <div>
              <img
                src={logo}
                alt={sellerName}
                className="h-32 w-auto max-w-[200px] object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="text-right">
              <div className="ml-auto mb-4 flex h-12 w-44 items-end justify-end gap-px">
                {barcodeBars.map((height, index) => (
                  <span
                    key={index}
                    className="block bg-black"
                    style={{ width: index % 5 === 0 ? 3 : 1, height }}
                  />
                ))}
              </div>
              <div className="leading-7">
                <div>
                  ইনভয়েস আইডি : <strong>{invoiceNo}</strong>
                </div>
                <div>
                  অর্ডার টাইম : <strong>{formatDate(orderDate)}</strong>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-12 grid grid-cols-2 gap-10">
            <div className="leading-7">
              <h2 className="mb-2 font-bold">বিক্রেতা</h2>
              <p>{sellerName}</p>
              <p>{sellerEmail}</p>
              <p>{sellerPhone}</p>
              <p>{sellerAddress}</p>
            </div>

            <div className="text-right leading-7">
              <h2 className="mb-2 font-bold">পণ্য ডেলিভারির ঠিকানা</h2>
              <p>{order.customerName || "Customer"}</p>
              <p>{order.customerPhone || "N/A"}</p>
              <p>{customerAddress || "N/A"}</p>
            </div>
          </section>

          <table className="mt-12 w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-left text-gray-600">
                <th className="w-24 py-3 font-bold">ছবি</th>
                <th className="py-3 font-bold">বিবরণ</th>
                <th className="w-36 py-3 text-center font-bold">পরিমাণ</th>
                <th className="w-36 py-3 text-right font-bold">মোট মূল্য</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-4">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden border border-gray-100 bg-gray-50 text-[10px] text-gray-300">
                      {item.image ? (
                        <img
                          src={imageUrl(item.image)}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            event.currentTarget.parentElement.textContent =
                              "IMG";
                          }}
                        />
                      ) : (
                        "IMG"
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-gray-700">{item.name}</td>
                  <td className="py-4 text-center text-gray-700">
                    {item.qty} x {money(item.unitPrice)}
                  </td>
                  <td className="py-4 text-right text-gray-700">
                    {money(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <section className="mt-0 flex justify-end">
            <table className="w-[390px] border-collapse text-gray-700">
              <tbody>
                <TotalRow
                  label="পণ্যের মোট মূল্য"
                  value={money(subtotal)}
                  bold
                />
                <TotalRow
                  label="ডেলিভারি চার্জ (+)"
                  value={money(shipping)}
                  bold
                />
                <TotalRow label="ছাড় (-)" value={money(discount)} bold />
                <TotalRow label="পরিশোধ যোগ্য" value={money(finalTotal)} bold />
                <TotalRow label="পরিশোধ" value={money(paid)} bold />
                <TotalRow label="বাকি" value={money(due)} bold />
              </tbody>
            </table>
          </section>

          <table className="mt-8 w-full border-collapse text-sm text-gray-700">
            <tbody>
              <tr>
                <InfoCell
                  label="Transaction Date"
                  value={formatDate(orderDate)}
                />
                <InfoCell label="Payment Gateway" value={paymentMethod} />
                <InfoCell
                  label="Transaction ID"
                  value={order.transactionId || meta.transactionId || ""}
                />
                <InfoCell
                  label="Account Number"
                  value={order.accountNumber || meta.accountNumber || ""}
                />
                <InfoCell label="Amount" value={paid || 0} />
              </tr>
            </tbody>
          </table>

          <footer className="mt-8 border-t border-gray-200 pt-8 text-center">
            <p className="font-bold italic text-indigo-600">
              Terms & Conditions
            </p>
            <p className="mt-3 italic text-gray-500">
              * This is a computer generated invoice, does not require any
              signature.
            </p>
          </footer>
        </div>
      </div>

      <style>{`
        .invoice-page {
          width: 760px;
          min-height: 986px;
          font-family: Arial, Helvetica, sans-serif;
        }
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: #fff !important; }
          .no-print, header.no-print, aside { display: none !important; }
          .invoice-page {
            width: 100%;
            min-height: auto;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

function TotalRow({ label, value, bold }) {
  return (
    <tr className="border border-gray-200">
      <td className={`px-3 py-2 ${bold ? "font-bold" : ""}`}>{label}</td>
      <td className={`w-32 px-3 py-2 ${bold ? "font-bold" : ""}`}>{value}</td>
    </tr>
  );
}

function InfoCell({ label, value }) {
  return (
    <td className="border border-gray-200 px-3 py-2 align-top">
      <div>{label}</div>
      <div className="mt-2">{value || ""}</div>
    </td>
  );
}
