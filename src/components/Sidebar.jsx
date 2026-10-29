import { useEffect, useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Truck, ShoppingBag,
  Globe, Shield, Users, Settings, Zap, Megaphone, BookOpen,
  Image, DollarSign, BarChart2, RefreshCw, ChevronRight, ChevronDown,
  List, Clock, Box, CheckCircle, XCircle, RotateCcw, PauseCircle,
  Send, CheckSquare, AlertCircle, Tag, Layers, GitBranch, Palette,
  Sliders, Barcode, Star, Grid, UserPlus, CreditCard, Wallet,
  User, KeyRound, Lock,
  Ban, SlidersHorizontal, Share2, Phone, Truck as TruckIcon, CircleDot, FilePlus,
  Bike, Banknote, MessageSquare, ShieldAlert,
  Cpu, Ticket, LayoutGrid, Activity, FileText, Folder, TrendingUp,
  PanelBottom, CalendarClock,
  Gift, X,
} from 'lucide-react';
import { orderStatusService, siteSettingService } from '../services/websiteService';
import { applyDocumentFavicon, getFavicon, getLogo, getSiteName, normalizeSettingData } from '../utils/siteBranding';
import { normalizeOrderStatuses } from '../utils/orderStatuses';
import { cacheService } from '../services/cacheService';
import { useAuth } from '../context/AuthContext';
import { getPermissionSet, hasAnyPermission, hasPermission } from '../utils/permissions';

// ── Orders submenu ──────────────────────────────────────────
const orderSubMenuItems = [
  { key: 'all', label: 'All Orders', icon: List, color: 'text-cyan-400' },
  { key: 'pre_order', label: 'Pre Order', icon: CalendarClock, color: 'text-pink-400' },
  { key: 'pending', label: 'Pending', icon: Clock, color: 'text-blue-400' },
  { key: 'packaging', label: 'Packaging', icon: Box, color: 'text-purple-400' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-teal-400' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-400' },
  { key: 'returned', label: 'Returned', icon: RotateCcw, color: 'text-amber-400' },
  { key: 'on_hold', label: 'On Hold', icon: PauseCircle, color: 'text-gray-400' },
  { key: 'in_courier', label: 'In Courier', icon: Send, color: 'text-indigo-400' },
  { key: 'delivered', label: 'Delivered', icon: CheckSquare, color: 'text-green-400' },
  { key: 'incomplete', label: 'Incomplete', icon: AlertCircle, color: 'text-orange-400' },
];

const ORDER_STATUS_ICONS = {
  pre_order: CalendarClock,
  pending: Clock,
  packaging: Box,
  confirmed: CheckCircle,
  cancelled: XCircle,
  returned: RotateCcw,
  on_hold: PauseCircle,
  in_courier: Send,
  delivered: CheckSquare,
  incomplete: AlertCircle,
};

const ORDER_STATUS_ICON_COLORS = [
  'text-blue-400',
  'text-purple-400',
  'text-teal-400',
  'text-red-400',
  'text-amber-400',
  'text-gray-400',
  'text-indigo-400',
  'text-green-400',
  'text-orange-400',
];

// ── Supplier submenu ─────────────────────────────────────────
const supplierSubMenuItems = [
  { key: 'supplier_list', label: 'Supplier List', icon: List, color: 'text-cyan-400' },
  { key: 'supplier_add', label: 'Supplier Add', icon: UserPlus, color: 'text-green-400' },
  { key: 'payment_add', label: 'Payment Add', icon: CreditCard, color: 'text-purple-400' },
  { key: 'payment_list', label: 'Payment List', icon: Wallet, color: 'text-amber-400' },
];

// ── Admin & Permission submenu ────────────────────────────────
const adminSubMenuItems = [
  { key: 'admin_user',        label: 'User',        icon: User,     color: 'text-blue-400'   },
  { key: 'admin_roles',       label: 'Roles',       icon: KeyRound, color: 'text-purple-400' },
  { key: 'admin_permissions', label: 'Permissions', icon: Lock,     color: 'text-amber-400'  },
];

// ── Customers submenu ─────────────────────────────────────────
const customersSubMenuItems = [
  { key: 'customer_list', label: 'Customer List', icon: Users,  color: 'text-cyan-400'  },
  { key: 'ip_block',      label: 'IP Block',      icon: Ban,    color: 'text-red-400'   },
];

// ── Website Setting submenu ───────────────────────────────────
const websiteSettingSubMenuItems = [
  { key: 'general_setting',  label: 'General Setting',  icon: SlidersHorizontal, color: 'text-blue-400'   },
  { key: 'order_block',      label: 'Order Block',      icon: ShieldAlert,       color: 'text-red-400'    },
  { key: 'website_footer',   label: 'Footer',           icon: PanelBottom,       color: 'text-amber-400'  },
  { key: 'customer_reward',  label: 'Customer Reward',  icon: Gift,              color: 'text-orange-400' },
  { key: 'social_media',     label: 'Social Media',     icon: Share2,            color: 'text-pink-400'   },
  { key: 'contact',          label: 'Contact',          icon: Phone,             color: 'text-green-400'  },
  { key: 'delivery_area',    label: 'Delivery Area',    icon: TruckIcon,         color: 'text-amber-400'  },
  { key: 'order_status',     label: 'Order Status',     icon: CircleDot,         color: 'text-purple-400' },
  { key: 'create_page',      label: 'Create Page',      icon: FilePlus,          color: 'text-teal-400'   },
];

// ── API Integration submenu ───────────────────────────────────
const apiSubMenuItems = [
  { key: 'courier_api',      label: 'Courier API',       icon: Bike,         color: 'text-cyan-400'   },
  { key: 'payment_gateway',  label: 'Payment Gateway',   icon: Banknote,     color: 'text-green-400'  },
  { key: 'sms_gateway',      label: 'SMS Gateway',       icon: MessageSquare, color: 'text-purple-400' },
  { key: 'fraud_checker_api',label: 'Fraud Checker API', icon: ShieldAlert,  color: 'text-red-400'    },
];

// ── Marketing Tools submenu ───────────────────────────────────
const marketingSubMenuItems = [
  { key: 'tag_manager',       label: 'Tag Manager',       icon: Tag,        color: 'text-blue-400'   },
  { key: 'facebook_pixels',   label: 'Facebook Pixels',   icon: Cpu,        color: 'text-indigo-400' },
  { key: 'tiktok_pixels',     label: 'TikTok Pixel',      icon: Activity,   color: 'text-pink-400'   },
  { key: 'google_ads',        label: 'Google Ads',        icon: TrendingUp, color: 'text-amber-400'  },
  { key: 'coupon_code',       label: 'Coupon Code',       icon: Ticket,     color: 'text-green-400'  },
  { key: 'sms_marketing',     label: 'SMS Marketing',     icon: MessageSquare, color: 'text-purple-400' },
  { key: 'facebook_catalogue',label: 'Facebook Catalogue',icon: LayoutGrid, color: 'text-cyan-400'   },
  { key: 'visitor_reports',   label: 'Visitor Reports',   icon: Activity,   color: 'text-amber-400'  },
];

// ── Blogs submenu ─────────────────────────────────────────────
const blogsSubMenuItems = [
  { key: 'blog', label: 'Blog', icon: FileText, color: 'text-teal-400' },
];

// ── Banner & Ads submenu ──────────────────────────────────────
const bannerSubMenuItems = [
  { key: 'banner_category', label: 'Banner Category', icon: Folder,      color: 'text-purple-400' },
  { key: 'banner_ads',      label: 'Banner & Ads',    icon: Image,       color: 'text-pink-400'   },
];

// ── Expense submenu ───────────────────────────────────────────
const expenseSubMenuItems = [
  { key: 'expense_categories', label: 'Expense Categories', icon: Tag,       color: 'text-purple-400' },
  { key: 'expense',            label: 'Expense',            icon: DollarSign, color: 'text-green-400'  },
];

// ── Reports submenu ───────────────────────────────────────────
const reportsSubMenuItems = [
  { key: 'stock_report',       label: 'Stock Report',       icon: BarChart2,  color: 'text-blue-400'   },
  { key: 'stock_alert_report', label: 'Stock Alert Report', icon: AlertCircle,color: 'text-red-400'    },
  { key: 'purchase_report',    label: 'Purchase Report',    icon: ShoppingBag,color: 'text-amber-400'  },
  { key: 'order_reports',      label: 'Order Reports',      icon: List,       color: 'text-cyan-400'   },
  { key: 'sales_reports',      label: 'Sales Reports',      icon: Activity,   color: 'text-green-400'  },
  { key: 'expense_reports',    label: 'Expense Reports',    icon: FileText,   color: 'text-purple-400' },
  { key: 'loss_profit',        label: 'Loss/Profit',        icon: TrendingUp, color: 'text-teal-400'   },
];

// ── Purchase submenu ─────────────────────────────────────────
const purchaseSubMenuItems = [
  { key: 'purchase_list', label: 'Purchase List', icon: List,     color: 'text-cyan-400'  },
  { key: 'purchase_add',  label: 'Add Purchase',  icon: ShoppingBag, color: 'text-green-400' },
];

// ── Products submenu ─────────────────────────────────────────
const productSubMenuItems = [
  { key: 'product_manage', label: 'Product Manage', icon: Grid, color: 'text-blue-400' },
  { key: 'categories', label: 'Categories', icon: Tag, color: 'text-purple-400' },
  { key: 'subcategories', label: 'Subcategories', icon: Layers, color: 'text-cyan-400' },
  { key: 'childcategories', label: 'Childcategories', icon: GitBranch, color: 'text-teal-400' },
  { key: 'brands', label: 'Brands', icon: CheckCircle, color: 'text-amber-400' },
  { key: 'colors', label: 'Colors', icon: Palette, color: 'text-pink-400' },
  { key: 'attribute', label: 'Attribute', icon: Sliders, color: 'text-green-400' },
  { key: 'barcode', label: 'Barcode', icon: Barcode, color: 'text-orange-400' },
  { key: 'reviews', label: 'Reviews', icon: Star, color: 'text-yellow-400' },
  { key: 'combo_offer', label: 'Combo Offer', icon: Gift, color: 'text-rose-400' },
];

export default function Sidebar({ activePage, onNavigate, activeOrderStatus, onOrderStatusChange, orderCounts = {}, activeProductPage, onProductPageChange, activeSupplierPage, onSupplierPageChange, activePurchasePage, onPurchasePageChange, onLandingPageChange, activeAdminPage, onAdminPageChange, activeCustomersPage, onCustomersPageChange, activeWebsitePage, onWebsitePageChange, activeApiPage, onApiPageChange, activeMarketingPage, onMarketingPageChange, activeBlogsPage, onBlogsPageChange, activeBannerPage, onBannerPageChange, activeExpensePage, onExpensePageChange, activeReportsPage, onReportsPageChange, siteSettings: externalSiteSettings, mobileOpen = false, onMobileClose }) {
  const { user } = useAuth();
  const [siteSettings, setSiteSettings] = useState(externalSiteSettings || null);
  const [dynamicOrderStatuses, setDynamicOrderStatuses] = useState(() => normalizeOrderStatuses());
  const [ordersOpen, setOrdersOpen] = useState(activePage === 'orders');
  const [productsOpen, setProductsOpen] = useState(activePage === 'products');
  const [supplierOpen, setSupplierOpen] = useState(activePage === 'supplier');
  const [purchaseOpen, setPurchaseOpen] = useState(activePage === 'purchase');
  const [adminOpen, setAdminOpen] = useState(activePage === 'admin');
  const [customersOpen, setCustomersOpen] = useState(activePage === 'customers');
  const [websiteOpen, setWebsiteOpen] = useState(activePage === 'website');
  const [apiOpen, setApiOpen] = useState(activePage === 'api');
  const [marketingOpen, setMarketingOpen] = useState(activePage === 'marketing');
  const [blogsOpen, setBlogsOpen] = useState(activePage === 'blogs');
  const [bannerOpen, setBannerOpen] = useState(activePage === 'banner');
  const [expenseOpen, setExpenseOpen] = useState(activePage === 'expense');
  const [reportsOpen, setReportsOpen] = useState(activePage === 'reports');
  const [cacheClearing, setCacheClearing] = useState(false);
  const currentSettings = externalSiteSettings || siteSettings;
  const currentLogo = getLogo(currentSettings);
  const siteName = getSiteName(currentSettings);
  const permissionSet = getPermissionSet(user);
  const can = (permissions) => hasAnyPermission(permissionSet, Array.isArray(permissions) ? permissions : [permissions]);
  const filteredAdminSubMenuItems = adminSubMenuItems.filter((item) => can(item.key));
  const filteredCustomersSubMenuItems = customersSubMenuItems.filter((item) => {
    if (item.key === 'ip_block') return can('ip_block');
    return can('customers');
  });
  const dynamicOrderSubMenuItems = [
    orderSubMenuItems[0],
    ...dynamicOrderStatuses.map((status, index) => ({
      key: status.key,
      label: status.label,
      icon: ORDER_STATUS_ICONS[status.key] || CircleDot,
      color: orderSubMenuItems.find((item) => item.key === status.key)?.color || ORDER_STATUS_ICON_COLORS[index % ORDER_STATUS_ICON_COLORS.length],
    })),
  ];

  async function handleCacheClear() {
    if (cacheClearing || !window.confirm('Application cache clear করবেন?')) return;
    setCacheClearing(true);
    try {
      await cacheService.clear();
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((key) => window.caches.delete(key)));
      }
      sessionStorage.clear();
      window.dispatchEvent(new CustomEvent('app-cache:cleared'));
      window.alert('Cache successfully cleared.');
      window.location.reload();
    } catch (error) {
      window.alert(error.message || 'Cache clear failed.');
      setCacheClearing(false);
    }
  }

  useEffect(() => {
    let active = true;
    const applySettings = (data) => {
      if (!active) return;
      const normalized = normalizeSettingData(data);
      setSiteSettings(normalized || null);
      applyDocumentFavicon(getFavicon(normalized));
    };
    siteSettingService.get('general')
      .then((res) => {
        applySettings(res.data?.data || null);
      })
      .catch(() => {});
    const handleSettingsUpdate = (event) => applySettings(event.detail);
    window.addEventListener('site-settings:update', handleSettingsUpdate);
    return () => {
      active = false;
      window.removeEventListener('site-settings:update', handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    let active = true;
    orderStatusService.getAll({ limit: 100 })
      .then((res) => {
        if (active) setDynamicOrderStatuses(normalizeOrderStatuses(res.data || []));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  function handleOrdersClick() {
    const next = !ordersOpen;
    setOrdersOpen(next);
    if (next) { onNavigate('orders'); onOrderStatusChange('all'); }
  }

  function handleOrderSub(key) { onNavigate('orders'); onOrderStatusChange(key); }

  function handleProductsClick() {
    const next = !productsOpen;
    setProductsOpen(next);
    if (next) { onNavigate('products'); onProductPageChange('product_manage'); }
  }

  function handleProductSub(key) { onNavigate('products'); onProductPageChange(key); }

  function handleSupplierClick() {
    const next = !supplierOpen;
    setSupplierOpen(next);
    if (next) { onNavigate('supplier'); onSupplierPageChange('supplier_list'); }
  }

  function handleSupplierSub(key) { onNavigate('supplier'); onSupplierPageChange(key); }

  function handlePurchaseClick() {
    const next = !purchaseOpen;
    setPurchaseOpen(next);
    if (next) { onNavigate('purchase'); onPurchasePageChange('purchase_list'); }
  }

  function handlePurchaseSub(key) { onNavigate('purchase'); onPurchasePageChange(key); }

  function handleLandingClick() { onNavigate('landing'); onLandingPageChange('landing_manage'); }

  function handleAdminClick() {
    const next = !adminOpen;
    setAdminOpen(next);
    if (next) { onNavigate('admin'); onAdminPageChange(filteredAdminSubMenuItems[0]?.key || 'admin_user'); }
  }
  function handleAdminSub(key) { onNavigate('admin'); onAdminPageChange(key); }

  function handleCustomersClick() {
    const next = !customersOpen;
    setCustomersOpen(next);
    if (next) { onNavigate('customers'); onCustomersPageChange(filteredCustomersSubMenuItems[0]?.key || 'customer_list'); }
  }
  function handleCustomersSub(key) { onNavigate('customers'); onCustomersPageChange(key); }

  function handleWebsiteClick() {
    const next = !websiteOpen;
    setWebsiteOpen(next);
    if (next) { onNavigate('website'); onWebsitePageChange('general_setting'); }
  }
  function handleWebsiteSub(key) { onNavigate('website'); onWebsitePageChange(key); }

  function handleApiClick() {
    const next = !apiOpen;
    setApiOpen(next);
    if (next) { onNavigate('api'); onApiPageChange('courier_api'); }
  }
  function handleApiSub(key) { onNavigate('api'); onApiPageChange(key); }

  function handleMarketingClick() {
    const next = !marketingOpen;
    setMarketingOpen(next);
    if (next) { onNavigate('marketing'); onMarketingPageChange('tag_manager'); }
  }
  function handleMarketingSub(key) { onNavigate('marketing'); onMarketingPageChange(key); }

  function handleBlogsClick() {
    const next = !blogsOpen;
    setBlogsOpen(next);
    if (next) { onNavigate('blogs'); onBlogsPageChange('blog'); }
  }
  function handleBlogsSub(key) { onNavigate('blogs'); onBlogsPageChange(key); }

  function handleBannerClick() {
    const next = !bannerOpen;
    setBannerOpen(next);
    if (next) { onNavigate('banner'); onBannerPageChange('banner_category'); }
  }
  function handleBannerSub(key) { onNavigate('banner'); onBannerPageChange(key); }

  function handleExpenseClick() {
    const next = !expenseOpen;
    setExpenseOpen(next);
    if (next) { onNavigate('expense'); onExpensePageChange('expense_categories'); }
  }
  function handleExpenseSub(key) { onNavigate('expense'); onExpensePageChange(key); }

  function handleReportsClick() {
    const next = !reportsOpen;
    setReportsOpen(next);
    if (next) { onNavigate('reports'); onReportsPageChange('stock_report'); }
  }
  function handleReportsSub(key) { onNavigate('reports'); onReportsPageChange(key); }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-56 min-h-screen flex-shrink-0 flex-col overflow-y-auto transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{ background: 'linear-gradient(180deg, #062635 0%, #0B3A4D 52%, #135772 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-blue-800/70 flex-shrink-0">
        {/* The whole logo (it already carries the shop name), uncropped */}
        {currentLogo && (
          <div className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-lg bg-white px-2 shadow-sm">
            <img src={currentLogo} alt={siteName || 'Logo'} className="max-h-10 max-w-full object-contain" />
          </div>
        )}
        {!currentLogo && siteName && (
          <div>
            <div className="text-white font-bold text-base leading-tight">{siteName}</div>
          </div>
        )}
        <button
          type="button"
          onClick={onMobileClose}
          className="ml-auto rounded p-1 text-blue-100 hover:bg-white/10 md:hidden"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="py-2 flex-1">
        {/* Dashboard */}
        {hasPermission(permissionSet, 'dashboard') && (
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activePage === 'dashboard'} onClick={() => onNavigate('dashboard')} />
        )}

        {/* ── Orders ── */}
        {hasPermission(permissionSet, 'orders') && (
        <ExpandableItem
          icon={ShoppingCart}
          label="Orders"
          isOpen={ordersOpen}
          isActive={activePage === 'orders'}
          badge={orderCounts.all ?? 0}
          onClick={handleOrdersClick}
        >
          {dynamicOrderSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              badge={orderCounts[item.key] ?? 0}
              isActive={activePage === 'orders' && activeOrderStatus === item.key}
              onClick={() => handleOrderSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}

        {/* ── Products ── */}
        {hasPermission(permissionSet, 'products') && (
        <ExpandableItem
          icon={Package}
          label="Products"
          isOpen={productsOpen}
          isActive={activePage === 'products'}
          onClick={handleProductsClick}
        >
          {productSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={activePage === 'products' && activeProductPage === item.key}
              onClick={() => handleProductSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}

        {/* ── Supplier ── */}
        {hasPermission(permissionSet, 'supplier') && (
        <ExpandableItem
          icon={Truck}
          label="Supplier"
          isOpen={supplierOpen}
          isActive={activePage === 'supplier'}
          onClick={handleSupplierClick}
        >
          {supplierSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={activePage === 'supplier' && activeSupplierPage === item.key}
              onClick={() => handleSupplierSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}
        {/* ── Purchase ── */}
        {hasPermission(permissionSet, 'purchase') && (
        <ExpandableItem
          icon={ShoppingBag}
          label="Purchase"
          isOpen={purchaseOpen}
          isActive={activePage === 'purchase'}
          onClick={handlePurchaseClick}
        >
          {purchaseSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={activePage === 'purchase' && activePurchasePage === item.key}
              onClick={() => handlePurchaseSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}
        {/* ── Landing Page ── */}
        {can('landing_page') && (
          <SidebarItem icon={Globe} label="Landing Page" active={activePage === 'landing'} onClick={handleLandingClick} />
        )}

        {/* ── Admin & Permission ── */}
        {filteredAdminSubMenuItems.length > 0 && (
        <ExpandableItem
          icon={Shield}
          label="Admin & Permission"
          isOpen={adminOpen}
          isActive={activePage === 'admin'}
          onClick={handleAdminClick}
        >
          {filteredAdminSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={activePage === 'admin' && activeAdminPage === item.key}
              onClick={() => handleAdminSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}
        {/* ── Customers ── */}
        {filteredCustomersSubMenuItems.length > 0 && (
        <ExpandableItem
          icon={Users}
          label="Customers"
          isOpen={customersOpen}
          isActive={activePage === 'customers'}
          onClick={handleCustomersClick}
        >
          {filteredCustomersSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={activePage === 'customers' && activeCustomersPage === item.key}
              onClick={() => handleCustomersSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}

        {/* ── Website Setting ── */}
        {hasPermission(permissionSet, 'website_setting') && (
        <ExpandableItem
          icon={Settings}
          label="Website Setting"
          isOpen={websiteOpen}
          isActive={activePage === 'website'}
          onClick={handleWebsiteClick}
        >
          {websiteSettingSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={activePage === 'website' && activeWebsitePage === item.key}
              onClick={() => handleWebsiteSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}

        {/* ── API Integration ── */}
        {hasPermission(permissionSet, 'api_integration') && (
        <ExpandableItem
          icon={Zap}
          label="API Integration"
          isOpen={apiOpen}
          isActive={activePage === 'api'}
          onClick={handleApiClick}
        >
          {apiSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={activePage === 'api' && activeApiPage === item.key}
              onClick={() => handleApiSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}
        {/* ── Marketing Tools ── */}
        {hasPermission(permissionSet, 'marketing_tools') && (
        <ExpandableItem
          icon={Megaphone}
          label="Marketing Tools"
          isOpen={marketingOpen}
          isActive={activePage === 'marketing'}
          onClick={handleMarketingClick}
        >
          {marketingSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={activePage === 'marketing' && activeMarketingPage === item.key}
              onClick={() => handleMarketingSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}

        {/* ── Blogs ── */}
        {hasPermission(permissionSet, 'blogs') && (
        <ExpandableItem
          icon={BookOpen}
          label="Blogs"
          isOpen={blogsOpen}
          isActive={activePage === 'blogs'}
          onClick={handleBlogsClick}
        >
          {blogsSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={activePage === 'blogs' && activeBlogsPage === item.key}
              onClick={() => handleBlogsSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}

        {/* ── Banner & Ads ── */}
        {hasPermission(permissionSet, 'banner_ads') && (
        <ExpandableItem
          icon={Image}
          label="Banner & Ads"
          isOpen={bannerOpen}
          isActive={activePage === 'banner'}
          onClick={handleBannerClick}
        >
          {bannerSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={activePage === 'banner' && activeBannerPage === item.key}
              onClick={() => handleBannerSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}
        {/* ── Expense ── */}
        {hasPermission(permissionSet, 'expense') && (
        <ExpandableItem
          icon={DollarSign}
          label="Expense"
          isOpen={expenseOpen}
          isActive={activePage === 'expense'}
          onClick={handleExpenseClick}
        >
          {expenseSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={activePage === 'expense' && activeExpensePage === item.key}
              onClick={() => handleExpenseSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}

        {/* ── Reports ── */}
        {hasPermission(permissionSet, 'reports') && (
        <ExpandableItem
          icon={BarChart2}
          label="Reports"
          isOpen={reportsOpen}
          isActive={activePage === 'reports'}
          onClick={handleReportsClick}
        >
          {reportsSubMenuItems.map((item) => (
            <SubItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={activePage === 'reports' && activeReportsPage === item.key}
              onClick={() => handleReportsSub(item.key)}
            />
          ))}
        </ExpandableItem>
        )}
        {hasPermission(permissionSet, 'cache_clear') && (
          <SidebarItem icon={RefreshCw} label={cacheClearing ? "Clearing..." : "Cache Clear"} onClick={handleCacheClear} />
        )}
      </nav>
    </aside>
  );
}

/* ── Reusable pieces ── */

function ExpandableItem({ icon: Icon, label, isOpen, isActive, badge, onClick, children }) {
  return (
    <div>
      <div
        onClick={onClick}
        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer group transition-all duration-150 ${
          isActive ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-inner' : 'text-blue-100 hover:bg-white/10 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className={isActive ? 'text-orange-200' : 'text-blue-200 group-hover:text-orange-200'} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {badge !== undefined && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
          )}
          {isOpen ? <ChevronDown size={13} className="opacity-60" /> : <ChevronRight size={13} className="opacity-60" />}
        </div>
      </div>
      {isOpen && (
        <div className="bg-blue-950/35 border-l-2 border-orange-400 ml-4">
          {children}
        </div>
      )}
    </div>
  );
}

function SubItem({ icon: Icon, label, color, badge, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-100 ${
        isActive ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon size={13} className={isActive ? 'text-white' : color} />
        <span className="text-xs">{label}</span>
      </div>
      {badge !== undefined && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-blue-800/80 text-blue-100'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, hasChild, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-2.5 cursor-pointer group transition-all duration-150 ${
        active ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-inner' : 'text-blue-100 hover:bg-white/10 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className={active ? 'text-orange-200' : 'text-blue-200 group-hover:text-orange-200'} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {hasChild && <ChevronRight size={14} className="opacity-60" />}
    </div>
  );
}
