import { apiRequest } from "../utils/apiClient";

let initializationPromise = null;
// Dashboard previews must not send real events to the live pixels / Conversions API.
let trackingSuspended = false;

export function setTrackingSuspended(value) {
  trackingSuspended = Boolean(value);
}
let trackingConfig = { metaPixels: [], tiktokPixels: [], googleAds: [] };

const META_EVENT_NAMES = {
  PageView: "PageView",
  ViewContent: "ViewContent",
  Search: "Search",
  InitiateCheckout: "InitiateCheckout",
  AddPaymentInfo: "AddPaymentInfo",
  AddToCart: "AddToCart",
  Lead: "Lead",
  Contact: "Contact",
  Purchase: "Purchase",
};

const TIKTOK_EVENT_NAMES = {
  PageView: "Pageview",
  ViewContent: "ViewContent",
  Search: "Search",
  InitiateCheckout: "InitiateCheckout",
  AddPaymentInfo: "AddPaymentInfo",
  AddToCart: "AddToCart",
  Lead: "SubmitForm",
  Contact: "Contact",
  Purchase: "CompletePayment",
};

const GOOGLE_EVENT_NAMES = {
  ViewContent: "view_item",
  Search: "search",
  AddToCart: "add_to_cart",
  InitiateCheckout: "begin_checkout",
  AddPaymentInfo: "add_payment_info",
  Lead: "generate_lead",
  Contact: "contact",
  Purchase: "purchase",
};

function createEventId(eventName) {
  if (globalThis.crypto?.randomUUID)
    return `${eventName}.${globalThis.crypto.randomUUID()}`;
  return `${eventName}.${Date.now()}.${Math.random().toString(16).slice(2)}`;
}

function getCookie(name) {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  return (
    document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix))
      ?.slice(prefix.length) || ""
  );
}

function getClickData() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  const gclid = params.get("gclid");
  const gbraid = params.get("gbraid");
  const wbraid = params.get("wbraid");
  return {
    fbp: getCookie("_fbp") || undefined,
    fbc:
      getCookie("_fbc") ||
      (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined),
    ttp: getCookie("_ttp") || undefined,
    ttclid: params.get("ttclid") || undefined,
    gclid: gclid || undefined,
    gbraid: gbraid || undefined,
    wbraid: wbraid || undefined,
  };
}

function installMetaPixel() {
  if (typeof window === "undefined") return;
  if (!window.fbq) {
    const fbq = function fbq(...args) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
  }
  if (!document.querySelector("script[data-holydeen-meta-pixel]")) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.dataset.holydeenMetaPixel = "true";
    document.head.appendChild(script);
  }
}

function installTiktokPixel() {
  if (typeof window === "undefined" || window.ttq) return;
  const ttq = (window.ttq = []);
  ttq.methods = [
    "page",
    "track",
    "identify",
    "instances",
    "debug",
    "on",
    "off",
    "once",
    "ready",
    "alias",
    "group",
    "enableCookie",
    "disableCookie",
    "holdConsent",
    "revokeConsent",
    "grantConsent",
  ];
  ttq.setAndDefer = (target, method) => {
    target[method] = (...args) => target.push([method, ...args]);
  };
  ttq.methods.forEach((method) => ttq.setAndDefer(ttq, method));
  ttq.instance = (pixelCode) => {
    const instance = ttq._i?.[pixelCode] || [];
    ttq.methods.forEach((method) => ttq.setAndDefer(instance, method));
    return instance;
  };
  ttq.load = (pixelCode, options = {}) => {
    ttq._i = ttq._i || {};
    ttq._i[pixelCode] = [];
    ttq._i[pixelCode]._u = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._t = ttq._t || {};
    ttq._t[pixelCode] = Date.now();
    ttq._o = ttq._o || {};
    ttq._o[pixelCode] = options;
    const script = document.createElement("script");
    script.async = true;
    script.src = `${ttq._i[pixelCode]._u}?sdkid=${encodeURIComponent(pixelCode)}&lib=ttq`;
    script.dataset.holydeenTiktokPixel = pixelCode;
    document.head.appendChild(script);
  };
}

function installGoogleTag(conversionId) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };
  if (!document.querySelector("script[data-holydeen-google-tag]")) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(conversionId)}`;
    script.dataset.holydeenGoogleTag = "true";
    document.head.appendChild(script);
    window.gtag("js", new Date());
  }
}

export async function initializeTracking() {
  if (initializationPromise) return initializationPromise;
  initializationPromise = apiRequest("/tracking/config")
    .then((response) => {
      trackingConfig = {
        metaPixels: Array.isArray(response?.data?.metaPixels)
          ? response.data.metaPixels
          : [],
        tiktokPixels: Array.isArray(response?.data?.tiktokPixels)
          ? response.data.tiktokPixels
          : [],
        googleAds: Array.isArray(response?.data?.googleAds)
          ? response.data.googleAds
          : [],
      };

      if (trackingConfig.metaPixels.length) {
        installMetaPixel();
        trackingConfig.metaPixels.forEach((pixel) =>
          window.fbq("init", pixel.pixelsId),
        );
      }
      if (trackingConfig.tiktokPixels.length) {
        installTiktokPixel();
        trackingConfig.tiktokPixels.forEach((pixel) =>
          window.ttq.load(pixel.pixelCode),
        );
      }
      trackingConfig.googleAds.forEach((config, index) => {
        if (index === 0) installGoogleTag(config.conversionId);
        window.gtag?.("config", config.conversionId);
      });
      return trackingConfig;
    })
    .catch((error) => {
      initializationPromise = null;
      throw error;
    });
  return initializationPromise;
}

function trackInBrowser(eventName, eventId, customData) {
  const metaEventName = META_EVENT_NAMES[eventName] || eventName;
  trackingConfig.metaPixels.forEach((pixel) => {
    window.fbq?.("trackSingle", pixel.pixelsId, metaEventName, customData, {
      eventID: eventId,
    });
  });

  const tiktokEventName = TIKTOK_EVENT_NAMES[eventName] || eventName;
  trackingConfig.tiktokPixels.forEach((pixel) => {
    window.ttq
      ?.instance(pixel.pixelCode)
      ?.track(tiktokEventName, { ...customData, event_id: eventId });
  });

  if (eventName === "Purchase") {
    trackingConfig.googleAds.forEach((config) => {
      if (!config.conversionId || !config.conversionLabel) return;
      window.gtag?.("event", "conversion", {
        send_to: `${config.conversionId}/${config.conversionLabel}`,
        value: customData.value,
        currency: customData.currency || "BDT",
        transaction_id: customData.order_id || eventId,
      });
    });
  }

  const googleEventName = GOOGLE_EVENT_NAMES[eventName];
  if (googleEventName) {
    trackingConfig.googleAds.forEach((config) => {
      if (!config.conversionId) return;
      window.gtag?.("event", googleEventName, {
        value: customData.value,
        currency: customData.currency || "BDT",
        items: (customData.content_ids || []).map((item) => ({
          item_id: String(item),
          item_name: customData.content_name || "",
          quantity: customData.num_items || 1,
        })),
      });
    });
  }
}

export function getTrackingClickData() {
  return getClickData();
}

export async function trackMarketingEvent(
  eventName,
  { userData = {}, customData = {}, eventId: suppliedEventId, server = true, enabled = true } = {},
) {
  if (!enabled || trackingSuspended) return null;
  try {
    await initializeTracking();
    if (!enabled || trackingSuspended) return null;
    const eventId = suppliedEventId || createEventId(eventName);
    trackInBrowser(eventName, eventId, customData);
    if (!server) return eventId;
    const clickData = getClickData();
    const response = await apiRequest("/tracking/events", {
      method: "POST",
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        referrerUrl: document.referrer || undefined,
        userData: { ...userData, ...clickData },
        customData,
      }),
    });
    const failures = response?.data?.results?.filter((item) => !item.ok && !item.skipped) || [];
    if (failures.length) console.warn('Marketing delivery failed', failures.map(({ platform, status }) => ({ platform, status })));
    return failures.length ? null : eventId;
  } catch (error) {
    console.warn(`Marketing event "${eventName}" failed`, error);
    return null;
  }
}

export function resetTrackingForTests() {
  initializationPromise = null;
  trackingConfig = { metaPixels: [], tiktokPixels: [], googleAds: [] };
}
