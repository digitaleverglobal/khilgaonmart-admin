import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  MessageCircle,
  MessageSquare,
  Minus,
  Package,
  Paperclip,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useAuth } from "../context/AuthContext";
import { orderService } from "../services/orderService";
import { userService } from "../services/adminService";
import { ipBlockService, orderStatusService } from "../services/websiteService";
import { cartLinesFromOrder, sellableUnits, toOrderItem, weightAdjustedLine } from "../utils/variants";
import { normalizeOrderStatuses, toOrderStatusKey } from "../utils/orderStatuses";
import { formatInvoiceNumber } from "../utils/invoiceNumber";
import { imageUrl } from "../utils/assetUrl";
import { useCheckoutSession } from "../utils/useCheckoutSession";
import {
  BD_DISTRICTS,
  ORDER_SOURCE_OPTIONS,
  ORDER_TAG_OPTIONS,
} from "../utils/orderFilters";

const COURIER_OPTIONS = ["Steadfast", "Pathao", "Redx", "Paperfly", "eCourier", "Carrybee"];

const PAYMENT_METHODS = [
  { value: "cod", label: "Cash on Delivery" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
];

const INPUT_CLASS =
  "h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-200 disabled:bg-gray-100 disabled:text-gray-500";

function parseMeta(note) {
  if (!note) return {};
  if (typeof note === "object") return note;
  try {
    const meta = JSON.parse(note);
    return meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {};
  } catch {
    return { legacyNote: note };
  }
}

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
  return image.url || image.file || image.filename || image.name || image.path || "";
}

const money = (value) =>
  `${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Tk`;

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("en-GB")} ${date
    .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    .replace(" ", "")
    .toLowerCase()}`;
}

const label = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

function normalizePhoneForLink(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `88${digits}`;
  return digits;
}

function copyText(value) {
  if (!value) return;
  navigator.clipboard?.writeText(String(value)).catch(() => {});
}

function getProviderList(res) {
  const payload = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeNotes(list) {
  return (Array.isArray(list) ? list : [])
    .map((item) =>
      typeof item === "string"
        ? { text: item, createdAt: null, by: "" }
        : { text: String(item?.text || "").trim(), createdAt: item?.createdAt || null, by: item?.by || "" },
    )
    .filter((item) => item.text);
}

// Create Order uses this same page with no order: notes and payments are kept
// on a local draft and saved together when the order is created.
const NEW_ORDER = { status: "pending", orderSource: "Manual", note: "{}" };
const NEW_ORDER_SHIPPING = 80;

export default function EditOrderPage({ order: existingOrder, onNavigate, onCountsRefresh, onPrintOrder, onViewCustomer, onOpenOrder, onCreated, notice, onDismissNotice }) {
  const { user } = useAuth();
  const actorName = [user?.FirstName, user?.LastName].filter(Boolean).join(" ") || user?.Email || "Admin";
  const canAssign = ["superadmin", "admin"].includes(String(user?.role || "").toLowerCase());
  const isNew = !existingOrder?.Id;
  const order = existingOrder || NEW_ORDER;
  const checkout = useCheckoutSession();
  const creating = useRef(false);

  // Live copy of the order; refreshed after every save so meta-based sections stay current.
  const [liveOrder, setLiveOrder] = useState(order);
  const meta = useMemo(() => parseMeta(liveOrder.note), [liveOrder.note]);

  const [initialCart] = useState(() =>
    isNew ? { lines: [], deliveryCharge: NEW_ORDER_SHIPPING, discount: 0 } : cartLinesFromOrder(order),
  );
  const [cart, setCart] = useState(initialCart.lines);
  const initialMeta = useMemo(() => parseMeta(order.note), [order.note]);

  const [form, setForm] = useState(() => ({
    phone: order.customerPhone || "",
    altPhone: initialMeta.alternativePhone || "",
    name: order.customerName || "",
    email: initialMeta.customerEmail || "",
    address: initialMeta.customerAddress || [order.customerArea].filter(Boolean).join(", "),
    district: order.customerDistrict || "",
    orderTag: initialMeta.orderTag || "",
    orderSource: order.orderSource || initialMeta.orderSource || initialMeta.source || "Manual",
    customerTag: ["safe", "fake"].includes(String(order.fraudStatus || "").toLowerCase())
      ? String(order.fraudStatus).toLowerCase()
      : "",
    status: order.status || "pending",
    paymentMethod: initialMeta.paymentMethod || "cod",
    courierNote: initialMeta.courierNote || "",
    packingNote: initialMeta.packingNote || "",
    discount: initialCart.discount ? String(initialCart.discount) : "0",
    discountType: "tk",
    shipping: String(initialCart.legacy ? 0 : initialCart.deliveryCharge || 0),
    courier: order.courier || "",
    advance: "",
  }));
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const [statuses, setStatuses] = useState(() => normalizeOrderStatuses());
  const [fraud, setFraud] = useState({ loading: true, data: null });
  const [assignees, setAssignees] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showPacking, setShowPacking] = useState(false);
  const [showCustomerOrders, setShowCustomerOrders] = useState(false);
  const [pathaoEditing, setPathaoEditing] = useState(false);
  const [pathaoCities, setPathaoCities] = useState([]);
  const [pathaoZones, setPathaoZones] = useState([]);
  const [pathaoLocation, setPathaoLocation] = useState(initialMeta.pathaoLocation || null);
  const [saving, setSaving] = useState("");
  const [open, setOpen] = useState({ notes: true });
  const toggle = (key) => setOpen((current) => ({ ...current, [key]: !current[key] }));

  const { data: rawProducts } = useProducts({ limit: 500 });
  const units = useMemo(
    () =>
      rawProducts.flatMap((product) =>
        sellableUnits(product, parseImages(product.images).map(imageValue).filter(Boolean)),
      ),
    [rawProducts],
  );
  const stockByUnit = useMemo(() => new Map(units.map((unit) => [`${unit.productId}:${unit.variantId || ""}`, unit.stock])), [units]);
  // Lines whose variant names a weight (e.g. "1 kg" fish) can be reweighed after cutting.
  const priced = weightAdjustedLine;

  useEffect(() => {
    let active = true;
    orderStatusService
      .getAll({ limit: 100 })
      .then((res) => active && setStatuses(normalizeOrderStatuses(res.data || [])))
      .catch(() => {});
    if (isNew) {
      return () => {
        active = false;
      };
    }
    orderService
      .getOrderById(order.Id)
      .then((res) => active && res.data && setLiveOrder(res.data))
      .catch(() => {});
    orderService
      .getFraudCheck(order.Id)
      .then((res) => active && setFraud({ loading: false, data: res.data }))
      .catch(() => active && setFraud({ loading: false, data: null }));
    return () => {
      active = false;
    };
  }, [isNew, order.Id]);

  // A new order has no Id yet: courier stats and order totals come from the
  // phone, and only count while they belong to the number typed now.
  const phoneDigits = form.phone.replace(/\D/g, "");
  const phoneReady = phoneDigits.length >= 11;
  const [phoneCheck, setPhoneCheck] = useState({ phone: "", data: null });
  const [phoneTick, setPhoneTick] = useState(0);
  useEffect(() => {
    if (!isNew || !phoneReady) return undefined;
    let active = true;
    const timer = window.setTimeout(() => {
      orderService
        .getPhoneFraudCheck(phoneDigits)
        .then((res) => {
          if (!active) return;
          setPhoneCheck({ phone: phoneDigits, data: res.data });
          // A returning customer: fill the contact fields still left empty from their last order.
          const last = res.data?.lastCustomer;
          if (!last) return;
          setForm((current) => ({
            ...current,
            altPhone: current.altPhone || last.altPhone || "",
            name: current.name || last.name || "",
            email: current.email || last.email || "",
            address: current.address || last.address || "",
            district: current.district || last.district || "",
          }));
          if (last.pathaoLocation?.cityId) setPathaoLocation((current) => current || last.pathaoLocation);
        })
        .catch(() => active && setPhoneCheck({ phone: phoneDigits, data: null }));
    }, 500);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isNew, phoneReady, phoneDigits, phoneTick]);
  const phoneData = phoneReady && phoneCheck.phone === phoneDigits ? phoneCheck.data : null;
  const fraudView = isNew
    ? { loading: phoneReady && phoneCheck.phone !== phoneDigits, data: phoneData }
    : fraud;

  useEffect(() => {
    if (!canAssign) return undefined;
    let active = true;
    orderService
      .getAssignees()
      .then((res) => active && setAssignees(res.data || []))
      .catch(() =>
        userService
          .getAll({ limit: 1000 })
          .then((res) => active && setAssignees((res.data || []).filter((item) => String(item.role).toLowerCase() !== "user")))
          .catch(() => {}),
      );
    return () => {
      active = false;
    };
  }, [canAssign]);

  useEffect(() => {
    if (!pathaoEditing || pathaoCities.length) return undefined;
    let active = true;
    orderService
      .getPathaoCities()
      .then((res) => active && setPathaoCities(getProviderList(res)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathaoEditing, pathaoCities.length]);

  const pathaoCityId = pathaoLocation?.cityId;
  useEffect(() => {
    if (!pathaoEditing || !pathaoCityId) return undefined;
    let active = true;
    orderService
      .getPathaoZones(pathaoCityId)
      .then((res) => active && setPathaoZones(getProviderList(res)))
      .catch(() => active && setPathaoZones([]));
    return () => {
      active = false;
    };
  }, [pathaoEditing, pathaoCityId]);

  // ── Totals ──
  const subtotal = cart.reduce((sum, item) => sum + priced(item).price * item.qty - (Number(item.disc) || 0), 0);
  const discountValue = Number(form.discount) || 0;
  const discountAmount =
    form.discountType === "%" ? Math.round((subtotal * discountValue) / 100) : discountValue;
  const shipping = Number(form.shipping) || 0;
  const grandTotal = Math.max(0, subtotal + shipping - discountAmount);
  const paid = isNew ? Number(form.advance) || 0 : Number(liveOrder.advance || 0);
  const due = Math.max(0, grandTotal - paid);

  // ── Meta-backed lists ──
  const adminNotes = normalizeNotes(meta.adminNotes);
  const customerNotes = normalizeNotes(meta.customerNotes);
  const payments = Array.isArray(meta.payments) ? meta.payments : [];
  const attachments = Array.isArray(meta.attachments) ? meta.attachments : [];
  const statusHistory = Array.isArray(meta.statusHistory) ? meta.statusHistory : [];
  const steadfast = meta.courierIntegration?.steadfast || {};
  const pathao = meta.courierIntegration?.pathao || {};
  const tracking = meta.tracking && typeof meta.tracking === "object" ? meta.tracking : {};
  const summary = (isNew ? phoneData?.courierSummary : liveOrder.courierSummary) || {};
  const invoice = isNew ? "New Order" : liveOrder.orderId || `#${liveOrder.Id}`;
  const referenceNo = steadfast.consignmentId || steadfast.trackingCode || pathao.consignmentId || "";
  const sourceWebsite = tracking.landingPage
    ? `Landing Page: ${tracking.landingPage}`
    : form.orderSource === "Website"
      ? window.location.hostname.replace(/^admin\./, "")
      : form.orderSource;
  const statusColor = statuses.find((item) => item.key === form.status)?.color;

  async function saveMeta(metaUpdates, extra = {}, key = "meta") {
    if (isNew) {
      // Kept on the draft until Create Order saves everything at once.
      setLiveOrder((current) => ({ ...current, note: JSON.stringify({ ...parseMeta(current.note), ...metaUpdates }) }));
      if (extra.advance !== undefined) set("advance")(String(extra.advance));
      return true;
    }
    setSaving(key);
    try {
      const res = await orderService.updateOrder(liveOrder.Id, { metaUpdates, ...extra });
      if (res.data) setLiveOrder((current) => ({ ...current, ...res.data }));
      return true;
    } catch (err) {
      alert(err.message || "Save failed");
      return false;
    } finally {
      setSaving("");
    }
  }

  async function handleUpdate(statusOverride) {
    if (!cart.length) return alert("Order এ অন্তত একটি product রাখুন");
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      return alert("Mobile Number, Full Name ও Address দিন");
    }
    setSaving("update");
    try {
      const fullAddress = [form.address.trim(), form.district]
        .filter(Boolean)
        .filter((part, index, list) => index === 0 || !list[0].toLowerCase().includes(part.toLowerCase()))
        .join(", ");
      const payload = {
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        customerArea: form.address.trim(),
        customerDistrict: form.district || null,
        items: cart.map(toOrderItem),
        deliveryCharge: shipping,
        discount: discountAmount,
        advance: paid,
        status: statusOverride || form.status,
        orderTag: form.orderTag,
        orderSource: form.orderSource,
        courier: form.courier || null,
        metaUpdates: {
          alternativePhone: form.altPhone.trim(),
          customerEmail: form.email.trim(),
          courierNote: form.courierNote,
          packingNote: form.packingNote,
          paymentMethod: form.paymentMethod,
          customerAddress: fullAddress,
          pathaoLocation,
        },
      };
      const currentTag = ["safe", "fake"].includes(String(liveOrder.fraudStatus || "").toLowerCase())
        ? String(liveOrder.fraudStatus).toLowerCase()
        : "";
      if (form.customerTag !== currentTag) {
        payload.fraudStatus = form.customerTag;
        payload.fraudReason = form.customerTag ? `Marked ${form.customerTag} from order page` : null;
      }
      if (isNew) {
        await createOrder(payload, fullAddress);
        return;
      }
      const res = await orderService.updateOrder(liveOrder.Id, payload);
      if (res.data) setLiveOrder((current) => ({ ...current, ...res.data }));
      if (statusOverride) set("status")(statusOverride);
      await onCountsRefresh?.();
      alert("Order সফলভাবে update হয়েছে!");
    } catch (err) {
      alert(err.message || "Update করতে সমস্যা হয়েছে");
    } finally {
      setSaving("");
    }
  }

  // Staff create takes the basics (and sets pending / pre order itself); the
  // rest of the form is then saved on the new order like an update.
  async function createOrder(payload, fullAddress) {
    if (creating.current) return;
    creating.current = true;
    try {
      const { data: created } = await orderService.createStaffOrder({
        checkoutKey: checkout.getKey(payload.customerPhone),
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        customerAddress: fullAddress,
        customerDistrict: payload.customerDistrict,
        items: payload.items,
        deliveryCharge: payload.deliveryCharge,
        discount: payload.discount,
        advance: payload.advance,
        orderSource: payload.orderSource,
        orderTag: payload.orderTag,
        orderDate: new Date().toISOString().slice(0, 10),
      });
      checkout.complete();
      let createdNotice;
      const invoiceId = created.invoiceId || created.orderId || "";
      try {
        await orderService.updateOrder(created.Id, {
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          customerArea: payload.customerArea,
          customerDistrict: payload.customerDistrict,
          orderTag: payload.orderTag,
          orderSource: payload.orderSource,
          courier: payload.courier,
          ...(form.status !== NEW_ORDER.status ? { status: payload.status } : {}),
          ...(payload.fraudStatus !== undefined
            ? { fraudStatus: payload.fraudStatus, fraudReason: payload.fraudReason }
            : {}),
          metaUpdates: {
            ...payload.metaUpdates,
            adminNotes: meta.adminNotes || [],
            customerNotes: meta.customerNotes || [],
            ...(Array.isArray(meta.payments) ? { payments: meta.payments } : {}),
          },
        });
        createdNotice = { type: "success", text: `Order ${invoiceId} সফলভাবে তৈরি হয়েছে!`, order: created };
      } catch (err) {
        // The order exists; creating again would duplicate it.
        createdNotice = {
          type: "warning",
          text: `Order ${invoiceId} তৈরি হয়েছে, কিন্তু কিছু তথ্য save হয়নি (${err.message}). Order edit করে ঠিক করে নিন।`,
          order: created,
        };
      }
      await onCountsRefresh?.();
      // Stay on Create Order with a fresh form, showing the result on top.
      if (onCreated) onCreated(createdNotice);
      else {
        alert(createdNotice.text);
        onNavigate?.("orders");
      }
    } finally {
      creating.current = false;
    }
  }

  async function refreshFraud() {
    if (isNew) {
      if (phoneReady) {
        setPhoneCheck({ phone: "", data: null });
        setPhoneTick((tick) => tick + 1);
      }
      return;
    }
    setFraud((current) => ({ ...current, loading: true }));
    try {
      const res = await orderService.getFraudCheck(liveOrder.Id, { refresh: 1 });
      setFraud({ loading: false, data: res.data });
    } catch (err) {
      setFraud((current) => ({ ...current, loading: false }));
      alert(err.message || "Refresh failed");
    }
  }

  async function handleAssign(userId) {
    if (!userId) return;
    setSaving("assign");
    try {
      await orderService.bulkAssign([liveOrder.Id], userId);
      const res = await orderService.getOrderById(liveOrder.Id);
      if (res.data) setLiveOrder(res.data);
      setShowAssign(false);
    } catch (err) {
      alert(err.message || "Assign failed");
    } finally {
      setSaving("");
    }
  }

  async function handleBlockIp() {
    const ip = String(liveOrder.ipAddress || "").trim();
    if (!ip || !window.confirm(`${ip} IP address block করবেন?`)) return;
    try {
      await ipBlockService.create({ ip, reason: `Blocked from order ${invoice}` });
      alert(`${ip} blocked successfully.`);
    } catch (err) {
      alert(err.message || "IP block failed");
    }
  }

  async function handleAttachment(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSaving("attachment");
    try {
      await orderService.addAttachment(liveOrder.Id, file);
      const res = await orderService.getOrderById(liveOrder.Id);
      if (res.data) setLiveOrder(res.data);
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setSaving("");
    }
  }

  function addToCart(unit) {
    setCart((current) => {
      const existing = current.find((line) => line.id === unit.id);
      if (existing) return current.map((line) => (line.id === unit.id ? { ...line, qty: line.qty + 1 } : line));
      return [...current, { ...unit, qty: 1, disc: 0 }];
    });
  }

  function updateLine(id, changes) {
    setCart((current) => current.map((line) => (line.id === id ? { ...line, ...changes } : line)));
  }

  function copyOrderInfo() {
    copyText(
      [
        `Invoice: ${invoice}`,
        `Name: ${form.name}`,
        `Phone: ${form.phone}`,
        `Address: ${[form.address, form.district].filter(Boolean).join(", ")}`,
        ...cart.map((line) => `${line.qty} x ${line.name} = ${line.price * line.qty - (Number(line.disc) || 0)} Tk`),
        `Shipping: ${shipping} Tk`,
        `Discount: ${discountAmount} Tk`,
        `Total: ${grandTotal} Tk`,
        `Paid: ${paid} Tk`,
        `Due: ${due} Tk`,
      ].join("\n"),
    );
  }

  const whatsapp = normalizePhoneForLink(form.phone);
  const customerRef = isNew ? { ...liveOrder, customerPhone: form.phone, customerName: form.name } : liveOrder;
  const districtOptions = BD_DISTRICTS.includes(form.district) || !form.district
    ? BD_DISTRICTS
    : [form.district, ...BD_DISTRICTS];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="space-y-4 p-4">
        {notice && (
          <div className={`flex items-center gap-3 rounded border px-4 py-3 text-sm ${notice.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
            {notice.type === "success" ? <CheckCircle2 size={18} className="shrink-0" /> : <Info size={18} className="shrink-0" />}
            <span className="flex-1 font-medium">{notice.text}</span>
            {notice.order?.Id && onOpenOrder && (
              <button type="button" onClick={() => onOpenOrder(notice.order)} className="rounded border border-current px-3 py-1 text-xs font-semibold hover:bg-white/60">
                Order দেখুন
              </button>
            )}
            {onDismissNotice && (
              <button type="button" onClick={onDismissNotice} className="opacity-60 hover:opacity-100"><X size={16} /></button>
            )}
          </div>
        )}
        {/* ── Shipping Address ── */}
        <Card title="Shipping Address" action={
          <button type="button" onClick={() => onNavigate?.("orders")} className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
            <ShoppingBag size={13} /> Back to Orders
          </button>
        }>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Mobile Number*"
              aside={
                <button type="button" onClick={() => onViewCustomer?.(customerRef)} className="inline-flex items-center gap-1 rounded-full border border-teal-500 px-2 py-0.5 text-[11px] text-teal-600 hover:bg-teal-50">
                  <MessageSquare size={11} /> History
                </button>
              }
            >
              <div className="flex">
                <input value={form.phone} onChange={(e) => set("phone")(e.target.value)} className={`${INPUT_CLASS} rounded-r-none`} />
                <div className="flex items-center gap-1 rounded-r border border-l-0 border-gray-300 px-1">
                  {whatsapp && (
                    <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" title="WhatsApp" className="inline-flex h-7 w-7 items-center justify-center rounded bg-teal-600 text-white hover:bg-teal-700">
                      <MessageCircle size={13} />
                    </a>
                  )}
                  <a href={`tel:${form.phone}`} title="Call" className="inline-flex h-7 w-7 items-center justify-center rounded bg-teal-600 text-white hover:bg-teal-700">
                    <Phone size={13} />
                  </a>
                  <a href={`sms:${form.phone}`} title="SMS" className="inline-flex h-7 w-7 items-center justify-center rounded bg-red-500 text-white hover:bg-red-600">
                    <MessageSquare size={13} />
                  </a>
                  <IconCopy value={form.phone} />
                </div>
              </div>
            </Field>
            <Field label="Alternative Number">
              <input value={form.altPhone} onChange={(e) => set("altPhone")(e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Full Name*">
              <InputWithCopy value={form.name} onChange={set("name")} />
            </Field>
            <Field label="Email">
              <InputWithCopy value={form.email} onChange={set("email")} type="email" />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
            <Field label="Address*">
              <InputWithCopy value={form.address} onChange={set("address")} />
            </Field>
            <Field label="District">
              <select value={form.district} onChange={(e) => set("district")(e.target.value)} className={INPUT_CLASS}>
                <option value="">Select District</option>
                {districtOptions.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-2 text-sm">
            <span className="font-semibold text-gray-700">Pathao Location: </span>
            {pathaoLocation?.cityName ? (
              <span className="text-teal-600">
                {pathaoLocation.cityName}
                {pathaoLocation.zoneName ? ` > ${pathaoLocation.zoneName}` : ""}
              </span>
            ) : (
              <span className="text-gray-400">Store default</span>
            )}{" "}
            <button type="button" onClick={() => setPathaoEditing((current) => !current)} className="text-teal-600 hover:underline">
              ({pathaoEditing ? "Close" : "Change"})
            </button>
            {pathaoEditing && (
              <div className="mt-2 grid max-w-xl gap-2 sm:grid-cols-2">
                <select
                  value={pathaoLocation?.cityId || ""}
                  onChange={(e) => {
                    const city = pathaoCities.find((item) => String(item.city_id) === e.target.value);
                    setPathaoLocation(city ? { cityId: city.city_id, cityName: city.city_name } : null);
                    setPathaoZones([]);
                  }}
                  className={INPUT_CLASS}
                >
                  <option value="">{pathaoCities.length ? "Select City" : "Loading cities..."}</option>
                  {pathaoCities.map((city) => (
                    <option key={city.city_id} value={city.city_id}>{city.city_name}</option>
                  ))}
                </select>
                <select
                  value={pathaoLocation?.zoneId || ""}
                  disabled={!pathaoLocation?.cityId}
                  onChange={(e) => {
                    const zone = pathaoZones.find((item) => String(item.zone_id) === e.target.value);
                    setPathaoLocation((current) => ({ ...current, zoneId: zone?.zone_id, zoneName: zone?.zone_name }));
                  }}
                  className={INPUT_CLASS}
                >
                  <option value="">Select Zone</option>
                  {pathaoZones.map((zone) => (
                    <option key={zone.zone_id} value={zone.zone_id}>{zone.zone_name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 sm:col-span-2">Update চাপলে save হবে; Pathao তে পাঠানোর সময় এই city/zone ব্যবহার হবে।</p>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <Field label={<>Total Orders (<button type="button" onClick={() => setShowCustomerOrders(true)} disabled={!phoneDigits} className="text-teal-600 hover:underline">View All</button>)</>}>
              <input value={summary.orders ?? "—"} disabled className={INPUT_CLASS} />
            </Field>
            <Field label="Completed/Delivered">
              <input value={summary.completed ?? "—"} disabled className={INPUT_CLASS} />
            </Field>
            <Field label="Order Source">
              <select value={form.orderSource} onChange={(e) => set("orderSource")(e.target.value)} className={INPUT_CLASS}>
                {!ORDER_SOURCE_OPTIONS.includes(form.orderSource) && <option value={form.orderSource}>{form.orderSource}</option>}
                {ORDER_SOURCE_OPTIONS.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </Field>
            <Field label="Order Tag">
              <select value={form.orderTag} onChange={(e) => set("orderTag")(e.target.value)} className={INPUT_CLASS}>
                <option value="">Select Tag</option>
                {form.orderTag && !ORDER_TAG_OPTIONS.includes(form.orderTag) && <option value={form.orderTag}>{form.orderTag}</option>}
                {ORDER_TAG_OPTIONS.map((tag) => (
                  <option key={tag} value={tag}>{label(tag)}</option>
                ))}
              </select>
            </Field>
            <Field label="Customer Tag" info="Customer এর সব order এ লাগবে">
              <select value={form.customerTag} onChange={(e) => set("customerTag")(e.target.value)} className={INPUT_CLASS}>
                <option value="">Select Tag</option>
                <option value="safe">Safe</option>
                <option value="fake">Fake</option>
              </select>
            </Field>
          </div>
        </Card>

        {/* ── Courier Success Rate ── */}
        <Card
          title="Courier Success Rate"
          action={
            <button type="button" onClick={refreshFraud} disabled={fraudView.loading} className="inline-flex items-center gap-1 rounded bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
              <RefreshCw size={13} className={fraudView.loading ? "animate-spin" : ""} /> Refresh
            </button>
          }
        >
          <CourierSuccess fraud={fraudView} summary={summary} />
        </Card>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-4">
            {/* ── Order Products ── */}
            <Card
              title={<span className="flex items-center gap-2"><Package size={16} className="text-teal-600" /> Order Products</span>}
              action={
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowProductPicker(true)} className="inline-flex items-center gap-1 rounded bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">
                    <Plus size={13} /> Add More Item
                  </button>
                  <button type="button" onClick={() => setShowPacking((current) => !current)} className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                    <Package size={13} /> {showPacking ? "Hide" : "Show"} Packing Items
                  </button>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-[11px] uppercase tracking-wide text-gray-500">
                      <th className="py-2 pr-2 font-semibold">Name</th>
                      <th className="px-2 py-2 font-semibold">Variant</th>
                      <th className="px-2 py-2 text-right font-semibold">Unit Price</th>
                      <th className="px-2 py-2 text-center font-semibold">Quantity</th>
                      <th className="px-2 py-2 text-center font-semibold">Discount</th>
                      <th className="px-2 py-2 text-right font-semibold">Subtotal</th>
                      <th className="py-2 pl-2 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.length === 0 && (
                      <tr><td colSpan={7} className="py-6 text-center text-gray-400">কোনো product নেই</td></tr>
                    )}
                    {cart.map((line) => {
                      const stock = stockByUnit.get(`${line.productId}:${line.variantId || ""}`);
                      const weight = priced(line);
                      const adjusted = weight.price !== weight.basePrice;
                      return (
                        <tr key={line.id} className="border-b border-gray-100 align-middle">
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2">
                              <Thumb src={line.images?.[0]} />
                              <div>
                                <div className="font-semibold text-gray-800">{line.baseName || line.name}</div>
                                <div className="text-[11px] text-gray-400">1 Pcs/Unit{line.sku ? ` · ${line.sku}` : ""}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-gray-600">
                            <div>{line.variant || (line.name !== line.baseName ? line.name.replace(line.baseName, "").replace(/[()]/g, "").trim() : "—") || "—"}</div>
                            {weight.nominal && (
                              <WeightAdjustInput
                                value={line.weightAdjust}
                                unit={weight.nominal.unit}
                                summary={weight.label}
                                tooMuch={weight.tooMuch}
                                courierBooked={Boolean(referenceNo)}
                                onChange={(weightAdjust) => updateLine(line.id, { weightAdjust, basePrice: weight.basePrice })}
                              />
                            )}
                          </td>
                          <td className="px-2 py-2 text-right">
                            {adjusted && <div className="text-[11px] text-gray-400 line-through">{money(weight.basePrice)}</div>}
                            {money(weight.price)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button type="button" onClick={() => updateLine(line.id, { qty: Math.max(1, line.qty - 1) })} className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 hover:bg-gray-200"><Minus size={11} /></button>
                              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold">{line.qty} Unit</span>
                              <button type="button" onClick={() => updateLine(line.id, { qty: line.qty + 1 })} className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 hover:bg-gray-200"><Plus size={11} /></button>
                            </div>
                            {stock !== undefined && (
                              <div className={`mt-0.5 text-[11px] ${stock <= 0 ? "text-red-500" : "text-gray-400"}`}>Available: {stock}</div>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input type="number" min={0} value={line.disc} onChange={(e) => updateLine(line.id, { disc: Number(e.target.value) || 0 })} className="h-8 w-20 rounded border border-gray-300 px-2 text-center text-sm outline-none focus:border-teal-500" />
                          </td>
                          <td className="px-2 py-2 text-right font-semibold">{money(weight.price * line.qty - (Number(line.disc) || 0))}</td>
                          <td className="py-2 pl-2 text-right">
                            <button
                              type="button"
                              onClick={() => window.confirm("এই product টি order থেকে সরাবেন?") && setCart((current) => current.filter((item) => item.id !== line.id))}
                              className="inline-flex items-center gap-1 rounded bg-red-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {showPacking && (
                <div className="mt-3 rounded border border-dashed border-teal-300 bg-teal-50/40 p-3 text-sm">
                  <div className="mb-1 font-semibold text-gray-700">Packing Items</div>
                  {cart.map((line) => (
                    <div key={line.id} className="flex justify-between border-b border-teal-100 py-1 last:border-0">
                      <span>{line.name}</span>
                      <span className="font-semibold">× {line.qty}</span>
                    </div>
                  ))}
                  {form.packingNote && <div className="mt-2 text-xs text-gray-600">Packing note: {form.packingNote}</div>}
                </div>
              )}

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="Order Status*">
                  <select value={form.status} onChange={(e) => set("status")(e.target.value)} className={INPUT_CLASS} style={{ color: statusColor }}>
                    {/* Keep a status that is not in the settings (e.g. Return Received) selectable. */}
                    {!statuses.some((status) => status.key === form.status) && (
                      <option value={form.status}>{label(form.status)}</option>
                    )}
                    {statuses.map((status) => (
                      <option key={status.key} value={status.key} style={{ color: status.color }}>{status.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Payment Method">
                  <select value={form.paymentMethod} onChange={(e) => set("paymentMethod")(e.target.value)} className={INPUT_CLASS}>
                    {!PAYMENT_METHODS.some((item) => item.value === form.paymentMethod) && <option value={form.paymentMethod}>{label(form.paymentMethod)}</option>}
                    {PAYMENT_METHODS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Attachments">
                  {isNew ? (
                    <p className="flex h-9 items-center rounded border border-dashed border-gray-300 px-3 text-xs text-gray-400">Order তৈরির পরে যোগ করা যাবে</p>
                  ) : (
                  <label className={`flex h-9 cursor-pointer items-center gap-2 rounded border border-gray-300 px-3 text-sm text-gray-600 hover:bg-gray-50 ${saving === "attachment" ? "opacity-60" : ""}`}>
                    {saving === "attachment" ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                    Choose file
                    <input type="file" accept="image/*,application/pdf" onChange={handleAttachment} className="hidden" />
                  </label>
                  )}
                  {attachments.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-xs">
                      {attachments.map((item, index) => (
                        <li key={`${item.file}-${index}`} className="flex items-center gap-1">
                          <a href={imageUrl(item.file)} target="_blank" rel="noreferrer" className="max-w-[180px] truncate text-teal-600 hover:underline">{item.name || item.file}</a>
                          <button
                            type="button"
                            onClick={() => window.confirm("Attachment মুছবেন?") && saveMeta({ attachments: attachments.filter((_, i) => i !== index) })}
                            className="text-red-400 hover:text-red-600"
                            title="Remove"
                          >
                            <X size={11} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Field>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Courier Note" info="Courier এ পাঠানোর সময় এই note যাবে">
                  <textarea value={form.courierNote} onChange={(e) => set("courierNote")(e.target.value)} rows={4} className="w-full rounded border border-gray-300 p-2 text-sm outline-none focus:border-teal-500" />
                </Field>
                <Field label="Packing Note">
                  <textarea value={form.packingNote} onChange={(e) => set("packingNote")(e.target.value)} rows={4} className="w-full rounded border border-gray-300 p-2 text-sm outline-none focus:border-teal-500" />
                </Field>
              </div>
            </Card>

            {/* ── Order Notes ── */}
            <NotesCard
              title="Order Notes"
              open={open.notes}
              onToggle={() => toggle("notes")}
              notes={adminNotes}
              busy={saving === "adminNotes"}
              onSave={(next) => saveMeta({ adminNotes: next }, {}, "adminNotes")}
              actorName={actorName}
            />

            {/* ── Customer Notes ── */}
            <NotesCard
              title="Customer Notes/Feedback Note"
              open={open.customerNotes}
              onToggle={() => toggle("customerNotes")}
              notes={customerNotes}
              busy={saving === "customerNotes"}
              onSave={(next) => saveMeta({ customerNotes: next }, {}, "customerNotes")}
              actorName={actorName}
            />

            {/* ── Others Information ── */}
            {!isNew && (
            <Collapsible title="Others Information" open={open.others} onToggle={() => toggle("others")}>
              <InfoGrid
                rows={[
                  ["IP Address", liveOrder.ipAddress],
                  ["Device ID", liveOrder.deviceId],
                  ["Delivery Date", meta.deliveryDate],
                  ["Customer Note", meta.customerNote],
                  ["Payment Status", label(meta.paymentStatus || "pending")],
                  ["Coupon Code", meta.couponCode],
                  ["Landing Page", tracking.landingPage],
                  ["UTM Source", tracking.utm_source],
                  ["UTM Campaign", tracking.utm_campaign],
                  ["Facebook Click (fbc)", tracking.fbc],
                  ["TikTok Click", tracking.ttclid],
                  ["Google Click", tracking.gclid || tracking.gbraid || tracking.wbraid],
                  ["Fraud Score", liveOrder.fraudScore],
                  ["Printed At", meta.printedAt ? formatDateTime(meta.printedAt) : ""],
                  ["Steadfast Status", label(steadfast.status)],
                  ["Pathao Status", label(pathao.status)],
                  ["Old Note", meta.legacyNote],
                ]}
              />
            </Collapsible>
            )}
          </div>

          {/* ── Summary ── */}
          <Card
            title="Summary"
            action={
              <button type="button" onClick={copyOrderInfo} className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                <Copy size={12} /> Copy Info
              </button>
            }
          >
            <h2 className="text-xl font-semibold text-gray-800">Invoice ID: {invoice}</h2>
            {!isNew && (
            <dl className="mt-2 space-y-1 text-sm text-gray-700">
              <div><span className="font-semibold">Created Date:</span> {formatDateTime(liveOrder.createdAt)}</div>
              <div><span className="font-semibold">Last Update:</span> {formatDateTime(liveOrder.updatedAt)}</div>
              <div>
                <span className="font-semibold">User IP:</span> {liveOrder.ipAddress || "—"}{" "}
                {liveOrder.ipAddress && <button type="button" onClick={handleBlockIp} className="text-teal-600 hover:underline">(Block IP)</button>}
              </div>
              <div>
                <span className="font-semibold">Assigned To:</span>{" "}
                {liveOrder.assignedEmployeeName || liveOrder.assignedEmployee?.FirstName || "All Employees"}{" "}
                {canAssign && <button type="button" onClick={() => setShowAssign((current) => !current)} className="text-teal-600 hover:underline">(Transfer To)</button>}
              </div>
              {showAssign && (
                <select defaultValue="" onChange={(e) => handleAssign(e.target.value)} disabled={saving === "assign"} className={INPUT_CLASS}>
                  <option value="">Select User</option>
                  {assignees.map((item) => (
                    <option key={item.Id} value={item.Id}>{item.name || [item.FirstName, item.LastName].filter(Boolean).join(" ")} ({item.role})</option>
                  ))}
                </select>
              )}
            </dl>
            )}

            {!isNew && (
            <Field label="Reference No" className="mt-4">
              <input value={referenceNo} disabled placeholder="Courier এ পাঠানোর পর আসবে" className={INPUT_CLASS} />
            </Field>
            )}
            <div className="mt-1 text-sm"><span className="font-semibold text-gray-700">Source Website:</span> {sourceWebsite}</div>

            <table className="mt-3 w-full border border-gray-200 text-sm">
              <tbody>
                <SummaryRow label="Subtotal:">{money(subtotal)}</SummaryRow>
                <SummaryRow label="Discount:" info="৳ = টাকা, % = subtotal এর শতাংশ">
                  <input type="number" min={0} value={form.discount} onChange={(e) => set("discount")(e.target.value)} className={INPUT_CLASS} />
                  <div className="mt-1 flex gap-1">
                    {["tk", "%"].map((type) => (
                      <button key={type} type="button" onClick={() => set("discountType")(type)} className={`h-6 w-7 rounded text-xs font-semibold ${form.discountType === type ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                        {type === "tk" ? "৳" : "%"}
                      </button>
                    ))}
                    {form.discountType === "%" && <span className="ml-1 self-center text-xs text-gray-500">= {money(discountAmount)}</span>}
                  </div>
                </SummaryRow>
                <SummaryRow label="Shipping Charge:">
                  <input type="number" min={0} value={form.shipping} onChange={(e) => set("shipping")(e.target.value)} className={INPUT_CLASS} />
                </SummaryRow>
                <SummaryRow label="Courier:">
                  <select value={form.courier} onChange={(e) => set("courier")(e.target.value)} className={INPUT_CLASS}>
                    <option value="">Select Courier</option>
                    {form.courier && !COURIER_OPTIONS.includes(form.courier) && <option value={form.courier}>{form.courier}</option>}
                    {COURIER_OPTIONS.map((courier) => (
                      <option key={courier} value={courier}>{courier}</option>
                    ))}
                  </select>
                </SummaryRow>
                <SummaryRow label="Grand Total:">{money(grandTotal)}</SummaryRow>
                <SummaryRow label="Paid Amount:">
                  {isNew ? (
                    <input type="number" min={0} value={form.advance} onChange={(e) => set("advance")(e.target.value)} placeholder="0" className={INPUT_CLASS} />
                  ) : (
                    <input value={paid} disabled className={INPUT_CLASS} />
                  )}
                  <button type="button" onClick={() => setOpen((current) => ({ ...current, payments: true, addPayment: true }))} className="mt-1 text-xs text-teal-600 hover:underline">
                    Add Payment
                  </button>
                </SummaryRow>
                <SummaryRow label="Due:">{money(due)}</SummaryRow>
              </tbody>
            </table>

            <div className="mt-4 space-y-2">
              <button type="button" onClick={() => handleUpdate()} disabled={saving === "update"} className="inline-flex items-center gap-1 rounded bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
                {saving === "update" && <Loader2 size={14} className="animate-spin" />} {isNew ? "Create Order" : "Update"}
              </button>
              <p className="text-xs text-gray-500"><span className="font-semibold">NB: (*)</span> marked are required field.</p>
              {!isNew && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onPrintOrder} className="inline-flex items-center gap-1 rounded bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                  <Printer size={14} /> Print
                </button>
                {form.status !== "pre_order" && (
                  <button
                    type="button"
                    onClick={() => window.confirm("Order টি Pre Order এ নেবেন?") && handleUpdate("pre_order")}
                    className="inline-flex items-center gap-1 rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                  >
                    <RotateCcw size={14} /> Move to Pre Order
                  </button>
                )}
              </div>
              )}
              <div className="space-y-1 pt-2 text-xs leading-relaxed text-gray-600">
                <p><span className="font-semibold">NB:</span> Order Returned বা Cancelled করলে product গুলোর stock আবার ফিরে যাবে।</p>
                <p><span className="font-semibold">NB:</span> Courier এ পাঠানো order এর status courier থেকে sync হয়; delivered হলে order টি Delivered হয়ে যাবে।</p>
                <p><span className="font-semibold">NB:</span> Customer Tag customer এর সব order এ একসাথে লাগে।</p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Order Payments ── */}
        <PaymentsCard
          open={open.payments}
          onToggle={() => toggle("payments")}
          showForm={open.addPayment}
          onShowForm={(value) => setOpen((current) => ({ ...current, payments: true, addPayment: value }))}
          payments={payments}
          legacyAdvance={payments.length ? 0 : paid}
          createdAt={liveOrder.createdAt}
          busy={saving === "payments"}
          actorName={actorName}
          onSave={(next) => {
            const advance = next.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            return saveMeta({ payments: next, advance }, { advance }, "payments");
          }}
        />

        {/* ── Employee Activity Track ── */}
        {!isNew && (
        <Collapsible title="Employee Activity Track on this Order" open={open.activity} onToggle={() => toggle("activity")}>
          <Timeline
            events={[
              { at: liveOrder.createdAt, text: `Order created (${form.orderSource})` },
              liveOrder.assignedAt && {
                at: liveOrder.assignedAt,
                text: `Assigned to ${liveOrder.assignedEmployeeName || "employee"}${liveOrder.assignedByName ? ` by ${liveOrder.assignedByName}` : ""}`,
              },
              ...adminNotes.map((note) => ({ at: note.createdAt, text: `Note${note.by ? ` by ${note.by}` : ""}: ${note.text}` })),
              ...payments.map((item) => ({ at: item.at, text: `Payment ${money(item.amount)} (${label(item.method)})${item.by ? ` by ${item.by}` : ""}` })),
              ...attachments.map((item) => ({ at: item.at, text: `Attachment "${item.name}"${item.by ? ` by ${item.by}` : ""}` })),
              meta.printedAt && { at: meta.printedAt, text: `Printed${meta.printCount > 1 ? ` (${meta.printCount} times)` : ""}` },
            ].filter(Boolean)}
          />
        </Collapsible>
        )}

        {/* ── Order Status Tracking ── */}
        {!isNew && (
        <Collapsible title="Order Status Tracking" open={open.tracking} onToggle={() => toggle("tracking")}>
          <Timeline
            events={[
              { at: liveOrder.createdAt, text: "Order placed" },
              ...statusHistory.map((item) => ({
                at: item.at,
                text: `${label(item.from) || "New"} → ${label(item.to)}`,
                color: statuses.find((status) => status.key === item.to)?.color,
              })),
              steadfast.status && { at: steadfast.updatedAt, text: `Steadfast: ${label(steadfast.status)}` },
              pathao.status && { at: pathao.updatedAt, text: `Pathao: ${label(pathao.status)}` },
            ].filter(Boolean)}
          />
        </Collapsible>
        )}

        <div className="pb-2 text-xs text-gray-400">Khilgaon Mart © {new Date().getFullYear()} | All Right Reserved</div>
      </div>

      {showCustomerOrders && (
        <CustomerOrdersModal
          phone={form.phone}
          statuses={statuses}
          currentOrderId={liveOrder.Id}
          onOpenOrder={onOpenOrder && ((target) => {
            setShowCustomerOrders(false);
            onOpenOrder(target);
          })}
          onViewProfile={onViewCustomer && (() => onViewCustomer(customerRef))}
          onClose={() => setShowCustomerOrders(false)}
        />
      )}
      {showProductPicker && (
        <ProductPicker units={units} cart={cart} onAdd={addToCart} onClose={() => setShowProductPicker(false)} />
      )}
    </div>
  );
}

/* ── Building blocks ── */

// Extra or missing weight after cutting, in the variant's own unit (kg or gm).
function WeightAdjustInput({ value, unit, summary, tooMuch, courierBooked, onChange }) {
  const direction = value?.direction === "+" ? "+" : "-";
  const amount = value?.amount || "";
  const set = (patch) => onChange({ direction, amount: Number(amount) || 0, ...patch });
  return (
    <div className="mt-1.5">
      <div className="inline-flex items-center overflow-hidden rounded border border-gray-300 text-xs">
        {[
          ["-", "− কম"],
          ["+", "+ বেশি"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => set({ direction: key })}
            className={`px-2 py-1 font-semibold ${direction === key ? (key === "-" ? "bg-red-500 text-white" : "bg-green-600 text-white") : "bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            {label}
          </button>
        ))}
        <input
          type="number"
          min={0}
          step={unit === "kg" ? 0.01 : 1}
          value={amount}
          onChange={(event) => set({ amount: Math.max(0, Number(event.target.value) || 0) })}
          placeholder="0"
          className="h-6 w-16 border-l border-gray-300 px-1.5 text-right outline-none"
          title="কাটার পর ওজন কত কম/বেশি হলো"
        />
        <span className="border-l border-gray-300 bg-gray-50 px-1.5 py-1 text-gray-500">{unit}</span>
      </div>
      {summary && (
        <div className={`mt-0.5 text-[11px] ${tooMuch ? "text-red-500" : "text-teal-700"}`}>
          {tooMuch ? "৫০% এর বেশি কম-বেশি করা যাবে না" : `আসল ওজন: ${summary}`}
        </div>
      )}
      {summary && courierBooked && (
        <div className="mt-0.5 text-[11px] text-amber-600">কুরিয়ারে বুক হয়ে গেছে — কুরিয়ারের COD টাকা আলাদা করে ঠিক করুন</div>
      )}
    </div>
  );
}

function Card({ title, action, children }) {
  return (
    <section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function Collapsible({ title, open, onToggle, action, children }) {
  return (
    <section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between gap-2 px-5 py-3">
        <button type="button" onClick={onToggle} className="flex items-center gap-1 text-base font-semibold text-gray-800">
          {title} {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {action}
      </div>
      {open && <div className="border-t border-gray-100 px-5 py-4">{children}</div>}
    </section>
  );
}

function Field({ label: fieldLabel, info, aside, className = "", children }) {
  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
          {fieldLabel}
          {info && <span title={info} className="text-gray-400"><Info size={12} /></span>}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}

function IconCopy({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        copyText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      title="Copy"
      className="inline-flex h-7 w-7 items-center justify-center rounded bg-gray-500 text-white hover:bg-gray-600"
    >
      {copied ? <span className="text-[10px]">✓</span> : <Copy size={12} />}
    </button>
  );
}

function InputWithCopy({ value, onChange, type = "text" }) {
  return (
    <div className="flex items-center gap-1 rounded border border-gray-300 pr-1 focus-within:border-teal-500">
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 min-w-0 flex-1 rounded px-3 text-sm text-gray-700 outline-none" />
      <IconCopy value={value} />
    </div>
  );
}

function Thumb({ src }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 text-[9px] text-gray-300">
      {src && !failed ? <img src={imageUrl(imageValue(src))} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : "IMG"}
    </div>
  );
}

function SummaryRow({ label: rowLabel, info, children }) {
  return (
    <tr className="border-b border-gray-200 last:border-0">
      <td className="w-36 border-r border-gray-200 px-3 py-2 align-middle font-semibold text-gray-700">
        <span className="inline-flex items-center gap-1">
          {rowLabel}
          {info && <span title={info} className="text-gray-400"><Info size={12} /></span>}
        </span>
      </td>
      <td className="px-3 py-2 text-gray-700">{children}</td>
    </tr>
  );
}

function InfoGrid({ rows }) {
  const visible = rows.filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");
  if (!visible.length) return <p className="text-sm text-gray-400">কোনো তথ্য নেই</p>;
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {visible.map(([key, value]) => (
        <div key={key} className="flex gap-2 border-b border-gray-50 pb-1">
          <dt className="w-40 flex-shrink-0 font-medium text-gray-500">{key}</dt>
          <dd className="min-w-0 break-all text-gray-800">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Timeline({ events }) {
  const sorted = [...events].sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
  if (!sorted.length) return <p className="text-sm text-gray-400">কোনো activity নেই</p>;
  return (
    <ol className="relative space-y-3 border-l-2 border-teal-100 pl-5">
      {sorted.map((event, index) => (
        <li key={index} className="relative text-sm">
          <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white" style={{ background: event.color || "#0d9488" }} />
          <div className="text-gray-800">{event.text}</div>
          <div className="text-xs text-gray-400">{formatDateTime(event.at)}</div>
        </li>
      ))}
    </ol>
  );
}

function CourierSuccess({ fraud, summary }) {
  const stats = fraud.data?.courierStats || [];
  const totals = fraud.data?.totals || {};
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
              <th className="w-40 border-r border-gray-200 px-3 py-2 font-semibold">Courier</th>
              <th className="px-3 py-2 font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {fraud.loading && !stats.length && (
              <tr><td colSpan={2} className="py-4 text-center text-gray-400"><Loader2 size={16} className="mr-1 inline animate-spin" /> Loading...</td></tr>
            )}
            {stats.map((row) => {
              const rate = row.totalParcel ? Math.round((row.delivered / row.totalParcel) * 100) : 0;
              return (
                <tr key={row.courier} className="border-t border-gray-200">
                  <td className="border-r border-gray-200 px-3 py-2 font-semibold text-gray-700">{row.courier}</td>
                  <td className="px-3 py-2">
                    <div className="relative h-4 w-full max-w-xs overflow-hidden rounded bg-gray-300">
                      {row.totalParcel > 0 && <div className="absolute inset-y-0 left-0 bg-teal-500" style={{ width: `${rate}%` }} />}
                      {row.totalParcel > 0 && <span className="absolute inset-0 text-center text-[10px] font-semibold leading-4 text-white">{rate}%</span>}
                    </div>
                    <div className="mt-0.5 flex max-w-xs justify-between text-xs">
                      <span>To: {row.totalParcel}</span>
                      <span className="text-teal-600">Su: {row.delivered}</span>
                      <span className="text-red-500">Fa: {row.return}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-center text-xs text-gray-500">NB: শুধু এই store এর courier এ পাঠানো order হিসাব করা হয়েছে।</p>
      </div>
      <div className="flex flex-wrap justify-around gap-6">
        <RateCircle title="Khilgaon Mart" total={summary.orders || 0} success={summary.completed || 0} failed={summary.failed || 0} />
        <RateCircle title="All Courier" total={totals.totalParcel || 0} success={totals.delivered || 0} failed={totals.return || 0} strong />
      </div>
    </div>
  );
}

function RateCircle({ title, total, success, failed, strong = false }) {
  const rate = total ? Math.round((success / total) * 1000) / 10 : 0;
  const size = strong ? 110 : 90;
  const stroke = strong ? 10 : 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = !total ? "#d1d5db" : rate >= 80 ? "#166534" : rate >= 50 ? "#d97706" : "#dc2626";
  return (
    <div className="text-center">
      <svg width={size} height={size} className="mx-auto">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - rate / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-gray-400" style={{ fontSize: strong ? 20 : 16 }}>
          {rate}%
        </text>
      </svg>
      <div className="mt-1 text-lg font-semibold text-gray-800">{title}</div>
      <div className="text-xs text-teal-600">Total: {total}</div>
      <div className="text-xs text-teal-600">Success: {success}</div>
      <div className="text-xs text-teal-600">Failed: {failed}</div>
    </div>
  );
}

function NotesCard({ title, open, onToggle, notes, busy, onSave, actorName }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const visible = notes
    .map((note, index) => ({ ...note, index }))
    .filter((note) => !query.trim() || note.text.toLowerCase().includes(query.trim().toLowerCase()));

  async function addNote() {
    const value = text.trim();
    if (!value) return;
    const ok = await onSave([...notes, { text: value, by: actorName, createdAt: new Date().toISOString() }]);
    if (ok) {
      setText("");
      setAdding(false);
    }
  }

  return (
    <Collapsible
      title={title}
      open={open}
      onToggle={onToggle}
      action={
        <button
          type="button"
          onClick={() => {
            if (!open) onToggle();
            setAdding(true);
          }}
          className="inline-flex items-center gap-1 rounded bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
        >
          <Plus size={13} /> Add Note
        </button>
      }
    >
      {adding && (
        <div className="mb-3 flex gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} autoFocus placeholder="Note লিখুন..." className="flex-1 rounded border border-gray-300 p-2 text-sm outline-none focus:border-teal-500" />
          <div className="flex flex-col gap-1">
            <button type="button" onClick={addNote} disabled={busy} className="rounded bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
              {busy ? <Loader2 size={13} className="animate-spin" /> : "Save"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-600">Cancel</button>
          </div>
        </div>
      )}
      <div className="mb-2 flex justify-end">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Search:
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-8 w-44 rounded border border-gray-300 px-2 text-sm outline-none focus:border-teal-500" />
        </label>
      </div>
      <table className="w-full border border-gray-200 text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
            <th className="w-12 px-3 py-2 font-semibold">SL.</th>
            <th className="px-3 py-2 font-semibold">Note</th>
            <th className="px-3 py-2 font-semibold">Added By</th>
            <th className="px-3 py-2 font-semibold">Created At</th>
            <th className="w-20 px-3 py-2 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 && (
            <tr><td colSpan={5} className="py-3 text-center text-gray-500">No data available in table</td></tr>
          )}
          {visible.map((note, row) => (
            <tr key={note.index} className="border-t border-gray-200">
              <td className="px-3 py-2">{row + 1}</td>
              <td className="px-3 py-2 text-gray-800">{note.text}</td>
              <td className="px-3 py-2 text-gray-600">{note.by || "—"}</td>
              <td className="px-3 py-2 text-gray-600">{formatDateTime(note.createdAt)}</td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => window.confirm("Note টি মুছবেন?") && onSave(notes.filter((_, i) => i !== note.index))}
                  className="text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-gray-500">Showing {visible.length ? 1 : 0} to {visible.length} of {notes.length} entries</p>
    </Collapsible>
  );
}

function PaymentsCard({ open, onToggle, showForm, onShowForm, payments, legacyAdvance, createdAt, busy, actorName, onSave }) {
  const [form, setForm] = useState({ amount: "", method: "bkash", note: "" });
  // An advance recorded before payments were tracked is shown as the first payment.
  const rows = legacyAdvance > 0
    ? [{ amount: legacyAdvance, method: "advance", note: "Initial advance", at: createdAt, legacy: true }]
    : payments;

  async function addPayment() {
    const amount = Number(form.amount);
    if (!(amount > 0)) return alert("সঠিক amount দিন");
    const base = payments.length
      ? payments
      : rows.map((item) => ({ amount: item.amount, method: item.method, note: item.note, at: item.at }));
    const ok = await onSave([...base, { amount, method: form.method, note: form.note.trim(), by: actorName, at: new Date().toISOString() }]);
    if (ok) {
      setForm({ amount: "", method: "bkash", note: "" });
      onShowForm(false);
    }
  }

  return (
    <Collapsible
      title="Order Payments"
      open={open}
      onToggle={onToggle}
      action={
        <button type="button" onClick={() => onShowForm(true)} className="inline-flex items-center gap-1 rounded bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">
          <Plus size={13} /> Add Payment
        </button>
      }
    >
      {showForm && (
        <div className="mb-3 grid gap-2 sm:grid-cols-[140px_160px_minmax(0,1fr)_auto]">
          <input type="number" min={0} placeholder="Amount" value={form.amount} onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))} className={INPUT_CLASS} />
          <select value={form.method} onChange={(e) => setForm((c) => ({ ...c, method: e.target.value }))} className={INPUT_CLASS}>
            {PAYMENT_METHODS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <input placeholder="Note / Transaction ID" value={form.note} onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))} className={INPUT_CLASS} />
          <div className="flex gap-1">
            <button type="button" onClick={addPayment} disabled={busy} className="rounded bg-teal-600 px-3 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
              {busy ? <Loader2 size={13} className="animate-spin" /> : "Save"}
            </button>
            <button type="button" onClick={() => onShowForm(false)} className="rounded border border-gray-300 px-3 text-xs text-gray-600">Cancel</button>
          </div>
        </div>
      )}
      <table className="w-full border border-gray-200 text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
            <th className="px-3 py-2 font-semibold">Date</th>
            <th className="px-3 py-2 font-semibold">Amount</th>
            <th className="px-3 py-2 font-semibold">Method</th>
            <th className="px-3 py-2 font-semibold">Note</th>
            <th className="px-3 py-2 font-semibold">Added By</th>
            <th className="w-20 px-3 py-2 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={6} className="py-3 text-center text-gray-500">কোনো payment নেই</td></tr>
          )}
          {rows.map((item, index) => (
            <tr key={index} className="border-t border-gray-200">
              <td className="px-3 py-2">{formatDateTime(item.at)}</td>
              <td className="px-3 py-2 font-semibold">{money(item.amount)}</td>
              <td className="px-3 py-2">{label(item.method)}</td>
              <td className="px-3 py-2 text-gray-600">{item.note || "—"}</td>
              <td className="px-3 py-2 text-gray-600">{item.by || "—"}</td>
              <td className="px-3 py-2">
                {!item.legacy && (
                  <button
                    type="button"
                    onClick={() => window.confirm("Payment টি মুছবেন?") && onSave(payments.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Collapsible>
  );
}

function orderItemsText(order) {
  const items = parseMeta(order.note).items;
  if (Array.isArray(items) && items.length) {
    return items.map((item) => `${Number(item.qty) || 1} x ${item.name || "Product"}`).join(", ");
  }
  return `${Number(order.quantity) || 1} x ${order.productName || "Product"}`;
}

function employeeName(order) {
  const employee = order.assignedEmployee || {};
  return (
    order.assignedEmployeeName ||
    employee.name ||
    [employee.FirstName, employee.LastName].filter(Boolean).join(" ").trim() ||
    "All"
  );
}

// Every order placed from the given phone, matched on its last 10 digits.
function CustomerOrdersModal({ phone, statuses, currentOrderId, onOpenOrder, onViewProfile, onClose }) {
  const key = String(phone || "").replace(/\D/g, "").slice(-10);
  const [state, setState] = useState({ loading: true, orders: [], error: "" });

  useEffect(() => {
    let active = true;
    orderService
      .getOrders({ search: key, limit: 100, page: 1, sortBy: "Id", sortOrder: "DESC" })
      .then((res) => {
        if (!active) return;
        const orders = (res.data || []).filter((order) => String(order.customerPhone || "").replace(/\D/g, "").endsWith(key));
        setState({ loading: false, orders, error: "" });
      })
      .catch((err) => active && setState({ loading: false, orders: [], error: err.message }));
    return () => {
      active = false;
    };
  }, [key]);

  const statusOf = (order) => statuses.find((item) => item.key === toOrderStatusKey(order.status));
  const counts = state.orders.reduce((acc, order) => {
    const found = statusOf(order);
    const name = found?.label || label(order.status);
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/45 px-4 pt-16" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
          <h3 className="font-semibold text-gray-800">Customer Orders</h3>
          <div className="flex items-center gap-3">
            {onViewProfile && (
              <button type="button" onClick={onViewProfile} className="inline-flex items-center gap-1 rounded border border-teal-500 px-3 py-1 text-xs font-semibold text-teal-600 hover:bg-teal-50">
                <ExternalLink size={12} /> Customer Profile
              </button>
            )}
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>
        <div className="overflow-y-auto p-5">
          {!state.loading && !state.error && state.orders.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-white">Total: {state.orders.length}</span>
              {Object.entries(counts).map(([name, count]) => (
                <span key={name} className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{name}: {count}</span>
              ))}
            </div>
          )}
          {state.loading && (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400"><Loader2 size={16} className="animate-spin" /> লোড হচ্ছে...</p>
          )}
          {state.error && <p className="py-8 text-center text-sm text-red-500">{state.error}</p>}
          {!state.loading && !state.error && state.orders.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">এই নম্বরে আগে কোনো order নেই</p>
          )}
          {state.orders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border border-gray-200 text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase text-gray-600">
                  <tr>
                    {["Invoice ID", "Date", "Items", "Amount", "Status", "Source", "Employee", "Action"].map((head) => (
                      <th key={head} className={`border border-gray-200 px-3 py-2 font-semibold ${head === "Amount" ? "text-right" : head === "Action" ? "text-center" : "text-left"}`}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.orders.map((order) => {
                    const status = statusOf(order);
                    const current = order.Id === currentOrderId;
                    return (
                      <tr key={order.Id} className={current ? "bg-teal-50/60" : "hover:bg-gray-50"}>
                        <td className="border border-gray-200 px-3 py-2 font-semibold text-gray-800">{formatInvoiceNumber(order, `#${order.Id}`)}</td>
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-xs text-gray-600">{formatDateTime(order.orderDate || order.createdAt)}</td>
                        <td className="border border-gray-200 px-3 py-2 text-xs text-gray-700">{orderItemsText(order)}</td>
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-800">{money(order.totalBill)}</td>
                        <td className="border border-gray-200 px-3 py-2">
                          <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ color: status?.color || "#b45309", backgroundColor: `${status?.color || "#f59e0b"}1a` }}>
                            {status?.label || label(order.status)}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">{order.orderSource || "—"}</td>
                        <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">{employeeName(order)}</td>
                        <td className="border border-gray-200 px-3 py-2 text-center">
                          {current ? (
                            <span className="text-xs text-teal-600">এই order</span>
                          ) : (
                            <button type="button" title="Order খুলুন" onClick={() => onOpenOrder?.(order)} className="inline-flex items-center rounded border border-teal-500 p-1.5 text-teal-600 hover:bg-teal-50">
                              <ExternalLink size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductPicker({ units, cart, onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return units
      .filter((unit) => !term || unit.name.toLowerCase().includes(term) || String(unit.sku || "").toLowerCase().includes(term))
      .slice(0, 60);
  }, [units, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/45 px-4 pt-10" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <Search size={16} className="text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} autoFocus placeholder="Product name বা SKU দিয়ে খুঁজুন..." className="flex-1 text-sm outline-none" />
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto">
          {results.length === 0 && <p className="py-8 text-center text-sm text-gray-400">কোনো product পাওয়া যায়নি</p>}
          {results.map((unit) => {
            const inCart = cart.find((line) => line.id === unit.id);
            return (
              <button key={unit.id} type="button" onClick={() => onAdd(unit)} className="flex w-full items-center gap-3 border-b border-gray-50 px-4 py-2 text-left hover:bg-teal-50">
                <Thumb src={unit.images?.[0]} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-800">{unit.name}</div>
                  <div className={`text-xs ${unit.stock <= 0 ? "text-red-500" : "text-gray-500"}`}>
                    {money(unit.price)} · Stock: {unit.stock}
                    {unit.sku ? ` · ${unit.sku}` : ""}
                  </div>
                </div>
                <span className={`rounded px-2 py-1 text-xs font-semibold ${inCart ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {inCart ? `Added × ${inCart.qty}` : "Add"}
                </span>
              </button>
            );
          })}
        </div>
        <div className="border-t border-gray-100 px-4 py-2 text-right">
          <button type="button" onClick={onClose} className="rounded bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700">Done</button>
        </div>
      </div>
    </div>
  );
}
