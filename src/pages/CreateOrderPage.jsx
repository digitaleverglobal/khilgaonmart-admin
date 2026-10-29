import { useCheckoutSession } from "../utils/useCheckoutSession";
import { useState, useMemo } from "react";
import {
  Search,
  Minus,
  Plus,
  X,
  ShoppingCart,
  LayoutDashboard,
  ShoppingBag,
  Trash2,
  ChevronDown,
  ChevronRight,
  PlayCircle,
} from "lucide-react";
import {
  useCategories,
  useChildcategories,
  useProducts,
  useSubcategories,
} from "../hooks/useProducts";
import { orderService } from "../services/orderService";
import { imageUrl } from "../utils/assetUrl";
import { sellableUnits, toOrderItem } from "../utils/variants";

const ORDER_SOURCE_OPTIONS = [
  "Website",
  "Facebook",
  "FB Messenger",
  "Tiktok Messenger",
  "Tiktok",
  "Whatsapp",
  "Direct Call",
  "Google",
  "WooCommerce",
  "Landing Page",
  "POS",
  "Manual",
  "Failed Order",
  "Other",
];

// ── Delivery areas ─────────────────────────────────────────
const deliveryAreas = [
  { label: "ঢাকার ভিতরে ৮০ টাকা", fee: 80 },
  { label: "ঢাকার বাইরে ১৩০ টাকা", fee: 130 },
  { label: "চট্টগ্রাম ১৫০ টাকা", fee: 150 },
  { label: "সিলেট ১৫০ টাকা", fee: 150 },
  { label: "রাজশাহী ১৩০ টাকা", fee: 130 },
  { label: "খুলনা ১৩০ টাকা", fee: 130 },
];

// ── Product images placeholder colors ───────────────────────
const imgGradients = [
  "from-amber-100 to-yellow-200",
  "from-orange-100 to-amber-200",
  "from-yellow-100 to-orange-100",
  "from-red-100 to-orange-200",
  "from-amber-200 to-yellow-300",
  "from-orange-200 to-red-100",
];

function parseImages(images) {
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return images ? [images] : [];
    }
  }
  return [];
}

function imageValue(image) {
  if (!image) return "";
  if (typeof image === "string") return image;
  return (
    image.url || image.file || image.filename || image.name || image.path || ""
  );
}

function productImageSrc(image) {
  const src = imageValue(image).trim();
  return imageUrl(src);
}

function toId(value) {
  return value === undefined || value === null ? "" : String(value);
}

export default function CreateOrderPage({ onNavigate }) {
  const checkout = useCheckoutSession();
  // Cart state
  const [cart, setCart] = useState([]);
  // Customer
  const [isGuest, setIsGuest] = useState(false);
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [areaIdx, setAreaIdx] = useState(0);
  const [discount, setDiscount] = useState("");
  const [advanced, setAdvanced] = useState("");
  const [orderTag, setOrderTag] = useState("");
  const [orderSource, setOrderSource] = useState("Manual");
  // Product search / filter
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedCat, setExpandedCat] = useState(null);
  const [expandedSub, setExpandedSub] = useState(null);

  // API products
  const { data: rawProducts, loading: productsLoading } = useProducts({
    limit: 500,
  });
  const { data: rawCategories } = useCategories({ limit: 500 });
  const { data: rawSubcategories } = useSubcategories({ limit: 500 });
  const { data: rawChildcategories } = useChildcategories({ limit: 500 });

  // ── Cart helpers ──────────────────────────────────────────
  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, { ...product, qty: 1, disc: 0 }];
    });
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function changeQty(id, delta) {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i,
      ),
    );
  }

  function changeDisc(id, val) {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, disc: Number(val) || 0 } : i)),
    );
  }

  function clearCart() {
    setCart([]);
  }

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (checkout.submitting.current) return;
    if (cart.length === 0) return;
    if (!isGuest && !phone.trim()) {
      alert("Phone number দিন");
      return;
    }
    if (!isGuest && !address.trim()) {
      alert("Customer এর পুরো ঠিকানা দিন");
      return;
    }

    checkout.submitting.current = true;
    setSubmitting(true);
    try {
      const payload = {
        checkoutKey: checkout.getKey(isGuest ? "Guest" : phone.trim()),
        customerName: isGuest ? "Guest" : customerName.trim() || "Guest",
        customerPhone: isGuest ? "Guest" : phone.trim(),
        customerAddress: address.trim(),
        customerDistrict: deliveryAreas[areaIdx].label,
        items: cart.map(toOrderItem),
        deliveryCharge: shippingFee,
        discount: discountAmt,
        advance: paidAmt || 0,
        orderSource,
        orderTag: orderTag.trim(),
        orderDate: new Date().toISOString().slice(0, 10),
      };

      await orderService.createStaffOrder(payload);
      checkout.complete();
      alert("Order সফলভাবে তৈরি হয়েছে!");
      clearCart();
      setOrderTag("");
      setOrderSource("Manual");
      onNavigate && onNavigate("orders");
    } catch (err) {
      alert(err.message || "Order তৈরি করতে সমস্যা হয়েছে");
    } finally {
      checkout.submitting.current = false;
      setSubmitting(false);
    }
  }

  // ── Calculations ──────────────────────────────────────────
  const subTotal = cart.reduce((sum, i) => sum + i.price * i.qty - i.disc, 0);
  const shippingFee = deliveryAreas[areaIdx].fee;
  const discountAmt = Number(discount) || 0;
  const paidAmt = Number(advanced) || 0;
  const total = subTotal + shippingFee - discountAmt;

  const categoryTree = useMemo(() => {
    const childrenBySub = rawChildcategories.reduce((acc, child) => {
      const subcategoryId = toId(child.subcategoryId || child.subcategory?.Id);
      if (!subcategoryId) return acc;
      acc[subcategoryId] = acc[subcategoryId] || [];
      acc[subcategoryId].push(child);
      return acc;
    }, {});
    const subsByCategory = rawSubcategories.reduce((acc, sub) => {
      const categoryId = toId(sub.categoryId || sub.category?.Id);
      if (!categoryId) return acc;
      acc[categoryId] = acc[categoryId] || [];
      acc[categoryId].push({
        ...sub,
        children: childrenBySub[toId(sub.Id)] || [],
      });
      return acc;
    }, {});

    return rawCategories.map((category) => ({
      ...category,
      children: subsByCategory[toId(category.Id)] || [],
    }));
  }, [rawCategories, rawSubcategories, rawChildcategories]);

  // ── Product list ──────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const mapped = rawProducts.flatMap((p) => {
      const images = parseImages(p.images).map(imageValue).filter(Boolean);
      const category = {
        categoryId: toId(p.categoryId || p.category?.Id),
        subcategoryId: toId(p.subcategoryId || p.subcategory?.Id),
        childcategoryId: toId(p.childcategoryId || p.childcategory?.Id),
        brand: p.brand?.name || p.brandName || "",
      };
      return sellableUnits(p, images).map((unit) => ({ ...unit, ...category }));
    });
    const q = search.trim().toLowerCase();
    return mapped.filter((product) => {
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (activeCategory === "all") return true;
      const [type, id] = activeCategory.split(":");
      if (type === "category") return product.categoryId === id;
      if (type === "subcategory") return product.subcategoryId === id;
      if (type === "childcategory") return product.childcategoryId === id;
      return true;
    });
  }, [rawProducts, search, activeCategory]);

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gray-50">
      {/* ── Special Top Nav ── */}
      <div className="bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 px-4 py-2 shadow-sm flex-shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            <LayoutDashboard size={14} />
            Dashboard
          </button>
          <button
            onClick={() => onNavigate("orders")}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            <ShoppingBag size={14} />
            Order
          </button>
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            <Trash2 size={14} />
            Cart Clear
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-1">
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
              29
            </span>
            <div className="w-5 h-5 text-gray-500">🔔</div>
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="flex flex-1 flex-col overflow-hidden xl:flex-row">
        {/* ════ LEFT PANEL ════ */}
        <div className="flex max-h-[48vh] w-full flex-shrink-0 flex-col overflow-y-auto border-b border-gray-200 bg-white xl:max-h-none xl:w-[640px] xl:border-b-0 xl:border-r">
          {/* Title */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h1 className="text-base font-bold text-gray-800">Create Order</h1>
            <button className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
              <PlayCircle size={13} />
              টিউটোরিয়াল দেখুন
            </button>
          </div>

          {/* ── Cart Table ── */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr
                  style={{
                    background: "linear-gradient(90deg, #0B3A4D, #156B8C)",
                  }}
                >
                  <th className="px-3 py-2.5 text-left text-white font-semibold">
                    Product
                  </th>
                  <th className="px-3 py-2.5 text-left text-white font-semibold">
                    Details
                  </th>
                  <th className="px-3 py-2.5 text-center text-white font-semibold">
                    Quantity
                  </th>
                  <th className="px-3 py-2.5 text-center text-white font-semibold">
                    Discount
                  </th>
                  <th className="px-3 py-2.5 text-right text-white font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-6 text-gray-400 text-xs"
                    >
                      কোনো পণ্য যোগ করা হয়নি
                    </td>
                  </tr>
                )}
                {cart.map((item) => (
                  <CartRow
                    key={item.id}
                    item={item}
                    onRemove={() => removeFromCart(item.id)}
                    onQty={(d) => changeQty(item.id, d)}
                    onDisc={(v) => changeDisc(item.id, v)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Customer Section ── */}
          <div className="px-4 py-3 border-t border-gray-100 space-y-2.5 flex-1">
            {/* Guest toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isGuest}
                onChange={(e) => setIsGuest(e.target.checked)}
                className="accent-teal-500 w-3.5 h-3.5"
              />
              <span className="text-xs font-medium text-gray-700">
                Guest Customer
              </span>
            </label>

            {!isGuest && (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                </div>
                {phone && !customerName && (
                  <div className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400 bg-gray-50">
                    No customers found
                  </div>
                )}
                <textarea
                  placeholder="Customer এর পুরো ঠিকানা"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
                />
              </>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-medium text-gray-700">
                <span>Order Tag</span>
                <select
                  value={orderTag}
                  onChange={(e) => setOrderTag(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300"
                >
                  <option value="">Select Order Tag</option>
                  <option value="up sale">Up Sale</option>
                  <option value="cross sale">Cross Sale</option>
                  <option value="regular sale">Regular Sale</option>
                  <option value="push sale">Push Sale</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium text-gray-700">
                <span>Order Source</span>
                <select
                  value={orderSource}
                  onChange={(e) => setOrderSource(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300"
                >
                  {ORDER_SOURCE_OPTIONS.map((source) => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Delivery area */}
            <div className="relative">
              <select
                value={areaIdx}
                onChange={(e) => setAreaIdx(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-300 appearance-none pr-8"
              >
                {deliveryAreas.map((a, i) => (
                  <option key={i} value={i}>
                    {a.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Shipping override */}
            <input
              type="number"
              value={shippingFee}
              readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-gray-50 focus:outline-none"
              placeholder="Shipping Fee"
            />

            {/* Discount */}
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300"
              placeholder="Discount"
            />

            {/* Advanced / Paid */}
            <input
              type="number"
              value={advanced}
              onChange={(e) => setAdvanced(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300"
              placeholder="Advanced"
            />

            {/* Summary */}
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              {[
                { label: "Sub Total", value: subTotal },
                { label: "Shipping Fee (+)", value: shippingFee },
                { label: "Discount (-)", value: discountAmt },
                { label: "Paid (-)", value: paidAmt },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-4 py-2 border-b border-gray-100 text-xs"
                >
                  <span className="text-gray-600">{row.label}</span>
                  <span className="font-medium text-gray-800">{row.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 text-xs">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-teal-600 text-sm">
                  ৳ {total}
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || submitting}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-40 text-white font-semibold text-sm py-2.5 rounded-xl transition"
            >
              {submitting ? "তৈরি হচ্ছে..." : "Order Submit"}
            </button>
          </div>
        </div>

        {/* ════ RIGHT PANEL ════ */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden sm:flex-row">
          {/* Category sidebar */}
          <div className="max-h-44 w-full flex-shrink-0 overflow-y-auto border-b border-gray-200 bg-white py-2 sm:max-h-none sm:w-40 sm:border-b-0 sm:border-r">
            <div
              onClick={() => {
                setActiveCategory("all");
                setExpandedCat(null);
                setExpandedSub(null);
              }}
              className={`px-3 py-2.5 cursor-pointer text-xs font-medium transition ${
                activeCategory === "all"
                  ? "bg-teal-500 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              All
            </div>
            {categoryTree.map((cat) => {
              const categoryKey = `category:${cat.Id}`;
              const isExpanded = expandedCat === cat.Id;
              return (
                <div key={cat.Id}>
                  <div
                    onClick={() => {
                      setActiveCategory(categoryKey);
                      setExpandedCat(isExpanded ? null : cat.Id);
                      setExpandedSub(null);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 cursor-pointer text-xs font-medium transition ${
                      activeCategory === categoryKey
                        ? "bg-teal-500 text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.children.length > 0 &&
                      (isExpanded ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      ))}
                  </div>
                  {cat.children.length > 0 && isExpanded && (
                    <div className="bg-gray-50 border-l-2 border-teal-400 ml-3">
                      {cat.children.map((sub) => {
                        const subKey = `subcategory:${sub.Id}`;
                        const isSubExpanded = expandedSub === sub.Id;
                        return (
                          <div key={sub.Id}>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCategory(subKey);
                                setExpandedSub(isSubExpanded ? null : sub.Id);
                              }}
                              className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition ${
                                activeCategory === subKey
                                  ? "bg-teal-50 text-teal-700 font-semibold"
                                  : "text-gray-600 hover:bg-teal-50 hover:text-teal-700"
                              }`}
                            >
                              <span>{sub.name}</span>
                              {sub.children.length > 0 &&
                                (isSubExpanded ? (
                                  <ChevronDown size={11} />
                                ) : (
                                  <ChevronRight size={11} />
                                ))}
                            </div>
                            {sub.children.length > 0 && isSubExpanded && (
                              <div className="ml-3 border-l border-teal-200">
                                {sub.children.map((child) => {
                                  const childKey = `childcategory:${child.Id}`;
                                  return (
                                    <div
                                      key={child.Id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveCategory(childKey);
                                      }}
                                      className={`px-3 py-1.5 text-[11px] cursor-pointer transition ${
                                        activeCategory === childKey
                                          ? "text-teal-700 font-semibold"
                                          : "text-gray-500 hover:text-teal-700"
                                      }`}
                                    >
                                      {child.name}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Products area */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gray-50">
            {/* Search */}
            <div className="px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Product or Scan Barcode ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 pr-10"
                />
                <Search
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* Product grid */}
            <div className="flex-1 overflow-y-auto p-3">
              {productsLoading ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  পণ্য লোড হচ্ছে...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {filteredProducts.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      gradient={imgGradients[i % imgGradients.length]}
                      inCart={cart.some((c) => c.id === product.id)}
                      onAdd={() => addToCart(product)}
                    />
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400 text-sm">
                      কোনো পণ্য পাওয়া যায়নি
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 py-1.5 border-t border-gray-100 bg-white flex-shrink-0">
        © Khilgaon Mart{" "}
        <span className="text-blue-500 cursor-pointer">DigitalEver</span>
      </div>
    </div>
  );
}

/* ── Cart Row ── */
function CartRow({ item, onRemove, onQty, onDisc }) {
  const imageSrc = productImageSrc(item.images?.[0] || item.image);
  const [failedImage, setFailedImage] = useState(null);

  return (
    <tr className="border-b border-gray-100">
      <td className="px-3 py-2 relative">
        <button
          onClick={onRemove}
          className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-10 transition"
        >
          <X size={9} />
        </button>
        <div className="w-10 h-10 overflow-hidden rounded bg-white border border-gray-200 flex items-center justify-center text-[9px] text-gray-400">
          {imageSrc && failedImage !== imageSrc ? (
            <img
              src={imageSrc}
              alt={item.name}
              className="h-full w-full object-contain"
              onError={() => setFailedImage(imageSrc)}
            />
          ) : (
            <span>No image</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="font-semibold text-gray-800 text-xs leading-tight max-w-[120px]">
          {item.name}
        </div>
        <div className="text-gray-500 text-[10px] mt-0.5">
          ৳ {item.price} × {item.qty}
        </div>
        <span className="bg-teal-100 text-teal-700 text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block">
          {item.sku}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1 justify-center">
          <button
            onClick={() => onQty(-1)}
            className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center transition"
          >
            <Minus size={11} />
          </button>
          <span className="w-6 text-center text-xs font-semibold">
            {item.qty}
          </span>
          <button
            onClick={() => onQty(1)}
            className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center transition"
          >
            <Plus size={11} />
          </button>
        </div>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          value={item.disc}
          onChange={(e) => onDisc(e.target.value)}
          className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-teal-300"
          min={0}
        />
      </td>
      <td className="px-3 py-2 text-right font-bold text-gray-800 text-xs whitespace-nowrap">
        ৳ {item.price * item.qty - item.disc}
      </td>
    </tr>
  );
}

/* ── Product Card ── */
function ProductCard({ product, gradient, inCart, onAdd }) {
  return (
    <div
      onClick={onAdd}
      className={`flex aspect-square min-w-0 flex-col bg-white rounded-xl border cursor-pointer transition-all duration-150 overflow-hidden group ${
        inCart
          ? "border-teal-400 shadow-md shadow-teal-100"
          : "border-gray-200 hover:border-teal-300 hover:shadow-md"
      }`}
    >
      {/* Image area */}
      <div
        className={`relative bg-gradient-to-br ${gradient} min-h-0 flex-1 flex items-center justify-center`}
      >
        {product.images?.[0] ? (
          <img
            src={productImageSrc(product.images[0])}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-contain p-2"
          />
        ) : (
          <div className="w-16 h-20 bg-white/40 rounded-lg flex items-center justify-center">
            <div className="text-2xl">🧴</div>
          </div>
        )}
        {/* Cart badge */}
        <div
          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition ${
            inCart ? "bg-teal-500" : "bg-white/80 group-hover:bg-teal-100"
          }`}
        >
          <ShoppingCart
            size={12}
            className={
              inCart ? "text-white" : "text-gray-500 group-hover:text-teal-600"
            }
          />
        </div>
        {inCart && (
          <div className="absolute top-2 left-2 bg-teal-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            Added
          </div>
        )}
      </div>

      {/* Info */}
      <div className="shrink-0 p-2">
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide truncate">
          {product.brand}
        </div>
        <div className="text-xs font-semibold text-gray-800 leading-tight mt-0.5 line-clamp-2 min-h-[28px]">
          {product.name}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-bold text-teal-600">
            ৳ {product.price}
          </span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
              product.stock <= 4
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            Stock: {product.stock}
          </span>
        </div>
      </div>
    </div>
  );
}
