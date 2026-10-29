import { useEffect, useMemo, useState } from "react";
import "./index.css";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import { useOrderStatusCounts } from "./hooks/useOrders";
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";
import Dashboard from "./components/Dashboard";
import OrdersPage from "./pages/OrdersPage";
import CreateOrderPage from "./pages/CreateOrderPage";
import InvoicePage from "./pages/InvoicePage";
import EditOrderPage from "./pages/EditOrderPage";
import ProductManagePage from "./pages/products/ProductManagePage";
import CategoriesPage from "./pages/products/CategoriesPage";
import SubcategoriesPage from "./pages/products/SubcategoriesPage";
import ChildCategoriesPage from "./pages/products/ChildCategoriesPage";
import BrandsPage from "./pages/products/BrandsPage";
import ColorsPage from "./pages/products/ColorsPage";
import AttributePage from "./pages/products/AttributePage";
import AttributeFormPage from "./pages/products/AttributeFormPage";
import BarcodePage from "./pages/products/BarcodePage";
import ReviewsPage from "./pages/products/ReviewsPage";
import ReviewFormPage from "./pages/products/ReviewFormPage";
import ComboOfferPage from "./pages/products/ComboOfferPage";
import ProductCreatePage from "./pages/products/ProductCreatePage";
import ProductEditPage from "./pages/products/ProductEditPage";
import CategoryCreatePage from "./pages/products/CategoryCreatePage";
import CategoryEditPage from "./pages/products/CategoryEditPage";
import SubcategoryCreatePage from "./pages/products/SubcategoryCreatePage";
import SubcategoryEditPage from "./pages/products/SubcategoryEditPage";
import ChildcategoryCreatePage from "./pages/products/ChildcategoryCreatePage";
import ChildcategoryEditPage from "./pages/products/ChildcategoryEditPage";
import BrandCreatePage from "./pages/products/BrandCreatePage";
import BrandEditPage from "./pages/products/BrandEditPage";
import ColorCreatePage from "./pages/products/ColorCreatePage";
import ColorEditPage from "./pages/products/ColorEditPage";
import PurchaseListPage from "./pages/purchase/PurchaseListPage";
import PurchaseFormPage from "./pages/purchase/PurchaseFormPage";
import SupplierListPage from "./pages/supplier/SupplierListPage";
import SupplierFormPage from "./pages/supplier/SupplierFormPage";
import PaymentAddPage from "./pages/supplier/PaymentAddPage";
import PaymentListPage from "./pages/supplier/PaymentListPage";
import { useSupplierAllList } from "./hooks/useSuppliers";
import AdminUserPage from "./pages/admin/AdminUserPage";
import AdminUserEditPage from "./pages/admin/AdminUserEditPage";
import AdminRolesPage from "./pages/admin/AdminRolesPage";
import AdminRoleEditPage from "./pages/admin/AdminRoleEditPage";
import AdminPermissionsPage from "./pages/admin/AdminPermissionsPage";
import CustomerListPage from "./pages/customers/CustomerListPage";
import CustomerEditPage from "./pages/customers/CustomerEditPage";
import CustomerViewPage from "./pages/customers/CustomerViewPage";
import CustomerLoginAsPage from "./pages/customers/CustomerLoginAsPage";
import CustomerIpBlockPage from "./pages/customers/CustomerIpBlockPage";
import LandingPageListPage from "./pages/landing/LandingPageListPage";
import LandingPageFormPage from "./pages/landing/LandingPageFormPage";
import LandingPageViewPage from "./pages/landing/LandingPageViewPage";
import { landingPageService } from "./services/landingPageService";
import WebsiteGeneralSettingPage from "./pages/website/WebsiteGeneralSettingPage";
import WebsiteOrderBlockPage from "./pages/website/WebsiteOrderBlockPage";
import WebsiteFooterPage from "./pages/website/WebsiteFooterPage";
import WebsiteRewardPage from "./pages/website/WebsiteRewardPage";
import WebsiteSocialMediaPage from "./pages/website/WebsiteSocialMediaPage";
import WebsiteContactPage from "./pages/website/WebsiteContactPage";
import WebsiteDeliveryAreaPage from "./pages/website/WebsiteDeliveryAreaPage";
import WebsiteDeliveryAreaEditPage from "./pages/website/WebsiteDeliveryAreaEditPage";
import WebsiteOrderStatusPage from "./pages/website/WebsiteOrderStatusPage";
import WebsiteOrderStatusEditPage from "./pages/website/WebsiteOrderStatusEditPage";
import WebsitePageManagePage from "./pages/website/WebsitePageManagePage";
import WebsitePageEditPage from "./pages/website/WebsitePageEditPage";
import CourierApiPage from "./pages/api/CourierApiPage";
import PaymentGatewayPage from "./pages/api/PaymentGatewayPage";
import SmsGatewayPage from "./pages/api/SmsGatewayPage";
import FraudCheckerApiPage from "./pages/api/FraudCheckerApiPage";
import TagManagerPage from "./pages/marketing/TagManagerPage";
import TagManagerFormPage from "./pages/marketing/TagManagerFormPage";
import FacebookPixelsPage from "./pages/marketing/FacebookPixelsPage";
import FacebookPixelsFormPage from "./pages/marketing/FacebookPixelsFormPage";
import TiktokPixelsPage from "./pages/marketing/TiktokPixelsPage";
import TiktokPixelFormPage from "./pages/marketing/TiktokPixelFormPage";
import GoogleAdsPage from "./pages/marketing/GoogleAdsPage";
import GoogleAdsFormPage from "./pages/marketing/GoogleAdsFormPage";
import CouponCodePage from "./pages/marketing/CouponCodePage";
import CouponCodeFormPage from "./pages/marketing/CouponCodeFormPage";
import SmsMarketingPage from "./pages/marketing/SmsMarketingPage";
import FacebookCataloguePage from "./pages/marketing/FacebookCataloguePage";
import VisitorReportsPage from "./pages/marketing/VisitorReportsPage";
import BlogPage from "./pages/blogs/BlogPage";
import BlogFormPage from "./pages/blogs/BlogFormPage";
import BannerCategoryPage from "./pages/banner/BannerCategoryPage";
import BannerCategoryFormPage from "./pages/banner/BannerCategoryFormPage";
import BannerAdsPage from "./pages/banner/BannerAdsPage";
import BannerAdsFormPage from "./pages/banner/BannerAdsFormPage";
import {
  bannerAdsService,
  bannerCategoryService,
} from "./services/bannerService";
import ExpenseCategoryPage from "./pages/expense/ExpenseCategoryPage";
import ExpenseCategoryFormPage from "./pages/expense/ExpenseCategoryFormPage";
import ExpensePage from "./pages/expense/ExpensePage";
import ExpenseFormPage from "./pages/expense/ExpenseFormPage";
import ReportsPage from "./pages/reports/ReportsPage";
import { expenseService } from "./services/reportService";
import { orderService } from "./services/orderService";
import { productService } from "./services/productService";
import { siteSettingService } from "./services/websiteService";
import {
  applyDocumentFavicon,
  applyDocumentTitle,
  getFavicon,
  getSiteName,
  normalizeSettingData,
} from "./utils/siteBranding";
import { imageUrl } from "./utils/assetUrl";
import {
  getPermissionSet,
  isNavigationAllowed,
  normalizeNavigationForPermissions,
} from "./utils/permissions";

function getDirectLandingPageId() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const queryId = params.get("landingPageId");
  if (queryId) return queryId;
  const match = window.location.pathname.match(/^\/landing-page\/([^/]+)$/);
  return match?.[1] || "";
}

const DASHBOARD_NAV_STORAGE_KEY = "holydeen-dashboard:navigation";

const DEFAULT_NAVIGATION = {
  activePage: "dashboard",
  activeOrderStatus: "all",
  activeProductPage: "product_manage",
  activeSupplierPage: "supplier_list",
  activePurchasePage: "purchase_list",
  activeLandingPage: "landing_manage",
  activeAdminPage: "admin_user",
  activeCustomersPage: "customer_list",
  activeWebsitePage: "general_setting",
  activeApiPage: "courier_api",
  activeMarketingPage: "tag_manager",
  activeBlogsPage: "blog",
  activeBannerPage: "banner_category",
  activeExpensePage: "expense_categories",
  activeReportsPage: "stock_report",
};

const PERSISTABLE_PAGES = new Set([
  "dashboard",
  "orders",
  "create_order",
  "pos",
  "products",
  "create_product",
  "create_category",
  "create_subcategory",
  "create_childcategory",
  "create_brand",
  "create_color",
  "create_attribute",
  "create_review",
  "supplier",
  "purchase",
  "landing",
  "admin",
  "customers",
  "website",
  "api",
  "marketing",
  "blogs",
  "banner",
  "expense",
  "reports",
]);

const TRANSIENT_PAGE_FALLBACKS = {
  invoice: { activePage: "orders", activeOrderStatus: "all" },
  edit_order: { activePage: "orders", activeOrderStatus: "all" },
  edit_product: { activePage: "products", activeProductPage: "product_manage" },
  edit_category: { activePage: "products", activeProductPage: "categories" },
  edit_subcategory: {
    activePage: "products",
    activeProductPage: "subcategories",
  },
  edit_childcategory: {
    activePage: "products",
    activeProductPage: "childcategories",
  },
  edit_brand: { activePage: "products", activeProductPage: "brands" },
  edit_color: { activePage: "products", activeProductPage: "colors" },
  edit_attribute: { activePage: "products", activeProductPage: "attribute" },
  edit_review: { activePage: "products", activeProductPage: "reviews" },
};

const TRANSIENT_SUBPAGE_FALLBACKS = {
  activeSupplierPage: {
    supplier_edit: "supplier_list",
    payment_edit: "payment_list",
  },
  activePurchasePage: {
    purchase_edit: "purchase_list",
  },
  activeLandingPage: {
    landing_edit: "landing_manage",
    landing_view: "landing_manage",
  },
  activeAdminPage: {
    admin_user_edit: "admin_user",
    admin_role_edit: "admin_roles",
  },
  activeCustomersPage: {
    customer_edit: "customer_list",
    customer_view: "customer_list",
    customer_login_as: "customer_list",
  },
  activeMarketingPage: {
    tag_manager_edit: "tag_manager",
    facebook_pixels_edit: "facebook_pixels",
    tiktok_pixels_edit: "tiktok_pixels",
    google_ads_edit: "google_ads",
    coupon_code_edit: "coupon_code",
  },
  activeBlogsPage: {
    blog_edit: "blog",
  },
  activeBannerPage: {
    banner_category_edit: "banner_category",
    banner_ads_edit: "banner_ads",
  },
  activeExpensePage: {
    expense_category_edit: "expense_categories",
    expense_edit: "expense",
  },
};

const PRODUCT_CREATE_ROUTES = {
  create_product: "/products/create",
  create_category: "/products/categories/create",
  create_subcategory: "/products/subcategories/create",
  create_childcategory: "/products/childcategories/create",
  create_brand: "/products/brands/create",
  create_color: "/products/colors/create",
  create_attribute: "/products/attribute/create",
  create_review: "/products/reviews/create",
};

const PRODUCT_CREATE_ROUTE_PAGES = Object.fromEntries(
  Object.entries(PRODUCT_CREATE_ROUTES).map(([page, route]) => [route, page]),
);

const NAVIGATION_ROUTE_GROUPS = {
  products: {
    activePage: "products",
    stateKey: "activeProductPage",
    basePath: "/products",
    defaultKey: "product_manage",
    routes: {
      product_manage: "manage",
      categories: "categories",
      subcategories: "subcategories",
      childcategories: "childcategories",
      brands: "brands",
      colors: "colors",
      attribute: "attribute",
      barcode: "barcode",
      reviews: "reviews",
      combo_offer: "combo-offer",
    },
  },
  supplier: {
    activePage: "supplier",
    stateKey: "activeSupplierPage",
    basePath: "/supplier",
    defaultKey: "supplier_list",
    routes: {
      supplier_list: "list",
      supplier_add: "create",
      payment_list: "payment-list",
      payment_add: "payment-add",
    },
  },
  purchase: {
    activePage: "purchase",
    stateKey: "activePurchasePage",
    basePath: "/purchase",
    defaultKey: "purchase_list",
    routes: {
      purchase_list: "list",
      purchase_add: "add",
    },
  },
  landing: {
    activePage: "landing",
    stateKey: "activeLandingPage",
    basePath: "/landing",
    defaultKey: "landing_manage",
    routes: {
      landing_create: "create",
      landing_manage: "manage",
    },
  },
  admin: {
    activePage: "admin",
    stateKey: "activeAdminPage",
    basePath: "/admin",
    defaultKey: "admin_user",
    routes: {
      admin_user: "users",
      admin_roles: "roles",
      admin_permissions: "permissions",
    },
  },
  customers: {
    activePage: "customers",
    stateKey: "activeCustomersPage",
    basePath: "/customers",
    defaultKey: "customer_list",
    routes: {
      customer_list: "list",
      ip_block: "ip-block",
    },
  },
  website: {
    activePage: "website",
    stateKey: "activeWebsitePage",
    basePath: "/website",
    defaultKey: "general_setting",
    routes: {
      general_setting: "general-setting",
      order_block: "order-block",
      website_footer: "footer",
      customer_reward: "customer-reward",
      social_media: "social-media",
      contact: "contact",
      delivery_area: "delivery-area",
      order_status: "order-status",
      create_page: "pages",
    },
  },
  api: {
    activePage: "api",
    stateKey: "activeApiPage",
    basePath: "/api",
    defaultKey: "courier_api",
    routes: {
      courier_api: "courier",
      payment_gateway: "payment-gateway",
      sms_gateway: "sms-gateway",
      fraud_checker_api: "fraud-checker",
    },
  },
  marketing: {
    activePage: "marketing",
    stateKey: "activeMarketingPage",
    basePath: "/marketing",
    defaultKey: "tag_manager",
    routes: {
      tag_manager: "tag-manager",
      tag_manager_create: "tag-manager/create",
      facebook_pixels: "facebook-pixels",
      facebook_pixels_create: "facebook-pixels/create",
      tiktok_pixels: "tiktok-pixels",
      tiktok_pixels_create: "tiktok-pixels/create",
      google_ads: "google-ads",
      google_ads_create: "google-ads/create",
      coupon_code: "coupon-code",
      coupon_code_create: "coupon-code/create",
      sms_marketing: "sms-marketing",
      facebook_catalogue: "facebook-catalogue",
      visitor_reports: "visitor-reports",
    },
  },
  blogs: {
    activePage: "blogs",
    stateKey: "activeBlogsPage",
    basePath: "/blogs",
    defaultKey: "blog",
    routes: {
      blog: "",
      blog_create: "create",
    },
  },
  banner: {
    activePage: "banner",
    stateKey: "activeBannerPage",
    basePath: "/banner",
    defaultKey: "banner_category",
    routes: {
      banner_category: "category",
      banner_category_create: "category/create",
      banner_ads: "ads",
      banner_ads_create: "ads/create",
    },
  },
  expense: {
    activePage: "expense",
    stateKey: "activeExpensePage",
    basePath: "/expense",
    defaultKey: "expense_categories",
    routes: {
      expense_categories: "categories",
      expense_category_create: "categories/create",
      expense: "list",
      expense_create: "create",
    },
  },
  reports: {
    activePage: "reports",
    stateKey: "activeReportsPage",
    basePath: "/reports",
    defaultKey: "stock_report",
    routes: {
      stock_report: "stock",
      stock_alert_report: "stock-alert",
      purchase_report: "purchase",
      order_reports: "orders",
      sales_reports: "sales",
      expense_reports: "expense",
      loss_profit: "loss-profit",
    },
  },
};

const GROUPS_BY_BASE_SEGMENT = Object.values(NAVIGATION_ROUTE_GROUPS).reduce(
  (acc, group) => {
    acc[group.basePath.replace(/^\//, "")] = group;
    return acc;
  },
  {},
);

function normalizeRoutePath(pathname = "") {
  const path = `/${String(pathname).split("?")[0].split("#")[0]}`
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "");
  return path === "" ? "/" : path;
}

function segmentToKey(segment = "") {
  return decodeURIComponent(segment).replace(/-/g, "_");
}

function keyToSegment(key = "") {
  return encodeURIComponent(String(key).replace(/_/g, "-"));
}

function getRouteKeyFromGroup(group, pathTail) {
  const normalizedTail = pathTail.replace(/^\//, "").replace(/\/$/, "");
  const found = Object.entries(group.routes).find(
    ([, segment]) => segment === normalizedTail,
  );
  return found?.[0] || group.defaultKey;
}

function getNavigationStateFromPath(pathname) {
  const path = normalizeRoutePath(pathname);
  if (path === "/" || path === "/dashboard") return DEFAULT_NAVIGATION;
  if (PRODUCT_CREATE_ROUTE_PAGES[path]) {
    return normalizeNavigationState({
      activePage: PRODUCT_CREATE_ROUTE_PAGES[path],
    });
  }
  if (path === "/orders/create") {
    return normalizeNavigationState({ activePage: "create_order" });
  }
  if (path === "/pos") {
    return normalizeNavigationState({ activePage: "pos" });
  }
  if (path === "/orders") {
    return normalizeNavigationState({
      activePage: "orders",
      activeOrderStatus: "all",
    });
  }
  if (path.startsWith("/orders/")) {
    const status = segmentToKey(path.replace(/^\/orders\//, "")) || "all";
    return normalizeNavigationState({
      activePage: "orders",
      activeOrderStatus: status,
    });
  }

  const [, baseSegment, ...rest] = path.split("/");
  const group = GROUPS_BY_BASE_SEGMENT[baseSegment];
  if (!group) return null;
  const routeKey = getRouteKeyFromGroup(group, rest.join("/"));
  return normalizeNavigationState({
    activePage: group.activePage,
    [group.stateKey]: routeKey,
  });
}

function getPathFromNavigationState(state = {}) {
  const nav = normalizeNavigationState(state);
  if (PRODUCT_CREATE_ROUTES[nav.activePage])
    return PRODUCT_CREATE_ROUTES[nav.activePage];
  if (nav.activePage === "dashboard") return "/";
  if (nav.activePage === "create_order") return "/orders/create";
  if (nav.activePage === "pos") return "/pos";
  if (nav.activePage === "orders") {
    return nav.activeOrderStatus && nav.activeOrderStatus !== "all"
      ? `/orders/${keyToSegment(nav.activeOrderStatus)}`
      : "/orders";
  }

  const group = Object.values(NAVIGATION_ROUTE_GROUPS).find(
    (item) => item.activePage === nav.activePage,
  );
  if (!group) return "/";
  const segment =
    group.routes[nav[group.stateKey]] ?? group.routes[group.defaultKey] ?? "";
  return segment ? `${group.basePath}/${segment}` : group.basePath;
}

function normalizeNavigationState(state = {}) {
  const fallback = TRANSIENT_PAGE_FALLBACKS[state.activePage] || {};
  const next = { ...DEFAULT_NAVIGATION, ...state, ...fallback };
  if (!PERSISTABLE_PAGES.has(next.activePage)) {
    next.activePage = DEFAULT_NAVIGATION.activePage;
  }
  Object.entries(TRANSIENT_SUBPAGE_FALLBACKS).forEach(([key, values]) => {
    if (values[next[key]]) next[key] = values[next[key]];
  });
  return next;
}

function getHashNavigationState() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  return getNavigationStateFromHash(hash);
}

function getNavigationStateFromHash(hash) {
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  if (!params.has("page")) return null;

  return normalizeNavigationState({
    activePage: params.get("page") || DEFAULT_NAVIGATION.activePage,
    activeOrderStatus:
      params.get("orderStatus") || DEFAULT_NAVIGATION.activeOrderStatus,
    activeProductPage:
      params.get("productPage") || DEFAULT_NAVIGATION.activeProductPage,
    activeSupplierPage:
      params.get("supplierPage") || DEFAULT_NAVIGATION.activeSupplierPage,
    activePurchasePage:
      params.get("purchasePage") || DEFAULT_NAVIGATION.activePurchasePage,
    activeLandingPage:
      params.get("landingPage") || DEFAULT_NAVIGATION.activeLandingPage,
    activeAdminPage:
      params.get("adminPage") || DEFAULT_NAVIGATION.activeAdminPage,
    activeCustomersPage:
      params.get("customersPage") || DEFAULT_NAVIGATION.activeCustomersPage,
    activeWebsitePage:
      params.get("websitePage") || DEFAULT_NAVIGATION.activeWebsitePage,
    activeApiPage: params.get("apiPage") || DEFAULT_NAVIGATION.activeApiPage,
    activeMarketingPage:
      params.get("marketingPage") || DEFAULT_NAVIGATION.activeMarketingPage,
    activeBlogsPage:
      params.get("blogsPage") || DEFAULT_NAVIGATION.activeBlogsPage,
    activeBannerPage:
      params.get("bannerPage") || DEFAULT_NAVIGATION.activeBannerPage,
    activeExpensePage:
      params.get("expensePage") || DEFAULT_NAVIGATION.activeExpensePage,
    activeReportsPage:
      params.get("reportsPage") || DEFAULT_NAVIGATION.activeReportsPage,
  });
}

function getNavigationStateFromUrl(url) {
  if (!url || typeof window === "undefined") return null;
  try {
    const value = String(url);
    if (value.startsWith("/#"))
      return getNavigationStateFromHash(value.slice(2));
    if (value.startsWith("#"))
      return getNavigationStateFromHash(value.slice(1));
    const parsed = new URL(value, window.location.origin);
    if (parsed.origin !== window.location.origin) return null;
    return (
      getNavigationStateFromPath(parsed.pathname) ||
      getNavigationStateFromHash(parsed.hash.replace(/^#/, ""))
    );
  } catch {
    return null;
  }
}

function getStoredNavigationState() {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(
      localStorage.getItem(DASHBOARD_NAV_STORAGE_KEY) || "null",
    );
    return parsed ? normalizeNavigationState(parsed) : null;
  } catch {
    return null;
  }
}

// The product edit page keeps its product id in the URL (/products/edit/:id) so a
// reload reopens the same product instead of falling back to Product Manage.
function getEditProductIdFromPath(pathname = window.location.pathname) {
  const match = /^\/products\/edit\/(\d+)$/.exec(normalizeRoutePath(pathname));
  return match ? Number(match[1]) : null;
}

function getInitialNavigationState() {
  if (getDirectLandingPageId()) return DEFAULT_NAVIGATION;
  if (getEditProductIdFromPath()) {
    return {
      ...DEFAULT_NAVIGATION,
      activePage: "edit_product",
      activeProductPage: "product_manage",
    };
  }
  return (
    getNavigationStateFromPath(window.location.pathname) ||
    getHashNavigationState() ||
    getStoredNavigationState() ||
    DEFAULT_NAVIGATION
  );
}

function writeNavigationState(state, { editProductId } = {}) {
  if (typeof window === "undefined" || getDirectLandingPageId()) return;
  const normalized = normalizeNavigationState(state);
  try {
    localStorage.setItem(DASHBOARD_NAV_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore storage failures.
  }

  const nextPath =
    state.activePage === "edit_product" && editProductId
      ? `/products/edit/${editProductId}`
      : getPathFromNavigationState(normalized);
  const currentPath = normalizeRoutePath(window.location.pathname);
  if (nextPath && currentPath !== nextPath) {
    window.history.pushState({ navigation: normalized }, "", nextPath);
  }
}

function normalizeBannerCategory(item) {
  return {
    id: item.Id ?? item.id,
    name: item.name ?? "",
    status: item.status === true || item.status === "Active",
    sortOrder: item.sortOrder ?? null,
  };
}

function normalizeBanner(item) {
  const category =
    item.category?.name || item.categoryName || item.category || "";
  const rawImageName =
    item.file ??
    item.imageName ??
    item.image ??
    item.imageUrl ??
    item.bannerImageUrl ??
    "";
  const rawImageSrc =
    item.imageUrl ??
    item.bannerImageUrl ??
    item.image ??
    item.file ??
    item.imageName ??
    "";
  const imageName = String(rawImageName || "");
  const imageSrc = String(rawImageSrc || "");
  return {
    id: item.Id ?? item.id,
    link: item.linkUrl ?? item.link ?? "",
    categoryId: item.categoryId ?? item.category?.Id ?? "",
    category,
    imageName,
    imageSrc: imageUrl(imageSrc),
    isDynamic: Boolean(imageSrc),
    imageText: item.alt ?? item.imageText ?? category,
    imageColor: item.imageColor ?? "linear-gradient(135deg, #94a3b8, #475569)",
    status: item.status === true || item.status === "Active",
    sortOrder: item.sortOrder ?? null,
  };
}

async function fetchBannerState() {
  const [categoryRes, bannerRes] = await Promise.all([
    bannerCategoryService.getAll({
      limit: 100,
      sortBy: "sortOrder",
      sortOrder: "ASC",
    }),
    bannerAdsService.getAll({
      limit: 100,
      sortBy: "sortOrder",
      sortOrder: "ASC",
    }),
  ]);

  return {
    categories: (categoryRes.data || []).map(normalizeBannerCategory),
    banners: (bannerRes.data || []).map(normalizeBanner),
  };
}

function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const directLandingPageId = getDirectLandingPageId();
  const initialNavigation = getInitialNavigationState();

  // All hooks must be called unconditionally (Rules of Hooks).
  // They silently return empty data when there is no auth token.
  const { counts: orderCounts, refetch: refetchOrderCounts } =
    useOrderStatusCounts(isAuthenticated);
  const [activePage, setActivePage] = useState(initialNavigation.activePage);
  const [activeOrderStatus, setActiveOrderStatus] = useState(
    initialNavigation.activeOrderStatus,
  );
  const [activeProductPage, setActiveProductPage] = useState(
    initialNavigation.activeProductPage,
  );
  const [activeSupplierPage, setActiveSupplierPage] = useState(
    initialNavigation.activeSupplierPage,
  );
  const [activePurchasePage, setActivePurchasePage] = useState(
    initialNavigation.activePurchasePage,
  );
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [activeLandingPage, setActiveLandingPage] = useState(
    initialNavigation.activeLandingPage,
  );
  const [activeAdminPage, setActiveAdminPage] = useState(
    initialNavigation.activeAdminPage,
  );
  const [activeCustomersPage, setActiveCustomersPage] = useState(
    initialNavigation.activeCustomersPage,
  );
  const [activeWebsitePage, setActiveWebsitePage] = useState(
    initialNavigation.activeWebsitePage,
  );
  const [activeApiPage, setActiveApiPage] = useState(
    initialNavigation.activeApiPage,
  );
  const [activeMarketingPage, setActiveMarketingPage] = useState(
    initialNavigation.activeMarketingPage,
  );
  const [activeBlogsPage, setActiveBlogsPage] = useState(
    initialNavigation.activeBlogsPage,
  );
  const [activeBannerPage, setActiveBannerPage] = useState(
    initialNavigation.activeBannerPage,
  );
  const [activeExpensePage, setActiveExpensePage] = useState(
    initialNavigation.activeExpensePage,
  );
  const [activeReportsPage, setActiveReportsPage] = useState(
    initialNavigation.activeReportsPage,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);
  const { data: suppliers } = useSupplierAllList();
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  // Create Order stays open after saving: a new run resets the form, the notice shows the result.
  const [createOrderRun, setCreateOrderRun] = useState(0);
  const [createOrderNotice, setCreateOrderNotice] = useState(null);
  const [invoiceAutoPrint, setInvoiceAutoPrint] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedChildcategory, setSelectedChildcategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedDeliveryArea, setSelectedDeliveryArea] = useState(null);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [tagManagers, setTagManagers] = useState([]);
  const [selectedTagManager, setSelectedTagManager] = useState(null);
  const [facebookPixels, setFacebookPixels] = useState([
    {
      id: 1,
      pixelsId: "645044913541888",
      metaAccessToken: "",
      testEventId: "",
      status: false,
    },
  ]);
  const [selectedFacebookPixel, setSelectedFacebookPixel] = useState(null);
  const [selectedTiktokPixel, setSelectedTiktokPixel] = useState(null);
  const [selectedGoogleAds, setSelectedGoogleAds] = useState(null);
  const [couponCodes, setCouponCodes] = useState([
    {
      id: 1,
      code: "winter11.11",
      date: "2026-01-20",
      type: "Percentage",
      amount: 11,
      buyAmount: 800,
      imageName: "",
      status: true,
    },
    {
      id: 2,
      code: "offer10",
      date: "2026-04-30",
      type: "Percentage",
      amount: 12,
      buyAmount: 1000,
      imageName: "",
      status: true,
    },
  ]);
  const [selectedCouponCode, setSelectedCouponCode] = useState(null);
  const [blogs, setBlogs] = useState([
    {
      id: 1,
      title: "৫০০ টাকার মধ্যে পুরুষ ব্যবহারর সেরা ৫টি সানস্ক্রিন...",
      imageName: "",
      imageText: "20,000 ROI",
      imageColor: "linear-gradient(135deg, #f2d3a4, #a4572c)",
      description: "",
      status: false,
    },
    {
      id: 2,
      title: "এ আঘা খাবার ৪টি কারণ",
      imageName: "",
      imageText: "Khilgaon Mart",
      imageColor: "linear-gradient(135deg, #0f172a, #4b6b8a)",
      description: "",
      status: false,
    },
  ]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [bannerCategories, setBannerCategories] = useState([
    { id: 1, name: "Nazmul Hasan", status: true },
    { id: 2, name: "Welcome to Khilgaon Mart", status: true },
  ]);
  const [selectedBannerCategory, setSelectedBannerCategory] = useState(null);
  const [banners, setBanners] = useState([]);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [directCampaign, setDirectCampaign] = useState(null);
  const [directCampaignLoading, setDirectCampaignLoading] = useState(
    Boolean(directLandingPageId),
  );
  const [directCampaignError, setDirectCampaignError] = useState("");
  const permissionSet = useMemo(
    () => getPermissionSet(user),
    [user?.Id, user?.role, JSON.stringify(user?.menuPermissions || [])],
  );
  const currentNavigationState = {
    activePage,
    activeOrderStatus,
    activeProductPage,
    activeSupplierPage,
    activePurchasePage,
    activeLandingPage,
    activeAdminPage,
    activeCustomersPage,
    activeWebsitePage,
    activeApiPage,
    activeMarketingPage,
    activeBlogsPage,
    activeBannerPage,
    activeExpensePage,
    activeReportsPage,
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([expenseService.getCategories(), expenseService.getAll()])
      .then(([categoryResponse, expenseResponse]) => {
        setExpenseCategories(
          (categoryResponse.data || []).map((item) => ({
            id: item.Id,
            name: item.name,
            status: item.status === "Active",
          })),
        );
        setExpenses(
          (expenseResponse.data || []).map((item) => ({
            id: item.Id,
            title: item.title,
            category: item.categoryName || "",
            categoryId: item.categoryId,
            date: item.date,
            amount: Number(item.amount || 0),
            note: item.note || "",
            status: item.status === "Active",
          })),
        );
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    writeNavigationState(
      {
        activePage,
        activeOrderStatus,
        activeProductPage,
        activeSupplierPage,
        activePurchasePage,
        activeLandingPage,
        activeAdminPage,
        activeCustomersPage,
        activeWebsitePage,
        activeApiPage,
        activeMarketingPage,
        activeBlogsPage,
        activeBannerPage,
        activeExpensePage,
        activeReportsPage,
      },
      { editProductId: selectedProduct?.Id || getEditProductIdFromPath() },
    );
  }, [
    selectedProduct?.Id,
    activePage,
    activeOrderStatus,
    activeProductPage,
    activeSupplierPage,
    activePurchasePage,
    activeLandingPage,
    activeAdminPage,
    activeCustomersPage,
    activeWebsitePage,
    activeApiPage,
    activeMarketingPage,
    activeBlogsPage,
    activeBannerPage,
    activeExpensePage,
    activeReportsPage,
  ]);

  // Reopened edit page (reload / back button): load the product from its URL id.
  useEffect(() => {
    if (!isAuthenticated || activePage !== "edit_product" || selectedProduct)
      return undefined;
    const productId = getEditProductIdFromPath();
    let active = true;
    const backToList = () => {
      setActivePage("products");
      setActiveProductPage("product_manage");
    };
    if (!productId) {
      backToList();
      return undefined;
    }
    productService
      .getById(productId)
      .then((res) => {
        if (!active) return;
        if (res?.data) setSelectedProduct(res.data);
        else backToList();
      })
      .catch(() => {
        if (active) backToList();
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, activePage, selectedProduct]);

  useEffect(() => {
    if (directLandingPageId) return undefined;
    const handlePopState = () => {
      const editProductId = getEditProductIdFromPath();
      if (editProductId) {
        setSelectedProduct((current) =>
          current?.Id === editProductId ? current : null,
        );
        setActivePage("edit_product");
        return;
      }
      const next =
        getNavigationStateFromPath(window.location.pathname) ||
        getHashNavigationState() ||
        DEFAULT_NAVIGATION;
      applyNavigationState(next);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [directLandingPageId]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    const applySettings = (data) => {
      if (!active) return;
      const normalized = normalizeSettingData(data);
      setSiteSettings(normalized);
      applyDocumentFavicon(getFavicon(normalized));
      applyDocumentTitle(getSiteName(normalized));
    };

    siteSettingService
      .get("general")
      .then((res) => applySettings(res.data?.data || null))
      .catch(() => {});

    const handleUpdate = (event) => applySettings(event.detail);
    window.addEventListener("site-settings:update", handleUpdate);
    return () => {
      active = false;
      window.removeEventListener("site-settings:update", handleUpdate);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;

    fetchBannerState()
      .then(({ categories, banners }) => {
        if (!active) return;
        setBannerCategories(categories);
        setBanners(banners);
      })
      .catch((err) => {
        console.error("Banner data fetch failed", err);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!directLandingPageId) return undefined;
    let active = true;
    setDirectCampaignLoading(true);
    setDirectCampaignError("");
    landingPageService
      .getPublicOne(directLandingPageId)
      .then((res) => {
        if (!active) return;
        setDirectCampaign(res.data || null);
      })
      .catch((err) => {
        if (!active) return;
        setDirectCampaignError(
          err.message || "Landing page not found or inactive.",
        );
      })
      .finally(() => {
        if (active) setDirectCampaignLoading(false);
      });
    return () => {
      active = false;
    };
  }, [directLandingPageId]);

  useEffect(() => {
    if (!isAuthenticated || directLandingPageId) return;
    const next = normalizeNavigationForPermissions(
      currentNavigationState,
      permissionSet,
    );
    const changed = Object.keys(next).some(
      (key) => next[key] !== currentNavigationState[key],
    );
    if (changed) applyNavigationState({ ...currentNavigationState, ...next });
  }, [
    isAuthenticated,
    directLandingPageId,
    permissionSet,
    activePage,
    activeOrderStatus,
    activeProductPage,
    activeSupplierPage,
    activePurchasePage,
    activeLandingPage,
    activeAdminPage,
    activeCustomersPage,
    activeWebsitePage,
    activeApiPage,
    activeMarketingPage,
    activeBlogsPage,
    activeBannerPage,
    activeExpensePage,
    activeReportsPage,
  ]);

  // Auth guards — placed after all hook calls to satisfy Rules of Hooks
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-orange-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (directLandingPageId) {
    if (directCampaignLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm font-semibold text-gray-500">
          Loading landing page...
        </div>
      );
    }

    if (directCampaignError || !directCampaign) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-red-500">
              {directCampaignError || "Landing page not found."}
            </p>
            <button
              type="button"
              onClick={() => window.location.assign("/")}
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-xs font-bold text-white"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen overflow-hidden bg-gray-100">
        <LandingPageViewPage
          campaign={directCampaign}
          onBack={() => window.location.assign("/")}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  function goProducts(page) {
    setActivePage("products");
    setActiveProductPage(page);
  }

  function saveTagManager(data) {
    if (data.id) {
      setTagManagers((prev) =>
        prev.map((tag) => (tag.id === data.id ? { ...tag, ...data } : tag)),
      );
      setSelectedTagManager(null);
      return;
    }

    setTagManagers((prev) => [
      ...prev,
      {
        id: Date.now(),
        tagManagerId: data.tagManagerId,
        status: data.status,
      },
    ]);
  }

  function deleteTagManager(id) {
    setTagManagers((prev) => prev.filter((tag) => tag.id !== id));
  }

  function saveFacebookPixel(data) {
    if (data.id) {
      setFacebookPixels((prev) =>
        prev.map((pixel) =>
          pixel.id === data.id ? { ...pixel, ...data } : pixel,
        ),
      );
      setSelectedFacebookPixel(null);
      return;
    }

    setFacebookPixels((prev) => [
      ...prev,
      {
        id: Date.now(),
        pixelsId: data.pixelsId,
        metaAccessToken: data.metaAccessToken,
        testEventId: data.testEventId,
        status: data.status,
      },
    ]);
  }

  function deleteFacebookPixel(id) {
    setFacebookPixels((prev) => prev.filter((pixel) => pixel.id !== id));
  }

  function saveCouponCode(data) {
    if (data.id) {
      setCouponCodes((prev) =>
        prev.map((coupon) =>
          coupon.id === data.id ? { ...coupon, ...data } : coupon,
        ),
      );
      setSelectedCouponCode(null);
      return;
    }

    setCouponCodes((prev) => [
      ...prev,
      {
        id: Date.now(),
        code: data.code,
        date: data.date,
        type: data.type,
        amount: data.amount,
        buyAmount: data.buyAmount,
        imageName: data.imageName,
        status: data.status,
      },
    ]);
  }

  function deleteCouponCode(id) {
    setCouponCodes((prev) => prev.filter((coupon) => coupon.id !== id));
  }

  function saveBlog(data) {
    if (data.id) {
      setBlogs((prev) =>
        prev.map((blog) => (blog.id === data.id ? { ...blog, ...data } : blog)),
      );
      setSelectedBlog(null);
      return;
    }

    setBlogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: data.title,
        imageName: data.imageName,
        imageText: data.imageText,
        imageColor: data.imageColor,
        description: data.description,
        status: data.status,
      },
    ]);
  }

  function deleteBlog(id) {
    setBlogs((prev) => prev.filter((blog) => blog.id !== id));
  }

  async function saveBannerCategory(data) {
    if (data.id) {
      const res = await bannerCategoryService.update(data.id, {
        name: data.name,
        status: data.status,
      });
      const updated = normalizeBannerCategory(res.data);
      setBannerCategories((prev) =>
        prev.map((category) => (category.id === data.id ? updated : category)),
      );
      setSelectedBannerCategory(null);
      return;
    }

    const res = await bannerCategoryService.create({
      name: data.name,
      status: data.status,
    });
    setBannerCategories((prev) => [...prev, normalizeBannerCategory(res.data)]);
  }

  async function saveBanner(data) {
    if (!data.categoryId) throw new Error("Banner category is required.");
    if (!data.id && !data.imageFile)
      throw new Error("Banner image is required.");

    const fd = new FormData();
    fd.append("linkUrl", data.link || "");
    fd.append("categoryId", data.categoryId || "");
    fd.append("categoryName", data.category || "");
    fd.append("alt", data.imageText || data.category || "");
    fd.append("status", data.status ? "Active" : "Inactive");
    if (data.sortOrder || data.sortOrder === 0) {
      fd.append("sortOrder", data.sortOrder);
    }
    if (data.imageFile) fd.append("image", data.imageFile);

    if (data.id) {
      if (!data.imageFile && data.imageName) fd.append("file", data.imageName);
      await bannerAdsService.update(data.id, fd);
      const next = await fetchBannerState();
      setBannerCategories(next.categories);
      setBanners(next.banners);
      setSelectedBanner(null);
      return;
    }

    await bannerAdsService.create(fd);
    const next = await fetchBannerState();
    setBannerCategories(next.categories);
    setBanners(next.banners);
  }

  async function toggleBannerCategoryStatus(category) {
    const res = await bannerCategoryService.update(category.id, {
      name: category.name,
      status: !category.status,
      sortOrder: category.sortOrder,
    });
    const updated = normalizeBannerCategory(res.data);
    setBannerCategories((prev) =>
      prev.map((item) => (item.id === category.id ? updated : item)),
    );
  }

  async function toggleBannerStatus(banner) {
    const fd = new FormData();
    fd.append("linkUrl", banner.link || "");
    fd.append("categoryId", banner.categoryId || "");
    fd.append("categoryName", banner.category || "");
    fd.append("file", banner.imageName || "");
    fd.append("alt", banner.imageText || banner.category || "");
    fd.append("status", banner.status ? "Inactive" : "Active");
    const res = await bannerAdsService.update(banner.id, fd);
    const updated = normalizeBanner(res.data);
    setBanners((prev) =>
      prev.map((item) => (item.id === banner.id ? updated : item)),
    );
  }

  async function deleteBanner(id) {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await bannerAdsService.delete(id);
      setBanners((prev) => prev.filter((banner) => banner.id !== id));
    } catch (err) {
      alert(err.message || "Banner delete failed.");
    }
  }

  async function saveExpenseCategory(data) {
    if (data.id) {
      const response = await expenseService.updateCategory(data.id, data);
      const saved = response.data;
      setExpenseCategories((prev) =>
        prev.map((category) =>
          category.id === data.id
            ? {
                id: saved.Id,
                name: saved.name,
                status: saved.status === "Active",
              }
            : category,
        ),
      );
      setSelectedExpenseCategory(null);
      return;
    }
    const response = await expenseService.createCategory(data);
    const saved = response.data;
    setExpenseCategories((prev) => [
      ...prev,
      { id: saved.Id, name: saved.name, status: saved.status === "Active" },
    ]);
  }

  async function saveExpense(data) {
    const category = expenseCategories.find(
      (item) => item.name === data.category,
    );
    const payload = {
      ...data,
      categoryId: category?.id || null,
      categoryName: data.category,
    };
    if (data.id) {
      const response = await expenseService.update(data.id, payload);
      const saved = response.data;
      setExpenses((prev) =>
        prev.map((expense) =>
          expense.id === data.id
            ? {
                ...data,
                id: saved.Id,
                amount: Number(saved.amount),
                category: saved.categoryName,
                status: saved.status === "Active",
              }
            : expense,
        ),
      );
      setSelectedExpense(null);
      return;
    }
    const response = await expenseService.create(payload);
    const saved = response.data;
    setExpenses((prev) => [
      ...prev,
      {
        ...data,
        id: saved.Id,
        amount: Number(saved.amount),
        category: saved.categoryName,
        status: saved.status === "Active",
      },
    ]);
  }

  async function deleteExpense(id) {
    await expenseService.delete(id);
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  }

  function handleQuickNavigate(target) {
    if (target === "landing") {
      setActivePage("landing");
      setActiveLandingPage("landing_manage");
      return;
    }
    if (target === "visitors") {
      setActivePage("marketing");
      setActiveMarketingPage("visitor_reports");
      return;
    }
    if (target === "pos") {
      setActivePage("pos");
      return;
    }
    if (target === "create_order") {
      setCreateOrderNotice(null);
      setActivePage("create_order");
      return;
    }
    if (target === "expense") {
      setActivePage("expense");
      setActiveExpensePage("expense");
      return;
    }
    if (target === "tutorial") {
      window.alert(
        "Tutorial link সেট করা হয়নি। VITE_TUTORIAL_URL দিলে এখানে open হবে।",
      );
    }
  }

  function applyNavigationState(next) {
    setActivePage(next.activePage);
    setActiveOrderStatus(next.activeOrderStatus);
    setActiveProductPage(next.activeProductPage);
    setActiveSupplierPage(next.activeSupplierPage);
    setActivePurchasePage(next.activePurchasePage);
    setActiveLandingPage(next.activeLandingPage);
    setActiveAdminPage(next.activeAdminPage);
    setActiveCustomersPage(next.activeCustomersPage);
    setActiveWebsitePage(next.activeWebsitePage);
    setActiveApiPage(next.activeApiPage);
    setActiveMarketingPage(next.activeMarketingPage);
    setActiveBlogsPage(next.activeBlogsPage);
    setActiveBannerPage(next.activeBannerPage);
    setActiveExpensePage(next.activeExpensePage);
    setActiveReportsPage(next.activeReportsPage);
  }

  function handleNotificationNavigate(url) {
    const next = getNavigationStateFromUrl(url);
    if (!next) return false;
    applyNavigationState(next);
    return true;
  }

  async function handleViewOrder(order) {
    setSelectedOrder(order);
    setInvoiceAutoPrint(false);
    setActivePage("invoice");
    try {
      const response = await orderService.getOrderById(order.Id);
      setSelectedOrder(response.data || order);
    } catch {
      setSelectedOrder(order);
    }
  }

  async function openEditOrder(order) {
    setSelectedOrder(order);
    setInvoiceAutoPrint(false);
    setActivePage("edit_order");
    try {
      const response = await orderService.getOrderById(order.Id);
      setSelectedOrder(response.data || order);
    } catch {
      setSelectedOrder(order);
    }
  }

  async function handlePrintOrder(order) {
    if (!order?.Id) return;
    setSelectedOrder(order);
    setInvoiceAutoPrint(true);
    setActivePage("invoice");
    try {
      const response = await orderService.getOrderById(order.Id);
      setSelectedOrder(response.data || order);
    } catch {
      setSelectedOrder(order);
    }
  }

  if (
    activePage === "invoice" &&
    selectedOrder &&
    isNavigationAllowed(currentNavigationState, permissionSet)
  ) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav
            siteSettings={siteSettings}
            onQuickNavigate={handleQuickNavigate}
            onNotificationNavigate={handleNotificationNavigate}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <InvoicePage
            order={selectedOrder}
            siteSettings={siteSettings}
            autoPrint={invoiceAutoPrint}
            onBack={() => {
              setInvoiceAutoPrint(false);
              setActivePage("orders");
              setSelectedOrder(null);
            }}
          />
        </div>
      </div>
    );
  }

  function renderMain() {
    if (!isNavigationAllowed(currentNavigationState, permissionSet)) {
      const next = normalizeNavigationForPermissions(
        currentNavigationState,
        permissionSet,
      );
      const hasAllowedFallback =
        Object.keys(next).some(
          (key) => next[key] !== currentNavigationState[key],
        ) &&
        isNavigationAllowed(
          { ...currentNavigationState, ...next },
          permissionSet,
        );

      if (hasAllowedFallback) {
        return (
          <div className="flex h-full items-center justify-center p-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
              <h1 className="text-lg font-bold text-gray-800">
                Loading permissions...
              </h1>
            </div>
          </div>
        );
      }

      return (
        <div className="flex h-full items-center justify-center p-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-bold text-gray-800">
              No menu permission
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              এই role-এর জন্য কোনো menu permission দেওয়া হয়নি।
            </p>
          </div>
        </div>
      );
    }
    if (activePage === "pos") {
      return (
        <CreateOrderPage
          onNavigate={(page) => {
            setActivePage(page);
            if (page === "orders") setActiveOrderStatus("all");
          }}
        />
      );
    }
    // Create Order is the order edit screen without an order.
    if (activePage === "create_order") {
      return (
        <EditOrderPage
          key={createOrderRun}
          order={null}
          notice={createOrderNotice}
          onDismissNotice={() => setCreateOrderNotice(null)}
          onCreated={(notice) => {
            setCreateOrderNotice(notice);
            setCreateOrderRun((run) => run + 1);
          }}
          onCountsRefresh={refetchOrderCounts}
          onOpenOrder={(order) => {
            setCreateOrderNotice(null);
            openEditOrder(order);
          }}
          onViewCustomer={(order) => {
            setSelectedCustomer(order);
            setActivePage("customers");
            setActiveCustomersPage("customer_view");
          }}
          onNavigate={(page) => {
            setActivePage(page);
            if (page === "orders") setActiveOrderStatus("all");
          }}
        />
      );
    }
    if (activePage === "edit_order" && selectedOrder) {
      return (
        <EditOrderPage
          key={selectedOrder.Id}
          order={selectedOrder}
          onCountsRefresh={refetchOrderCounts}
          onOpenOrder={openEditOrder}
          onPrintOrder={() => handlePrintOrder(selectedOrder)}
          onViewCustomer={(order) => {
            setSelectedCustomer(order);
            setActivePage("customers");
            setActiveCustomersPage("customer_view");
          }}
          onNavigate={(page) => {
            setActivePage(page);
            setSelectedOrder(null);
            if (page === "orders") setActiveOrderStatus("all");
          }}
        />
      );
    }
    if (activePage === "dashboard") return <Dashboard />;
    if (activePage === "orders")
      return (
        <OrdersPage
          activeStatus={activeOrderStatus}
          onStatusChange={setActiveOrderStatus}
          onCreateOrder={() => setActivePage("create_order")}
          onViewOrder={handleViewOrder}
          onEditOrder={openEditOrder}
          onPrintOrder={handlePrintOrder}
          onViewCustomer={(order) => {
            setSelectedCustomer(order);
            setActivePage("customers");
            setActiveCustomersPage("customer_view");
          }}
          siteSettings={siteSettings}
          statusCounts={orderCounts}
          onCountsRefresh={refetchOrderCounts}
        />
      );
    if (activePage === "create_product") {
      return (
        <ProductCreatePage onNavigate={() => goProducts("product_manage")} />
      );
    }
    if (activePage === "edit_product" && !selectedProduct) {
      return (
        <div className="flex-1 p-6 text-sm text-gray-500">Loading product…</div>
      );
    }
    if (activePage === "edit_product" && selectedProduct) {
      return (
        <ProductEditPage
          key={selectedProduct.Id}
          product={selectedProduct}
          onNavigate={() => {
            goProducts("product_manage");
            setSelectedProduct(null);
          }}
        />
      );
    }
    if (activePage === "create_category") {
      return (
        <CategoryCreatePage
          onNavigate={(page) => goProducts(page || "categories")}
        />
      );
    }
    if (activePage === "edit_category" && selectedCategory) {
      return (
        <CategoryEditPage
          category={selectedCategory}
          onNavigate={(page) => {
            goProducts(page || "categories");
            setSelectedCategory(null);
          }}
        />
      );
    }
    if (activePage === "create_subcategory") {
      return (
        <SubcategoryCreatePage
          onNavigate={(page) => goProducts(page || "subcategories")}
        />
      );
    }
    if (activePage === "edit_subcategory" && selectedSubcategory) {
      return (
        <SubcategoryEditPage
          subcategory={selectedSubcategory}
          onNavigate={(page) => {
            goProducts(page || "subcategories");
            setSelectedSubcategory(null);
          }}
        />
      );
    }
    if (activePage === "create_childcategory") {
      return (
        <ChildcategoryCreatePage
          onNavigate={(page) => goProducts(page || "childcategories")}
        />
      );
    }
    if (activePage === "edit_childcategory" && selectedChildcategory) {
      return (
        <ChildcategoryEditPage
          childcategory={selectedChildcategory}
          onNavigate={(page) => {
            goProducts(page || "childcategories");
            setSelectedChildcategory(null);
          }}
        />
      );
    }
    if (activePage === "create_brand") {
      return (
        <BrandCreatePage onNavigate={(page) => goProducts(page || "brands")} />
      );
    }
    if (activePage === "edit_brand" && selectedBrand) {
      return (
        <BrandEditPage
          brand={selectedBrand}
          onNavigate={(page) => {
            goProducts(page || "brands");
            setSelectedBrand(null);
          }}
        />
      );
    }
    if (activePage === "create_color") {
      return (
        <ColorCreatePage onNavigate={(page) => goProducts(page || "colors")} />
      );
    }
    if (activePage === "edit_color" && selectedColor) {
      return (
        <ColorEditPage
          color={selectedColor}
          onNavigate={(page) => {
            goProducts(page || "colors");
            setSelectedColor(null);
          }}
        />
      );
    }
    if (activePage === "create_attribute") {
      return (
        <AttributeFormPage
          onNavigate={(page) => goProducts(page || "attribute")}
        />
      );
    }
    if (activePage === "edit_attribute" && selectedAttribute) {
      return (
        <AttributeFormPage
          mode="edit"
          attribute={selectedAttribute}
          onNavigate={(page) => {
            goProducts(page || "attribute");
            setSelectedAttribute(null);
          }}
        />
      );
    }
    if (activePage === "create_review") {
      return (
        <ReviewFormPage onNavigate={(page) => goProducts(page || "reviews")} />
      );
    }
    if (activePage === "edit_review" && selectedReview) {
      return (
        <ReviewFormPage
          mode="edit"
          review={selectedReview}
          onNavigate={(page) => {
            goProducts(page || "reviews");
            setSelectedReview(null);
          }}
        />
      );
    }
    if (activePage === "supplier") {
      const goSupplier = (page) => {
        setActivePage("supplier");
        setActiveSupplierPage(page);
      };
      if (activeSupplierPage === "supplier_list") {
        return (
          <SupplierListPage
            onNavigate={goSupplier}
            onEditSupplier={(s) => {
              setSelectedSupplier(s);
              goSupplier("supplier_edit");
            }}
            onPaymentSupplier={() => goSupplier("payment_add")}
          />
        );
      }
      if (activeSupplierPage === "supplier_add") {
        return <SupplierFormPage mode="create" onNavigate={goSupplier} />;
      }
      if (activeSupplierPage === "supplier_edit" && selectedSupplier) {
        return (
          <SupplierFormPage
            mode="edit"
            supplier={selectedSupplier}
            onSave={() => setSelectedSupplier(null)}
            onNavigate={goSupplier}
          />
        );
      }
      if (activeSupplierPage === "payment_add") {
        return <PaymentAddPage mode="create" onNavigate={goSupplier} />;
      }
      if (activeSupplierPage === "payment_edit" && selectedPayment) {
        return (
          <PaymentAddPage
            mode="edit"
            payment={selectedPayment}
            onSave={() => setSelectedPayment(null)}
            onNavigate={goSupplier}
          />
        );
      }
      if (activeSupplierPage === "payment_list") {
        return (
          <PaymentListPage
            onNavigate={goSupplier}
            onEditPayment={(p) => {
              setSelectedPayment(p);
              goSupplier("payment_edit");
            }}
          />
        );
      }
      return <Dashboard />;
    }
    if (activePage === "purchase") {
      const goPurchase = (page) => {
        setActivePage("purchase");
        setActivePurchasePage(page);
      };
      if (activePurchasePage === "purchase_list") {
        return (
          <PurchaseListPage
            onNavigate={goPurchase}
            onEditPurchase={(p) => {
              setSelectedPurchase(p);
              goPurchase("purchase_edit");
            }}
          />
        );
      }
      if (activePurchasePage === "purchase_add") {
        return <PurchaseFormPage mode="create" onNavigate={goPurchase} />;
      }
      if (activePurchasePage === "purchase_edit" && selectedPurchase) {
        return (
          <PurchaseFormPage
            mode="edit"
            purchase={selectedPurchase}
            onSave={() => setSelectedPurchase(null)}
            onNavigate={goPurchase}
          />
        );
      }
      return <Dashboard />;
    }
    if (activePage === "admin") {
      const goAdmin = (page) => {
        setActivePage("admin");
        setActiveAdminPage(page);
      };
      if (activeAdminPage === "admin_user") {
        return (
          <AdminUserPage
            onNavigate={goAdmin}
            onEditUser={(u) => {
              setSelectedUser(u);
              setActiveAdminPage("admin_user_edit");
            }}
          />
        );
      }
      if (activeAdminPage === "admin_user_edit") {
        return (
          <AdminUserEditPage
            user={selectedUser}
            onSave={() => setSelectedUser(null)}
            onNavigate={(page) => {
              setSelectedUser(null);
              goAdmin(page);
            }}
          />
        );
      }
      if (activeAdminPage === "admin_roles") {
        return (
          <AdminRolesPage
            onEditRole={(r) => {
              setSelectedRole(r);
              setActiveAdminPage("admin_role_edit");
            }}
          />
        );
      }
      if (activeAdminPage === "admin_role_edit" && selectedRole) {
        return (
          <AdminRoleEditPage
            role={selectedRole}
            onSave={() => {
              setSelectedRole(null);
            }}
            onNavigate={(page) => {
              setSelectedRole(null);
              goAdmin(page);
            }}
          />
        );
      }
      if (activeAdminPage === "admin_permissions") {
        return (
          <AdminPermissionsPage
            onEditPermission={(role) => {
              setSelectedRole(role);
              setActiveAdminPage("admin_role_edit");
            }}
          />
        );
      }
      return (
        <AdminUserPage
          onNavigate={goAdmin}
          onEditUser={(u) => {
            setSelectedUser(u);
            setActiveAdminPage("admin_user_edit");
          }}
        />
      );
    }
    if (activePage === "landing") {
      const goLanding = (page) => {
        setSelectedCampaign(null);
        setActivePage("landing");
        setActiveLandingPage(page);
      };
      if (activeLandingPage === "landing_create") {
        return <LandingPageFormPage onNavigate={goLanding} />;
      }
      if (activeLandingPage === "landing_edit" && selectedCampaign) {
        return (
          <LandingPageFormPage
            key={selectedCampaign.Id}
            campaign={selectedCampaign}
            onNavigate={goLanding}
          />
        );
      }
      return (
        <LandingPageListPage
          onCreate={() => goLanding("landing_create")}
          onEdit={(campaign) => {
            landingPageService
              .getOne(campaign.Id)
              .then((res) => setSelectedCampaign(res.data || campaign))
              .catch(() => setSelectedCampaign(campaign))
              .finally(() => setActiveLandingPage("landing_edit"));
          }}
        />
      );
    }
    if (activePage === "products") {
      if (activeProductPage === "product_manage") {
        return (
          <ProductManagePage
            onNavigate={(page, data) => {
              if (page === "edit_product" && data) {
                setSelectedProduct(data);
              }
              setActivePage(page);
            }}
          />
        );
      }
      if (activeProductPage === "categories") {
        return (
          <CategoriesPage
            onNavigate={setActivePage}
            onEditCategory={(cat) => {
              setSelectedCategory(cat);
              setActivePage("edit_category");
            }}
          />
        );
      }
      if (activeProductPage === "subcategories") {
        return (
          <SubcategoriesPage
            onNavigate={setActivePage}
            onEditSubcategory={(sub) => {
              setSelectedSubcategory(sub);
              setActivePage("edit_subcategory");
            }}
          />
        );
      }
      if (activeProductPage === "childcategories") {
        return (
          <ChildCategoriesPage
            onNavigate={setActivePage}
            onEditChildcategory={(child) => {
              setSelectedChildcategory(child);
              setActivePage("edit_childcategory");
            }}
          />
        );
      }
      if (activeProductPage === "brands") {
        return (
          <BrandsPage
            onNavigate={setActivePage}
            onEditBrand={(b) => {
              setSelectedBrand(b);
              setActivePage("edit_brand");
            }}
          />
        );
      }
      if (activeProductPage === "colors") {
        return (
          <ColorsPage
            onNavigate={setActivePage}
            onEditColor={(c) => {
              setSelectedColor(c);
              setActivePage("edit_color");
            }}
          />
        );
      }
      if (activeProductPage === "attribute") {
        return (
          <AttributePage
            onNavigate={setActivePage}
            onEditAttribute={(attribute) => {
              setSelectedAttribute(attribute);
              setActivePage("edit_attribute");
            }}
          />
        );
      }
      if (activeProductPage === "barcode") {
        return <BarcodePage />;
      }
      if (activeProductPage === "combo_offer") {
        return <ComboOfferPage />;
      }
      if (activeProductPage === "reviews") {
        return (
          <ReviewsPage
            onNavigate={setActivePage}
            onEditReview={(review) => {
              setSelectedReview(review);
              setActivePage("edit_review");
            }}
          />
        );
      }
      return <Dashboard />;
    }
    if (activePage === "customers") {
      const goCustomers = (page) => {
        setActivePage("customers");
        setActiveCustomersPage(page);
      };
      if (activeCustomersPage === "customer_list") {
        return (
          <CustomerListPage
            onEditCustomer={(c) => {
              setSelectedCustomer(c);
              setActiveCustomersPage("customer_edit");
            }}
            onViewCustomer={(c) => {
              setSelectedCustomer(c);
              setActiveCustomersPage("customer_view");
            }}
          />
        );
      }
      if (activeCustomersPage === "customer_edit" && selectedCustomer) {
        return (
          <CustomerEditPage
            customer={selectedCustomer}
            onSave={() => setSelectedCustomer(null)}
            onNavigate={(page) => {
              setSelectedCustomer(null);
              goCustomers(page);
            }}
          />
        );
      }
      if (activeCustomersPage === "customer_view" && selectedCustomer) {
        return (
          <CustomerViewPage
            customer={selectedCustomer}
            onNavigate={(page) => {
              setSelectedCustomer(null);
              goCustomers(page);
            }}
            onLoginAs={(c) => {
              setSelectedCustomer(c);
              setActiveCustomersPage("customer_login_as");
            }}
            onOpenOrder={openEditOrder}
          />
        );
      }
      if (activeCustomersPage === "customer_login_as" && selectedCustomer) {
        return (
          <CustomerLoginAsPage
            customer={selectedCustomer}
            onBack={() => {
              setSelectedCustomer(null);
              goCustomers("customer_list");
            }}
          />
        );
      }
      if (activeCustomersPage === "ip_block") {
        return <CustomerIpBlockPage />;
      }
      return <CustomerListPage />;
    }
    if (activePage === "website") {
      if (activeWebsitePage === "general_setting")
        return <WebsiteGeneralSettingPage />;
      if (activeWebsitePage === "order_block") return <WebsiteOrderBlockPage />;
      if (activeWebsitePage === "website_footer") return <WebsiteFooterPage />;
      if (activeWebsitePage === "customer_reward") return <WebsiteRewardPage />;
      if (activeWebsitePage === "social_media")
        return <WebsiteSocialMediaPage />;
      if (activeWebsitePage === "contact") return <WebsiteContactPage />;
      if (activeWebsitePage === "delivery_area") {
        return (
          <WebsiteDeliveryAreaPage
            onEdit={(a) => {
              setSelectedDeliveryArea(a);
              setActiveWebsitePage("delivery_area_edit");
            }}
            onCreate={() => {
              setSelectedDeliveryArea(null);
              setActiveWebsitePage("delivery_area_edit");
            }}
          />
        );
      }
      if (activeWebsitePage === "order_status") {
        return (
          <WebsiteOrderStatusPage
            onEdit={(s) => {
              setSelectedOrderStatus(s);
              setActiveWebsitePage("order_status_edit");
            }}
            onCreate={() => {
              setSelectedOrderStatus(null);
              setActiveWebsitePage("order_status_edit");
            }}
          />
        );
      }
      if (activeWebsitePage === "order_status_edit") {
        return (
          <WebsiteOrderStatusEditPage
            status={selectedOrderStatus}
            onSave={() => setSelectedOrderStatus(null)}
            onNavigate={(page) => {
              setSelectedOrderStatus(null);
              setActiveWebsitePage(page);
            }}
          />
        );
      }
      if (activeWebsitePage === "delivery_area_edit") {
        return (
          <WebsiteDeliveryAreaEditPage
            area={selectedDeliveryArea}
            onSave={() => setSelectedDeliveryArea(null)}
            onNavigate={(page) => {
              setSelectedDeliveryArea(null);
              setActiveWebsitePage(page);
            }}
          />
        );
      }
      if (activeWebsitePage === "create_page") {
        return (
          <WebsitePageManagePage
            onEdit={(p) => {
              setSelectedPage(p);
              setActiveWebsitePage("page_edit");
            }}
            onCreate={() => {
              setSelectedPage(null);
              setActiveWebsitePage("page_edit");
            }}
          />
        );
      }
      if (activeWebsitePage === "page_edit") {
        return (
          <WebsitePageEditPage
            page={selectedPage}
            onSave={() => setSelectedPage(null)}
            onNavigate={(pg) => {
              setSelectedPage(null);
              setActiveWebsitePage(pg);
            }}
          />
        );
      }
      return <WebsiteGeneralSettingPage />;
    }
    if (activePage === "api") {
      if (activeApiPage === "courier_api") return <CourierApiPage />;
      if (activeApiPage === "payment_gateway") return <PaymentGatewayPage />;
      if (activeApiPage === "sms_gateway") return <SmsGatewayPage />;
      if (activeApiPage === "fraud_checker_api") return <FraudCheckerApiPage />;
      return <CourierApiPage />;
    }
    if (activePage === "marketing") {
      const goMarketing = (page) => {
        setActivePage("marketing");
        setActiveMarketingPage(page);
      };

      if (activeMarketingPage === "tag_manager") {
        return (
          <TagManagerPage
            tags={tagManagers}
            onCreate={() => {
              setSelectedTagManager(null);
              goMarketing("tag_manager_create");
            }}
            onEdit={(tag) => {
              setSelectedTagManager(tag);
              goMarketing("tag_manager_edit");
            }}
            onDelete={deleteTagManager}
          />
        );
      }

      if (activeMarketingPage === "tag_manager_create") {
        return (
          <TagManagerFormPage
            onSave={saveTagManager}
            onNavigate={goMarketing}
          />
        );
      }

      if (activeMarketingPage === "tag_manager_edit" && selectedTagManager) {
        return (
          <TagManagerFormPage
            mode="edit"
            tag={selectedTagManager}
            onSave={saveTagManager}
            onNavigate={(page) => {
              setSelectedTagManager(null);
              goMarketing(page);
            }}
          />
        );
      }

      if (activeMarketingPage === "facebook_pixels") {
        return (
          <FacebookPixelsPage
            pixels={facebookPixels}
            onCreate={() => {
              setSelectedFacebookPixel(null);
              goMarketing("facebook_pixels_create");
            }}
            onEdit={(pixel) => {
              setSelectedFacebookPixel(pixel);
              goMarketing("facebook_pixels_edit");
            }}
            onDelete={deleteFacebookPixel}
          />
        );
      }

      if (activeMarketingPage === "facebook_pixels_create") {
        return (
          <FacebookPixelsFormPage
            onSave={saveFacebookPixel}
            onNavigate={goMarketing}
          />
        );
      }

      if (
        activeMarketingPage === "facebook_pixels_edit" &&
        selectedFacebookPixel
      ) {
        return (
          <FacebookPixelsFormPage
            mode="edit"
            pixel={selectedFacebookPixel}
            onSave={saveFacebookPixel}
            onNavigate={(page) => {
              setSelectedFacebookPixel(null);
              goMarketing(page);
            }}
          />
        );
      }

      if (activeMarketingPage === "tiktok_pixels") {
        return (
          <TiktokPixelsPage
            onCreate={() => {
              setSelectedTiktokPixel(null);
              goMarketing("tiktok_pixels_create");
            }}
            onEdit={(pixel) => {
              setSelectedTiktokPixel(pixel);
              goMarketing("tiktok_pixels_edit");
            }}
          />
        );
      }

      if (activeMarketingPage === "tiktok_pixels_create") {
        return (
          <TiktokPixelFormPage
            onSave={() => setSelectedTiktokPixel(null)}
            onNavigate={goMarketing}
          />
        );
      }

      if (activeMarketingPage === "tiktok_pixels_edit" && selectedTiktokPixel) {
        return (
          <TiktokPixelFormPage
            mode="edit"
            pixel={selectedTiktokPixel}
            onSave={() => setSelectedTiktokPixel(null)}
            onNavigate={(page) => {
              setSelectedTiktokPixel(null);
              goMarketing(page);
            }}
          />
        );
      }

      if (activeMarketingPage === "google_ads") {
        return (
          <GoogleAdsPage
            onCreate={() => {
              setSelectedGoogleAds(null);
              goMarketing("google_ads_create");
            }}
            onEdit={(config) => {
              setSelectedGoogleAds(config);
              goMarketing("google_ads_edit");
            }}
          />
        );
      }

      if (activeMarketingPage === "google_ads_create") {
        return (
          <GoogleAdsFormPage
            onSave={() => setSelectedGoogleAds(null)}
            onNavigate={goMarketing}
          />
        );
      }

      if (activeMarketingPage === "google_ads_edit" && selectedGoogleAds) {
        return (
          <GoogleAdsFormPage
            mode="edit"
            config={selectedGoogleAds}
            onSave={() => setSelectedGoogleAds(null)}
            onNavigate={(page) => {
              setSelectedGoogleAds(null);
              goMarketing(page);
            }}
          />
        );
      }

      if (activeMarketingPage === "coupon_code") {
        return (
          <CouponCodePage
            coupons={couponCodes}
            onCreate={() => {
              setSelectedCouponCode(null);
              goMarketing("coupon_code_create");
            }}
            onEdit={(coupon) => {
              setSelectedCouponCode(coupon);
              goMarketing("coupon_code_edit");
            }}
            onDelete={deleteCouponCode}
          />
        );
      }

      if (activeMarketingPage === "coupon_code_create") {
        return (
          <CouponCodeFormPage
            onSave={saveCouponCode}
            onNavigate={goMarketing}
          />
        );
      }

      if (activeMarketingPage === "coupon_code_edit" && selectedCouponCode) {
        return (
          <CouponCodeFormPage
            mode="edit"
            coupon={selectedCouponCode}
            onSave={saveCouponCode}
            onNavigate={(page) => {
              setSelectedCouponCode(null);
              goMarketing(page);
            }}
          />
        );
      }

      if (activeMarketingPage === "sms_marketing") {
        return <SmsMarketingPage />;
      }

      if (activeMarketingPage === "facebook_catalogue") {
        return <FacebookCataloguePage />;
      }

      if (activeMarketingPage === "visitor_reports") {
        return <VisitorReportsPage />;
      }

      return (
        <TagManagerPage
          tags={tagManagers}
          onCreate={() => goMarketing("tag_manager_create")}
          onEdit={(tag) => {
            setSelectedTagManager(tag);
            goMarketing("tag_manager_edit");
          }}
          onDelete={deleteTagManager}
        />
      );
    }
    if (activePage === "blogs") {
      const goBlogs = (page) => {
        setActivePage("blogs");
        setActiveBlogsPage(page);
      };

      if (activeBlogsPage === "blog") {
        return (
          <BlogPage
            blogs={blogs}
            onCreate={() => {
              setSelectedBlog(null);
              goBlogs("blog_create");
            }}
            onEdit={(blog) => {
              setSelectedBlog(blog);
              goBlogs("blog_edit");
            }}
            onDelete={deleteBlog}
          />
        );
      }

      if (activeBlogsPage === "blog_create") {
        return <BlogFormPage onSave={saveBlog} onNavigate={goBlogs} />;
      }

      if (activeBlogsPage === "blog_edit" && selectedBlog) {
        return (
          <BlogFormPage
            mode="edit"
            blog={selectedBlog}
            onSave={saveBlog}
            onNavigate={(page) => {
              setSelectedBlog(null);
              goBlogs(page);
            }}
          />
        );
      }

      return (
        <BlogPage
          blogs={blogs}
          onCreate={() => goBlogs("blog_create")}
          onEdit={(blog) => {
            setSelectedBlog(blog);
            goBlogs("blog_edit");
          }}
          onDelete={deleteBlog}
        />
      );
    }
    if (activePage === "banner") {
      const goBanner = (page) => {
        setActivePage("banner");
        setActiveBannerPage(page);
      };

      if (activeBannerPage === "banner_category") {
        return (
          <BannerCategoryPage
            categories={bannerCategories}
            onCreate={() => {
              setSelectedBannerCategory(null);
              goBanner("banner_category_create");
            }}
            onEdit={(category) => {
              setSelectedBannerCategory(category);
              goBanner("banner_category_edit");
            }}
            onToggleStatus={toggleBannerCategoryStatus}
          />
        );
      }

      if (activeBannerPage === "banner_category_create") {
        return (
          <BannerCategoryFormPage
            onSave={saveBannerCategory}
            onNavigate={goBanner}
          />
        );
      }

      if (
        activeBannerPage === "banner_category_edit" &&
        selectedBannerCategory
      ) {
        return (
          <BannerCategoryFormPage
            mode="edit"
            category={selectedBannerCategory}
            onSave={saveBannerCategory}
            onNavigate={(page) => {
              setSelectedBannerCategory(null);
              goBanner(page);
            }}
          />
        );
      }

      if (activeBannerPage === "banner_ads") {
        return (
          <BannerAdsPage
            banners={banners}
            onCreate={() => {
              setSelectedBanner(null);
              goBanner("banner_ads_create");
            }}
            onEdit={(banner) => {
              setSelectedBanner(banner);
              goBanner("banner_ads_edit");
            }}
            onDelete={deleteBanner}
            onToggleStatus={toggleBannerStatus}
          />
        );
      }

      if (activeBannerPage === "banner_ads_create") {
        return (
          <BannerAdsFormPage
            categories={bannerCategories}
            onSave={saveBanner}
            onNavigate={goBanner}
          />
        );
      }

      if (activeBannerPage === "banner_ads_edit" && selectedBanner) {
        return (
          <BannerAdsFormPage
            mode="edit"
            banner={selectedBanner}
            categories={bannerCategories}
            onSave={saveBanner}
            onNavigate={(page) => {
              setSelectedBanner(null);
              goBanner(page);
            }}
          />
        );
      }

      return (
        <BannerCategoryPage
          categories={bannerCategories}
          onCreate={() => goBanner("banner_category_create")}
          onEdit={(category) => {
            setSelectedBannerCategory(category);
            goBanner("banner_category_edit");
          }}
          onToggleStatus={toggleBannerCategoryStatus}
        />
      );
    }
    if (activePage === "expense") {
      const goExpense = (page) => {
        setActivePage("expense");
        setActiveExpensePage(page);
      };

      if (activeExpensePage === "expense_categories") {
        return (
          <ExpenseCategoryPage
            categories={expenseCategories}
            onCreate={() => {
              setSelectedExpenseCategory(null);
              goExpense("expense_category_create");
            }}
            onEdit={(category) => {
              setSelectedExpenseCategory(category);
              goExpense("expense_category_edit");
            }}
          />
        );
      }

      if (activeExpensePage === "expense_category_create") {
        return (
          <ExpenseCategoryFormPage
            onSave={saveExpenseCategory}
            onNavigate={goExpense}
          />
        );
      }

      if (
        activeExpensePage === "expense_category_edit" &&
        selectedExpenseCategory
      ) {
        return (
          <ExpenseCategoryFormPage
            mode="edit"
            category={selectedExpenseCategory}
            onSave={saveExpenseCategory}
            onNavigate={(page) => {
              setSelectedExpenseCategory(null);
              goExpense(page);
            }}
          />
        );
      }

      if (activeExpensePage === "expense") {
        return (
          <ExpensePage
            expenses={expenses}
            onCreate={() => {
              setSelectedExpense(null);
              goExpense("expense_create");
            }}
            onEdit={(expense) => {
              setSelectedExpense(expense);
              goExpense("expense_edit");
            }}
            onDelete={deleteExpense}
          />
        );
      }

      if (activeExpensePage === "expense_create") {
        return (
          <ExpenseFormPage
            categories={expenseCategories}
            onSave={saveExpense}
            onNavigate={goExpense}
          />
        );
      }

      if (activeExpensePage === "expense_edit" && selectedExpense) {
        return (
          <ExpenseFormPage
            mode="edit"
            expense={selectedExpense}
            categories={expenseCategories}
            onSave={saveExpense}
            onNavigate={(page) => {
              setSelectedExpense(null);
              goExpense(page);
            }}
          />
        );
      }

      return (
        <ExpenseCategoryPage
          categories={expenseCategories}
          onCreate={() => goExpense("expense_category_create")}
          onEdit={(category) => {
            setSelectedExpenseCategory(category);
            goExpense("expense_category_edit");
          }}
        />
      );
    }
    if (activePage === "reports") {
      return (
        <ReportsPage key={activeReportsPage} reportKey={activeReportsPage} />
      );
    }
    return <Dashboard />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/45 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        activeOrderStatus={activeOrderStatus}
        onOrderStatusChange={setActiveOrderStatus}
        orderCounts={orderCounts}
        activeProductPage={activeProductPage}
        onProductPageChange={setActiveProductPage}
        activeSupplierPage={activeSupplierPage}
        onSupplierPageChange={setActiveSupplierPage}
        activePurchasePage={activePurchasePage}
        onPurchasePageChange={setActivePurchasePage}
        activeLandingPage={activeLandingPage}
        onLandingPageChange={setActiveLandingPage}
        activeAdminPage={activeAdminPage}
        onAdminPageChange={setActiveAdminPage}
        activeCustomersPage={activeCustomersPage}
        onCustomersPageChange={setActiveCustomersPage}
        activeWebsitePage={activeWebsitePage}
        onWebsitePageChange={setActiveWebsitePage}
        activeApiPage={activeApiPage}
        onApiPageChange={setActiveApiPage}
        activeMarketingPage={activeMarketingPage}
        onMarketingPageChange={setActiveMarketingPage}
        activeBlogsPage={activeBlogsPage}
        onBlogsPageChange={setActiveBlogsPage}
        activeBannerPage={activeBannerPage}
        onBannerPageChange={setActiveBannerPage}
        activeExpensePage={activeExpensePage}
        onExpensePageChange={setActiveExpensePage}
        activeReportsPage={activeReportsPage}
        onReportsPageChange={setActiveReportsPage}
        siteSettings={siteSettings}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNav
          siteSettings={siteSettings}
          onQuickNavigate={handleQuickNavigate}
          onNotificationNavigate={handleNotificationNavigate}
          onMenuClick={() => setSidebarOpen(true)}
        />
        {renderMain()}
      </div>
    </div>
  );
}

export default App;
