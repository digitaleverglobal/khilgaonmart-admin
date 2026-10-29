import { useState, useRef, useEffect } from "react";
import { ChevronDown, Upload, Trash2, X } from "lucide-react";
import {
  categoryService,
  subcategoryService,
  childcategoryService,
  brandService,
  colorService,
  attributeService,
  productService,
} from "../../services/productService";
import { supplierService } from "../../services/supplierService";
import RichEditor from "../../components/RichEditor";
import VariantBuilder from "../../components/VariantBuilder";
import { variantsFromProduct, serializeVariants, clearImageRef, shiftNewImageRefs } from "../../utils/variants";
import { apiRequest } from "../../utils/apiClient";
import { imageUrl } from "../../utils/assetUrl";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-blue-500" : "bg-gray-300"}`}
    >
      <span
        className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ${checked ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white";
const selectCls = `${inputCls} appearance-none`;
export default function ProductEditPage({ product, onNavigate }) {
  const fileInputRef = useRef(null);

  // ----- product info fields -----
  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [productVideo, setProductVideo] = useState(product?.productVideo || "");
  const [advanceAmount, setAdvanceAmount] = useState(
    product?.advanceAmount || "",
  );
  const [stockAlert, setStockAlert] = useState(product?.stockAlert || "");
  const [rackNo, setRackNo] = useState(product?.rackNo || "");

  // ----- descriptions -----
  const [description, setDescription] = useState(product?.description || "");
  const [shortDescription, setShortDescription] = useState(
    product?.shortDescription || "",
  );

  // ----- SEO -----
  const [metaTitle, setMetaTitle] = useState(product?.metaTitle || "");
  const [metaKeyword, setMetaKeyword] = useState(product?.metaKeyword || "");
  const [metaDescription, setMetaDescription] = useState(
    product?.metaDescription || "",
  );

  // ----- gift -----
  const [giftTitle, setGiftTitle] = useState(product?.giftTitle || "");
  const [giftPrice, setGiftPrice] = useState(product?.giftPrice || "");

  // ----- toggles -----
  const [status, setStatus] = useState(product?.status !== "Inactive");
  const [bestDeals, setBestDeals] = useState(!!product?.bestDeals);
  const [freeShipping, setFreeShipping] = useState(!!product?.freeShipping);
  const [flashSale, setFlashSale] = useState(!!product?.flashSale);
  const [purchaseEnabled, setPurchaseEnabled] = useState(true);

  // ----- existing images -----
  // Unwraps repeatedly: some copied products stored the list as a quoted string.
  const parseImages = (images) => {
    if (Array.isArray(images)) return images;
    if (typeof images === "string") {
      try {
        return parseImages(JSON.parse(images));
      } catch {
        return [];
      }
    }
    return [];
  };
  const existingImages = parseImages(product?.images);
  const [keptImages, setKeptImages] = useState(existingImages); // filenames to keep
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // ----- variations -----
  const [variations, setVariations] = useState(() =>
    variantsFromProduct(product?.variations),
  );

  // ----- dropdowns -----
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [childcats, setChildcats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [selectedCat, setSelectedCat] = useState(
    product?.categoryId ? String(product.categoryId) : "",
  );
  const [selectedSub, setSelectedSub] = useState(
    product?.subcategoryId ? String(product.subcategoryId) : "",
  );
  const [selectedChild, setSelectedChild] = useState(
    product?.childcategoryId ? String(product.childcategoryId) : "",
  );
  const [selectedBrand, setSelectedBrand] = useState(
    product?.brandId ? String(product.brandId) : "",
  );
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));

  const [loadingSub, setLoadingSub] = useState(false);
  const [loadingChild, setLoadingChild] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // load categories, brands, suppliers on mount
  useEffect(() => {
    categoryService
      .getAllList()
      .then((r) => setCategories(r.data || []))
      .catch(() => {});
    brandService
      .getAllList()
      .then((r) => setBrands(r.data || []))
      .catch(() => {});
    colorService
      .getAllList()
      .then((r) => setColors(r.data || []))
      .catch(() => {});
    attributeService
      .getAllList()
      .then((r) => setAttributes(r.data || []))
      .catch(() => {});
    supplierService
      .getAllList()
      .then((r) => setSuppliers(r.data || []))
      .catch(() => {});
  }, []);

  // load subcategories when category changes
  useEffect(() => {
    setSubcategories([]);
    if (!selectedCat) return;
    setLoadingSub(true);
    subcategoryService
      .getAll({ categoryId: selectedCat, limit: 100 })
      .then((r) => setSubcategories(r.data?.data || r.data || []))
      .catch(() => {})
      .finally(() => setLoadingSub(false));
  }, [selectedCat]);

  // load child categories when subcategory changes
  useEffect(() => {
    setChildcats([]);
    if (!selectedSub) return;
    setLoadingChild(true);
    childcategoryService
      .getAll({ subcategoryId: selectedSub, limit: 100 })
      .then((r) => setChildcats(r.data?.data || r.data || []))
      .catch(() => {})
      .finally(() => setLoadingChild(false));
  }, [selectedSub]);

  function autoSlug(val) {
    return val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  function handleNameChange(val) {
    setName(val);
    if (!product?.slug) setSlug(autoSlug(val));
  }

  // images
  function addFiles(files) {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setNewImageFiles((prev) => [...prev, ...imgs]);
    imgs.forEach((f) =>
      setNewImagePreviews((prev) => [...prev, URL.createObjectURL(f)]),
    );
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }
  function handleFileChange(e) {
    addFiles(e.target.files);
  }
  function removeExisting(filename) {
    setKeptImages((prev) => prev.filter((f) => f !== filename));
    setVariations((prev) => clearImageRef(prev, filename));
  }
  function removeNew(idx) {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    setVariations((prev) => shiftNewImageRefs(prev, idx));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setSubmitError("Product name is required");
      return;
    }
    if (!serializeVariants(variations).length) {
      setSubmitError("অন্তত একটি variant-এর New Price দিন");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("slug", slug);
      if (sku) fd.append("sku", sku);
      if (selectedCat) fd.append("categoryId", selectedCat);
      if (selectedSub) fd.append("subcategoryId", selectedSub);
      if (selectedChild) fd.append("childcategoryId", selectedChild);
      if (selectedBrand) fd.append("brandId", selectedBrand);
      if (productVideo) fd.append("productVideo", productVideo);
      if (advanceAmount) fd.append("advanceAmount", advanceAmount);
      if (stockAlert) fd.append("stockAlert", stockAlert);
      fd.append("rackNo", rackNo);
      if (description) fd.append("description", description);
      if (shortDescription) fd.append("shortDescription", shortDescription);
      if (metaTitle) fd.append("metaTitle", metaTitle);
      if (metaKeyword) fd.append("metaKeyword", metaKeyword);
      if (metaDescription) fd.append("metaDescription", metaDescription);
      if (giftTitle) fd.append("giftTitle", giftTitle);
      if (giftPrice) fd.append("giftPrice", giftPrice);
      fd.append("status", status ? "Active" : "Inactive");
      fd.append("bestDeals", bestDeals ? "true" : "false");
      fd.append("freeShipping", freeShipping ? "true" : "false");
      fd.append("flashSale", flashSale ? "true" : "false");
      fd.append("purchaseEnabled", purchaseEnabled ? "true" : "false");
      if (purchaseEnabled && selectedSupplier) fd.append("supplierId", selectedSupplier);
      if (purchaseEnabled && payAmount) fd.append("payAmount", payAmount);
      if (purchaseEnabled && purchaseDate) fd.append("purchaseDate", purchaseDate);
      fd.append("keptImages", JSON.stringify(keptImages));
      fd.append("variations", JSON.stringify(serializeVariants(variations)));
      newImageFiles.forEach((f) => fd.append("gallery_images", f));

      await apiRequest(`/product/${product.Id}`, { method: "PUT", body: fd });
      alert("Product updated successfully!");
      onNavigate && onNavigate("products");
    } catch (err) {
      setSubmitError(err.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  }

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-gray-800">Product Edit</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
          >
            রেজিস্ট্রেশন করুন
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("products")}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Product Info */}
      <SectionCard title="Product Info">
        <div className="space-y-4">
          {submitError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Product Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputCls}
              />
            </FormField>
            <FormField label="Slug" required>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={inputCls}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField label="Categories" required>
              <div className="relative">
                <select
                  className={selectCls}
                  value={selectedCat}
                  onChange={(e) => {
                    setSelectedCat(e.target.value);
                    setSelectedSub("");
                    setSelectedChild("");
                  }}
                >
                  <option value="">Select...</option>
                  {categories.map((c) => (
                    <option key={c.Id} value={c.Id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </FormField>
            <FormField label="Sub Categories">
              <div className="relative">
                <select
                  className={selectCls}
                  value={selectedSub}
                  onChange={(e) => {
                    setSelectedSub(e.target.value);
                    setSelectedChild("");
                  }}
                  disabled={!selectedCat || loadingSub}
                >
                  <option value="">
                    {loadingSub ? "Loading..." : "Choose ..."}
                  </option>
                  {subcategories.map((s) => (
                    <option key={s.Id} value={s.Id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </FormField>
            <FormField label="Child Categories">
              <div className="relative">
                <select
                  className={selectCls}
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  disabled={!selectedSub || loadingChild}
                >
                  <option value="">
                    {loadingChild ? "Loading..." : "Choose ..."}
                  </option>
                  {childcats.map((c) => (
                    <option key={c.Id} value={c.Id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField label="Brands">
              <div className="relative">
                <select
                  className={selectCls}
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                >
                  <option value="">Select...</option>
                  {brands.map((b) => (
                    <option key={b.Id} value={b.Id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </FormField>
            <FormField label="Product Video">
              <input
                type="text"
                value={productVideo}
                onChange={(e) => setProductVideo(e.target.value)}
                className={inputCls}
                placeholder="YouTube URL"
              />
            </FormField>
            <FormField label="SKU / Barcode">
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className={inputCls}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField label="Advance Payment Amount">
              <input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                className={inputCls}
              />
            </FormField>
            <FormField label="Stock Alert">
              <input
                type="number"
                value={stockAlert}
                onChange={(e) => setStockAlert(e.target.value)}
                className={inputCls}
              />
            </FormField>
            <FormField label="Rack No">
              <input
                value={rackNo}
                onChange={(e) => setRackNo(e.target.value)}
                placeholder="e.g. A-12"
                className={inputCls}
              />
            </FormField>
          </div>
        </div>
      </SectionCard>

      {/* Image Gallery */}
      <SectionCard title="Product Image Gallery">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer transition ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}
        >
          <Upload size={28} className="text-gray-400 mb-2" />
          <p className="text-sm font-semibold text-gray-500">
            Drag &amp; Drop or Click
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Upload multiple images</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Existing images */}
        {keptImages.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            {keptImages.map((filename, i) => (
              <div key={i} className="relative group w-20">
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={imageUrl(filename)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "";
                      e.target.parentElement.classList.add("bg-gray-100");
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeExisting(filename)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                >
                  <X size={10} />
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-1 truncate">
                  Existing
                </p>
              </div>
            ))}
          </div>
        )}

        {/* New images */}
        {newImagePreviews.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {newImagePreviews.map((url, i) => (
              <div
                key={i}
                className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNew(i)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Price & Variation */}
      <SectionCard title="Price & Variation">
        <VariantBuilder
          attributes={attributes}
          colors={colors}
          images={[
            ...keptImages.map((filename) => ({ ref: filename, src: imageUrl(filename) })),
            ...newImagePreviews.map((src, i) => ({ ref: `new:${i}`, src })),
          ]}
          rows={variations}
          onChange={setVariations}
        />
      </SectionCard>

      {/* Purchase */}
      <SectionCard title="Purchase">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Purchase
            </label>
            <Toggle checked={purchaseEnabled} onChange={setPurchaseEnabled} />
          </div>
          <FormField label="Suppliers">
            <div className="relative">
              <select
                className={selectCls}
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
              >
                <option value="">Select...</option>
                {suppliers.map((s) => (
                  <option key={s.Id} value={s.Id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </FormField>
          <FormField label="Pay Amount">
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Cash" className={inputCls} />
          </FormField>
          <FormField label="Date">
            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className={inputCls} />
          </FormField>
        </div>
      </SectionCard>

      {/* Description */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <RichEditor
          label="Description"
          required
          value={description}
          onChange={setDescription}
          placeholder="Enter product description"
        />
      </div>

      {/* Short Description */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <RichEditor
          label="Short Description"
          value={shortDescription}
          onChange={setShortDescription}
          placeholder="Enter short description"
        />
      </div>

      {/* SEO */}
      <SectionCard title="SEO and Meta">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Meta Title">
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className={inputCls}
              />
            </FormField>
            <FormField label="Meta Keyword">
              <input
                type="text"
                value={metaKeyword}
                onChange={(e) => setMetaKeyword(e.target.value)}
                className={inputCls}
              />
            </FormField>
          </div>
          <FormField label="Meta Description">
            <textarea
              rows={4}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </FormField>
        </div>
      </SectionCard>

      {/* Gift Wrapping */}
      <SectionCard title="For Gift Wrapping">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Title">
            <input
              type="text"
              value={giftTitle}
              onChange={(e) => setGiftTitle(e.target.value)}
              className={inputCls}
            />
          </FormField>
          <FormField label="Price">
            <input
              type="number"
              value={giftPrice}
              onChange={(e) => setGiftPrice(e.target.value)}
              className={inputCls}
            />
          </FormField>
        </div>
      </SectionCard>

      {/* Toggles + Submit */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-6 mb-5">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Status</span>
            <Toggle checked={status} onChange={setStatus} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">
              Best Deals
            </span>
            <Toggle checked={bestDeals} onChange={setBestDeals} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">
              Free Shipping
            </span>
            <Toggle checked={freeShipping} onChange={setFreeShipping} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Flash Sale</span>
            <Toggle checked={flashSale} onChange={setFlashSale} />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-sm font-semibold px-8 py-2 rounded-lg transition"
        >
          {submitting ? "Updating..." : "Update"}
        </button>
      </div>
    </div>
  );
}
