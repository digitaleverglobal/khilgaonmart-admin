const normalize = (value) => String(value || '').trim().toLowerCase();
const PERMISSION_ALIASES = {
  order: 'orders',
  all_orders: 'orders',
  sale: 'orders',
  product: 'products',
  marketing: 'marketing_tools',
  settings: 'website_setting',
};
const normalizePermission = (value) => PERMISSION_ALIASES[normalize(value)] || normalize(value);
const PRIVILEGED_ROLES = new Set(['admin', 'superadmin', 'super_admin', 'super admin']);

export const PAGE_PERMISSION_MAP = {
  dashboard: ['dashboard'],
  orders: ['orders'],
  create_order: ['orders'],
  edit_order: ['orders'],
  invoice: ['orders'],
  products: ['products'],
  create_product: ['products'],
  edit_product: ['products'],
  create_category: ['products'],
  edit_category: ['products'],
  create_subcategory: ['products'],
  edit_subcategory: ['products'],
  create_childcategory: ['products'],
  edit_childcategory: ['products'],
  create_brand: ['products'],
  edit_brand: ['products'],
  create_color: ['products'],
  edit_color: ['products'],
  create_attribute: ['products'],
  edit_attribute: ['products'],
  create_review: ['products'],
  edit_review: ['products'],
  supplier: ['supplier'],
  purchase: ['purchase'],
  landing: ['landing_page'],
  admin: ['admin_user', 'admin_roles', 'admin_permissions'],
  customers: ['customers', 'ip_block'],
  website: ['website_setting'],
  api: ['api_integration'],
  marketing: ['marketing_tools'],
  blogs: ['blogs'],
  banner: ['banner_ads'],
  expense: ['expense'],
  reports: ['reports'],
};

export const SUBPAGE_PERMISSION_MAP = {
  activeLandingPage: {
    landing_create: ['landing_page'],
    landing_manage: ['landing_page'],
    landing_edit: ['landing_page'],
    landing_view: ['landing_page'],
  },
  activeAdminPage: {
    admin_user: ['admin_user'],
    admin_user_edit: ['admin_user'],
    admin_roles: ['admin_roles'],
    admin_role_edit: ['admin_roles', 'admin_permissions'],
    admin_permissions: ['admin_permissions'],
  },
  activeCustomersPage: {
    customer_list: ['customers'],
    customer_edit: ['customers'],
    customer_view: ['customers'],
    customer_login_as: ['customers'],
    ip_block: ['ip_block'],
  },
};

export const SECTION_DEFAULTS = {
  products: { activeProductPage: 'product_manage' },
  supplier: { activeSupplierPage: 'supplier_list' },
  purchase: { activePurchasePage: 'purchase_list' },
  landing: { activeLandingPage: 'landing_manage' },
  admin: { activeAdminPage: 'admin_user' },
  customers: { activeCustomersPage: 'customer_list' },
  website: { activeWebsitePage: 'general_setting' },
  api: { activeApiPage: 'courier_api' },
  marketing: { activeMarketingPage: 'tag_manager' },
  blogs: { activeBlogsPage: 'blog' },
  banner: { activeBannerPage: 'banner_category' },
  expense: { activeExpensePage: 'expense_categories' },
  reports: { activeReportsPage: 'stock_report' },
};

const SUBPAGE_STATE_BY_PAGE = {
  landing: 'activeLandingPage',
  admin: 'activeAdminPage',
  customers: 'activeCustomersPage',
};

export const FIRST_SUBPAGE_BY_PERMISSION = {
  activeLandingPage: [
    ['landing_page', 'landing_manage'],
  ],
  activeAdminPage: [
    ['admin_user', 'admin_user'],
    ['admin_roles', 'admin_roles'],
    ['admin_permissions', 'admin_permissions'],
  ],
  activeCustomersPage: [
    ['customers', 'customer_list'],
    ['ip_block', 'ip_block'],
  ],
};

export const NAVIGATION_ORDER = [
  ['dashboard', { activePage: 'dashboard' }],
  ['orders', { activePage: 'orders', activeOrderStatus: 'all' }],
  ['products', { activePage: 'products', activeProductPage: 'product_manage' }],
  ['supplier', { activePage: 'supplier', activeSupplierPage: 'supplier_list' }],
  ['purchase', { activePage: 'purchase', activePurchasePage: 'purchase_list' }],
  ['landing_page', { activePage: 'landing', activeLandingPage: 'landing_manage' }],
  ['admin_user', { activePage: 'admin', activeAdminPage: 'admin_user' }],
  ['admin_roles', { activePage: 'admin', activeAdminPage: 'admin_roles' }],
  ['admin_permissions', { activePage: 'admin', activeAdminPage: 'admin_permissions' }],
  ['customers', { activePage: 'customers', activeCustomersPage: 'customer_list' }],
  ['ip_block', { activePage: 'customers', activeCustomersPage: 'ip_block' }],
  ['website_setting', { activePage: 'website', activeWebsitePage: 'general_setting' }],
  ['api_integration', { activePage: 'api', activeApiPage: 'courier_api' }],
  ['marketing_tools', { activePage: 'marketing', activeMarketingPage: 'tag_manager' }],
  ['blogs', { activePage: 'blogs', activeBlogsPage: 'blog' }],
  ['banner_ads', { activePage: 'banner', activeBannerPage: 'banner_category' }],
  ['expense', { activePage: 'expense', activeExpensePage: 'expense_categories' }],
  ['reports', { activePage: 'reports', activeReportsPage: 'stock_report' }],
];

export function getPermissionSet(user) {
  const role = normalize(user?.role).replace(/[\s_-]+/g, '');
  if (PRIVILEGED_ROLES.has(role) || role === 'superadmin') {
    return new Set([
      ...NAVIGATION_ORDER.map(([permission]) => permission),
      'cache_clear',
    ]);
  }
  return new Set((user?.menuPermissions || []).map(normalizePermission).filter(Boolean));
}

export function hasAnyPermission(permissionSet, permissions = []) {
  return permissions.some((permission) => permissionSet.has(normalizePermission(permission)));
}

export function hasPermission(permissionSet, permission) {
  return permissionSet.has(normalizePermission(permission));
}

export function getFirstAllowedNavigation(permissionSet) {
  const match = NAVIGATION_ORDER.find(([permission]) => hasPermission(permissionSet, permission));
  return match ? match[1] : null;
}

function withPermittedSubpage(state, permissionSet) {
  const stateKey = SUBPAGE_STATE_BY_PAGE[state.activePage];
  if (!stateKey) return state;

  const pagePermissions = SUBPAGE_PERMISSION_MAP[stateKey]?.[state[stateKey]];
  if (!pagePermissions || hasAnyPermission(permissionSet, pagePermissions)) return state;

  const fallback = FIRST_SUBPAGE_BY_PERMISSION[stateKey]?.find(([permission]) =>
    hasPermission(permissionSet, permission),
  );

  return fallback ? { ...state, [stateKey]: fallback[1] } : state;
}

export function normalizeNavigationForPermissions(state, permissionSet) {
  if (!permissionSet) return state;
  if (!permissionSet.size) return state;
  if (hasAnyPermission(permissionSet, PAGE_PERMISSION_MAP[state.activePage] || [])) {
    return withPermittedSubpage(state, permissionSet);
  }
  const fallback = getFirstAllowedNavigation(permissionSet);
  return fallback ? { ...state, ...fallback } : state;
}

export function isNavigationAllowed(state, permissionSet) {
  if (!permissionSet) return true;
  if (!permissionSet.size) return false;
  if (!hasAnyPermission(permissionSet, PAGE_PERMISSION_MAP[state.activePage] || [])) return false;

  const stateKey = SUBPAGE_STATE_BY_PAGE[state.activePage];
  if (!stateKey) return true;

  const permissions = SUBPAGE_PERMISSION_MAP[stateKey]?.[state[stateKey]];
  return !permissions || hasAnyPermission(permissionSet, permissions);
}
