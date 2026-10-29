import { useMemo, useState } from "react";
import { Search, Trash2, Video } from "lucide-react";
import { useSupplierAllList } from "../../hooks/useSuppliers";
import { purchaseService } from "../../services/purchaseService";
import { productService } from "../../services/productService";
import { imageUrl } from "../../utils/assetUrl";

function nowDateTime() {
  const d = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function toDateOnly(value) {
  return String(value || "").slice(0, 10);
}

function parseImages(images) {
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      return JSON.parse(images);
    } catch {
      return [];
    }
  }
  return [];
}

function getProductPrice(product) {
  const variation = Array.isArray(product.variations)
    ? product.variations.find(
        (v) => v?.purchasePrice || v?.newPrice || v?.oldPrice,
      )
    : null;
  return Number(
    product.purchasePrice ||
      product.purchase_price ||
      product.price ||
      product.newPrice ||
      variation?.purchasePrice ||
      variation?.newPrice ||
      variation?.oldPrice ||
      0,
  );
}

function normalizeInitialItems(purchase) {
  const rawItems =
    Array.isArray(purchase?.items) && purchase.items.length
      ? purchase.items
      : purchase?.productId
        ? [purchase]
        : [];

  return rawItems.map((item, index) => {
    const quantity = Number(item.quantity || item.qty || 1);
    const amount = Number(item.amount || 0);
    const price = Number(item.price || (quantity ? amount / quantity : 0) || 0);
    return {
      id: item.productId || item.id || item.Id || `item-${index}`,
      productId: item.productId || item.id || item.Id || null,
      name: item.name || purchase?.name || "Selected Product",
      image: item.image || item.productImage || null,
      quantity,
      price,
      discount: Number(item.discount || 0),
    };
  });
}

export default function PurchaseFormPage({
  mode = "create",
  purchase,
  onSave,
  onNavigate,
}) {
  const { data: suppliers } = useSupplierAllList();

  const [supplierId, setSupplierId] = useState(purchase?.supplierId ?? "");
  const [items, setItems] = useState(() => normalizeInitialItems(purchase));
  const [paid, setPaid] = useState("");
  const [date, setDate] = useState(
    purchase?.date ? `${purchase.date} 00:00:00` : nowDateTime(),
  );
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchTouched, setSearchTouched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    const subTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const discount = items.reduce(
      (sum, item) => sum + Number(item.discount || 0),
      0,
    );
    const total = Math.max(0, subTotal - discount);
    const paidAmount = Number(paid || 0);
    return {
      subTotal,
      discount,
      total,
      paid: paidAmount,
      due: Math.max(0, total - paidAmount),
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items, paid]);

  async function handleSearch(value) {
    setSearch(value);
    setError("");
    setSearchError("");
    if (!value.trim()) {
      setSuggestions([]);
      setSearchTouched(false);
      return;
    }

    setSearchTouched(true);
    setSearching(true);
    try {
      const res = await productService.getAll({ searchTerm: value, limit: 10 });
      setSuggestions(
        (res.data || []).filter(
          (product) => !items.some((item) => item.productId === product.Id),
        ),
      );
    } catch (err) {
      setSuggestions([]);
      setSearchError(err.message || "Product search failed.");
    } finally {
      setSearching(false);
    }
  }

  function addProduct(product) {
    const images = parseImages(product.images);
    setItems((prev) => [
      ...prev,
      {
        id: product.Id,
        productId: product.Id,
        name: product.name,
        image: images[0] || null,
        quantity: 1,
        price: getProductPrice(product),
        discount: 0,
      },
    ]);
    setSearch("");
    setSuggestions([]);
    setSearchTouched(false);
    setSearchError("");
  }

  function updateItem(id, field, value) {
    const numericFields = new Set(["quantity", "price", "discount"]);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextValue = numericFields.has(field)
          ? Math.max(0, Number(value || 0))
          : value;
        return {
          ...item,
          [field]: field === "quantity" ? Math.max(1, nextValue) : nextValue,
        };
      }),
    );
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!items.length) {
      setError("Please select at least one product.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: items.map((item) => item.name).join(", "),
        supplierId: supplierId ? Number(supplierId) : undefined,
        date: toDateOnly(date),
        quantity: totals.quantity,
        amount: totals.total,
        note: paid
          ? `Paid: ${totals.paid} Tk, Due: ${totals.due} Tk`
          : undefined,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          amount: Math.max(
            0,
            item.price * item.quantity - Number(item.discount || 0),
          ),
          price: item.price,
          discount: item.discount,
        })),
      };

      if (mode === "edit" && purchase?.Id) {
        await purchaseService.update(purchase.Id, payload);
      } else {
        await purchaseService.create(payload);
      }
      onSave && onSave();
      onNavigate && onNavigate("purchase_list");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Product Purchase</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
          >
            <Video size={14} />
            টিউটোরিয়াল দেখুন
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("purchase_list")}
            className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
          >
            Manage
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5 shadow-sm">
        {error && (
          <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="mb-2 block text-sm font-bold text-gray-500">
            Products *
          </label>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search Product or Scan Barcode ..."
              className="h-10 w-full border border-gray-300 px-2 pr-14 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <button
              type="button"
              onClick={() => handleSearch(search)}
              className="absolute right-0 top-0 flex h-10 w-12 items-center justify-center border border-gray-300 bg-gray-100 text-black"
              title="Search product"
            >
              <Search size={24} />
            </button>

            {(searchTouched || searching) && (
              <div className="absolute left-0 right-0 z-30 border border-gray-200 bg-gray-100 shadow-sm">
                {searching && (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Searching...
                  </div>
                )}
                {!searching && searchError && (
                  <div className="px-4 py-3 text-sm font-semibold text-red-500">
                    {searchError}
                  </div>
                )}
                {!searching &&
                  !searchError &&
                  suggestions.map((product) => {
                    const price = getProductPrice(product);
                    return (
                      <button
                        key={product.Id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="block w-full border-b border-gray-200 px-4 py-2 text-left text-sm text-gray-800 last:border-b-0 hover:bg-white"
                      >
                        <span className="block">{product.name}</span>
                        <span className="block text-xs text-gray-700">
                          ৳{price.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                {!searching && !searchError && suggestions.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No product found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border border-gray-300 bg-gray-100 text-left text-gray-500">
                {[
                  "Image",
                  "Name",
                  "Quantity",
                  "Price",
                  "Discount",
                  "Sub Total",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="border-r border-gray-300 px-3 py-3 font-bold last:border-r-0"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-x border-b border-gray-200">
                  <td className="w-24 px-3 py-3">
                    <div className="flex h-12 w-14 items-center justify-center overflow-hidden border border-gray-200 bg-gray-50 text-[10px] font-semibold text-gray-400">
                      {item.image ? (
                        <img
                          src={imageUrl(item.image)}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        "IMG"
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-semibold text-gray-700">
                    {item.name}
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", e.target.value)
                      }
                      className="h-9 w-24 border border-gray-300 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(item.id, "price", e.target.value)
                      }
                      className="h-9 w-28 border border-gray-300 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min="0"
                      value={item.discount}
                      onChange={(e) =>
                        updateItem(item.id, "discount", e.target.value)
                      }
                      className="h-9 w-28 border border-gray-300 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </td>
                  <td className="px-3 py-3 font-semibold text-gray-700">
                    {Math.max(
                      0,
                      item.price * item.quantity - Number(item.discount || 0),
                    ).toLocaleString()}{" "}
                    Tk
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded bg-red-100 text-red-500 hover:bg-red-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr className="border-x border-b border-gray-200">
                  <td
                    colSpan={7}
                    className="py-8 text-center text-sm text-gray-400"
                  >
                    Search and select products above
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]">
          <div className="space-y-3">
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="h-10 w-full border border-gray-300 bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              <option value="">Select Supplier..</option>
              {suppliers.map((supplier) => (
                <option key={supplier.Id} value={supplier.Id}>
                  {supplier.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
              placeholder="0"
              className="h-10 w-full border border-gray-300 px-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-500">
                Date*
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full border border-gray-300 px-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
          </div>

          <div className="border border-gray-200">
            <SummaryRow label="Sub Total" value={totals.subTotal} />
            <SummaryRow label="Discount" value={totals.discount} />
            <SummaryRow label="Total" value={totals.total} />
            <SummaryRow label="Paid" value={totals.paid} />
            <SummaryRow label="Due Payment" value={totals.due} />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 h-10 w-full bg-teal-500 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : mode === "edit"
              ? "Purchase Update"
              : "Purchase Submit"}
        </button>
      </form>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(120px,1fr)] border-b border-gray-200 last:border-b-0">
      <div className="border-r border-gray-200 px-4 py-3 text-sm text-gray-600">
        {label}
      </div>
      <div className="px-4 py-3 text-sm text-gray-600">
        {Number(value || 0).toLocaleString()} Tk
      </div>
    </div>
  );
}
