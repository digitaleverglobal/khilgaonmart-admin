import { useCheckoutSession } from "../../utils/useCheckoutSession";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  Package,
  Phone,
  ShoppingCart,
  Star,
  Truck,
  User,
} from "lucide-react";
import heroImage from "../../assets/hero.png";
import sslcommerzImage from "../../assets/sslcommerz.png";
import { landingPageService } from "../../services/landingPageService";
import { orderService } from "../../services/orderService";
import {
  getTrackingClickData,
  setTrackingSuspended,
  trackMarketingEvent,
} from "../../services/trackingService";
import {
  siteSettingService,
  websitePageService,
} from "../../services/websiteService";
import { imageUrl } from "../../utils/assetUrl";

// Same rules as the storefront landing page and the order API (regularData.deliveryInside/Outside):
// at least 80/130, and free when every selected product ships free.
function getShippingOptions(campaign, freeShipping = false) {
  const regularData = parseObject(campaign?.regularData);
  return [
    { id: "inside", label: "Inside Dhaka", banglaLabel: "ঢাকার ভিতরে", charge: Math.max(toNumber(regularData.deliveryInside, 0), 80) },
    { id: "outside", label: "Outside Dhaka", banglaLabel: "ঢাকার বাইরে", charge: Math.max(toNumber(regularData.deliveryOutside, 0), 130) },
  ].map((option) =>
    freeShipping
      ? { ...option, label: `${option.label} (Free Delivery)`, charge: 0, free: true }
      : option,
  );
}

const DEVICE_ID_KEY = "holydeen_device_id";

function getLandingDeviceId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

function normalizeBangladeshPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (/^01\d{9}$/.test(digits)) return digits;
  if (/^8801\d{9}$/.test(digits)) return `0${digits.slice(3)}`;
  return "";
}

function trackLandingContactClick(label, value) {
  void trackMarketingEvent("Contact", {
    customData: {
      content_name: label || "Landing contact",
      content_type: "contact",
      contact_value: value || "",
      currency: "BDT",
      value: 0,
    },
  });
}

const WINNERS = [
  "রাকিবুল ইসলাম",
  "ফারহানা তানিয়া",
  "মোঃ রনি",
  "মাহিয়া ইমরান",
  "মাকসুদা তামান্না",
  "সোহাগ হোসেন",
  "মোঃ রুবেল",
  "সেলিম উদ্দিন",
  "আসিফ মাহমুদ",
  "রবিন হাসান",
  "প্রান্তির রহমান",
];

function isRegularLandingPage(campaign) {
  const pageType = String(campaign?.pageType || "").trim().toLowerCase();
  const template = String(campaign?.template || campaign?.campaignTemplate || "")
    .trim()
    .toLowerCase();
  if (isMurdaMoshariOffer(campaign)) return false;
  return pageType === "regular" || template === "regular";
}

function isMurdaMoshariOffer(campaign) {
  const haystack = [
    campaign?.template,
    campaign?.campaignTemplate,
    campaign?.title,
    campaign?.campaignTitle,
    campaign?.product,
    campaign?.productName,
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  return (
    haystack.includes("murda moshari") ||
    haystack.includes("মুর্দা মশারি") ||
    haystack.includes("morda moshari")
  );
}

function parseObject(value) {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getVideoEmbedUrl(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/embed/")) return raw;
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : raw;
    }
  } catch {
    return raw;
  }

  return raw;
}

export default function LandingPageViewPage({ campaign, trackingEnabled = true }) {
  // Declared first so it runs before the PageView/ViewContent effect below.
  useEffect(() => {
    setTrackingSuspended(!trackingEnabled);
    return () => setTrackingSuspended(false);
  }, [trackingEnabled]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    shipping: "inside",
    payment: "cod",
    coupon: "",
    agree: false,
  });
  const [landingPages, setLandingPages] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);
  const [showTrackOrder, setShowTrackOrder] = useState(false);
  const [footerSettings, setFooterSettings] = useState(null);
  const [footerPages, setFooterPages] = useState([]);
  const checkout = useCheckoutSession();
  const incompleteOrderIdRef = useRef(null);
  const incompletePhoneRef = useRef("");
  const leadTrackedOrderIdRef = useRef(null);
  const viewedCampaignRef = useRef(null);
  const checkoutCampaignRef = useRef(null);

  const productName = getProductName(campaign);
  const title =
    campaign?.campaignTitle || campaign?.title || "Attar & Perfume Combo Pack";
  const subTitle =
    campaign?.subTitle || "অল্প সময়ে ঘরে বসে প্রিমিয়াম সুগন্ধির কালেকশন পান";
  const regularPage = isRegularLandingPage(campaign);
  const price = toNumber(campaign?.price, regularPage ? 4100 : 699);
  const originalPrice = toNumber(campaign?.originalPrice, regularPage ? 5600 : 1500);
  const phone =
    String(campaign?.phone || "").trim() ||
    footerSettings?.header?.supportPhone ||
    footerSettings?.footer?.supportPhone ||
    footerSettings?.contact?.hotlineNumber ||
    footerSettings?.contact?.phoneNumber ||
    footerSettings?.contact?.phone ||
    "";
  const shortDescription = stripHtml(campaign?.shortDescription || "");
  const descriptionTitle =
    campaign?.descriptionTitle || "এই ক্যাম্পেইনের বিশেষ অফার";
  const bannerImage = campaign?.bannerImageUrl || heroImage;
  const prizeImageSource = campaign?.prizeImageUrl || "";
  const reviewImages = parseImages(campaign?.reviewImages);
  // The public landing API sends free-shipping product ids; the admin preview loads them separately.
  const [fetchedFreeShippingIds, setFetchedFreeShippingIds] = useState(null);
  const freeShippingIds = campaign?.freeShippingProductIds ?? fetchedFreeShippingIds;
  const productOptions = useMemo(
    () => getLandingProductOptions(campaign, { productName, price, originalPrice, bannerImage }, freeShippingIds),
    [campaign, productName, price, originalPrice, bannerImage, freeShippingIds],
  );
  const [selectedProducts, setSelectedProducts] = useState(() =>
    initializeSelectedProducts(productOptions),
  );
  const allFreeShipping =
    selectedProducts.length > 0 && selectedProducts.every((item) => item.freeShipping);
  const shippingOptions = useMemo(
    () => getShippingOptions(campaign, allFreeShipping),
    [campaign, allFreeShipping],
  );
  const deliveryCharge =
    shippingOptions.find((option) => option.id === form.shipping)?.charge || 0;
  const productSubtotal = selectedProducts.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  const total = productSubtotal + deliveryCharge;

  useEffect(() => {
    setSelectedProducts(initializeSelectedProducts(productOptions));
  }, [productOptions]);

  useEffect(() => {
    if (!campaign?.Id || Array.isArray(campaign.freeShippingProductIds)) return undefined;
    let active = true;
    landingPageService
      .getPublicOne(campaign.Id)
      .then((res) => {
        if (active) setFetchedFreeShippingIds(res.data?.freeShippingProductIds || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [campaign?.Id, campaign?.freeShippingProductIds]);

  useEffect(() => {
    let active = true;
    landingPageService
      .getAll({ limit: 100 })
      .then((res) => {
        if (!active) return;
        setLandingPages(res.data || []);
      })
      .catch(() => {
        if (active) setLandingPages([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!trackingEnabled || !campaign?.Id || viewedCampaignRef.current === campaign.Id) return;
    viewedCampaignRef.current = campaign.Id;
    const contentId = String(campaign?.productId || campaign?.Id || "");
    const commonData = {
      content_ids: contentId ? [contentId] : [],
      content_id: contentId,
      content_type: "product",
      content_name: title,
      contents: contentId ? [{ content_id: contentId, quantity: 1, price }] : [],
      value: price,
      currency: "BDT",
    };
    void trackMarketingEvent("PageView");
    void trackMarketingEvent("ViewContent", { customData: commonData });
  }, [campaign?.Id, campaign?.productId, price, title, trackingEnabled]);

  useEffect(() => {
    let active = true;

    Promise.all([
      siteSettingService.get("general").catch(() => null),
      siteSettingService.get("contact").catch(() => null),
      siteSettingService.get("social_media").catch(() => null),
      websitePageService.getAll({ limit: 100 }).catch(() => ({ data: [] })),
      landingPageService.getPublicHeader().catch(() => null),
      landingPageService.getPublicFooter().catch(() => null),
    ]).then(
      ([generalRes, contactRes, socialRes, pageRes, headerRes, footerRes]) => {
        if (!active) return;

        setFooterSettings({
          general: normalizeSettingData(generalRes?.data?.data),
          contact: normalizeSettingData(contactRes?.data?.data),
          social: normalizeSocialMedia(socialRes?.data?.data),
          header: headerRes?.data || null,
          footer: footerRes?.data || null,
        });
        setFooterPages(
          (pageRes?.data || [])
            .filter((page) => isActiveStatus(page?.status))
            .slice(0, 4),
        );
      },
    );

    return () => {
      active = false;
    };
  }, []);

  const relatedProducts = useMemo(
    () =>
      landingPages
        .filter((page) => String(page.Id) !== String(campaign?.Id))
        .filter((page) => page.status !== false)
        .slice(0, 6)
        .map((page) => ({
          id: page.Id,
          name: page.title || page.product || "Landing Page",
          price: toNumber(page.price, 0),
          oldPrice: toNumber(page.originalPrice, 0),
          image: getCampaignBannerImage(page),
        })),
    [campaign?.Id, landingPages],
  );

  function startCheckout() {
    if (!trackingEnabled || checkoutCampaignRef.current === campaign?.Id) return;
    checkoutCampaignRef.current = campaign?.Id;
    void trackMarketingEvent("InitiateCheckout", { enabled: trackingEnabled, customData: {
      content_ids: getSelectedOrderItems().map((item) => String(item.productId || item.id)),
      content_type: "product", value: total, currency: "BDT",
    } });
  }

  function trackAddedProduct(item, quantity = 1) {
    if (!trackingEnabled) return;
    void trackMarketingEvent("AddToCart", { enabled: trackingEnabled, customData: {
      content_ids: [String(item.productId || item.id)], content_type: "product",
      contents: [{ id: String(item.productId || item.id), quantity, item_price: item.price }],
      value: item.price * quantity, currency: "BDT",
    } });
  }

  function set(field, value) {
    startCheckout();
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function toggleProductOption(option) {
    startCheckout();
    if (!selectedProducts.some((item) => item.id === option.id)) trackAddedProduct(option);
    setSelectedProducts((current) => {
      const exists = current.some((item) => item.id === option.id);
      if (exists) {
        const next = current.filter((item) => item.id !== option.id);
        return next.length ? next : current;
      }
      return [...current, { ...option, qty: 1 }];
    });
  }

  function changeProductQty(optionId, delta) {
    startCheckout();
    const item = selectedProducts.find((entry) => entry.id === optionId);
    if (item && delta > 0) trackAddedProduct(item, delta);
    setSelectedProducts((current) =>
      current.map((item) =>
        item.id === optionId ? { ...item, qty: Math.max(1, item.qty + delta) } : item,
      ),
    );
  }

  function getSelectedOrderItems() {
    return selectedProducts.length
      ? selectedProducts
      : initializeSelectedProducts(productOptions);
  }

  function buildLandingOrderPayload({ phoneNumber } = {}) {
    const selectedItems = getSelectedOrderItems();
    const normalizedPhone = phoneNumber || normalizeBangladeshPhone(form.phone) || form.phone.trim();
    const incompleteOrderId =
      incompletePhoneRef.current === normalizedPhone ? incompleteOrderIdRef.current : null;
    const tracking = getTrackingClickData();

    // Prices and delivery charge are recalculated by the order API from this landing page.
    return {
      checkoutKey: checkout.getKey(normalizedPhone),
      ...(incompleteOrderId ? { incompleteOrderId } : {}),
      deviceId: getLandingDeviceId(),
      source: "Landing Page",
      orderSource: "Landing Page",
      customerName: form.name.trim() || "Landing Customer",
      customerPhone: normalizedPhone,
      customerAddress: form.address.trim(),
      customerDistrict: form.shipping === "outside" ? "outside" : "inside",
      paymentMethod: "cod",
      items: selectedItems.map((item) => ({
        id: Number(item.productId) || Number(campaign?.Id) || 0,
        name: item.name,
        image: item.image || "",
        price: item.price,
        qty: item.qty,
      })),
      subtotal: productSubtotal,
      deliveryCharge,
      discount: 0,
      advance: 0,
      total,
      tracking: {
        ...(tracking || {}),
        source: "Landing Page",
        landingPageId: campaign?.Id,
        landingPage: title,
      },
    };
  }

  useEffect(() => {
    if (placedOrder) return undefined;

    const normalizedPhone = normalizeBangladeshPhone(form.phone);
    if (!normalizedPhone) {
      incompleteOrderIdRef.current = null;
      incompletePhoneRef.current = "";
      leadTrackedOrderIdRef.current = null;
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      if (checkout.submitting.current) return;
      try {
        const response = await orderService.saveIncompleteOrder(
          buildLandingOrderPayload({ phoneNumber: normalizedPhone }),
        );
        const draft = response?.data || response || {};
        const draftId = draft.Id || draft.id;
        if (draftId) {
          incompleteOrderIdRef.current = draftId;
          incompletePhoneRef.current = normalizedPhone;
          if (leadTrackedOrderIdRef.current !== draftId) {
            leadTrackedOrderIdRef.current = draftId;
            void trackMarketingEvent("Lead", {
              userData: { name: form.name.trim(), phone: normalizedPhone },
              customData: {
                content_ids: getSelectedOrderItems().map((item) => String(item.productId || item.id)).filter(Boolean),
                content_name: title,
                content_type: "product",
                value: total,
                currency: "BDT",
                order_id: draft.orderId || draftId,
              },
            });
          }
        }
      } catch (error) {
        console.warn("Incomplete landing order save failed:", error?.message || error);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [
    form.name,
    form.phone,
    form.address,
    form.shipping,
    placedOrder,
    selectedProducts,
    productOptions,
    productName,
    productSubtotal,
    deliveryCharge,
    total,
    title,
  ]);

  async function handlePlaceOrder() {
    if (checkout.submitting.current || placingOrder || placedOrder) return;
    startCheckout();
    setOrderError("");
    const normalizedPhone = normalizeBangladeshPhone(form.phone);
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setOrderError(
        "Please enter your name, phone number and delivery address.",
      );
      document
        .getElementById("order-now")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!normalizedPhone) {
      setOrderError("Please enter a valid Bangladeshi phone number.");
      document
        .getElementById("order-now")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    checkout.submitting.current = true;
    setPlacingOrder(true);
    const selectedItems = getSelectedOrderItems();
    const contentId = String(selectedItems[0]?.productId || campaign?.productId || campaign?.Id || "");
    const trackingData = {
      content_ids: selectedItems.map((item) => String(item.productId || item.id)).filter(Boolean),
      content_id: contentId,
      content_type: "product",
      content_name: selectedItems.map((item) => item.name).join(", ") || title,
      contents: selectedItems.map((item) => ({
        content_id: String(item.productId || item.id),
        quantity: item.qty,
        price: item.price,
      })),
      value: total,
      currency: "BDT",
      num_items: selectedItems.reduce((sum, item) => sum + item.qty, 0),
    };
    const trackingUser = { name: form.name.trim(), phone: normalizedPhone };

    try {
      void trackMarketingEvent("AddPaymentInfo", {
        userData: trackingUser,
        customData: trackingData,
      });
      const payload = buildLandingOrderPayload({ phoneNumber: normalizedPhone });
      payload.landingTracking = { enabled: trackingEnabled, eventSourceUrl: window.location.href, customData: trackingData };
      const response = await orderService.createOrder(payload);
      const placedOrderData = response.data || payload;
      setPlacedOrder(placedOrderData);
      checkout.complete();
      incompleteOrderIdRef.current = null;
      incompletePhoneRef.current = "";
      leadTrackedOrderIdRef.current = null;
      void trackMarketingEvent("Purchase", {
        enabled: trackingEnabled,
        eventId: placedOrderData.purchaseEventId,
        server: !placedOrderData.purchaseEventId,
        userData: {
          ...trackingUser,
          customerId: placedOrderData.customerId || placedOrderData.customer?.Id,
        },
        customData: {
          ...trackingData,
          order_id: placedOrderData.orderId || placedOrderData.Id,
        },
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      checkout.submitting.current = false;
      setOrderError(err.message || "Order create failed. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  }

  const template = normalizeTemplate(
    campaign?.template || campaign?.campaignTemplate,
  );
  const viewData = {
    form,
    set,
    productName,
    title,
    subTitle,
    price,
    originalPrice,
    productOptions,
    selectedProducts,
    productSubtotal,
    toggleProductOption,
    changeProductQty,
    phone,
    shortDescription,
    descriptionTitle,
    bannerImage,
    prizeImageSource,
    reviewImages,
    deliveryCharge,
    shippingOptions,
    productOptions,
    selectedProducts,
    productSubtotal,
    toggleProductOption,
    changeProductQty,
    total,
    relatedProducts,
    placingOrder,
    orderError,
    onPlaceOrder: handlePlaceOrder,
    onTrackOrder: () => setShowTrackOrder(true),
    footerSettings,
    footerPages,
  };

  if (placedOrder) {
    return (
      <OrderSuccessPage
        order={placedOrder}
        form={form}
        productName={productName}
        productImage={bannerImage}
        price={price}
        deliveryCharge={placedOrder.deliveryCharge ?? deliveryCharge}
        total={placedOrder.total ?? total}
        phoneNumber={phone}
        onContinue={() => setPlacedOrder(null)}
        onTrack={() => {
          setPlacedOrder(null);
          setShowTrackOrder(true);
        }}
        footerSettings={footerSettings}
        footerPages={footerPages}
      />
    );
  }

  if (showTrackOrder) {
    return (
      <TrackOrderPage
        phoneNumber={phone}
        onBack={() => setShowTrackOrder(false)}
        footerSettings={footerSettings}
        footerPages={footerPages}
      />
    );
  }

  if (isMurdaMoshariOffer(campaign)) {
    return (
      <PreviewShell tone="light">
        <MurdaMoshariOfferTemplate data={viewData} campaign={campaign} />
      </PreviewShell>
    );
  }

  if (regularPage) {
    return (
      <PreviewShell tone="light">
        <RegularLandingTemplate data={viewData} campaign={campaign} />
      </PreviewShell>
    );
  }

  if (template === "Giveaway Campaign") {
    return (
      <PreviewShell tone="light">
        <GiveawayCampaignTemplate data={viewData} />
      </PreviewShell>
    );
  }

  if (template === "Template Design 2") {
    return (
      <PreviewShell tone="light">
        <TemplateDesign2 data={viewData} />
      </PreviewShell>
    );
  }

  if (template === "Template Design 3") {
    return (
      <PreviewShell tone="dark">
        <TemplateDesign3 data={viewData} />
      </PreviewShell>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaf6] text-slate-900">
      <div
        className="min-h-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 16%, rgba(211, 172, 76, 0.08) 0 48px, transparent 49px), radial-gradient(circle at 84% 20%, rgba(211, 172, 76, 0.07) 0 58px, transparent 59px), linear-gradient(90deg, rgba(248, 246, 238, 0.92), rgba(255,255,255,0.8), rgba(248,246,238,0.92))",
        }}
      >
        <TopStrip
          phone={phone}
          onTrack={() => setShowTrackOrder(true)}
          settings={footerSettings?.header}
        />

        <main className="mx-auto max-w-[1340px] px-4 pb-12">
          {footerSettings?.header?.status !== false && (
            <header className="py-4 text-center">
              {footerSettings?.header?.logoUrl ? (
                <img
                  src={footerSettings.header.logoUrl}
                  alt={footerSettings.header.logoAlt || "Website logo"}
                  className="mx-auto h-16 max-w-56 object-contain"
                />
              ) : (
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white shadow-sm">
                  W
                </div>
              )}
            </header>
          )}

          <Notice tone="yellow">
            আজকে কিনুন ৫ পিস আতর পারফিউম কম্বো প্যাকের সাথে নিশ্চিত ২ টি
            পুরস্কার
            <br />
            <span className="text-emerald-700">
              পণ্যটিতে থাকছে খুবই সাশ্রয়ী দামে সুগন্ধির কালেকশন
            </span>
          </Notice>
          <Notice tone="purple">
            কাস্টমারদের মধ্যে আগের ক্যাম্পেইনে বাইক বিজয়ী হয়েছেন
            <br />
            <span className="text-emerald-700">
              প্রতিটি অর্ডারের সাথে থাকছে আকর্ষণীয় অফার
            </span>
          </Notice>

          <div className="mt-3 text-center">
            <JumpButton targetId="order-now">অর্ডার করুন</JumpButton>
          </div>

          <section className="mx-auto mt-5 max-w-[1340px] overflow-hidden rounded border border-amber-100 bg-[#24170d] shadow-sm">
            <img
              src={bannerImage}
              alt={productName}
              className="h-[clamp(240px,42vw,560px)] w-full object-cover"
            />
          </section>

          <SectionBadge>এই ক্যাম্পেইনের পুরস্কার</SectionBadge>

          <section className="mx-auto max-w-[1340px] overflow-hidden rounded border border-slate-200 bg-sky-100 shadow-sm">
            {prizeImageSource ? (
              <img
                src={prizeImageSource}
                alt="Campaign prize"
                className="h-[clamp(240px,42vw,560px)] w-full object-cover"
              />
            ) : (
              <div className="grid min-h-[300px] items-center gap-4 bg-gradient-to-br from-sky-300 via-white to-slate-200 p-8 md:grid-cols-[0.85fr_1fr]">
                <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-700 p-5 text-center text-white shadow-xl">
                  <p className="text-sm font-bold">SCRATCH CARD</p>
                  <p className="mt-1 text-4xl font-black">R15</p>
                  <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-red-600">
                    স্বপ্নপূরণ ক্যাম্পেইন
                  </p>
                  <p className="mt-4 text-xs">
                    প্রতি অর্ডারে থাকছে পুরস্কার জেতার সুযোগ
                  </p>
                </div>
                <div className="relative min-h-[210px]">
                  <div className="absolute bottom-8 left-6 h-20 w-64 -skew-x-12 rounded-full bg-blue-800 shadow-2xl" />
                  <div className="absolute bottom-20 left-20 h-24 w-36 rounded-t-full border-[18px] border-blue-700" />
                  <div className="absolute bottom-5 left-2 h-20 w-20 rounded-full border-[14px] border-slate-950 bg-slate-700" />
                  <div className="absolute bottom-5 right-24 h-20 w-20 rounded-full border-[14px] border-slate-950 bg-slate-700" />
                  <div className="absolute right-10 top-4 rounded-full bg-white px-5 py-3 text-center text-xl font-black text-sky-700 shadow-lg">
                    স্বপ্নপূরণ
                    <span className="block text-sm text-red-500">
                      ক্যাম্পেইন
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <SectionBadge>আগের ক্যাম্পেইনের বাইক বিজয়ী</SectionBadge>

          <section className="mx-auto mt-4 max-w-[1340px] rounded border border-orange-100 bg-white/90 p-5 shadow-sm">
            <h2 className="text-center text-2xl font-black text-slate-800">
              আগের ক্যাম্পেইনের{" "}
              <span className="text-red-600">১১ জন বাইক বিজয়ী</span>
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {WINNERS.map((winner, index) => (
                <WinnerCard
                  key={winner}
                  name={winner}
                  index={index}
                  image={
                    reviewImages.length
                      ? reviewImages[index % reviewImages.length]
                      : ""
                  }
                />
              ))}
            </div>
          </section>

          <div className="mx-auto mt-5 max-w-xs rounded border border-emerald-200 bg-gradient-to-r from-rose-50 to-emerald-50 p-4 text-center shadow-sm">
            <p className="text-xs text-slate-600">
              পূর্বের মূল্য{" "}
              <span className="line-through">
                {formatMoney(originalPrice)} টাকা
              </span>
            </p>
            <p className="mt-1 text-lg font-black text-emerald-700">
              অফার মূল্য - {formatMoney(price)} টাকা
            </p>
          </div>

          <section id="order-now" className="mt-8">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">
                Complete Your Order
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Fill in your details to place your order
              </p>
            </div>

            <div className="mx-auto mt-5 grid max-w-[1340px] gap-4 md:grid-cols-[1.25fr_0.75fr]">
              <div className="space-y-4">
                <CheckoutPanel
                  title="Customer Information"
                  icon={<User size={15} />}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      label="Full Name *"
                      value={form.name}
                      onChange={(value) => set("name", value)}
                      placeholder="Enter your full name"
                    />
                    <Input
                      label="Phone Number *"
                      value={form.phone}
                      onChange={(value) => set("phone", value)}
                      placeholder="+880-XXX-XXX-XXX"
                      type="tel"
                    />
                  </div>
                  <Input
                    label="Delivery Address *"
                    value={form.address}
                    onChange={(value) => set("address", value)}
                    placeholder="e.g. house, road, city"
                  />
                </CheckoutPanel>

                <CheckoutPanel
                  title="Delivery Options"
                  icon={<Truck size={15} />}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {shippingOptions.map((option) => (
                      <RadioOption
                        key={option.id}
                        selected={form.shipping === option.id}
                        label={option.label}
                        price={option.charge}
                        onClick={() => set("shipping", option.id)}
                      />
                    ))}
                  </div>
                </CheckoutPanel>

                <CheckoutPanel
                  title="Payment Method"
                  icon={<CreditCard size={15} />}
                >
                  <RadioOption
                    selected={form.payment === "cod"}
                    label="Cash on Delivery"
                    price={0}
                    note="Pay cash when you get your product"
                    onClick={() => set("payment", "cod")}
                  />
                </CheckoutPanel>
              </div>

              <aside className="space-y-4">
                <ProductOptionsCheckout
                  title="Campaign Products"
                  options={productOptions}
                  selectedProducts={selectedProducts}
                  onToggle={toggleProductOption}
                  onQtyChange={changeProductQty}
                />

                <div className="rounded border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-black text-slate-900">
                    Order Summary
                  </h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <SummaryRow
                      label="Product"
                      value={`BDT ${formatMoney(productSubtotal)}`}
                    />
                    <SummaryRow
                      label="Delivery"
                      value={`BDT ${formatMoney(deliveryCharge)}`}
                    />
                    <div className="flex gap-2 pt-1">
                      <input
                        value={form.coupon}
                        onChange={(event) => set("coupon", event.target.value)}
                        placeholder="Enter coupon code"
                        className="min-w-0 flex-1 rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        className="rounded bg-emerald-100 px-3 text-xs font-bold text-emerald-700"
                      >
                        Apply
                      </button>
                    </div>
                    <SummaryRow
                      label="Total"
                      value={`BDT ${formatMoney(total)}`}
                      strong
                    />
                    <SummaryRow label="Pay Now" value="BDT 0.00" />
                    <SummaryRow
                      label="Due on Delivery"
                      value={`BDT ${formatMoney(total)}`}
                      strong
                      highlight
                    />
                  </div>
                </div>

                <div className="rounded border border-amber-100 bg-amber-50 p-4">
                  <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.agree}
                      onChange={(event) => set("agree", event.target.checked)}
                      className="mt-0.5 accent-blue-600"
                    />
                    I agree to the Terms and Privacy Policy
                  </label>
                  {orderError ? (
                    <p className="mt-3 rounded bg-red-50 px-3 py-2 text-xs font-bold text-red-500">
                      {orderError}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded bg-indigo-500 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Lock size={14} />
                    {placingOrder ? "Placing..." : "Place Order"}
                  </button>
                </div>
              </aside>
            </div>
          </section>

          <section className="mt-10 text-center">
            <h2 className="text-lg font-black text-slate-900">
              You Might Also Like
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              More campaigns you may like
            </p>
            <div className="mx-auto mt-5 grid max-w-[1340px] gap-4 md:grid-cols-3">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} item={item} image={item.image} />
              ))}
            </div>
          </section>

          {shortDescription ? (
            <section className="mx-auto mt-8 max-w-[1340px] rounded border border-slate-200 bg-white/80 p-5 text-sm leading-7 text-slate-600">
              <h2 className="mb-2 text-lg font-black text-slate-900">
                {descriptionTitle}
              </h2>
              {shortDescription}
            </section>
          ) : null}
        </main>

        <Footer phone={phone} settings={footerSettings} pages={footerPages} />
      </div>
    </div>
  );
}

function PreviewShell({ tone = "light", children }) {
  return (
    <div
      className={`flex-1 overflow-y-auto ${tone === "dark" ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`}
    >
      {children}
    </div>
  );
}

function MurdaMoshariOfferTemplate({ data, campaign }) {
  const {
    form,
    set,
    productName,
    title,
    subTitle,
    price,
    originalPrice,
    phone,
    bannerImage,
    productOptions,
    selectedProducts,
    productSubtotal,
    toggleProductOption,
    changeProductQty,
    deliveryCharge,
    total,
    placingOrder,
    orderError,
    onPlaceOrder,
  } = data;
  const regularData = parseObject(campaign?.regularData);
  const ctaText = regularData.ctaText || "অর্ডার করতে ক্লিক করুন";
  const orderTitle = regularData.orderTitle || "অর্ডার করতে আপনার সঠিক তথ্য দিয়ে নিচের ফর্মটি সম্পূর্ণ পূরণ করুন।";
  const priceLine = regularData.priceLine || "";
  const pricePrefix = regularData.pricePrefix || "মাত্র";
  const priceSuffix = regularData.priceSuffix || "টাকায়";
  const sizeTitle = regularData.sizeTitle || "";
  const introText = regularData.introText || "";
  const offerImageTitle = regularData.offerImageTitle || "";
  const carouselItems = normalizeCarouselItems(regularData.carouselItems).length
    ? normalizeCarouselItems(regularData.carouselItems)
    : productOptions;
  const shortDescription = stripHtml(campaign?.shortDescription || "");
  const whyChooseUs = stripHtml(campaign?.whyChooseUs || "");
  const description = stripHtml(campaign?.description || "");

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <main className="mx-auto max-w-[1200px] px-3 py-5">
        {title ? (
          <h1 className="text-center text-3xl font-black text-red-600 md:text-5xl">
            {title}
          </h1>
        ) : null}
        {subTitle ? (
          <div className="mt-5 bg-black px-4 py-3 text-center text-3xl font-black text-white md:text-5xl">
            {subTitle}
          </div>
        ) : null}
        {priceLine || price ? (
          <div className="mt-5 bg-yellow-300 px-4 py-3 text-center text-3xl font-black text-red-600 md:text-5xl">
            {priceLine || `${pricePrefix} ${formatMoney(price)} ${priceSuffix}`}
          </div>
        ) : null}
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={productName}
            className="mx-auto mt-8 w-full max-w-[1140px] object-contain"
          />
        ) : null}
        <div className="mt-6 text-center">
          <JumpButton targetId="order-now">{ctaText}</JumpButton>
        </div>

        {introText || shortDescription || campaign?.descriptionTitle ? (
          <section className="mx-auto max-w-[900px] px-4 py-8 text-center">
            {introText ? (
              <IntroTextBlock value={introText} />
            ) : null}
            {campaign?.descriptionTitle ? (
              <h2 className="text-3xl font-black text-orange-600">
                {campaign.descriptionTitle}
              </h2>
            ) : null}
            {shortDescription ? (
              <DynamicTextBlock value={shortDescription} />
            ) : null}
          </section>
        ) : null}

        {carouselItems.length ? (
          <section className="px-4 py-6 text-center">
            {offerImageTitle ? (
              <h2 className="mb-5 text-3xl font-black text-orange-600">
                {offerImageTitle}
              </h2>
            ) : null}
            <ProductCardCarousel options={carouselItems} />
          </section>
        ) : null}

        {whyChooseUs || campaign?.whyChooseTitle ? (
          <section className="mx-auto max-w-[900px] px-4 py-8">
            {campaign?.whyChooseTitle ? (
              <h2 className="text-center text-3xl font-black text-orange-600">
                {campaign.whyChooseTitle}
              </h2>
            ) : null}
            {whyChooseUs ? <DynamicTextBlock value={whyChooseUs} /> : null}
          </section>
        ) : null}

        {description ? (
          <section className="mx-auto max-w-[900px] px-4 py-8">
            {sizeTitle ? (
              <h2 className="text-center text-3xl font-black text-orange-600">
                {sizeTitle}
              </h2>
            ) : null}
            <DynamicTextBlock value={description} />
          </section>
        ) : null}

        <section id="order-now" className="px-4 py-10">
          <div className="mx-auto max-w-5xl rounded border-2 border-slate-900 bg-white p-5 md:p-7">
            <h2 className="text-center text-2xl font-black text-sky-400 md:text-4xl">
              {orderTitle}
            </h2>
            <div className="mt-7">
              <ProductOptionsCheckout
                title="আপনার প্রোডাক্টটি সিলেক্ট করুন"
                options={productOptions}
                selectedProducts={selectedProducts}
                onToggle={toggleProductOption}
                onQtyChange={changeProductQty}
                compact={false}
              />
            </div>
            <div className="mt-8 grid gap-8 md:grid-cols-[1fr_0.9fr]">
              <div>
                <Input label="আপনার নাম *" value={form.name} onChange={(value) => set("name", value)} placeholder="আপনার নাম" />
                <Input label="আপনার ফোন নাম্বার *" value={form.phone} onChange={(value) => set("phone", value)} placeholder="মোবাইল নাম্বার দিন" type="tel" />
                <Input label="আপনার ঠিকানা *" value={form.address} onChange={(value) => set("address", value)} placeholder="আপনার সম্পূর্ণ ঠিকানা" />
                <textarea
                  value={form.note || ""}
                  onChange={(event) => set("note", event.target.value)}
                  placeholder="অর্ডার এবং কলার সম্পর্কে কিছু বলার থাকলে এখানে লিখুন"
                  className="mt-3 min-h-24 w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-600"
                />
                {orderError ? <p className="mt-4 text-sm font-bold text-red-500">{orderError}</p> : null}
                <button
                  type="button"
                  onClick={onPlaceOrder}
                  disabled={placingOrder}
                  className="mt-5 w-full rounded bg-orange-600 px-5 py-4 text-base font-black text-white transition hover:bg-orange-700 disabled:opacity-60"
                >
                  🔒 {placingOrder ? "অর্ডার হচ্ছে..." : `Place Order ${formatMoney(total)}৳`}
                </button>
              </div>
              <div className="rounded border border-slate-200 p-4">
                <h3 className="text-xl font-black text-slate-800">Your order</h3>
                <div className="mt-4 space-y-3">
                  {selectedProducts.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <img src={imageUrl(item.image) || bannerImage} alt={item.name} className="h-12 w-12 rounded object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-bold">{item.name}</p>
                        <p className="text-xs text-slate-500">x {item.qty}</p>
                      </div>
                      <strong>{formatMoney(item.price * item.qty)}৳</strong>
                    </div>
                  ))}
                  <SummaryRow label="Subtotal" value={`${formatMoney(productSubtotal)}৳`} />
                  <SummaryRow label="Delivery" value={`${formatMoney(deliveryCharge)}৳`} />
                  <SummaryRow label="Total" value={`${formatMoney(total)}৳`} strong />
                </div>
              </div>
            </div>
            {phone ? (
              <a href={`tel:${String(phone).replace(/\s+/g, "")}`} className="mt-6 block text-center text-lg font-black text-blue-600">
                {phone}
              </a>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

function DynamicTextBlock({ value }) {
  const lines = String(value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (lines.length > 1) {
    return (
      <ul className="mx-auto mt-6 max-w-3xl space-y-3 text-left text-lg font-bold text-gray-600">
        {lines.map((line) => (
          <li key={line} className="flex gap-3">
            <span className="mt-1 h-4 w-4 rounded-full bg-yellow-400" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="mt-5 text-xl font-black leading-9 text-slate-900">{lines[0]}</p>;
}

function IntroTextBlock({ value }) {
  const lines = String(value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  return (
    <div className="mb-6 text-center text-2xl font-black leading-9 text-slate-950">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

function RegularLandingTemplate({ data, campaign }) {
  const {
    form,
    set,
    productName,
    title,
    subTitle,
    phone,
    shortDescription,
    descriptionTitle,
    bannerImage,
    deliveryCharge,
    shippingOptions,
    productOptions,
    selectedProducts,
    productSubtotal,
    toggleProductOption,
    changeProductQty,
    total,
    placingOrder,
    orderError,
    onPlaceOrder,
    onTrackOrder,
    footerSettings,
    footerPages,
  } = data;
  const regularData = parseObject(campaign?.regularData);
  const colors = {
    titleColor: "#7b2457",
    subTitleColor: "#111111",
    headingColor: "#7b2457",
    fontColor: "#333333",
    buttonColor: "#078f12",
    buttonTextColor: "#ffffff",
    sectionBgColor: "#e4f3df",
    ...parseObject(regularData.colors),
  };
  const whyChooseTitle = campaign?.whyChooseTitle || "কেন আমাদের থেকেই কিনবেন?";
  const whyChooseUs = stripHtml(campaign?.whyChooseUs || "");
  const description = stripHtml(campaign?.description || shortDescription);
  const videoEmbedUrl = getVideoEmbedUrl(campaign?.video);
  const reviewHeading = campaign?.reviewTitle || "";
  const reviewSubHeading = regularData.reviewSubTitle || "";
  const reviewRegularPriceLabel = regularData.reviewRegularPriceLabel || "";
  const reviewOfferPriceLabel = regularData.reviewOfferPriceLabel || "";
  const reviewButtonText = regularData.reviewButtonText || "";
  // Page-level prices win; otherwise show the first checkout product's prices.
  const reviewOfferPrice =
    toNumber(campaign?.price, 0) || toNumber(productOptions[0]?.price, 0);
  const reviewRegularPrice =
    toNumber(campaign?.originalPrice, 0) || toNumber(productOptions[0]?.originalPrice, 0);
  const hasReviewSectionContent = Boolean(
    reviewHeading ||
    reviewSubHeading ||
    reviewRegularPriceLabel ||
    reviewOfferPriceLabel ||
    reviewButtonText,
  );
  const featureSectionTitle = regularData.featureSectionTitle || "";
  const headingItems = Array.isArray(regularData.headings)
    ? regularData.headings.filter((item) => item?.title || item?.subtitle)
    : [];
  const featureImages = Array.isArray(regularData.images)
    ? regularData.images.filter((item) => item?.title || item?.imageUrl)
    : [];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <TopStrip phone={phone} onTrack={onTrackOrder} settings={footerSettings?.header} />

      <section className="bg-[#e4f3df] px-4 pb-14 pt-8 text-center">
        {footerSettings?.header?.status !== false && footerSettings?.header?.logoUrl && (
          <img
            src={footerSettings.header.logoUrl}
            alt={footerSettings.header.logoAlt || "Website logo"}
            className="mx-auto mb-5 h-20 max-w-64 object-contain"
          />
        )}
        <h1 className="text-3xl font-black md:text-5xl" style={{ color: colors.titleColor }}>
          {title}
        </h1>
        <p className="mt-4 text-xl font-black md:text-3xl" style={{ color: colors.subTitleColor }}>
          {subTitle}
        </p>
        <div className="mx-auto mt-7 max-w-5xl overflow-hidden rounded-md bg-white shadow-sm">
          <img src={bannerImage} alt={productName} className="w-full object-cover" />
        </div>
        <RegularButton targetId="order-now" color={colors.buttonColor} textColor={colors.buttonTextColor}>
          🛒 অর্ডার করতে ক্লিক করুন
        </RegularButton>
      </section>

      {headingItems.length > 0 && (
        <section className="px-4 py-12">
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {headingItems.map((item, index) => (
              <div
                key={`heading-${index}`}
                className="rounded-lg px-5 py-6 text-center shadow-sm"
                style={{ backgroundColor: item.backgroundColor || "#ffffff" }}
              >
                {item.title && (
                  <h3 className="text-xl font-black" style={{ color: colors.headingColor }}>
                    {item.title}
                  </h3>
                )}
                {item.subtitle && (
                  <p className="mt-3 text-sm font-semibold leading-6" style={{ color: colors.fontColor }}>
                    {item.subtitle}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {hasReviewSectionContent && (
        <section className="px-4 py-14 text-center" style={{ backgroundColor: colors.sectionBgColor }}>
          {reviewHeading && (
            <h2 className="text-3xl font-black md:text-5xl" style={{ color: colors.headingColor }}>
              {reviewHeading}
            </h2>
          )}
          {reviewSubHeading && (
            <p className="mt-3 text-sm font-semibold" style={{ color: colors.fontColor }}>
              {reviewSubHeading}
            </p>
          )}
          {reviewRegularPriceLabel && reviewRegularPrice > 0 && (
            <p className="mt-12 text-2xl font-black text-slate-600">
              {reviewRegularPriceLabel} <span className="line-through">{formatMoney(reviewRegularPrice)}/- টাকা</span>
            </p>
          )}
          {reviewOfferPriceLabel && reviewOfferPrice > 0 && (
            <p className="mt-5 text-3xl font-black md:text-5xl" style={{ color: colors.headingColor }}>
              {reviewOfferPriceLabel} <span className="text-green-600">{formatMoney(reviewOfferPrice)}/- টাকা</span>
            </p>
          )}
          {reviewButtonText && (
            <RegularButton targetId="order-now" color={colors.buttonColor} textColor={colors.buttonTextColor}>
              {reviewButtonText}
            </RegularButton>
          )}
        </section>
      )}

      <section className="px-4 py-16 text-center">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black md:text-5xl" style={{ color: colors.headingColor }}>
            {descriptionTitle}
          </h2>
          <p className="mx-auto mt-6 max-w-4xl text-base leading-8" style={{ color: colors.fontColor }}>
            {description || "পণ্যের বিস্তারিত তথ্য এখানে দেখানো হবে।"}
          </p>
          {videoEmbedUrl && (
            <div className="mx-auto mt-8 aspect-video max-w-3xl overflow-hidden rounded-lg bg-black shadow-sm">
              <iframe
                src={videoEmbedUrl}
                title={title || "Campaign video"}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}
          <RegularButton targetId="order-now" color={colors.buttonColor} textColor={colors.buttonTextColor}>
            📞 অর্ডার করতে চাই
          </RegularButton>
        </div>
      </section>

      {featureImages.length > 0 && (
        <section className="px-4 py-16" style={{ backgroundColor: colors.sectionBgColor }}>
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-black md:text-5xl" style={{ color: colors.headingColor }}>
              {featureSectionTitle}
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {featureImages.map((item, index) => (
                <div key={`${item.title || "feature"}-${index}`} className="overflow-hidden rounded-lg bg-white text-center shadow-sm">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title || `Feature ${index + 1}`} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="grid h-36 place-items-center bg-green-50 text-3xl">✅</div>
                  )}
                  <p className="px-3 py-4 text-base font-black" style={{ color: colors.headingColor }}>
                    {item.title || `Feature ${index + 1}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-16" style={{ backgroundColor: colors.sectionBgColor }}>
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-black md:text-5xl" style={{ color: colors.headingColor }}>
            {whyChooseTitle}
          </h2>
          <div className="mx-auto mt-6 max-w-4xl text-left text-base font-semibold leading-8" style={{ color: colors.fontColor }}>
            {whyChooseUs ? (
              <p>{whyChooseUs}</p>
            ) : (
              <p>✅ ১০০% অরিজিনাল পণ্য ✅ দ্রুত ডেলিভারি ✅ ক্যাশ অন ডেলিভারি সুবিধা ✅ সহজ অর্ডার প্রক্রিয়া</p>
            )}
          </div>
          {phone ? (
            <a
              href={`tel:${String(phone).replace(/\s+/g, "")}`}
              onClick={() => trackLandingContactClick("Landing phone", phone)}
              className="mt-12 inline-flex items-center justify-center rounded-full border-4 border-white px-8 py-3 text-xl font-black shadow"
              style={{ backgroundColor: colors.buttonColor, color: colors.buttonTextColor }}
            >
              📞 {phone}
            </a>
          ) : null}
        </div>
      </section>

      <section id="order-now" className="bg-slate-100 px-4 py-20">
        <div className="mx-auto max-w-5xl rounded border-2 border-green-600 bg-white p-6 md:p-8">
          <h2 className="text-center text-3xl font-black text-slate-800">প্রোডাক্ট সিলেক্ট করুন</h2>
          <div className="mt-6">
            <ProductOptionsCheckout
              title="Your Products"
              options={productOptions}
              selectedProducts={selectedProducts}
              onToggle={toggleProductOption}
              onQtyChange={changeProductQty}
              compact={false}
            />
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_0.95fr]">
            <div>
              <p className="mb-4 text-sm font-black text-red-500">
                আপনার নাম,মোবাইল নাম্বার এবং ঠিকানা লিখে সাবমিট করুন
              </p>
              <RegularOrderInput icon={<User size={18} />} placeholder="আপনার নাম" value={form.name} onChange={(value) => set("name", value)} />
              <RegularOrderInput icon={<Phone size={18} />} placeholder="মোবাইল নাম্বার দিন" value={form.phone} onChange={(value) => set("phone", value)} />
              <RegularOrderInput icon={<Package size={18} />} placeholder="আপনার সম্পূর্ণ ঠিকানা" value={form.address} onChange={(value) => set("address", value)} />
              <div className="mt-4 overflow-hidden rounded border border-slate-200">
                {shippingOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => set("shipping", option.id)}
                    className="flex w-full items-center gap-3 border-b border-slate-200 px-4 py-3 text-left text-sm last:border-b-0"
                  >
                    <span className={`h-5 w-5 rounded-full border ${form.shipping === option.id ? "border-green-600 bg-green-600" : "border-slate-300"}`} />
                    {`${option.banglaLabel} ${option.free ? "ফ্রি ডেলিভারি" : `${option.charge} টাকা`}`}
                  </button>
                ))}
              </div>
              {orderError ? <p className="mt-4 text-sm font-bold text-red-500">{orderError}</p> : null}
              <button
                type="button"
                onClick={onPlaceOrder}
                disabled={placingOrder}
                className="mt-6 w-full rounded bg-green-700 px-5 py-4 text-base font-black text-white transition hover:bg-green-800 disabled:opacity-60"
              >
                🔒 {placingOrder ? "অর্ডার হচ্ছে..." : "অর্ডারটি কনফার্ম করুন"}
              </button>
            </div>
            <div className="overflow-hidden rounded border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-center">Amount</th>
                    <th className="p-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((item) => (
                    <tr key={item.id} className="bg-slate-200">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <img src={imageUrl(item.image) || bannerImage} alt={item.name} className="h-10 w-10 rounded object-cover" />
                          <span className="line-clamp-1 font-semibold">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-3 rounded border border-slate-700 px-3 py-1 font-bold">
                          {item.qty} x
                        </span>
                      </td>
                      <td className="p-3 text-right">৳{formatMoney(item.price * item.qty)}</td>
                    </tr>
                  ))}
                  <RegularTotalRow label="Total" value={productSubtotal} />
                  <RegularTotalRow label="Delivery Charge" value={deliveryCharge} />
                  <RegularTotalRow label="TOTAL" value={total} strong />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <Footer phone={phone} settings={footerSettings} pages={footerPages} />
    </div>
  );
}

function RegularButton({ targetId, color, textColor, children }) {
  return (
    <button
      type="button"
      onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className="mt-7 rounded-full border-4 border-white px-8 py-3 text-lg font-black shadow"
      style={{ backgroundColor: color, color: textColor }}
    >
      {children}
    </button>
  );
}

function RegularOrderInput({ icon, placeholder, value, onChange }) {
  return (
    <label className="mb-3 flex items-center overflow-hidden rounded border border-slate-200 bg-white">
      <span className="flex h-11 w-12 items-center justify-center bg-slate-100 text-slate-600">{icon}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 px-3 py-3 text-sm outline-none"
      />
    </label>
  );
}

function RegularTotalRow({ label, value, strong }) {
  return (
    <tr className={strong ? "font-black" : "font-bold"}>
      <td className="p-3 text-right" colSpan={2}>{label}</td>
      <td className="p-3 text-right">৳ {formatMoney(value)}</td>
    </tr>
  );
}

function OrderSuccessPage({
  order,
  form,
  productName,
  productImage,
  price,
  deliveryCharge,
  total,
  phoneNumber,
  onContinue,
  onTrack,
  footerSettings,
  footerPages,
}) {
  const orderNumber = order.orderId || `#${order.Id || "Pending"}`;
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 text-slate-900">
      <TopStrip
        phone={phoneNumber}
        onTrack={onTrack}
        settings={footerSettings?.header}
      />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 size={34} />
          </div>
          <h1 className="mt-4 text-3xl font-black text-slate-900">
            Order Placed Successfully!
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Thank you for your order. We've received your request and will
            process it shortly.
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="inline-flex items-center gap-2 text-sm font-black text-blue-800">
              <ShoppingCart size={16} />
              Order Summary
            </h2>
          </div>
          <div className="p-5">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Order Information
                </h3>
                <InfoRow label="Order Number:" value={orderNumber} />
                <InfoRow
                  label="Order Date:"
                  value={orderDate.toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                />
                <InfoRow label="Payment Status:" value="Unpaid" danger />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Delivery Information
                </h3>
                <p className="mt-3 text-xs text-slate-600">
                  Contact:{" "}
                  <span className="font-bold text-slate-900">{form.name}</span>
                </p>
                <p className="text-xs text-slate-600">{form.phone}</p>
                <p className="mt-2 text-xs text-slate-600">
                  Address:{" "}
                  <span className="font-bold text-slate-900">
                    {form.address}
                  </span>
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  Delivery Zone:{" "}
                  <span className="font-bold text-slate-900">
                    {order.customerArea || "Inside Dhaka"}
                  </span>
                </p>
              </div>
            </div>

            <div className="my-6 border-t border-slate-200" />

            <h3 className="text-sm font-black text-slate-900">Order Items</h3>
            <div className="mt-4 flex items-center gap-4 rounded-lg bg-slate-50 p-4">
              <img
                src={productImage || heroImage}
                alt={productName}
                className="h-16 w-16 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900">
                  {productName}
                </p>
                <p className="mt-2 text-xs text-slate-500">Quantity: 1</p>
              </div>
              <div className="text-right text-sm font-black text-slate-900">
                BDT {formatMoney(price)} × 1
                <p className="text-xs text-blue-600">
                  BDT {formatMoney(price)}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm">
              <InfoRow
                label="Delivery Charge:"
                value={`BDT ${formatMoney(deliveryCharge)}`}
              />
              <div className="flex items-center justify-between pt-2 text-lg font-black">
                <span>Total:</span>
                <span className="text-blue-600">BDT {formatMoney(total)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-900">What's Next?</h2>
          <Step
            number="1"
            title="Order Confirmation"
            text="You will receive a confirmation call within 2-4 hours to verify your order details."
          />
          <Step
            number="2"
            title="Processing"
            text="Once confirmed, your order will be processed and prepared for delivery."
          />
          <Step
            number="3"
            title="Delivery"
            text="Your order will be delivered to your address within 2-5 business days."
          />
        </section>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onContinue}
            className="rounded bg-blue-600 px-5 py-2 text-sm font-bold text-white"
          >
            Back to Landing Page
          </button>
          <button
            type="button"
            onClick={onTrack}
            className="ml-3 rounded bg-slate-800 px-5 py-2 text-sm font-bold text-white"
          >
            Track Order
          </button>
        </div>
      </main>
      <Footer
        phone={phoneNumber}
        settings={footerSettings}
        pages={footerPages}
      />
    </div>
  );
}

function InfoRow({ label, value, danger }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-4 text-xs">
      <span className="text-slate-500">{label}</span>
      <span
        className={`text-right font-bold ${danger ? "text-orange-600" : "text-slate-900"}`}
      >
        {value}
      </span>
    </div>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="mt-5 flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-600">
        {number}
      </span>
      <div>
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function TrackOrderPage({ phoneNumber, onBack, footerSettings, footerPages }) {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function searchOrders() {
    setError("");
    setSearched(true);
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      const response = await orderService.trackOrders(phone.trim());
      setOrders(response.data || []);
    } catch (err) {
      setError(err.message || "Order lookup failed.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f0e8] text-slate-900">
      <TopStrip
        phone={phoneNumber}
        settings={footerSettings?.header}
        onTrack={() =>
          document
            .getElementById("track-order-search")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      />
      <main
        className="min-h-screen px-4 py-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(244,240,232,.88), rgba(244,240,232,.92)), radial-gradient(circle at 20% 20%, rgba(255,255,255,.9), transparent 34%), radial-gradient(circle at 70% 25%, rgba(255,255,255,.7), transparent 30%)",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-800 text-white shadow">
              <Package size={38} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900">
                Track Your Order
              </h1>
              <p className="mt-2 text-lg font-semibold text-slate-500">
                Monitor your order journey from placement to delivery with
                real-time updates
              </p>
            </div>
          </div>

          <section
            id="track-order-search"
            className="mt-6 rounded-xl border border-white/80 bg-white/85 p-8 text-center shadow-sm backdrop-blur"
          >
            <h2 className="text-2xl font-black text-slate-900">
              Search Your Order
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Enter your phone number to find all your orders
            </p>
            <div className="mx-auto mt-7 flex max-w-2xl flex-col gap-3 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Phone
                  size={22}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchOrders();
                  }}
                  placeholder="Enter your phone number (e.g. 01712345678)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-12 py-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                />
              </label>
              <button
                type="button"
                onClick={searchOrders}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-8 py-4 text-sm font-black text-white shadow transition hover:bg-slate-900 disabled:opacity-60"
              >
                <Truck size={18} />
                {loading ? "Searching..." : "Search Orders"}
              </button>
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-500">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
              Secure and fast order lookup
            </p>
            {error ? (
              <p className="mt-4 text-sm font-bold text-red-500">{error}</p>
            ) : null}
          </section>

          {searched && !loading && !error ? (
            <section className="mt-6">
              {orders.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-sm">
                  No orders found for this phone number.
                </div>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <TrackedOrderCard key={order.Id} order={order} />
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </main>
      <Footer
        phone={phoneNumber}
        settings={footerSettings}
        pages={footerPages}
      />
    </div>
  );
}

function GiveawayCampaignTemplate({ data }) {
  const {
    productName,
    title,
    subTitle,
    price,
    originalPrice,
    phone,
    shortDescription,
    descriptionTitle,
    bannerImage,
    prizeImageSource,
    reviewImages,
    relatedProducts,
    onTrackOrder,
    footerSettings,
    footerPages,
  } = data;

  return (
    <div className="min-h-screen bg-[#fffdf8] text-slate-900">
      <div
        className="min-h-screen"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.94), rgba(255,255,255,.97)), radial-gradient(circle at 8% 14%, rgba(234,179,8,.10) 0 70px, transparent 72px), radial-gradient(circle at 92% 32%, rgba(234,179,8,.08) 0 90px, transparent 92px)",
        }}
      >
        <TopStrip phone={phone} onTrack={onTrackOrder} settings={footerSettings?.header} />

        <main className="mx-auto max-w-[1340px] px-4 pb-12">
          {footerSettings?.header?.status !== false && (
            <header className="py-4 text-center">
              {footerSettings?.header?.logoUrl ? (
                <img
                  src={footerSettings.header.logoUrl}
                  alt={footerSettings.header.logoAlt || "Website logo"}
                  className="mx-auto h-10 max-w-40 object-contain"
                />
              ) : (
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white shadow-sm">
                  {String(productName || "K").slice(0, 1)}
                </div>
              )}
            </header>
          )}

          <Notice tone="yellow">
            আজই কিনুন ৫ পিস আতর পারফিউম কম্বো প্যাকের সাথে নিশ্চিত ২ টি পুরস্কার
            <br />
            <span className="text-emerald-700">ক্যাম্পেইন অফার চলে যাওয়ার আগেই অর্ডার করুন</span>
          </Notice>
          <Notice tone="purple">
            শতাধিকের মধ্যে অনেকেই পুরস্কার পেয়েছেন, আপনিও পাবেন
            <br />
            <span className="text-emerald-700">প্রতিটি অর্ডারের সাথে থাকছে আকর্ষণীয় অফার</span>
          </Notice>

          <div className="mt-3 text-center">
            <JumpButton targetId="order-now">অর্ডার করুন</JumpButton>
          </div>

          <section className="mt-5 overflow-hidden rounded-md border border-amber-100 bg-[#21150c] shadow-sm">
            <img
              src={bannerImage}
              alt={productName}
              className="h-[clamp(240px,42vw,560px)] w-full object-cover"
            />
          </section>

          <SectionBadge>এই ক্যাম্পেইনের পুরস্কার</SectionBadge>

          <section className="overflow-hidden rounded-md border border-slate-200 bg-sky-50 shadow-sm">
            {prizeImageSource ? (
              <img
                src={prizeImageSource}
                alt="Campaign prize"
                className="h-[clamp(240px,42vw,560px)] w-full object-cover"
              />
            ) : (
              <div className="grid min-h-[280px] items-center gap-4 bg-gradient-to-br from-sky-300 via-white to-slate-200 p-6 md:grid-cols-[0.85fr_1fr]">
                <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-700 p-5 text-center text-white shadow-xl">
                  <p className="text-sm font-bold">SCRATCH CARD</p>
                  <p className="mt-1 text-4xl font-black">R15</p>
                  <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-red-600">
                    স্বপ্নপূরণ ক্যাম্পেইন
                  </p>
                </div>
                <div className="text-center text-3xl font-black text-sky-800">
                  বাইক বিজয়ী হওয়ার সুযোগ
                </div>
              </div>
            )}
          </section>

          <SectionBadge>আগের ক্যাম্পেইনের বাইক বিজয়ী</SectionBadge>

          <section className="mt-4 rounded-md border border-orange-100 bg-white/95 p-5 shadow-sm">
            <h2 className="text-center text-2xl font-black text-slate-800">
              আগের ক্যাম্পেইনের <span className="text-red-600">১১ জন বাইক বিজয়ী</span>
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {WINNERS.map((winner, index) => (
                <WinnerCard
                  key={winner}
                  name={winner}
                  index={index}
                  image={reviewImages.length ? reviewImages[index % reviewImages.length] : ""}
                />
              ))}
            </div>
          </section>

          <div className="mx-auto mt-5 max-w-xs rounded border border-emerald-200 bg-gradient-to-r from-rose-50 to-emerald-50 p-4 text-center shadow-sm">
            <p className="text-xs text-slate-600">
              পূর্বের মূল্য <span className="line-through">{formatMoney(originalPrice)} টাকা</span>
            </p>
            <p className="mt-1 text-lg font-black text-emerald-700">
              অফার মূল্য - {formatMoney(price)} টাকা
            </p>
          </div>

          <OrderFormBlock data={data} />

          {relatedProducts.length ? (
            <section className="mt-10 text-center">
              <h2 className="text-lg font-black text-slate-900">You Might Also Like</h2>
              <p className="mt-1 text-xs text-slate-500">More great products from the same category</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {relatedProducts.slice(0, 3).map((item) => (
                  <ProductCard key={item.id} item={item} image={item.image} />
                ))}
              </div>
            </section>
          ) : null}

          {shortDescription ? (
            <section className="mt-8 rounded border border-slate-200 bg-white/85 p-5 text-sm leading-7 text-slate-600">
              <h2 className="mb-2 text-lg font-black text-slate-900">{descriptionTitle}</h2>
              {shortDescription}
            </section>
          ) : null}

          {title || subTitle ? (
            <section className="mt-8 text-center">
              <h2 className="text-xl font-black text-slate-900">{title}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">{subTitle}</p>
            </section>
          ) : null}
        </main>

        <Footer phone={phone} settings={footerSettings} pages={footerPages} />
      </div>
    </div>
  );
}

function TrackedOrderCard({ order }) {
  const status = String(order.status || "pending").replace(/_/g, " ");
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            Order Number
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-900">
            {order.orderId}
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {order.productName}
          </p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black capitalize text-blue-700">
          {status}
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <InfoTile label="Customer" value={order.customerName} />
        <InfoTile label="Phone" value={order.customerPhone} />
        <InfoTile label="Total" value={`BDT ${formatMoney(order.totalBill)}`} />
      </div>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[11px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value || "-"}</p>
    </div>
  );
}

function TemplateDesign2({ data }) {
  const {
    productName,
    title,
    subTitle,
    price,
    originalPrice,
    phone,
    shortDescription,
    descriptionTitle,
    bannerImage,
    prizeImageSource,
    reviewImages,
    relatedProducts,
    onTrackOrder,
  } = data;

  return (
    <div className="min-h-screen bg-[#f7fbf8]">
      <TopStrip
        phone={phone}
        onTrack={onTrackOrder}
        settings={data.footerSettings?.header}
      />
      <main className="mx-auto max-w-[1340px] px-4 pb-14">
        <section className="grid min-h-[520px] items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded border border-emerald-100 bg-white shadow-sm">
            <img
              src={bannerImage}
              alt={productName}
              className="h-[460px] w-full object-cover"
            />
          </div>
          <div>
            <span className="inline-flex rounded bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
              Premium Campaign
            </span>
            <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              {subTitle}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PricePill price={price} originalPrice={originalPrice} />
              <JumpButton targetId="order-now">অর্ডার করুন</JumpButton>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {["Authentic Product", "Fast Delivery", "Cash on Delivery"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <PrizeShowcase
            prizeImageSource={prizeImageSource}
            productName={productName}
          />
          <DescriptionBlock title={descriptionTitle} text={shortDescription} />
        </section>

        <WinnerGrid reviewImages={reviewImages} title="Campaign Winners" />
        <OrderFormBlock data={data} />
        <RelatedProductsSection
          relatedProducts={relatedProducts}
          bannerImage={bannerImage}
        />
      </main>
      <Footer
        phone={phone}
        settings={data.footerSettings}
        pages={data.footerPages}
      />
    </div>
  );
}

function TemplateDesign3({ data }) {
  const {
    productName,
    title,
    subTitle,
    price,
    originalPrice,
    phone,
    shortDescription,
    descriptionTitle,
    bannerImage,
    prizeImageSource,
    reviewImages,
    onTrackOrder,
  } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <TopStrip
        phone={phone}
        onTrack={onTrackOrder}
        settings={data.footerSettings?.header}
      />

      <main className="mx-auto max-w-[1340px] px-4 pb-14">
        <section className="grid gap-6 py-8 lg:grid-cols-[1fr_420px]">
          <div className="overflow-hidden rounded border border-white/10 bg-white text-slate-950">
            <div className="relative min-h-[430px]">
              <img
                src={bannerImage}
                alt={productName}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/30 to-transparent" />
              <div className="relative z-10 max-w-2xl px-6 py-10 text-white md:px-10">
                <span className="rounded bg-red-500 px-3 py-1 text-xs font-black uppercase">
                  Limited Offer
                </span>
                <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-lg text-base leading-7 text-slate-200">
                  {subTitle}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <PricePill price={price} originalPrice={originalPrice} dark />
                  <JumpButton targetId="order-now">এখনই অর্ডার</JumpButton>
                </div>
              </div>
            </div>
          </div>

          <div
            id="order-now"
            className="rounded border border-emerald-400/40 bg-white p-4 text-slate-950 shadow-2xl"
          >
            <h2 className="text-xl font-black">Quick Order</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Order summary and customer information
            </p>
            <div className="mt-4">
              <OrderFormBlock data={data} compact />
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-black text-emerald-300">Product</h3>
            <p className="mt-2 text-2xl font-black">{productName}</p>
          </div>
          <div className="rounded border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-black text-emerald-300">Offer Price</h3>
            <p className="mt-2 text-2xl font-black">
              {formatMoney(price)} টাকা
            </p>
          </div>
          <div className="rounded border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-black text-emerald-300">
              Regular Price
            </h3>
            <p className="mt-2 text-2xl font-black line-through opacity-70">
              {formatMoney(originalPrice)} টাকা
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded border border-white/10 bg-white p-5 text-slate-900">
            <DescriptionBlock
              title={descriptionTitle}
              text={shortDescription}
            />
          </div>
          <PrizeShowcase
            prizeImageSource={prizeImageSource}
            productName={productName}
            dark
          />
        </section>

        <WinnerGrid reviewImages={reviewImages} title="Customer Proof" dark />
      </main>
      <Footer
        phone={phone}
        settings={data.footerSettings}
        pages={data.footerPages}
      />
    </div>
  );
}

function PricePill({ price, originalPrice, dark }) {
  return (
    <div
      className={`rounded px-5 py-3 shadow-sm ${dark ? "bg-white text-slate-950" : "bg-slate-950 text-white"}`}
    >
      <p className="text-xs font-bold opacity-70">
        Regular{" "}
        <span className="line-through">{formatMoney(originalPrice)} টাকা</span>
      </p>
      <p className="text-2xl font-black">Offer {formatMoney(price)} টাকা</p>
    </div>
  );
}

function PrizeShowcase({ prizeImageSource, productName, dark }) {
  return (
    <section
      className={`overflow-hidden rounded border shadow-sm ${dark ? "border-white/10 bg-white/10" : "border-slate-200 bg-white"}`}
    >
      <div className="border-b border-slate-200 px-5 py-3">
        <h2
          className={`text-lg font-black ${dark ? "text-white" : "text-slate-900"}`}
        >
          Campaign Prize
        </h2>
      </div>
      {prizeImageSource ? (
        <img
          src={prizeImageSource}
          alt={`${productName} prize`}
          className="h-80 w-full object-cover"
        />
      ) : (
        <div className="grid min-h-[320px] place-items-center bg-gradient-to-br from-cyan-100 via-white to-amber-100 p-8 text-center text-slate-900">
          <div>
            <p className="text-sm font-black uppercase text-red-600">
              Reward Campaign
            </p>
            <p className="mt-2 text-4xl font-black">Special Gift</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              প্রতি অর্ডারে থাকছে আকর্ষণীয় পুরস্কারের সুযোগ
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function DescriptionBlock({ title, text }) {
  return (
    <section className="rounded border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        {text ||
          "এই ক্যাম্পেইনে প্রিমিয়াম পণ্য, সহজ অর্ডার, দ্রুত ডেলিভারি এবং ক্যাশ অন ডেলিভারি সুবিধা আছে।"}
      </p>
    </section>
  );
}

function WinnerGrid({ reviewImages, title, dark }) {
  return (
    <section
      className={`mt-8 rounded border p-5 shadow-sm ${dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}
    >
      <h2
        className={`text-center text-2xl font-black ${dark ? "text-white" : "text-slate-900"}`}
      >
        {title}
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {WINNERS.map((winner, index) => (
          <WinnerCard
            key={winner}
            name={winner}
            index={index}
            image={
              reviewImages.length
                ? reviewImages[index % reviewImages.length]
                : ""
            }
          />
        ))}
      </div>
    </section>
  );
}

function OrderFormBlock({ data, compact }) {
  const {
    form,
    set,
    productName,
    price,
    bannerImage,
    deliveryCharge,
    shippingOptions,
    total,
    placingOrder,
    orderError,
    onPlaceOrder,
  } = data;

  return (
    <section
      id={compact ? undefined : "order-now"}
      className={compact ? "" : "mt-8"}
    >
      {!compact ? (
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900">
            Complete Your Order
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Fill in your details to place your order
          </p>
        </div>
      ) : null}

      <div
        className={`mt-5 grid gap-4 ${compact ? "grid-cols-1" : "md:grid-cols-[1.25fr_0.75fr]"}`}
      >
        <div className="space-y-4">
          <CheckoutPanel title="Customer Information" icon={<User size={15} />}>
            <div
              className={compact ? "grid gap-3" : "grid gap-3 md:grid-cols-2"}
            >
              <Input
                label="Full Name *"
                value={form.name}
                onChange={(value) => set("name", value)}
                placeholder="Enter your full name"
              />
              <Input
                label="Phone Number *"
                value={form.phone}
                onChange={(value) => set("phone", value)}
                placeholder="+880-XXX-XXX-XXX"
                type="tel"
              />
            </div>
            <Input
              label="Delivery Address *"
              value={form.address}
              onChange={(value) => set("address", value)}
              placeholder="e.g. house, road, city"
            />
          </CheckoutPanel>

          <CheckoutPanel title="Delivery Options" icon={<Truck size={15} />}>
            <div
              className={compact ? "grid gap-3" : "grid gap-3 md:grid-cols-2"}
            >
              {shippingOptions.map((option) => (
                <RadioOption
                  key={option.id}
                  selected={form.shipping === option.id}
                  label={option.label}
                  price={option.charge}
                  onClick={() => set("shipping", option.id)}
                />
              ))}
            </div>
          </CheckoutPanel>

          <CheckoutPanel title="Payment Method" icon={<CreditCard size={15} />}>
            <RadioOption
              selected={form.payment === "cod"}
              label="Cash on Delivery"
              price={0}
              note="Pay cash when you get your product"
              onClick={() => set("payment", "cod")}
            />
          </CheckoutPanel>
        </div>

        <aside className="space-y-4">
          <div className="rounded border border-blue-200 bg-blue-50 p-4">
            <h3 className="text-xs font-bold text-blue-700">
              Campaign Product
            </h3>
            <div className="mt-3 flex items-center gap-3 rounded border border-emerald-300 bg-white p-3">
              <img
                src={bannerImage}
                alt={productName}
                className="h-12 w-16 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-slate-800">
                  {productName}
                </p>
                <p className="text-xs text-slate-500">Special campaign offer</p>
              </div>
              <p className="text-sm font-black text-emerald-700">
                {formatMoney(price)}
              </p>
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-white p-4 text-slate-900">
            <h3 className="text-sm font-black">Order Summary</h3>
            <div className="mt-3 space-y-2 text-sm">
              <SummaryRow label="Product" value={`BDT ${formatMoney(price)}`} />
              <SummaryRow
                label="Delivery"
                value={`BDT ${formatMoney(deliveryCharge)}`}
              />
              <div className="flex gap-2 pt-1">
                <input
                  value={form.coupon}
                  onChange={(event) => set("coupon", event.target.value)}
                  placeholder="Enter coupon code"
                  className="min-w-0 flex-1 rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  className="rounded bg-emerald-100 px-3 text-xs font-bold text-emerald-700"
                >
                  Apply
                </button>
              </div>
              <SummaryRow
                label="Total"
                value={`BDT ${formatMoney(total)}`}
                strong
              />
              <SummaryRow label="Pay Now" value="BDT 0.00" />
              <SummaryRow
                label="Due on Delivery"
                value={`BDT ${formatMoney(total)}`}
                strong
                highlight
              />
            </div>
          </div>

          <div className="rounded border border-amber-100 bg-amber-50 p-4">
            <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(event) => set("agree", event.target.checked)}
                className="mt-0.5 accent-blue-600"
              />
              I agree to the Terms and Privacy Policy
            </label>
            {orderError ? (
              <p className="mt-3 rounded bg-red-50 px-3 py-2 text-xs font-bold text-red-500">
                {orderError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onPlaceOrder}
              disabled={placingOrder}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded bg-indigo-500 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lock size={14} />
              {placingOrder ? "Placing..." : "Place Order"}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function RelatedProductsSection({ relatedProducts }) {
  if (relatedProducts.length === 0) return null;

  return (
    <section className="mt-10 text-center">
      <h2 className="text-lg font-black text-slate-900">You Might Also Like</h2>
      <p className="mt-1 text-xs text-slate-500">More campaigns you may like</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {relatedProducts.map((item) => (
          <ProductCard key={item.id} item={item} image={item.image} />
        ))}
      </div>
    </section>
  );
}

function TopStrip({ phone, onTrack, settings }) {
  if (settings?.status === false) return null;
  const supportPhone = settings?.supportPhone || phone;
  const socialLinks = settings?.socialLinks?.length
    ? settings.socialLinks
    : [
        { platform: "facebook", label: "Facebook", url: "" },
        { platform: "youtube", label: "YouTube", url: "" },
        { platform: "instagram", label: "Instagram", url: "" },
      ];
  return (
    <div
      style={{
        backgroundColor: settings?.backgroundColor || "#1d1d1b",
        color: settings?.textColor || "#ffffff",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-x-16 gap-y-2 px-5 py-2.5 text-sm md:px-8">
        <p className="min-w-0 break-words">
          {settings?.helpText || "Need any help? Call"}{" "}
          <a
            href={
              supportPhone
                ? `tel:${String(supportPhone).replace(/\s+/g, "")}`
                : undefined
            }
            className="font-semibold"
          >
            {supportPhone}
          </a>
          {settings?.supportText ? " or " : ""}
          {settings?.supportText &&
            (settings.supportUrl ? (
              <a
                href={settings.supportUrl}
                style={{ color: settings?.accentColor || "#fbbf24" }}
              >
                {settings.supportText}
              </a>
            ) : (
              <span style={{ color: settings?.accentColor || "#fbbf24" }}>
                {settings.supportText}
              </span>
            ))}
        </p>
        <div
          className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2"
          style={{ color: settings?.accentColor || "#fbbf24" }}
        >
          <button
            type="button"
            onClick={onTrack}
            className="text-sm font-bold hover:text-amber-100"
          >
            {settings?.trackOrderText || "Track your order"}
          </button>
          <div className="flex items-center gap-2.5">
            {settings?.followUsText && (
              <span style={{ color: settings?.textColor || "#ffffff" }}>
                {settings.followUsText}
              </span>
            )}
            {socialLinks.map((item) => (
              <a
                key={`${item.platform}-${item.label}`}
                href={item.url || undefined}
                target={item.url ? "_blank" : undefined}
                rel={item.url ? "noreferrer" : undefined}
              >
                <SocialIcon type={item.platform} label={item.label} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialIcon({
  type,
  label,
  className = "h-5 w-5 text-amber-300 hover:bg-white/10 hover:text-amber-100",
}) {
  return (
    <span
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-full transition ${className}`}
    >
      {type === "facebook" ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-3.5 w-3.5 fill-current"
        >
          <path d="M14.2 8.1h2.2V4.4c-.4-.1-1.7-.2-3.2-.2-3.2 0-5.3 2-5.3 5.6v3.1H4.4V17h3.5v7h4.2v-7h3.3l.5-4.1h-3.8V10.2c0-1.2.3-2.1 2.1-2.1Z" />
        </svg>
      ) : null}
      {type === "youtube" ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-4 w-4 fill-current"
        >
          <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5a3 3 0 0 0-2.1 2.1C2 9 2 12 2 12s0 3 .4 4.8a3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1C22 15 22 12 22 12s0-3-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
        </svg>
      ) : null}
      {type === "instagram" ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.3]"
        >
          <rect x="4" y="4" width="16" height="16" rx="4.5" />
          <circle cx="12" cy="12" r="3.4" />
          <circle
            cx="16.9"
            cy="7.1"
            r="0.8"
            className="fill-current stroke-0"
          />
        </svg>
      ) : null}
      {type === "tiktok" ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-3.5 w-3.5 fill-current"
        >
          <path d="M17.4 6.1a5.7 5.7 0 0 0 3.4 1.1v3.5a9.2 9.2 0 0 1-3.5-.7v5.3a5.9 5.9 0 1 1-5.9-5.9c.4 0 .8 0 1.2.1v3.7a2.3 2.3 0 1 0 1.1 2V2.8h3.7v3.3Z" />
        </svg>
      ) : null}
    </span>
  );
}

function Notice({ children, tone }) {
  const classes =
    tone === "yellow"
      ? "border-yellow-100 bg-yellow-100/80 text-red-600"
      : "border-indigo-100 bg-indigo-100/80 text-red-600";

  return (
    <div
      className={`mx-auto mt-2 max-w-[720px] rounded border px-5 py-3 text-center text-[17px] font-black leading-8 ${classes}`}
    >
      {children}
    </div>
  );
}

function JumpButton({ children, targetId, className = "" }) {
  return (
    <button
      type="button"
      onClick={() =>
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      className={`inline-flex items-center gap-2 rounded bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 ${className}`}
    >
      <ShoppingCart size={14} />
      {children}
    </button>
  );
}

function SectionBadge({ children }) {
  return (
    <div className="my-4 text-center">
      <span className="inline-flex rounded border border-blue-200 bg-white px-7 py-3 text-2xl font-black text-red-600 shadow-sm">
        {children}
      </span>
    </div>
  );
}

function WinnerCard({ name, index, image }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-rose-200 via-amber-100 to-sky-200">
        {image ? (
          <img
            src={image}
            alt={name}
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <>
            <div className="absolute left-3 top-3 h-14 w-14 rounded-full bg-white/80" />
            <div className="absolute inset-x-3 bottom-3 h-9 rounded bg-black/70" />
          </>
        )}
        <div className="absolute bottom-2 right-3 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-white shadow">
          #{index + 1}
        </div>
      </div>
      <div className="px-2.5 py-2 text-center">
        <p className="truncate text-sm font-black text-red-600">{name}</p>
        <p className="text-[11px] font-bold text-slate-500">R15 বাইক বিজয়ী</p>
      </div>
    </div>
  );
}

function CheckoutPanel({ title, icon, children }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-black text-slate-800">
        <span className="text-blue-600">{icon}</span>
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block text-left">
      <span className="mb-1 block text-xs font-bold text-slate-600">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
      />
    </label>
  );
}

function ProductOptionsCheckout({
  title,
  options,
  selectedProducts,
  onToggle,
  onQtyChange,
  compact = true,
}) {
  const selectedIds = new Set(selectedProducts.map((item) => item.id));

  return (
    <div className={`rounded border border-blue-200 bg-blue-50 ${compact ? "p-4" : "p-0 border-0 bg-transparent"}`}>
      <h3 className="text-xs font-bold text-blue-700">{title}</h3>
      <div className={`mt-3 grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
        {options.map((option) => {
          const selected = selectedIds.has(option.id);
          const cartItem = selectedProducts.find((item) => item.id === option.id);
          return (
            <div
              key={option.id}
              className={`flex items-center gap-3 rounded border bg-white p-3 transition ${
                selected ? "border-emerald-400 ring-1 ring-emerald-100" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => onToggle(option)}
                className={`h-4 w-4 flex-shrink-0 rounded-full border ${
                  selected ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                }`}
                aria-label={`Select ${option.name}`}
              />
              <img
                src={imageUrl(option.image) || heroImage}
                alt={option.name}
                className="h-12 w-14 flex-shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-slate-800">{option.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center rounded border border-slate-200 bg-slate-50 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => selected && onQtyChange(option.id, -1)}
                      disabled={!selected}
                      className="px-2 py-1 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="min-w-7 px-2 py-1 text-center">{cartItem?.qty || 1}</span>
                    <button
                      type="button"
                      onClick={() => selected && onQtyChange(option.id, 1)}
                      disabled={!selected}
                      className="px-2 py-1 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs font-black text-emerald-700">
                    ৳{formatMoney(option.price)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductCardCarousel({ options }) {
  const carouselItems = options.length >= 4
    ? options
    : Array.from({ length: 4 }, (_, index) => options[index % options.length]).filter(Boolean);
  const repeatedItems = [...carouselItems, ...carouselItems];

  return (
    <div className="mx-auto max-w-[1140px] overflow-hidden">
      <style>{`
        @keyframes murda-product-slide {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .murda-product-track {
          animation: murda-product-slide 22s linear infinite;
        }
        .murda-product-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="murda-product-track flex w-max gap-4">
        {repeatedItems.map((option, index) => (
          <div
            key={`${option.id}-${index}`}
            className="w-[82vw] max-w-[270px] flex-shrink-0 overflow-hidden rounded border border-slate-200 bg-white shadow-sm sm:w-[45vw] lg:w-[270px]"
          >
            <div className="aspect-square overflow-hidden bg-slate-50">
              <img
                src={imageUrl(option.image) || heroImage}
                alt={option.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeCarouselItems(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => ({
      id: item.id || item.productId || `carousel-${index}`,
      name: item.name || "",
      price: toNumber(item.price, 0),
      originalPrice: toNumber(item.originalPrice, 0),
      image: item.image || "",
    }))
    .filter((item) => item.name || item.image);
}

function RadioOption({ selected, label, price, note, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded border p-3 text-left transition ${
        selected
          ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
          <span
            className={`h-2.5 w-2.5 rounded-full ${selected ? "bg-orange-500" : "bg-slate-300"}`}
          />
          {label}
        </span>
        {price ? (
          <span className="text-xs font-black text-blue-600">{price}</span>
        ) : null}
      </span>
      {note ? (
        <span className="mt-1 block pl-4 text-xs text-slate-500">{note}</span>
      ) : null}
    </button>
  );
}

function SummaryRow({ label, value, strong, highlight }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0">
      <span
        className={`${strong ? "font-black text-slate-900" : "text-slate-600"}`}
      >
        {label}
      </span>
      <span
        className={`${strong ? "font-black" : "font-semibold"} ${highlight ? "text-emerald-700" : "text-slate-800"}`}
      >
        {value}
      </span>
    </div>
  );
}

function ProductCard({ item, image }) {
  function openLandingPage() {
    if (!item.id) return;
    window.location.assign(`/?landingPageId=${item.id}`);
  }

  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white text-left shadow-sm">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-amber-100 via-white to-emerald-100">
        {image ? (
          <img
            src={image}
            alt={item.name}
            className="h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 px-5 text-center text-xs font-black text-slate-400">
            No banner image
          </div>
        )}
        <span className="absolute right-2 top-2 rounded bg-white px-2 py-1 text-[10px] font-black text-red-600 shadow">
          40% Off
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-black text-slate-800">
          {item.name}
        </h3>
        <div className="mt-2 flex items-center gap-1 text-amber-500">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} size={12} fill="currentColor" />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-base font-black text-red-600">
            {formatMoney(item.price)}
          </span>
          <span className="text-xs text-slate-400 line-through">
            {formatMoney(item.oldPrice)}
          </span>
        </div>
        <button
          type="button"
          onClick={openLandingPage}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded bg-orange-500 px-3 py-2 text-xs font-black text-white"
        >
          <ShoppingCart size={13} />
          Buy
        </button>
      </div>
    </div>
  );
}

function Footer({ phone, settings, pages = [] }) {
  const general = settings?.general || {};
  const contact = settings?.contact || {};
  const footer = settings?.footer || {};
  const hasDynamicFooter = Boolean(settings?.footer);
  const socialLinks = footer.socialLinks?.length
    ? footer.socialLinks.map((item) => ({
        ...item,
        key: item.platform || item.key,
      }))
    : settings?.social?.length
      ? settings.social
      : [
          { key: "facebook", label: "facebook", url: "" },
          { key: "youtube", label: "youtube", url: "" },
          { key: "tiktok", label: "tiktok", url: "" },
          { key: "instagram", label: "instagram", url: "" },
        ];
  const siteName =
    footer.companyName ||
    general.companyName ||
    general.websiteName ||
    general.siteName ||
    general.name ||
    "ওয়াজিহ";
  const logo =
    footer.logoUrl ||
    general.logo ||
    general.logoUrl ||
    general.logoFile ||
    general.darkLogo ||
    general.whiteLogo ||
    "";
  const supportPhone =
    footer.supportPhone ||
    contact.hotlineNumber ||
    contact.phoneNumber ||
    contact.phone ||
    contact.whatsappNumber ||
    phone;
  const address =
    footer.address ||
    contact.address ||
    general.address ||
    "500/3 Khilgaon Niribili Society, Dhaka Bangladesh";
  const description =
    footer.description ||
    general.footerText ||
    general.shortDescription ||
    general.metaDescription ||
    "Corporate and promotional gift item supplier in Bangladesh";
  const defaultQuickLinks = [
    {
      label: "Customer Support",
      href: supportPhone
        ? `tel:${String(supportPhone).replace(/\s+/g, "")}`
        : "#",
      onClick: () => trackLandingContactClick("Landing footer support", supportPhone),
    },
    { label: "All Products", href: "#products" },
    { label: "Categories", href: "#categories" },
    { label: "Track My Order", href: "#track-order" },
  ];
  const quickLinks = footer.quickLinks?.length
    ? footer.quickLinks.map((link) => ({ ...link, href: link.url || "#" }))
    : defaultQuickLinks;
  const importantLinks = footer.importantLinks?.length
    ? footer.importantLinks.map((link) => ({ ...link, href: link.url || "#" }))
    : pages.length
      ? pages.map((page) => ({
          label: page.title || page.name || page.pageTitle || page.slug,
          href: page.slug ? `/page/${page.slug}` : "#",
        }))
      : [{ label: "Refund Policy", href: "#" }];

  if (hasDynamicFooter && footer.status === false) return null;

  return (
    <footer className="bg-[#20211f] text-slate-300">
      <div className="mx-auto  px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.65fr_0.75fr_0.75fr_1fr]">
          <div>
            <div className="flex items-center gap-3 text-xl font-black text-white">
              {logo ? (
                <img
                  src={logo}
                  alt={siteName}
                  className="h-12 w-12 rounded-sm bg-white object-contain p-1 shadow-sm"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-sm bg-white text-sm text-amber-500 shadow-sm">
                  {siteName.slice(0, 1)}
                </span>
              )}
              {siteName}
            </div>
            <p className="mt-7 text-md font-medium text-slate-400">
              {footer.supportLabel || "Customer Supports:"}
            </p>
            <p className="mt-3 text-md font-black tracking-wide text-white">
              {supportPhone}
            </p>
            <p className="mt-7 max-w-xl text-base font-medium leading-7 text-slate-400">
              {description}
            </p>
            <p className="mt-3 text-base font-medium text-slate-400">
              {address}
            </p>
          </div>

          <FooterLinks
            title={footer.quickLinksTitle || "Quick Links"}
            links={quickLinks}
          />

          <div>
            <h3 className="text-xl font-black text-white">
              {footer.socialLinksTitle || "Follow Us"}
            </h3>
            <ul className="mt-5 space-y-3 text-base font-semibold text-slate-500">
              {socialLinks.map((item) => (
                <li
                  key={`${item.key}-${item.label}`}
                  className="flex text-md font-medium text-slate-400 items-center gap-3"
                >
                  <a
                    href={item.url || "#"}
                    target={item.url ? "_blank" : undefined}
                    rel={item.url ? "noreferrer" : undefined}
                    className="inline-flex items-center gap-3 transition hover:text-white"
                  >
                    <SocialIcon
                      type={item.key}
                      label={item.label}
                      className="h-5 w-5 text-md font-medium text-slate-400 hover:text-white"
                    />
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-black text-white">
              {footer.importantLinksTitle || "Important Links"}
            </h3>
            <div className="mt-5 space-y-3">
              {importantLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex w-full max-w-xs items-center justify-between rounded-lg bg-[#343538] px-4 py-4 text-sm font-black text-slate-400 transition hover:bg-[#3d3e42] hover:text-white"
                >
                  <span className="inline-flex items-center gap-3">
                    <span className="h-2.5 w-2.5 text-md font-medium rounded-full bg-slate-400" />
                    {link.label}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-4 w-4 fill-none stroke-current stroke-2"
                  >
                    <path d="M7 17 17 7" />
                    <path d="M9 7h8v8" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded bg-white shadow-sm">
          <img
            src={footer.paymentMethodsImageUrl || sslcommerzImage}
            alt="Available payment methods and SSLCommerz verification"
            className="w-full object-contain"
          />
        </div>

        {(footer.copyrightText || footer.developerText) && (
          <div className="mt-10 border-t border-white/10 pt-8">
            <p className="text-center text-sm font-bold text-slate-500">
              {footer.copyrightText}
              {footer.copyrightText && footer.developerText ? " " : ""}
              {footer.developerUrl ? (
                <a
                  href={footer.developerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400"
                >
                  {footer.developerText}
                </a>
              ) : (
                <span className="text-sky-400">{footer.developerText}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }) {
  return (
    <div>
      <h3 className="text-xl font-black text-white">{title}</h3>
      <ul className="mt-5 space-y-3 text-md font-medium text-slate-400">
        {links.map((link) => {
          const item =
            typeof link === "string" ? { label: link, href: "#" } : link;
          return (
            <li key={item.label}>
              <a
                href={item.href || "#"}
                className="transition hover:text-white"
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function getProductName(campaign) {
  if (!campaign) return "Attar & Perfume Combo Pack";
  if (typeof campaign.product === "string") return campaign.product;
  return (
    campaign.product?.name ||
    campaign.productName ||
    "Attar & Perfume Combo Pack"
  );
}

function getLandingProductOptions(campaign, fallback, freeShippingIds) {
  const regularData = parseObject(campaign?.regularData);
  // Same linked product the order API checks for free shipping.
  const freeIds = new Set((freeShippingIds || []).map(Number));
  const isFreeShipping = (linkedId) =>
    freeIds.has(Number(linkedId || campaign?.productId || 0));
  const configured = Array.isArray(regularData.productOptions)
    ? regularData.productOptions
    : [];
  const options = configured
    .map((item) => ({
      id: String(item.productId || item.id || item.name || ""),
      productId: item.productId || item.id || "",
      name: item.name || "Product",
      price: toNumber(item.price, fallback.price),
      originalPrice: toNumber(item.originalPrice, fallback.originalPrice),
      image: imageUrl(item.image) || fallback.bannerImage || heroImage,
      freeShipping: isFreeShipping(item.productId),
    }))
    .filter((item) => item.id && item.name && item.price > 0);

  if (options.length) return options;

  return [
    {
      id: String(campaign?.productId || campaign?.Id || "campaign-product"),
      productId: campaign?.productId || campaign?.Id || "",
      name: fallback.productName,
      price: fallback.price,
      originalPrice: fallback.originalPrice,
      image: fallback.bannerImage || heroImage,
      freeShipping: isFreeShipping(campaign?.productId),
    },
  ];
}

function initializeSelectedProducts(options) {
  const first = options[0];
  return first ? [{ ...first, qty: 1 }] : [];
}

function normalizeTemplate(value) {
  const template = String(value || "Template Design 1").trim();
  if (
    template === "Murda Moshari Offer" ||
    template === "Giveaway Campaign" ||
    template === "Template Design 2" ||
    template === "Template Design 3"
  )
    return template;
  return "Template Design 1";
}

function normalizeSettingData(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeSocialMedia(value) {
  const data = normalizeSettingData(value);
  const list = Array.isArray(data) ? data : Object.values(data || {});

  return list
    .filter((item) => item && typeof item === "object")
    .filter((item) => isActiveStatus(item.active))
    .map((item) => ({
      key: String(item.key || item.type || item.label || "").toLowerCase(),
      label: item.label || item.key || "Social",
      url: item.url || item.link || "",
    }))
    .filter((item) => item.key);
}

function isActiveStatus(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  return !["0", "false", "inactive", "disabled"].includes(normalized);
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-BD");
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseImages(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function getCampaignBannerImage(page) {
  return (
    page?.bannerImageUrl ||
    page?.bannerImage ||
    page?.banner ||
    page?.imageUrl ||
    page?.image ||
    ""
  );
}
