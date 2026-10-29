import { useMemo, useState } from "react";
import { ChevronDown, Printer, Video } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";

export default function BarcodePage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [generatedProduct, setGeneratedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  const { data: allProducts } = useProducts({ limit: 200 });

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = query
      ? allProducts.filter((p) => p.name.toLowerCase().includes(query))
      : allProducts;
    return list.slice(0, 8);
  }, [search, allProducts]);

  function handleSelect(product) {
    setSelectedProduct(product);
    setSearch("");
    setError("");
    setIsOpen(false);
  }

  function handleSubmit() {
    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }
    setError("");
    setGeneratedProduct(selectedProduct);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-bold text-gray-800">Product Barcode</h1>
        <button className="flex w-fit items-center gap-1.5 self-end bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-full transition">
          <Video size={14} />
          টিউটোরিয়াল দেখুন
        </button>
      </div>

      <div className="mx-auto w-full max-w-[1060px]">
        <label className="mb-2 block text-sm font-bold text-gray-500">
          Products *
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="flex h-9 w-full items-center justify-between border border-gray-400 bg-white px-2 text-left text-sm text-gray-700"
          >
            <span>
              {selectedProduct
                ? productLabel(selectedProduct)
                : "Select Product.."}
            </span>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute left-0 right-0 z-20 border-x border-b border-gray-400 bg-white shadow-sm">
              <div className="border-b border-gray-300 p-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="h-8 w-full border border-gray-400 px-2 text-sm text-gray-700 focus:outline-none"
                />
              </div>

              <div className="max-h-52 overflow-y-auto pr-1">
                <OptionRow
                  active={!selectedProduct}
                  onClick={() => setSelectedProduct(null)}
                >
                  Select Product..
                </OptionRow>

                {filteredProducts.map((product) => (
                  <OptionRow
                    key={product.Id}
                    active={selectedProduct?.Id === product.Id}
                    onClick={() => handleSelect(product)}
                  >
                    {productLabel(product)}
                  </OptionRow>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="px-2 py-3 text-sm text-gray-400">
                    No product found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Submit
          </button>
        </div>
      </div>

      {generatedProduct && (
        <div className="mt-12 flex flex-col items-center gap-9">
          <button
            type="button"
            onClick={handlePrint}
            className="print:hidden flex h-7 w-8 items-center justify-center rounded bg-emerald-500 text-white transition hover:bg-emerald-600"
            title="Print barcode"
          >
            <Printer size={14} />
          </button>

          <BarcodeCard product={generatedProduct} />
        </div>
      )}
    </div>
  );
}

function productLabel(product) {
  const price = getProductPrice(product);
  return `${product.name}${price ? ` - ${price}` : ""}`;
}

function BarcodeCard({ product }) {
  const code = String(product.sku || "N/A");
  const price = getProductPrice(product);
  const bars = buildBarcodeBars(code);

  return (
    <div
      id="product-barcode-card"
      className="w-full max-w-[465px] bg-white px-3 py-3 text-center shadow-sm print:shadow-none"
    >
      <h2 className="text-2xl font-bold text-gray-500">Khilgaon Mart</h2>
      <p className="mt-1 text-base font-extrabold leading-tight text-black">
        {product.name}
      </p>
      <p className="mt-1 text-sm font-bold text-black">
        Price: {price || "N/A"} Tk
      </p>

      <div className="mt-3 flex h-[84px] items-stretch justify-center overflow-hidden">
        {bars.map((bar, index) => (
          <span
            key={`${bar.width}-${index}`}
            className={bar.black ? "bg-black" : "bg-white"}
            style={{ width: `${bar.width}px` }}
          />
        ))}
      </div>

      <p className="mt-2 text-base font-extrabold text-black">{code}</p>
    </div>
  );
}

function getProductPrice(product) {
  const variationPrice = Array.isArray(product.variations)
    ? product.variations.find(
        (variation) => variation?.newPrice || variation?.oldPrice,
      )?.newPrice ||
      product.variations.find(
        (variation) => variation?.newPrice || variation?.oldPrice,
      )?.oldPrice
    : null;
  return (
    product.price ||
    product.newPrice ||
    product.salePrice ||
    variationPrice ||
    product.advanceAmount ||
    ""
  );
}

function buildBarcodeBars(value) {
  const source = value || "N/A";
  const bits = source
    .split("")
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
  const framedBits = `1010${bits}0101`;
  const bars = [];
  let black = true;

  for (let i = 0; i < framedBits.length; i += 1) {
    const bit = framedBits[i];
    bars.push({
      black,
      width: bit === "1" ? 4 : 2,
    });
    black = !black;
  }

  return bars;
}

function OptionRow({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-2 py-2 text-left text-sm transition ${
        active
          ? "bg-blue-500 text-white"
          : "bg-white text-gray-600 hover:bg-blue-50"
      }`}
    >
      {children}
    </button>
  );
}
