import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Download, Info, Loader2, Search, X } from "lucide-react";
import { orderService } from "../services/orderService";
import { categoryService, productService } from "../services/productService";
import {
  BD_DISTRICTS,
  ORDER_REPORTS,
  ORDER_SOURCE_OPTIONS,
  ORDER_TAG_OPTIONS,
  TEAM_ROLES,
} from "../utils/orderFilters";

const COURIER_OPTIONS = ["Steadfast", "Pathao", "Redx", "Paperfly", "eCourier"]
  .map((value) => ({ value, label: value }))
  .concat({ value: "none", label: "Not Set" });

const DEFAULT_COURIER_STATUSES = [
  "in_review",
  "pending",
  "hold",
  "delivered",
  "partial_delivered",
  "cancelled",
  "unknown",
];

const COMPARE_OPTIONS = [
  { value: "gte", label: "Greater Then Eq" },
  { value: "gt", label: "Greater Then" },
  { value: "lte", label: "Less Then Eq" },
  { value: "lt", label: "Less Then" },
  { value: "eq", label: "Equal" },
];

const UTM_SOURCE_OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google" },
  { value: "none", label: "No UTM / Direct" },
];

const toLabel = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const toOptions = (values = []) => values.map((value) => ({ value, label: toLabel(value) }));

// Known values first, then any other value already saved on orders (case-insensitive dedupe).
const mergeValues = (known = [], saved = []) => {
  const seen = new Set(known.map((value) => String(value).toLowerCase()));
  return [...known, ...saved.filter((value) => !seen.has(String(value).toLowerCase()))];
};

async function searchProducts(term) {
  const res = await productService.getAll({ searchTerm: term || undefined, limit: 20 });
  return (res.data || []).map((product) => ({
    value: String(product.Id),
    label: product.name,
  }));
}

function getProviderList(res) {
  const payload = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function OrderFilterPanel({
  filters,
  onChange,
  onApply,
  onClear,
  employeeValue,
  employeeOptions,
  onEmployeeChange,
  leadingFields,
  onReport,
  exporting = false,
}) {
  const [options, setOptions] = useState({
    districts: [],
    orderSources: [],
    orderTags: [],
    courierStatuses: [],
    paymentStatuses: [],
    roles: [],
  });
  const [categories, setCategories] = useState([]);
  const [pathaoCities, setPathaoCities] = useState([]);
  const [zoneState, setZoneState] = useState({ cityId: "", zones: [] });
  // Labels of products picked from search results, keyed by product Id.
  const [productLabels, setProductLabels] = useState({});

  useEffect(() => {
    let active = true;
    orderService
      .getFilterOptions()
      .then((res) => active && setOptions((current) => ({ ...current, ...(res.data || {}) })))
      .catch(() => {});
    categoryService
      .getAllList()
      .then((res) => active && setCategories(res.data || []))
      .catch(() => {});
    orderService
      .getPathaoCities()
      .then((res) => active && setPathaoCities(getProviderList(res)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const cityId = filters.pathaoCity;
    if (!cityId) return undefined;
    let active = true;
    orderService
      .getPathaoZones(cityId)
      .then((res) => active && setZoneState({ cityId, zones: getProviderList(res) }))
      .catch(() => active && setZoneState({ cityId, zones: [] }));
    return () => {
      active = false;
    };
  }, [filters.pathaoCity]);
  const pathaoZones = zoneState.cityId === filters.pathaoCity ? zoneState.zones : [];

  const set = (key) => (value) => onChange({ ...filters, [key]: value });

  const orderSourceOptions = useMemo(
    () =>
      mergeValues(ORDER_SOURCE_OPTIONS, options.orderSources).map((value) => ({ value, label: value })),
    [options.orderSources],
  );
  const orderTagOptions = useMemo(
    () => [
      ...toOptions(mergeValues(ORDER_TAG_OPTIONS, options.orderTags)),
      { value: "none", label: "No Tag" },
    ],
    [options.orderTags],
  );
  const teamOptions = useMemo(
    () => [{ value: "", label: "All Teams" }, ...toOptions(mergeValues(TEAM_ROLES, options.roles))],
    [options.roles],
  );
  const courierStatusOptions = useMemo(
    () => toOptions([...new Set([...DEFAULT_COURIER_STATUSES, ...options.courierStatuses])]),
    [options.courierStatuses],
  );
  const paymentStatusOptions = useMemo(
    () => toOptions([...new Set(["pending", "unverified", "paid", ...options.paymentStatuses])]),
    [options.paymentStatuses],
  );
  const districtOptions = useMemo(
    () => mergeValues(BD_DISTRICTS, options.districts).map((value) => ({ value, label: value })),
    [options.districts],
  );
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: String(category.Id), label: category.name })),
    [categories],
  );

  function handleProductChange(values, picked = []) {
    if (picked.length) {
      setProductLabels((current) => ({
        ...current,
        ...Object.fromEntries(picked.map((option) => [option.value, option.label])),
      }));
    }
    set("product")(values);
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
        {leadingFields}

        {employeeOptions && (
          <Field label="Employee">
            <Select value={employeeValue} onChange={onEmployeeChange} options={employeeOptions} />
          </Field>
        )}

        <Field label="Team" info="Assigned employee এর role অনুযায়ী">
          <Select
            value={filters.team}
            onChange={set("team")}
            options={teamOptions}
          />
        </Field>

        <Field label="Employee Action">
          <Select
            value={filters.employeeAction}
            onChange={set("employeeAction")}
            options={[
              { value: "assigned", label: "Order Created/Assigned" },
              { value: "assigned_by", label: "Assigned By" },
            ]}
          />
        </Field>

        <Field
          label="Order Source"
          aside={<Check label="Exclude" checked={filters.orderSourceExclude} onChange={set("orderSourceExclude")} />}
        >
          <MultiSelect values={filters.orderSource} onChange={set("orderSource")} options={orderSourceOptions} />
        </Field>

        <Field label="Order Tag">
          <MultiSelect values={filters.orderTag} onChange={set("orderTag")} options={orderTagOptions} placeholder="Select Tag" />
        </Field>

        <Field label="Customer Tag">
          <Select
            value={filters.customerTag}
            onChange={set("customerTag")}
            options={[
              { value: "", label: "All" },
              { value: "safe", label: "Safe" },
              { value: "fake", label: "Fake" },
              { value: "unmarked", label: "Not Marked" },
            ]}
          />
        </Field>

        <Field label="Customer Type">
          <Select
            value={filters.customerType}
            onChange={set("customerType")}
            options={[
              { value: "", label: "All" },
              { value: "new", label: "New Customer" },
              { value: "repeat", label: "Repeat Customer" },
            ]}
          />
        </Field>

        <Field
          label="Courier"
          aside={<Check label="Exclude" checked={filters.courierExclude} onChange={set("courierExclude")} />}
        >
          <MultiSelect values={filters.courier} onChange={set("courier")} options={COURIER_OPTIONS} />
        </Field>

        <Field
          label="Courier Status"
          aside={<Check label="Exclude" checked={filters.courierStatusExclude} onChange={set("courierStatusExclude")} />}
        >
          <MultiSelect values={filters.courierStatus} onChange={set("courierStatus")} options={courierStatusOptions} />
        </Field>

        <Field label="Courier Performance">
          <CompareInput
            metric={filters.performanceMetric}
            onMetricChange={set("performanceMetric")}
            metricOptions={[
              { value: "successRate", label: "Success Rate" },
              { value: "totalParcel", label: "Total Parcel" },
            ]}
            value={filters.performanceValue}
            onValueChange={set("performanceValue")}
            op={filters.performanceOp}
            onOpChange={set("performanceOp")}
          />
        </Field>

        <Field label="Courier Charged" info="Courier এ booking হয়েছে কিনা">
          <Select value={filters.courierCharged} onChange={set("courierCharged")} options={YES_NO_OPTIONS} />
        </Field>

        <Field label="Delivery Charge">
          <Select
            value={filters.deliveryCharge}
            onChange={set("deliveryCharge")}
            options={[
              { value: "", label: "All" },
              { value: "free", label: "Free Delivery" },
              { value: "charged", label: "With Charge" },
            ]}
          />
        </Field>

        <Field label="COD Changed" info="Courier এ পাঠানো COD বর্তমান due এর থেকে আলাদা">
          <Select value={filters.codChanged} onChange={set("codChanged")} options={YES_NO_OPTIONS} />
        </Field>

        <Field
          label="Product Category"
          below={
            <>
              <Check label="Exclude" checked={filters.categoryExclude} onChange={set("categoryExclude")} />
              <Check label="Only These" checked={filters.categoryOnly} onChange={set("categoryOnly")} />
            </>
          }
        >
          <MultiSelect
            values={filters.category}
            onChange={set("category")}
            options={categoryOptions}
            placeholder="Search Category"
          />
        </Field>

        <Field
          label="Select Product"
          below={
            <>
              <Check label="Exclude" checked={filters.productExclude} onChange={set("productExclude")} />
              <Check label="Only These" checked={filters.productOnly} onChange={set("productOnly")} />
              <Check label="Include Returns" checked={filters.includeReturns} onChange={set("includeReturns")} />
            </>
          }
        >
          <MultiSelect
            values={filters.product}
            onChange={handleProductChange}
            options={filters.product.map((id) => ({ value: id, label: productLabels[id] || `#${id}` }))}
            onSearch={searchProducts}
            placeholder="Search Product"
          />
        </Field>

        <Field
          label="District"
          below={<Check label="Exclude" checked={filters.districtExclude} onChange={set("districtExclude")} />}
        >
          <MultiSelect
            values={filters.district}
            onChange={set("district")}
            options={districtOptions}
            placeholder="Search District"
          />
        </Field>

        <Field label="Payment Status">
          <MultiSelect values={filters.paymentStatus} onChange={set("paymentStatus")} options={paymentStatusOptions} />
        </Field>

        <Field label="Order Type">
          <Select
            value={filters.orderType}
            onChange={set("orderType")}
            options={[
              { value: "", label: "All" },
              { value: "regular", label: "Regular" },
              { value: "pre_order", label: "Pre Order" },
            ]}
          />
        </Field>

        <Field label="Stock Availability">
          <Select
            value={filters.stockAvailability}
            onChange={set("stockAvailability")}
            options={[
              { value: "", label: "All" },
              { value: "in_stock", label: "In Stock" },
              { value: "out_of_stock", label: "Out of Stock" },
            ]}
          />
        </Field>

        <Field label="Website">
          <Select
            value={filters.website}
            onChange={set("website")}
            options={[
              { value: "", label: "All" },
              { value: "main", label: "Main Website" },
              { value: "landing", label: "Landing Page" },
            ]}
          />
        </Field>

        <Field label="Print Status">
          <div className="grid grid-cols-[1fr_120px]">
            <Select
              value={filters.printStatus}
              onChange={(value) => onChange({ ...filters, printStatus: value, printDate: value === "printed" ? filters.printDate : "" })}
              options={[
                { value: "", label: "All" },
                { value: "printed", label: "Printed" },
                { value: "not_printed", label: "Not Printed" },
              ]}
              className="rounded-r-none"
            />
            <Select
              value={filters.printDate}
              onChange={set("printDate")}
              disabled={filters.printStatus !== "printed"}
              options={[
                { value: "", label: "All Time" },
                { value: "today", label: "Today" },
                { value: "yesterday", label: "Yesterday" },
                { value: "last7", label: "Last 7 Days" },
                { value: "last30", label: "Last 30 Days" },
              ]}
              className="rounded-l-none border-l-0"
            />
          </div>
        </Field>

        <Field label="Courier Mark" info="Courier select করা কিন্তু এখনো booking হয়নি">
          <Select
            value={filters.courierMark}
            onChange={set("courierMark")}
            options={[
              { value: "", label: "All" },
              { value: "marked", label: "Marked (Not Booked)" },
              { value: "unmarked", label: "Not Marked" },
            ]}
          />
        </Field>

        <Field label="Pathao City">
          <Select
            value={filters.pathaoCity}
            onChange={(value) => onChange({ ...filters, pathaoCity: value, pathaoZone: "" })}
            options={[
              { value: "", label: "Search City" },
              ...pathaoCities.map((city) => ({ value: String(city.city_id), label: city.city_name })),
            ]}
            searchable
          />
        </Field>

        <Field label="Pathao Zone">
          <Select
            value={filters.pathaoZone}
            onChange={set("pathaoZone")}
            disabled={!filters.pathaoCity}
            options={[
              { value: "", label: "Select Zone" },
              ...pathaoZones.map((zone) => ({ value: String(zone.zone_id), label: zone.zone_name })),
            ]}
            searchable
          />
        </Field>

        <Field label="Cancel/Return Reason">
          <TextInput value={filters.cancelReason} onChange={set("cancelReason")} placeholder="Return reason" />
        </Field>

        <Field label="Email Status" info="Customer account এ email আছে কিনা (phone দিয়ে মিলানো)">
          <Select
            value={filters.emailStatus}
            onChange={set("emailStatus")}
            options={[
              { value: "", label: "Any" },
              { value: "has_email", label: "Has Email" },
              { value: "no_email", label: "No Email" },
            ]}
          />
        </Field>

        <Field label="BD Mobile Number" info="Valid: 01XXXXXXXXX (11 digit)">
          <Select
            value={filters.bdMobile}
            onChange={set("bdMobile")}
            options={[
              { value: "", label: "All" },
              { value: "valid", label: "Valid" },
              { value: "invalid", label: "Invalid" },
            ]}
          />
        </Field>

        <Field
          label="UTM Source"
          aside={<Check label="Exclude" checked={filters.utmSourceExclude} onChange={set("utmSourceExclude")} />}
        >
          <MultiSelect values={filters.utmSource} onChange={set("utmSource")} options={UTM_SOURCE_OPTIONS} placeholder="Any" />
        </Field>

        <Field label="Product Amount Min">
          <TextInput type="number" value={filters.amountMin} onChange={set("amountMin")} />
        </Field>

        <Field label="Product Amount Max">
          <TextInput type="number" value={filters.amountMax} onChange={set("amountMax")} />
        </Field>

        <Field label="Order Items">
          <CompareInput
            metric={filters.itemsMetric}
            onMetricChange={set("itemsMetric")}
            metricOptions={[
              { value: "quantity", label: "Total Quantity" },
              { value: "products", label: "Total Products" },
            ]}
            value={filters.itemsValue}
            onValueChange={set("itemsValue")}
            op={filters.itemsOp}
            onOpChange={set("itemsOp")}
          />
        </Field>

        <Field label="URL/UTM">
          <TextInput value={filters.urlUtm} onChange={set("urlUtm")} placeholder="fbclid / gclid / landing page" />
        </Field>

        <Field label="Reference ID" info="Courier consignment ID / tracking code">
          <TextInput value={filters.referenceId} onChange={set("referenceId")} />
        </Field>

        <Field label="Discount Amount">
          <div className="grid grid-cols-[1fr_150px]">
            <TextInput
              type="number"
              value={filters.discountValue}
              onChange={set("discountValue")}
              className="rounded-r-none"
            />
            <Select
              value={filters.discountOp}
              onChange={set("discountOp")}
              options={COMPARE_OPTIONS}
              className="rounded-l-none border-l-0"
            />
          </div>
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-8 items-center gap-1 rounded border border-gray-200 bg-white px-3 text-xs text-gray-700 transition hover:bg-gray-50"
        >
          <X size={13} />
          Clear Filter
        </button>
        {ORDER_REPORTS.map((report) => (
          <button
            key={report.type}
            type="button"
            onClick={() => onReport(report.type)}
            className={`inline-flex h-8 items-center rounded px-3 text-xs font-medium text-white shadow-sm transition hover:brightness-95 ${report.color}`}
          >
            {report.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onReport("export")}
          disabled={exporting}
          className="inline-flex h-8 items-center gap-1 rounded bg-teal-600 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          Export
        </button>
        <button
          type="button"
          onClick={onApply}
          className="ml-auto inline-flex h-9 items-center gap-1 rounded-lg bg-blue-600 px-4 text-xs font-medium text-white transition hover:bg-blue-700"
        >
          <Search size={13} />
          Apply Filter
        </button>
      </div>
    </div>
  );
}

const YES_NO_OPTIONS = [
  { value: "", label: "All" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const CONTROL_CLASS =
  "h-9 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400";

function Field({ label, info, aside, below, children }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
          {label}
          {info && (
            <span title={info} className="text-gray-400">
              <Info size={11} />
            </span>
          )}
        </label>
        {aside}
      </div>
      {children}
      {below && <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">{below}</div>}
    </div>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-gray-500">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}

function TextInput({ value, onChange, type = "text", placeholder, className = "" }) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`${CONTROL_CLASS} ${className}`}
    />
  );
}

function CompareInput({ metric, onMetricChange, metricOptions, value, onValueChange, op, onOpChange }) {
  return (
    <div className="grid grid-cols-[1.1fr_0.8fr_1.1fr]">
      <Select value={metric} onChange={onMetricChange} options={metricOptions} className="rounded-r-none" />
      <TextInput
        type="number"
        value={value}
        onChange={onValueChange}
        className="rounded-none border-l-0 px-2"
      />
      <Select value={op} onChange={onOpChange} options={COMPARE_OPTIONS} className="rounded-l-none border-l-0" />
    </div>
  );
}

function useOutsideClose(open, setOpen) {
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, setOpen]);
  return rootRef;
}

function Select({ value, onChange, options, disabled = false, searchable = false, className = "" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useOutsideClose(open, setOpen);
  const selected = options.find((option) => String(option.value) === String(value)) || options[0];
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => String(option.label).toLowerCase().includes(term));
  }, [options, query]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`${CONTROL_CLASS} flex items-center justify-between gap-2 text-left ${className}`}
      >
        <span className="min-w-0 truncate">{selected?.label || "Select"}</span>
        <ChevronDown size={14} className={`flex-shrink-0 text-gray-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 w-full min-w-[160px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {searchable && (
            <div className="border-b border-gray-100 p-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
                placeholder="Search..."
                className="h-8 w-full rounded border border-gray-200 px-2 text-xs text-gray-700 outline-none focus:border-blue-400"
              />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setQuery("");
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-xs ${
                  String(option.value) === String(value)
                    ? "bg-blue-600 font-semibold text-white"
                    : "text-gray-700 hover:bg-blue-50"
                }`}
              >
                {option.label}
              </button>
            ))}
            {filtered.length === 0 && <div className="px-3 py-3 text-xs text-gray-400">No option found</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// Multi-value picker. With onSearch, options come from the server as the user types.
function MultiSelect({ values, onChange, options, onSearch, placeholder = "" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState({ term: null, options: [] });
  const rootRef = useOutsideClose(open, setOpen);

  const term = query.trim();
  useEffect(() => {
    if (!onSearch || !open) return undefined;
    let active = true;
    // An empty term loads the first page, so options show as soon as the list opens.
    const timer = window.setTimeout(() => {
      onSearch(term)
        .then((result) => active && setRemote({ term, options: result }))
        .catch(() => active && setRemote({ term, options: [] }));
    }, term ? 300 : 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [onSearch, open, term]);
  const searching = Boolean(onSearch && open && remote.term !== term);

  const labelFor = (value) =>
    options.find((option) => String(option.value) === String(value))?.label || value;

  const choices = useMemo(() => {
    const needle = term.toLowerCase();
    const remoteOptions = remote.term === term ? remote.options : [];
    const source = onSearch ? remoteOptions : options;
    return source.filter(
      (option) =>
        !values.includes(String(option.value)) &&
        (onSearch || !needle || String(option.label).toLowerCase().includes(needle)),
    );
  }, [onSearch, options, term, remote, values]);

  function add(option) {
    onChange([...values, String(option.value)], [option]);
    setQuery("");
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <div
        onClick={() => setOpen(true)}
        className="flex min-h-9 w-full cursor-text flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
      >
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex max-w-full items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-700"
          >
            <span className="truncate">{labelFor(value)}</span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange(values.filter((item) => item !== value));
              }}
              className="text-blue-400 hover:text-blue-700"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !query && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          placeholder={values.length ? "" : placeholder}
          className="h-6 min-w-[60px] flex-1 border-0 bg-transparent p-0 text-xs text-gray-600 outline-none focus:ring-0"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {searching && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
              <Loader2 size={12} className="animate-spin" /> Searching...
            </div>
          )}
          {choices.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => add(option)}
              className="block w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50"
            >
              {option.label}
            </button>
          ))}
          {!searching && choices.length === 0 && (
            <div className="px-3 py-3 text-xs text-gray-400">
              No option found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
