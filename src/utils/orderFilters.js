export const ORDER_SOURCE_OPTIONS = [
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

// Same tags as the Create/Edit order form.
export const ORDER_TAG_OPTIONS = ["up sale", "cross sale", "regular sale", "push sale"];

// Staff roles from the backend ENUM_USER_ROLE (customers excluded).
export const TEAM_ROLES = [
  "superAdmin",
  "admin",
  "marketer",
  "leader",
  "inventor",
  "accountant",
  "logistics",
  "up",
  "cs",
  "staff",
  "employee",
];

// Storefront checkout district list.
export const BD_DISTRICTS = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogura",
  "Brahmanbaria",
  "Chandpur",
  "Chapai Nawabganj",
  "Chattogram",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dhaka",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokati",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
];

// Report buttons in the filter panel; types match the backend /orders/report/:type.
export const ORDER_REPORTS = [
  { type: "order_items", label: "Order Items", color: "bg-teal-600" },
  { type: "items_status", label: "Items Status Wise", color: "bg-teal-600" },
  { type: "order_sources", label: "Order Sources", color: "bg-teal-600" },
  { type: "duplicate_orders", label: "Duplicate Orders", color: "bg-red-500" },
  { type: "orders_employee", label: "Orders Employee", color: "bg-red-500" },
  { type: "order_source_website", label: "Order Source Website", color: "bg-teal-600" },
  { type: "utm_sources", label: "UTM Sources", color: "bg-teal-600" },
  { type: "campaign_ids", label: "Campaign IDs", color: "bg-teal-600" },
  { type: "order_previous_status", label: "Order Previous Status", color: "bg-red-500" },
  { type: "orders_by_locations", label: "Orders by Locations", color: "bg-amber-500" },
  { type: "orders_by_amount", label: "Orders by Amount", color: "bg-green-600" },
  { type: "courier_statuses", label: "Courier Statuses", color: "bg-slate-600" },
  { type: "failed_last_event", label: "Failed Order Last Event", color: "bg-teal-600" },
  { type: "cancel_return_reason", label: "Cancel/Return Reason", color: "bg-red-500" },
];

export const EMPTY_ORDER_FILTERS = {
  employeeAction: "assigned",
  team: "",
  orderSource: [],
  orderSourceExclude: false,
  orderTag: [],
  customerTag: "",
  customerType: "",
  courier: [],
  courierExclude: false,
  courierStatus: [],
  courierStatusExclude: false,
  performanceMetric: "successRate",
  performanceValue: "",
  performanceOp: "gte",
  courierCharged: "",
  deliveryCharge: "",
  codChanged: "",
  category: [],
  categoryExclude: false,
  categoryOnly: false,
  product: [],
  productExclude: false,
  productOnly: false,
  includeReturns: false,
  district: [],
  districtExclude: false,
  paymentStatus: [],
  orderType: "",
  stockAvailability: "",
  website: "",
  printStatus: "",
  printDate: "",
  courierMark: "",
  pathaoCity: "",
  pathaoZone: "",
  cancelReason: "",
  bdMobile: "",
  emailStatus: "",
  utmSource: [],
  utmSourceExclude: false,
  amountMin: "",
  amountMax: "",
  itemsMetric: "quantity",
  itemsValue: "",
  itemsOp: "gte",
  urlUtm: "",
  referenceId: "",
  discountValue: "",
  discountOp: "gte",
};

// Values that only qualify another filter; they don't count as an active filter on their own.
const MODIFIER_KEYS = new Set([
  "employeeAction",
  "performanceMetric",
  "performanceOp",
  "itemsMetric",
  "itemsOp",
  "discountOp",
]);

// Turns panel state into API query params (arrays joined, unset values dropped).
export function toOrderFilterParams(filters = {}) {
  return Object.entries(filters).reduce((params, [key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) params[key] = value.join(",");
    } else if (typeof value === "boolean") {
      if (value) params[key] = "1";
    } else if (value !== "" && value !== null && value !== undefined) {
      params[key] = value;
    }
    return params;
  }, {});
}

export function countActiveOrderFilters(filters = {}) {
  return Object.entries(toOrderFilterParams(filters)).filter(
    ([key, value]) =>
      !MODIFIER_KEYS.has(key) &&
      !key.endsWith("Exclude") &&
      !key.endsWith("Only") &&
      key !== "includeReturns" &&
      value !== EMPTY_ORDER_FILTERS[key],
  ).length;
}
