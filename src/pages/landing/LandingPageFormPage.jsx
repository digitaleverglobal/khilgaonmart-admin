import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ImageIcon, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { landingPageService } from '../../services/landingPageService';
import { imageUrl } from '../../utils/assetUrl';
import { OFFER_PAGE_TYPE } from './LandingPageListPage';

// Defaults follow the reference offer page so a new page is ready after adding products and a banner.
const DEFAULT_HEADLINES = [
  'মিস্ট এয়ার কুলার, জাদুর এই এসি বাংলাদেশে এখন পাচ্ছেন',
  'বিদ্যুৎ ছাড়া চলবে ৬-৮ ঘণ্টা, সাথে বিদ্যুৎ দিয়েও চালানো যাবে।',
  'আজ অর্ডার করলে পাচ্ছেন ৫০% ডিসকাউন্ট বিশেষ ছাড়! সারা বাংলাদেশে ফ্রি হোম ডেলিভারি',
];

const DEFAULT_FEATURES = [
  'ডাবল কুলিং সিস্টেম – বাতাস + পানি মিস্ট একসাথে দেয়, ফলে দ্রুত ঠান্ডা লাগে।',
  'ডাবল ব্যাটারি বিদ্যুৎ ছাড়া চলবে বেশি সময় ধরে।',
  'USB / ব্যাটারি চালিত – বিদ্যুৎ না থাকলেও ব্যবহার করা যায়।',
];

// "Demo দিয়ে ভরুন" fills the form with this sample; images live in public/demo.
const DEMO_CONTENT = {
  title: 'Mini Air Cooler Offer',
  headlines: [
    'মিস্ট এয়ার কুলার, জাদুর এই এসি বাংলাদেশে এখন পাচ্ছেন খিলগাঁও মার্টে',
    'বিদ্যুৎ ছাড়া চলবে ৬-৮ ঘণ্টা, সাথে বিদ্যুৎ দিয়েও চালানো যাবে।',
    'আজ অর্ডার করলে পাচ্ছেন ৫০% ডিসকাউন্ট বিশেষ ছাড়! সারা বাংলাদেশে ফ্রি হোম ডেলিভারি',
  ],
  featureTitle: 'ফ্যানটির আকর্ষণীয় বিবরন',
  features: [
    'ডাবল কুলিং সিস্টেম – বাতাস + পানি মিস্ট একসাথে দেয়, ফলে দ্রুত ঠান্ডা লাগে।',
    'ডাবল ব্যাটারি বিদ্যুৎ ছাড়া চলবে বেশি সময় ধরে।',
    'USB / ব্যাটারি চালিত – বিদ্যুৎ না থাকলেও ব্যবহার করা যায়।',
    'কম বিদ্যুৎ খরচ – AC এর তুলনায় অনেক সাশ্রয়ী।',
    'নিম্ন শব্দ (Low Noise) – ঘুম বা পড়াশোনায় সমস্যা করে না।',
    'অ্যাডজাস্টেবল মিস্ট লেভেল – পানি স্প্রে কম-বেশি করা যায়।',
    'মাল্টিপল স্পিড সেটিংস – নিজের মতো বাতাসের গতি ঠিক করা যায়।',
    'পোর্টেবল ডিজাইন – সহজে এক জায়গা থেকে অন্য জায়গায় নেওয়া যায়।',
  ],
  ctaText: 'অর্ডার করতে চাই',
  price: '1150',
  originalPrice: '2300',
};
const DEMO_BANNER_PATH = '/demo/offer-banner.jpg';
const DEMO_CAROUSEL_TITLE = 'এক নজরে মিনি এয়ার কুলার';
const DEMO_REVIEW_TITLE = 'আমাদের সন্তুষ্ট ক্রেতাদের মতামত';
const DEMO_REVIEW_PATHS = ['/demo/review-1.svg', '/demo/review-2.svg', '/demo/review-3.svg'];
const DEMO_CAROUSEL_PATHS = [
  '/demo/offer-mist.jpg',
  '/demo/offer-glass.jpg',
  '/demo/offer-product.jpg',
  '/demo/offer-banner.jpg',
];

// Text of the checkout-style order form (same layout as the website checkout).
const DEFAULT_CHECKOUT_FORM = {
  formHeaderText: "বিস্তারিত তথ্য পূরণ করুন এবং 'অর্ডার কনফার্ম করুন' বাটনে ক্লিক করুন।",
  nameLabel: 'আপনার নাম',
  phoneLabel: 'ফোন নাম্বার',
  phonePlaceholder: '১১ সংখ্যার মোবাইল নম্বর',
  addressLabel: 'আপনার পুরো ঠিকানা',
  districtLabel: 'জেলা নির্বাচন করুন',
  districtPlaceholder: '-- জেলা বেছে নিন --',
  areaLabel: 'এরিয়া নির্বাচন করুন',
  areaPlaceholder: '-- এরিয়া বেছে নিন --',
  deliveryDateLabel: 'ডেলিভারি তারিখ ও সময়',
  noteLabel: 'বিশেষ নোট (ঐচ্ছিক)',
  notePlaceholder: 'ডেলিভারি সংক্রান্ত কোনো নির্দেশনা থাকলে লিখুন',
  paymentLabel: 'পেমেন্ট মেথড',
  codLabel: 'Cash on Delivery',
  codDescription: 'পণ্য হাতে পেয়ে টাকা দিন',
  buttonText: 'অর্ডার কনফার্ম করুন',
  placingText: 'প্রসেস হচ্ছে...',
  policyTitle: 'হোম ডেলিভারি পলিসি',
  summaryTitle: 'অর্ডার বিবরণ',
  subtotalLabel: 'মোট',
  deliveryLabel: 'ডেলিভারি চার্জ',
  discountLabel: 'ডিসকাউন্ট',
  totalLabel: 'সর্বমোট',
  freeDeliveryText: 'ফ্রি ডেলিভারি',
  couponPlaceholder: 'Apply Coupon',
  couponButtonText: 'APPLY',
  requiredError: 'নাম, ফোন, জেলা এবং ঠিকানা পূরণ করুন।',
  areaRequiredError: 'এরিয়া নির্বাচন করুন।',
  phoneError: 'সঠিক ১১ সংখ্যার ফোন নাম্বার দিন।',
  productRequiredError: 'অর্ডারের জন্য অন্তত একটি প্রোডাক্ট সিলেক্ট করুন।',
};

// Earlier default texts that no longer fit small phones; saved pages still holding them
// get the current default.
const OLD_DEFAULT_CHECKOUT_FORM = {
  phonePlaceholder: '০ দিয়ে শুরু করে ১১ সংখ্যার মোবাইল নম্বর দিন',
};

function withoutOldDefaults(labels) {
  const next = { ...labels };
  Object.entries(OLD_DEFAULT_CHECKOUT_FORM).forEach(([key, value]) => {
    if (next[key] === value) next[key] = DEFAULT_CHECKOUT_FORM[key];
  });
  return next;
}

const CHECKOUT_FORM_FIELDS = [
  ['formHeaderText', 'Form Header (রঙিন strip)'],
  ['nameLabel', 'Name Label'],
  ['phoneLabel', 'Phone Label'],
  ['phonePlaceholder', 'Phone Placeholder'],
  ['addressLabel', 'Address Label'],
  ['districtLabel', 'District Label'],
  ['districtPlaceholder', 'District Placeholder'],
  ['areaLabel', 'Area Label'],
  ['areaPlaceholder', 'Area Placeholder'],
  ['deliveryDateLabel', 'Delivery Date Label'],
  ['noteLabel', 'Note Button Text'],
  ['notePlaceholder', 'Note Placeholder'],
  ['paymentLabel', 'Payment Label'],
  ['codLabel', 'Cash on Delivery Title'],
  ['codDescription', 'Cash on Delivery Text'],
  ['buttonText', 'Confirm Button Text'],
  ['placingText', 'Button Text While Placing'],
  ['policyTitle', 'Delivery Policy Title (fallback)'],
  ['summaryTitle', 'Order Summary Title'],
  ['subtotalLabel', 'Subtotal Label'],
  ['deliveryLabel', 'Delivery Charge Label'],
  ['discountLabel', 'Discount Label'],
  ['totalLabel', 'Total Label'],
  ['freeDeliveryText', 'Free Delivery Text'],
  ['couponPlaceholder', 'Coupon Placeholder'],
  ['couponButtonText', 'Coupon Button'],
  ['requiredError', 'Required Field Error'],
  ['areaRequiredError', 'No Area Error'],
  ['phoneError', 'Wrong Phone Error'],
  ['productRequiredError', 'No Product Error'],
];

const DEFAULT_COLORS = {
  pageBg: '#000000',
  accentColor: '#e10600',
  headlineBg: '#f2f2f2',
  headlineText: '#111111',
  priceBg: '#000000',
  priceText: '#ffffff',
  sectionBg: '#ffffff',
  textColor: '#1e293b',
  checkColor: '#f97316',
  buttonTextColor: '#ffffff',
  formSectionBg: '#f7f4ef',
  footerBg: '#0f172a',
  footerText: '#ffffff',
  formHeaderBg: '#F07A22',
  confirmButtonBg: '#0E4A5F',
};

// Defaults of the short-lived "premium" layout; pages saved with them get the current defaults.
const PREVIOUS_DEFAULT_COLORS = {
  pageBg: '#f7f4ef',
  accentColor: '#e11d2a',
  headlineBg: '#0f172a',
  headlineText: '#ffffff',
  priceBg: '#111827',
  priceText: '#ffffff',
  checkColor: '#16a34a',
};

function resolveColors(saved = {}) {
  const untouched = ['pageBg', 'headlineBg', 'headlineText', 'priceBg'].every(
    (key) => String(saved[key] || '').toLowerCase() === PREVIOUS_DEFAULT_COLORS[key],
  );
  const kept = untouched
    ? Object.fromEntries(
        Object.entries(saved).filter(
          ([key, value]) => String(value || '').toLowerCase() !== PREVIOUS_DEFAULT_COLORS[key],
        ),
      )
    : saved;
  return { ...DEFAULT_COLORS, ...kept };
}

const COLOR_FIELDS = [
  ['pageBg', 'Page Background'],
  ['accentColor', 'Accent (title, button, circle)'],
  ['headlineBg', 'Headline Strip Background'],
  ['headlineText', 'Headline Strip Text'],
  ['priceBg', 'Price Bar Background'],
  ['priceText', 'Price Bar Text'],
  ['sectionBg', 'Box Background (logo, features, form title)'],
  ['textColor', 'Text'],
  ['checkColor', 'Feature Check Icon'],
  ['formSectionBg', 'Order Form Area Background'],
  ['footerBg', 'Footer Background'],
  ['footerText', 'Footer Text'],
  ['buttonTextColor', 'Button Text'],
  ['formHeaderBg', 'Order Form Header'],
  ['confirmButtonBg', 'Confirm Order Button'],
];

function parseObject(value) {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return parseObject(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function urlToDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Demo image load failed.');
  return fileToDataUrl(await response.blob());
}

function getProductPrice(product = {}) {
  return Number(product.offerPrice || product.salePrice || product.price || product.regularPrice || 0);
}

function getProductImage(product = {}) {
  if (product.file) return product.file;
  if (Array.isArray(product.images) && product.images[0]) return product.images[0];
  if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed[0]) return parsed[0];
    } catch {
      return product.images;
    }
  }
  return '';
}

function stringList(value, fallback) {
  return Array.isArray(value) ? value.map((item) => String(item ?? '')) : fallback;
}

function buildFormState(campaign) {
  const data = parseObject(campaign?.regularData);
  return {
    title: campaign?.title || '',
    status: campaign?.status ?? true,
    showLogo: data.showLogo !== false,
    logoUrl: data.logoUrl || '',
    bannerImageUrl: campaign?.bannerImageUrl || '',
    headlines: stringList(data.headlines, DEFAULT_HEADLINES),
    carouselTitle: data.carouselTitle ?? '',
    carouselImages: Array.isArray(data.carouselImages) ? data.carouselImages.filter(Boolean) : [],
    showCarousel: data.showCarousel !== false,
    reviewCarouselTitle: data.reviewCarouselTitle ?? '',
    reviewCarouselImages: Array.isArray(data.reviewCarouselImages) ? data.reviewCarouselImages.filter(Boolean) : [],
    showReviewCarousel: data.showReviewCarousel !== false,
    featureTitle: data.featureTitle ?? 'পণ্যটির আকর্ষণীয় বিবরণ',
    features: stringList(data.features, DEFAULT_FEATURES),
    ctaText: data.ctaText || 'অর্ডার করতে চাই',
    priceLabel: data.priceLabel ?? 'অফার মূল্য-',
    currencyText: data.currencyText ?? 'টাকা',
    price: Number(campaign?.price) > 0 ? String(Number(campaign.price)) : '',
    originalPrice: Number(campaign?.originalPrice) > 0 ? String(Number(campaign.originalPrice)) : '',
    productOptions: Array.isArray(data.productOptions) ? data.productOptions : [],
    orderTitle: data.orderTitle || 'অর্ডার করতে নিচের ফর্মটি সঠিক ভাবে পুরন করুন।',
    deliveryInside: data.deliveryInside ?? 80,
    deliveryOutside: data.deliveryOutside ?? 130,
    checkoutForm: withoutOldDefaults({ ...DEFAULT_CHECKOUT_FORM, ...parseObject(data.checkoutForm) }),
    showDeliveryDate: data.showDeliveryDate !== false,
    showNote: data.showNote !== false,
    showCoupon: data.showCoupon !== false,
    showPolicy: data.showPolicy !== false,
    footerText: data.footerText || '',
    colors: resolveColors(parseObject(data.colors)),
  };
}

export default function LandingPageFormPage({ campaign, onNavigate }) {
  const isEdit = Boolean(campaign?.Id);
  const [form, setForm] = useState(() => buildFormState(campaign));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setNested(group, field, value) {
    setForm((prev) => ({ ...prev, [group]: { ...prev[group], [field]: value } }));
  }

  // Sent as a data URL so saving uploads it to the backend like a picked file.
  async function fillDemo() {
    setError('');
    try {
      const [bannerImageUrl, ...images] = await Promise.all(
        [DEMO_BANNER_PATH, ...DEMO_CAROUSEL_PATHS, ...DEMO_REVIEW_PATHS].map(urlToDataUrl),
      );
      const carouselImages = images.slice(0, DEMO_CAROUSEL_PATHS.length);
      const reviewCarouselImages = images.slice(DEMO_CAROUSEL_PATHS.length);
      setForm((prev) => ({
        ...prev,
        ...DEMO_CONTENT,
        title: prev.title || DEMO_CONTENT.title,
        bannerImageUrl,
        carouselTitle: DEMO_CAROUSEL_TITLE,
        carouselImages,
        showCarousel: true,
        reviewCarouselTitle: DEMO_REVIEW_TITLE,
        reviewCarouselImages,
        showReviewCarousel: true,
      }));
    } catch (err) {
      setError(err.message || 'Demo load failed.');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!form.title.trim()) {
      setError('Page title দিন।');
      return;
    }
    if (!form.productOptions.length) {
      setError('অন্তত একটি checkout product যোগ করুন।');
      return;
    }
    const missingPrice = form.productOptions.some((item) =>
      item.variants?.length
        ? item.variants.some((variant) => !(Number(variant.price) > 0))
        : !(Number(item.price) > 0),
    );
    if (missingPrice) {
      setError('প্রতিটি checkout product ও variation-এর offer price দিন।');
      return;
    }

    const productOptions = form.productOptions.map((item) => {
      const variants = (item.variants || []).map((variant) => ({
        variantId: Number(variant.variantId),
        label: String(variant.label || '').trim(),
        price: Number(variant.price),
        originalPrice: Number(variant.originalPrice) || '',
        image: variant.image || '',
      }));
      return {
        productId: String(item.productId),
        name: item.name,
        // With variations the first one is the card's starting price.
        price: variants.length ? variants[0].price : Number(item.price),
        originalPrice: variants.length ? variants[0].originalPrice : Number(item.originalPrice) || '',
        image: item.image || '',
        ...(variants.length ? { variants } : {}),
      };
    });
    const payload = {
      pageType: OFFER_PAGE_TYPE,
      template: OFFER_PAGE_TYPE,
      title: form.title.trim(),
      status: form.status,
      productId: productOptions[0].productId,
      bannerImageUrl: form.bannerImageUrl || null,
      price: form.price,
      originalPrice: form.originalPrice,
      regularData: {
        showLogo: form.showLogo,
        logoUrl: form.logoUrl || null,
        headlines: form.headlines.map((line) => line.trim()).filter(Boolean),
        carouselTitle: form.carouselTitle.trim(),
        carouselImages: form.carouselImages,
        showCarousel: form.showCarousel,
        reviewCarouselTitle: form.reviewCarouselTitle.trim(),
        reviewCarouselImages: form.reviewCarouselImages,
        showReviewCarousel: form.showReviewCarousel,
        featureTitle: form.featureTitle.trim(),
        features: form.features.map((line) => line.trim()).filter(Boolean),
        ctaText: form.ctaText.trim(),
        priceLabel: form.priceLabel,
        currencyText: form.currencyText.trim(),
        productOptions,
        orderTitle: form.orderTitle.trim(),
        deliveryInside: Number(form.deliveryInside) || 0,
        deliveryOutside: Number(form.deliveryOutside) || 0,
        checkoutForm: form.checkoutForm,
        showDeliveryDate: form.showDeliveryDate,
        showNote: form.showNote,
        showCoupon: form.showCoupon,
        showPolicy: form.showPolicy,
        footerText: form.footerText.trim(),
        colors: form.colors,
      },
    };

    setSaving(true);
    try {
      if (isEdit) await landingPageService.update(campaign.Id, payload);
      else await landingPageService.create(payload);
      onNavigate('landing_manage');
    } catch (err) {
      setError(err.message || 'Landing page save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('landing_manage')}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-600 shadow hover:bg-gray-50"
              title="Back to list"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                {isEdit ? 'Edit Landing Page' : 'Create Landing Page'}
              </h1>
              <p className="text-xs text-gray-500">Offer design — headline, banner, features, price ও order form।</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fillDemo}
              className="flex items-center gap-1.5 rounded-lg bg-purple-100 px-4 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-200"
              title="Demo text ও banner দিয়ে form পূরণ করুন"
            >
              <Sparkles size={14} />
              Demo দিয়ে ভরুন
            </button>
            <SaveButton saving={saving} isEdit={isEdit} />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{error}</div>
        )}

        <Card title="Basic">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <TextField
              label="Page Name — শুধু browser tab ও admin list-এ দেখায়, page-এর ভেতরে দেখায় না"
              required
              value={form.title}
              onChange={(value) => set('title', value)}
            />
            <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={form.status}
                onChange={(event) => set('status', event.target.checked)}
                className="h-4 w-4 accent-green-600"
              />
              Active
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Toggle label="Logo দেখাবে" checked={form.showLogo} onChange={(value) => set('showLogo', value)} />
              {form.showLogo && (
                <ImageField
                  label="Logo (খালি রাখলে website logo দেখাবে)"
                  value={form.logoUrl}
                  onChange={(value) => set('logoUrl', value)}
                />
              )}
            </div>
            <ImageField
              label="Banner Image"
              value={form.bannerImageUrl}
              onChange={(value) => set('bannerImageUrl', value)}
            />
          </div>
        </Card>

        <Card title="Top Headlines" hint="Page-এর একদম উপরের লেখা — logo-র নিচে প্রতিটি লাইন আলাদা strip হয়ে দেখাবে, তার নিচে banner। যত খুশি লাইন যোগ/মুছতে পারবেন।">
          <LineListEditor
            value={form.headlines}
            onChange={(value) => set('headlines', value)}
            addLabel="Add Headline"
          />
        </Card>

        <Card
          title="Carousel"
          hint="Banner-এর নিচে একটা title আর তার নিচে image carousel (মাঝের ছবি বড়, দুই পাশে ছোট; নিজে থেকে slide হয়)। OFF করলে landing page-এ দেখাবে না।"
          action={<SectionSwitch checked={form.showCarousel} onChange={(value) => set('showCarousel', value)} />}
          muted={!form.showCarousel}
        >
          <TextField label="Carousel Title" value={form.carouselTitle} onChange={(value) => set('carouselTitle', value)} />
          <CarouselImagesEditor value={form.carouselImages} onChange={(value) => set('carouselImages', value)} />
        </Card>

        <Card title="Features Section" hint="Banner-এর নিচে title, ✔ চিহ্নসহ feature list আর একটা button। Button Text mobile-এর নিচের order bar-এও ব্যবহার হয়।">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Section Title" value={form.featureTitle} onChange={(value) => set('featureTitle', value)} />
            <TextField label="Button Text" value={form.ctaText} onChange={(value) => set('ctaText', value)} />
          </div>
          <LineListEditor
            value={form.features}
            onChange={(value) => set('features', value)}
            addLabel="Add Feature"
          />
        </Card>

        <Card
          title="Review Carousel"
          hint="Features section ও “অর্ডার করতে চাই” button-এর পরে একটা title আর customer review-এর ছবির carousel (যেমন review screenshot)। OFF করলে landing page-এ দেখাবে না।"
          action={<SectionSwitch checked={form.showReviewCarousel} onChange={(value) => set('showReviewCarousel', value)} />}
          muted={!form.showReviewCarousel}
        >
          <TextField label="Review Title" value={form.reviewCarouselTitle} onChange={(value) => set('reviewCarouselTitle', value)} />
          <CarouselImagesEditor value={form.reviewCarouselImages} onChange={(value) => set('reviewCarouselImages', value)} />
        </Card>

        <Card title="Offer Price Bar" hint="Features-এর নিচের price bar — পুরনো দাম লাল গোল দাগে কাটা থাকবে। Price খালি রাখলে প্রথম checkout product-এর price দেখাবে।">
          <div className="grid gap-4 md:grid-cols-4">
            <TextField label="Label" value={form.priceLabel} onChange={(value) => set('priceLabel', value)} />
            <TextField label="Regular Price (কাটা দাগ)" type="number" value={form.originalPrice} onChange={(value) => set('originalPrice', value)} />
            <TextField label="Offer Price" type="number" value={form.price} onChange={(value) => set('price', value)} />
            <TextField label="Currency Text" value={form.currencyText} onChange={(value) => set('currencyText', value)} />
          </div>
        </Card>

        <Card title="Checkout Products" hint="Order form-এর title-এর নিচে shop-এর মতো product card হিসেবে দেখাবে; customer + চাপলে সেটি ডানপাশের অর্ডার বিবরণে আসবে। Product-এর variation থাকলে card-এ shop-এর মতো chip (যেমন 500 gm / 1 kg) নিজে থেকেই দেখাবে, product-এর দামে — landing-এর আলাদা দাম দিতে চাইলে “Variations যোগ করুন” চেপে দাম বসান। প্রথমটি default selected থাকবে।">
          <ProductOptionsEditor value={form.productOptions} onChange={(value) => set('productOptions', value)} />
        </Card>

        <Card title="Order Form" hint="Website-এর checkout page-এর মতো form — নাম, ফোন, ঠিকানা, জেলা/এরিয়া, ডেলিভারি তারিখ, নোট, পেমেন্ট মেথড, অর্ডার বিবরণ ও কুপন।">
          <div className="grid gap-4 md:grid-cols-3">
            <TextField label="Form-এর উপরের Title" value={form.orderTitle} onChange={(value) => set('orderTitle', value)} />
            <TextField label="ঢাকা জেলার Delivery Charge" type="number" value={form.deliveryInside} onChange={(value) => set('deliveryInside', value)} />
            <TextField label="অন্য জেলার Delivery Charge" type="number" value={form.deliveryOutside} onChange={(value) => set('deliveryOutside', value)} />
          </div>
          <p className="text-[11px] text-gray-500">
            Website Setting → Delivery Area-তে এরিয়া সেট করা থাকলে checkout-এর মতো এরিয়ার charge লাগবে; না থাকলে উপরের দুই charge।
          </p>
          <div className="flex flex-wrap gap-6">
            <Toggle label="ডেলিভারি তারিখ ও সময়" checked={form.showDeliveryDate} onChange={(value) => set('showDeliveryDate', value)} />
            <Toggle label="বিশেষ নোট" checked={form.showNote} onChange={(value) => set('showNote', value)} />
            <Toggle label="কুপন" checked={form.showCoupon} onChange={(value) => set('showCoupon', value)} />
            <Toggle label="হোম ডেলিভারি পলিসি" checked={form.showPolicy} onChange={(value) => set('showPolicy', value)} />
          </div>
          <details className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-gray-700">Form labels ও messages</summary>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {CHECKOUT_FORM_FIELDS.map(([key, label]) => (
                <TextField
                  key={key}
                  label={label}
                  value={form.checkoutForm[key]}
                  onChange={(value) => setNested('checkoutForm', key, value)}
                />
              ))}
            </div>
            <p className="mt-3 text-[11px] text-gray-500">
              bKash/Nagad/Rocket নাম্বার ও ডেলিভারি পলিসি Website Setting → General Setting থেকে আসে, checkout page-এর মতোই।
            </p>
          </details>
        </Card>

        <Card title="Footer & Colors">
          <TextField
            label="Footer Text (খালি রাখলে “Copyright © year site name”)"
            value={form.footerText}
            onChange={(value) => set('footerText', value)}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {COLOR_FIELDS.map(([key, label]) => (
              <label key={key} className="block text-xs font-semibold text-gray-700">
                {label}
                <input
                  type="color"
                  value={form.colors[key]}
                  onChange={(event) => setNested('colors', key, event.target.value)}
                  className="mt-1.5 h-9 w-full rounded border border-gray-300 bg-white p-1"
                />
              </label>
            ))}
          </div>
        </Card>

        <div className="flex justify-end pb-6">
          <SaveButton saving={saving} isEdit={isEdit} />
        </div>
      </form>
    </div>
  );
}

function SaveButton({ saving, isEdit }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="rounded-lg bg-green-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
    >
      {saving ? 'Saving...' : isEdit ? 'Update Page' : 'Create Page'}
    </button>
  );
}

function Card({ title, hint, action, muted = false, children }) {
  return (
    <section className="space-y-4 rounded-xl bg-white p-4 shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-800">{title}</h2>
          {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
        </div>
        {action}
      </div>
      {/* A switched-off section stays editable, just dimmed. */}
      <div className={`space-y-4 ${muted ? 'opacity-50' : ''}`}>{children}</div>
    </section>
  );
}

// ON/OFF switch for whether a section shows on the landing page.
function SectionSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex shrink-0 items-center gap-2 text-xs font-semibold text-gray-600"
      title="Landing page-এ দেখাবে কি না"
    >
      <span className={checked ? 'text-green-600' : 'text-gray-400'}>{checked ? 'ON' : 'OFF'}</span>
      <span className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-green-600"
      />
      {label}
    </label>
  );
}

function TextField({ label, value, onChange, required = false, type = 'text' }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
    </div>
  );
}

function ImageField({ label, value, onChange }) {
  async function handleFile(file) {
    if (file) onChange(await fileToDataUrl(file));
  }
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">{label}</label>
      <div className="space-y-2 rounded-lg border border-dashed border-gray-300 p-3">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => handleFile(event.target.files?.[0])}
          className="w-full text-xs text-gray-500 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:text-gray-600"
        />
        {value ? (
          <div className="relative">
            <img src={imageUrl(value)} alt="" className="max-h-40 w-full rounded bg-gray-50 object-contain" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-1 top-1 rounded bg-white/90 p-1 text-red-500 shadow hover:bg-white"
              title="Remove image"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ) : (
          <div className="flex h-20 items-center justify-center rounded bg-gray-50 text-gray-300">
            <ImageIcon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}

function CarouselImagesEditor({ value, onChange }) {
  async function addFiles(fileList) {
    const files = [...(fileList || [])].filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;
    onChange([...value, ...(await Promise.all(files.map(fileToDataUrl)))]);
  }

  function move(index, step) {
    const next = [...value];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {value.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {value.map((image, index) => (
            <div key={`${index}-${image.slice(-24)}`} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <img src={imageUrl(image)} alt="" className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between px-1.5 py-1">
                <span className="text-[11px] text-gray-400">#{index + 1}</span>
                <span className="flex items-center gap-0.5">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30" title="আগে নিন">
                    <ChevronLeft size={13} />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30" title="পরে নিন">
                    <ChevronRight size={13} />
                  </button>
                  <button type="button" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} className="rounded p-1 text-red-500 hover:bg-red-50" title="মুছে ফেলুন">
                    <Trash2 size={13} />
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
          এখনো কোনো ছবি যোগ করা হয়নি।
        </div>
      )}
      <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
        <Plus size={13} />
        ছবি যোগ করুন (একসাথে অনেকগুলো বাছাই করা যাবে)
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </label>
    </div>
  );
}

function LineListEditor({ value, onChange, addLabel }) {
  function update(index, text) {
    onChange(value.map((item, itemIndex) => (itemIndex === index ? text : item)));
  }
  return (
    <div className="space-y-2">
      {value.map((line, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right text-[11px] text-gray-400">{index + 1}.</span>
          <input
            value={line}
            onChange={(event) => update(index, event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
            className="shrink-0 rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"
            title="Remove"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ''])}
        className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
      >
        <Plus size={13} />
        {addLabel}
      </button>
    </div>
  );
}

// A product's variations as landing variants, priced from the product to start with.
function getProductVariants(product = {}) {
  const variations = Array.isArray(product.variations) ? product.variations : [];
  return variations
    .map((variation) => {
      const options = parseObject(variation.options);
      const price = Number(variation.newPrice || variation.oldPrice || 0);
      const oldPrice = Number(variation.oldPrice || 0);
      return {
        variantId: variation.Id,
        label: Object.values(options).join(' / ') || variation.attribute || `#${variation.Id}`,
        price: price || '',
        originalPrice: oldPrice > price ? oldPrice : '',
        image: variation.colorImage || '',
      };
    })
    .filter((variant) => variant.variantId);
}

function ProductOptionsEditor({ value, onChange }) {
  const { data: products, loading } = useProducts({ limit: 200 });
  const [query, setQuery] = useState('');
  const selectedIds = value.map((item) => String(item.productId));
  const normalizedQuery = query.trim().toLowerCase();
  const matches = normalizedQuery
    ? products
        .filter((product) => !selectedIds.includes(String(product.Id)))
        .filter(
          (product) =>
            String(product.name || '').toLowerCase().includes(normalizedQuery) ||
            String(product.sku || '').toLowerCase().includes(normalizedQuery),
        )
        .slice(0, 20)
    : [];

  function addProduct(product) {
    const variants = getProductVariants(product);
    onChange([
      ...value,
      {
        productId: String(product.Id),
        name: product.name,
        price: getProductPrice(product) || '',
        originalPrice: product.oldPrice || product.regularPrice || '',
        image: getProductImage(product),
        ...(variants.length > 1 ? { variants } : {}),
      },
    ]);
    setQuery('');
  }

  function productVariants(productId) {
    const product = products.find((entry) => String(entry.Id) === String(productId));
    return product ? getProductVariants(product) : [];
  }

  function updateVariant(productId, variantId, patch) {
    const option = value.find((item) => String(item.productId) === String(productId));
    update(productId, {
      variants: option.variants.map((variant) =>
        variant.variantId === variantId ? { ...variant, ...patch } : variant,
      ),
    });
  }

  function update(productId, patch) {
    onChange(value.map((item) => (String(item.productId) === String(productId) ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      <div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={loading ? 'Loading products...' : 'Product name বা SKU দিয়ে search করে Add করুন...'}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
        {normalizedQuery && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            {matches.map((product) => (
              <button
                key={product.Id}
                type="button"
                onClick={() => addProduct(product)}
                className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left text-xs last:border-b-0 hover:bg-blue-50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-gray-700">{product.name}</span>
                  <span className="block text-[11px] text-gray-400">
                    ৳{getProductPrice(product)}
                    {product.sku ? ` · SKU: ${product.sku}` : ''}
                  </span>
                </span>
                <span className="rounded-full bg-blue-600 px-3 py-1 font-semibold text-white">Add</span>
              </button>
            ))}
            {!matches.length && (
              <div className="px-3 py-3 text-xs text-gray-400">No product found</div>
            )}
          </div>
        )}
      </div>

      {value.length ? (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {value.map((option) => {
            const hasVariants = Boolean(option.variants?.length);
            const available = productVariants(option.productId);
            const missing = available.filter(
              (variant) => !option.variants?.some((entry) => entry.variantId === variant.variantId),
            );
            return (
              <div key={option.productId} className="p-3">
                <div
                  className="grid items-center gap-2 md:grid-cols-[48px_minmax(0,1fr)_130px_130px_auto]"
                >
                  <label className="relative block h-12 w-12 cursor-pointer" title="ছবি বদলাতে click করুন">
                    {option.image ? (
                      <img src={imageUrl(option.image)} alt="" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-gray-300">
                        <ImageIcon size={16} />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 rounded-b bg-black/50 text-center text-[9px] text-white">Change</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (file) update(option.productId, { image: await fileToDataUrl(file) });
                      }}
                    />
                  </label>
                  <input
                    value={option.name}
                    onChange={(event) => update(option.productId, { name: event.target.value })}
                    title="Order form-এ এই নাম দেখাবে"
                    className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                  />
                  {hasVariants ? (
                    <p className="text-[11px] text-gray-500 md:col-span-2">দাম নিচে variation অনুযায়ী</p>
                  ) : (
                    <>
                      <input
                        type="number"
                        value={option.price}
                        onChange={(event) => update(option.productId, { price: event.target.value })}
                        placeholder="Offer price"
                        className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                      />
                      <input
                        type="number"
                        value={option.originalPrice || ''}
                        onChange={(event) => update(option.productId, { originalPrice: event.target.value })}
                        placeholder="Regular price"
                        className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                      />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((item) => item.productId !== option.productId))}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
  
                {hasVariants && (
                  <div className="mt-2 space-y-1.5 rounded-lg bg-gray-50 p-2 md:ml-14">
                    <p className="text-[11px] font-semibold text-gray-600">
                      Variations — card-এ chip হিসেবে দেখাবে, customer যেটা বাছাই করবে সেই দামে order হবে
                    </p>
                    {option.variants.map((variant) => (
                      <div
                        key={variant.variantId}
                        className="grid items-center gap-2 md:grid-cols-[minmax(0,1fr)_130px_130px_auto]"
                      >
                        <input
                          value={variant.label}
                          onChange={(event) => updateVariant(option.productId, variant.variantId, { label: event.target.value })}
                          title="Chip-এ এই লেখা দেখাবে"
                          className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                        />
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(event) => updateVariant(option.productId, variant.variantId, { price: event.target.value })}
                          placeholder="Offer price"
                          className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                        />
                        <input
                          type="number"
                          value={variant.originalPrice || ''}
                          onChange={(event) => updateVariant(option.productId, variant.variantId, { originalPrice: event.target.value })}
                          placeholder="Regular price"
                          className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const rest = option.variants.filter((entry) => entry.variantId !== variant.variantId);
                            update(option.productId, rest.length ? { variants: rest } : { variants: undefined, price: variant.price, originalPrice: variant.originalPrice });
                          }}
                          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                          title="এই variation বাদ দিন"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {available.length > 1 && missing.length > 0 && (
                  <button
                    type="button"
                    onClick={() => update(option.productId, { variants: [...(option.variants || []), ...missing] })}
                    className="mt-2 flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 md:ml-14"
                  >
                    <Plus size={12} />
                    {hasVariants ? `বাকি ${missing.length}টি variation যোগ করুন` : `Variations যোগ করুন (${available.length}টি)`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400">
          এখনো কোনো product যোগ করা হয়নি।
        </div>
      )}
    </div>
  );
}
