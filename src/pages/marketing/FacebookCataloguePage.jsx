import { useState } from "react";
import { CheckCircle, Copy, PlayCircle, RefreshCw } from "lucide-react";
import { facebookCatalogueService } from "../../services/marketingService";

const BASE = import.meta.env.VITE_API_URL || "/api/v1";
const FEED_URL = `${BASE}/facebook-catalogue/feed.xml`;

export default function FacebookCataloguePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleRefresh() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await facebookCatalogueService.refresh();
      setResult(res.data);
    } catch (err) {
      setError(err.message || "Failed to refresh feed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(FEED_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Facebook Catalogue</h1>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
        >
          <PlayCircle size={16} /> টিউটোরিয়াল দেখুন
        </button>
      </div>

      <div className="rounded bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        {result && (
          <div className="mb-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle size={16} />
            <span>
              Feed refreshed — {result.count} product
              {result.count !== 1 ? "s" : ""} included.
            </span>
          </div>
        )}

        <p className="mb-3 text-sm text-gray-600">
          Click to regenerate the Facebook product XML feed to keep your
          Facebook Shop catalogue updated with your latest products.
        </p>
        <p className="mb-5 text-sm text-gray-600">
          ফেসবুক ক্যাটালগ আপডেট করার জন্য নতুন করে প্রোডাক্ট XML ফাইল তৈরি করতে
          এখানে ক্লিক করুন।
        </p>

        <div className="mb-5 flex items-center gap-2 rounded border border-gray-200 bg-slate-50 px-3 py-2">
          <span className="flex-1 truncate font-mono text-xs text-gray-600">
            {FEED_URL}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-xs text-gray-600 transition hover:bg-slate-300"
          >
            <Copy size={12} /> {copied ? "Copied!" : "Copy URL"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Update Product Feed"}
        </button>
      </div>
    </div>
  );
}
