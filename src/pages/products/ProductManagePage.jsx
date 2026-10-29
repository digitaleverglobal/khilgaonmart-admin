import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  Search,
  Eye,
  Edit2,
  Archive,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Copy,
} from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { productService } from "../../services/productService";
import { imageUrl } from "../../utils/assetUrl";

// Unwraps repeatedly: some copied products stored the list as a quoted string.
function parseImages(images) {
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      return parseImages(JSON.parse(images));
    } catch {
      return [];
    }
  }
  return [];
}

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function firstFilled(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function productPrice(product) {
  const variations = parseArray(product.variations);
  const pricedVariation = variations.find((variation) =>
    firstFilled(variation?.newPrice, variation?.salePrice, variation?.oldPrice),
  );
  return firstFilled(
    product.price,
    product.newPrice,
    product.salePrice,
    product.regularPrice,
    pricedVariation?.newPrice,
    pricedVariation?.salePrice,
    pricedVariation?.oldPrice,
  );
}

function productStock(product) {
  const directStock = firstFilled(product.stock, product.quantity, product.qty);
  if (directStock !== undefined) return directStock;

  const variations = parseArray(product.variations);
  const stockValues = variations
    .map((variation) => Number(firstFilled(variation?.stock, variation?.quantity, variation?.qty)))
    .filter((value) => Number.isFinite(value));

  if (stockValues.length === 0) return "";
  return stockValues.reduce((sum, value) => sum + value, 0);
}

function productCategoryLabel(product) {
  return firstFilled(
    product.category?.name,
    product.categoryName,
    product.Category?.name,
    product.subcategory?.name,
    product.subcategoryName,
  );
}

function formatNumberish(value, suffix = "") {
  if (value === undefined || value === null || value === "") return "—";
  const num = Number(value);
  if (Number.isFinite(num)) return `${num.toLocaleString()}${suffix}`;
  return `${value}${suffix}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10) || "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function colorSizeLabel(row) {
  const color = firstFilled(
    row.colorName,
    row.color?.name,
    row.Color?.name,
    row.color,
  );
  const size = firstFilled(row.attribute, row.size, row.sizeName, row.variant);
  if (color && size) return `${color}, ${size}`;
  if (color) return color;
  if (size) return `, ${size}`;
  return "—";
}

function getHistorySource(product) {
  return (
    parseArray(product.purchaseHistory).length
      ? parseArray(product.purchaseHistory)
      : parseArray(product.purchases).length
        ? parseArray(product.purchases)
        : parseArray(product.history).length
          ? parseArray(product.history)
          : parseArray(product.variations)
  );
}

function purchaseHistoryRows(product) {
  const source = getHistorySource(product);
  if (source.length) {
    return source.map((row, index) => ({
      id: row.Id || row.id || `${product.Id || "product"}-${index}`,
      date: firstFilled(
        row.purchaseDate,
        row.date,
        row.createdAt,
        product.purchaseDate,
        product.createdAt,
      ),
      name: firstFilled(row.productName, row.name, product.name),
      category: firstFilled(row.categoryName, row.category?.name, productCategoryLabel(product)),
      colorSize: colorSizeLabel(row),
      purchase: firstFilled(row.purchasePrice, row.purchase, row.costPrice, product.purchasePrice),
      oldPrice: firstFilled(row.oldPrice, row.regularPrice, product.oldPrice),
      price: firstFilled(row.newPrice, row.salePrice, row.price, productPrice(product)),
      stock: firstFilled(row.stock, row.quantity, row.qty, product.stock),
    }));
  }

  return [
    {
      id: product.Id || "product",
      date: firstFilled(product.purchaseDate, product.createdAt),
      name: product.name,
      category: productCategoryLabel(product),
      colorSize: "—",
      purchase: firstFilled(product.purchasePrice, product.costPrice),
      oldPrice: firstFilled(product.oldPrice, product.regularPrice),
      price: productPrice(product),
      stock: productStock(product),
    },
  ];
}

const PAGE_SIZES = [10, 20, 30, 50];

export default function ProductManagePage({ onNavigate }) {
  const [perPage, setPerPage] = useState(30);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState([]);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const {
    data: products,
    meta,
    loading,
    error,
    refetch,
  } = useProducts({
    searchTerm,
    page,
    limit: perPage,
  });

  const total = meta?.count ?? products.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function handleSearch() {
    setSearchTerm(searchInput);
    setPage(1);
  }

  function toggleAll() {
    if (selected.length === products.length) setSelected([]);
    else setSelected(products.map((p) => p.Id));
  }

  function toggleOne(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleDelete(id) {
    if (!window.confirm("এই product মুছে ফেলবেন?")) return;
    try {
      await productService.delete(id);
      setSelected((prev) => prev.filter((item) => item !== id));
      refetch();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleBulkDelete() {
    if (selected.length === 0) return;
    if (!window.confirm(`${selected.length} টি product মুছে ফেলবেন?`)) return;
    try {
      await Promise.all(selected.map((id) => productService.delete(id)));
      setSelected([]);
      refetch();
    } catch (e) {
      alert(e.message || "Selected products delete করতে সমস্যা হয়েছে");
    }
  }

  async function openPurchaseHistory(product) {
    setHistoryProduct(product);
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await productService.getById(product.Id);
      setHistoryProduct(response.data || product);
    } catch (e) {
      setHistoryError(e.message || "Purchase history load করতে সমস্যা হয়েছে");
      setHistoryProduct(product);
    } finally {
      setHistoryLoading(false);
    }
  }

  // Copies the product, then opens the copy for editing (rename, price, images).
  async function handleDuplicate(product) {
    if (!window.confirm(`"${product.name}" এর একটি কপি তৈরি করবেন?\nকপিটি Inactive থাকবে, এডিট করে Active করুন।`)) return;
    setDuplicatingId(product.Id);
    try {
      const response = await productService.duplicate(product.Id);
      const copyId = response?.data?.Id;
      const full = copyId ? await productService.getById(copyId) : null;
      refetch();
      if (full?.data && onNavigate) onNavigate("edit_product", full.data);
    } catch (e) {
      alert(e.message || "Product duplicate করতে সমস্যা হয়েছে");
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleToggleStatus(product) {
    const active = product.status === "active" || product.status === "Active";
    const nextStatus = active ? "Inactive" : "Active";
    setStatusUpdatingId(product.Id);
    try {
      await productService.update(product.Id, { status: nextStatus });
      refetch();
    } catch (e) {
      alert(e.message || "Product status update করতে সমস্যা হয়েছে");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  if (historyProduct) {
    return (
      <ProductPurchaseHistoryPage
        product={historyProduct}
        loading={historyLoading}
        error={historyError}
        onBack={() => {
          setHistoryProduct(null);
          setHistoryError("");
        }}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Product Manage</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate && onNavigate("create_product")}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
          >
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow p-3 flex flex-wrap items-center gap-2">
        <button
          disabled={selected.length === 0}
          onClick={handleBulkDelete}
          className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5 rounded transition"
        >
          <Trash2 size={13} />
          Delete {selected.length > 0 && `(${selected.length})`}
        </button>
        <button className="flex items-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded transition">
          Action <ChevronDown size={13} />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 w-48 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-1.5 rounded flex items-center gap-1 transition"
          >
            <Search size={12} /> Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading && (
          <div className="text-center py-12 text-gray-400 text-xs">
            Loading...
          </div>
        )}
        {error && (
          <div className="text-center py-12 text-red-400 text-xs">{error}</div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={
                        selected.length === products.length &&
                        products.length > 0
                      }
                      onChange={toggleAll}
                      className="rounded accent-blue-600"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-gray-500 font-semibold w-16">
                    Image
                  </th>
                  <th className="px-3 py-3 text-left text-gray-500 font-semibold">
                    Name
                  </th>
                  <th className="px-3 py-3 text-left text-gray-500 font-semibold">
                    Price
                  </th>
                  <th className="px-3 py-3 text-left text-gray-500 font-semibold">
                    Stock
                  </th>
                  <th className="px-3 py-3 text-center text-gray-500 font-semibold">
                    Status
                  </th>
                  <th className="px-3 py-3 text-center text-gray-500 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <ProductRow
                    key={product.Id}
                    product={product}
                    checked={selected.includes(product.Id)}
                    onToggle={() => toggleOne(product.Id)}
                    onDelete={() => handleDelete(product.Id)}
                    onEdit={() =>
                      onNavigate && onNavigate("edit_product", product)
                    }
                    onHistory={() => openPurchaseHistory(product)}
                    onToggleStatus={() => handleToggleStatus(product)}
                    statusUpdating={statusUpdatingId === product.Id}
                    onDuplicate={() => handleDuplicate(product)}
                    duplicating={duplicatingId === product.Id}
                  />
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      কোনো পণ্য পাওয়া যায়নি
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Showing {total === 0 ? 0 : (page - 1) * perPage + 1}–
            {Math.min(page * perPage, total)} of {total}
          </div>
          <div className="flex items-center gap-1">
            <PaginationBtn
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={14} />
            </PaginationBtn>
            {buildPageRange(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span
                  key={`dots-${i}`}
                  className="w-7 text-center text-gray-400 text-xs"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded text-xs font-medium transition ${
                    p === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <PaginationBtn
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight size={14} />
            </PaginationBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductPurchaseHistoryPage({ product, loading, error, onBack }) {
  const rows = purchaseHistoryRows(product);
  const totalStock = rows.reduce((sum, row) => {
    const stock = Number(row.stock);
    return Number.isFinite(stock) ? sum + stock : sum;
  }, 0);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">
          Product Purchase History
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
        >
          &lt; Back
        </button>
      </div>

      <div className="bg-white p-5 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Loading purchase history...
          </div>
        ) : error ? (
          <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {error}
          </div>
        ) : null}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="px-3 py-4 text-left font-bold text-gray-600">
                    SL
                  </th>
                  <th className="px-3 py-4 text-left font-bold text-gray-600">
                    Date
                  </th>
                  <th className="px-3 py-4 text-left font-bold text-gray-600">
                    Name
                  </th>
                  <th className="px-3 py-4 text-left font-bold text-gray-600">
                    Category
                  </th>
                  <th className="px-3 py-4 text-left font-bold text-gray-600">
                    Color & Size
                  </th>
                  <th className="px-3 py-4 text-left font-bold text-gray-600">
                    Purchase
                  </th>
                  <th className="px-3 py-4 text-left font-bold text-gray-600">
                    Old Price
                  </th>
                  <th className="px-3 py-4 text-left font-bold text-gray-600">
                    Price
                  </th>
                  <th className="px-3 py-4 text-left font-bold text-gray-600">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="border-b border-gray-200">
                    <td className="px-3 py-4 text-gray-600">{index + 1}</td>
                    <td className="px-3 py-4 text-gray-600">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-3 py-4 text-gray-600">{row.name || "—"}</td>
                    <td className="px-3 py-4 text-gray-600">
                      {row.category || "—"}
                    </td>
                    <td className="px-3 py-4 text-gray-600">
                      {row.colorSize || "—"}
                    </td>
                    <td className="px-3 py-4 text-gray-600">
                      {formatNumberish(row.purchase)}
                    </td>
                    <td className="px-3 py-4 text-gray-600">
                      {formatNumberish(row.oldPrice)}
                    </td>
                    <td className="px-3 py-4 text-gray-600">
                      {formatNumberish(row.price)}
                    </td>
                    <td className="px-3 py-4 text-gray-600">
                      {formatNumberish(row.stock)}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      No purchase history found
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={6} />
                  <td className="border-t border-gray-200 px-3 py-4 font-bold text-gray-600">
                    Total
                  </td>
                  <td className="border-t border-gray-200 px-3 py-4 font-bold text-gray-600">
                    {formatNumberish(totalStock)} pcs
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductRow({
  product,
  checked,
  onToggle,
  onDelete,
  onEdit,
  onHistory,
  onToggleStatus,
  statusUpdating,
  onDuplicate,
  duplicating,
}) {
  const active = product.status === "active" || product.status === "Active";
  const price = productPrice(product);
  const stock = productStock(product);
  const category = productCategoryLabel(product);

  return (
    <tr
      className={`border-b border-gray-50 transition ${checked ? "bg-blue-50" : "hover:bg-gray-50/60"}`}
    >
      <td className="px-3 py-2.5 text-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="rounded accent-blue-600"
        />
      </td>
      <td className="px-3 py-2.5">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-orange-100 border border-orange-200 rounded-lg overflow-hidden flex items-center justify-center">
          {(() => {
            const imgs = parseImages(product.images);
            return imgs[0] ? (
              <img
                src={imageUrl(imgs[0])}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.querySelector("span").style.display =
                    "flex";
                }}
              />
            ) : (
              <span className="text-orange-400 text-[9px] font-medium">
                IMG
              </span>
            );
          })()}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="font-semibold text-gray-800 max-w-[260px] leading-tight line-clamp-2">
          {product.name}
        </div>
        {product.sku && (
          <div className="mt-0.5 text-gray-400 text-[10px]">
            SKU: {product.sku}
          </div>
        )}
        {category && (
          <div className="mt-1">
            <span className="inline-flex rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-600">
              {category}
            </span>
          </div>
        )}
      </td>
      <td className="px-3 py-2.5 text-left font-medium text-gray-600">
        {formatNumberish(price, " Tk")}
      </td>
      <td className="px-3 py-2.5 text-left font-medium text-gray-600">
        {formatNumberish(stock)}
      </td>
      <td className="px-3 py-2.5 text-center">
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
        >
          {active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-3 py-2.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <ActionBtn
            icon={<Eye size={12} />}
            color="bg-cyan-100 text-cyan-600 hover:bg-cyan-200"
            title="View"
          />
          <ActionBtn
            icon={<Edit2 size={12} />}
            color="bg-blue-100 text-blue-600 hover:bg-blue-200"
            title="Edit"
            onClick={onEdit}
          />
          <ActionBtn
            icon={<Trash2 size={12} />}
            color="bg-red-100 text-red-500 hover:bg-red-200"
            title="Delete"
            onClick={onDelete}
          />
          <ActionBtn
            icon={
              statusUpdating ? (
                <Loader2 size={12} className="animate-spin" />
              ) : active ? (
                <ToggleRight size={14} />
              ) : (
                <ToggleLeft size={14} />
              )
            }
            color={
              active
                ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                : "bg-amber-100 text-amber-600 hover:bg-amber-200"
            }
            title={active ? "Make Inactive" : "Make Active"}
            onClick={onToggleStatus}
            disabled={statusUpdating}
          />
          <ActionBtn
            icon={<Archive size={12} />}
            color="bg-sky-100 text-sky-500 hover:bg-sky-200"
            title="Purchase History"
            onClick={onHistory}
          />
          <ActionBtn
            icon={duplicating ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
            color="bg-violet-100 text-violet-600 hover:bg-violet-200"
            title="Duplicate"
            onClick={onDuplicate}
            disabled={duplicating}
          />
        </div>
      </td>
    </tr>
  );
}

function ActionBtn({ icon, color, title, onClick, disabled = false }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-6 h-6 rounded flex items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-60 ${color}`}
    >
      {icon}
    </button>
  );
}

function PaginationBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 rounded flex items-center justify-center transition ${
        disabled
          ? "bg-gray-50 text-gray-300 cursor-not-allowed"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push("...");
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  )
    pages.push(p);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
