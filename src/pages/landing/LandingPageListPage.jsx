import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  Edit2,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { landingPageService } from "../../services/landingPageService";
import { imageUrl } from "../../utils/assetUrl";

const PAGE_SIZE = 20;
const FRONTEND_SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://khilgaonmart.com"
).replace(/\/+$/, "");

// The demo page ships with the frontend code, so in local dev it is opened on the local frontend.
const DEMO_PREVIEW_URL = import.meta.env.DEV
  ? `${(import.meta.env.VITE_LOCAL_SITE_URL || "https://khilgaonmart.com").replace(/\/+$/, "")}/landing-page/demo`
  : `${FRONTEND_SITE_URL}/landing-page/demo`;

export const OFFER_PAGE_TYPE = "Offer";

function getFrontendLandingUrl(id) {
  return `${FRONTEND_SITE_URL}/landing-page/${encodeURIComponent(String(id))}`;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB");
}

export default function LandingPageListPage({ onCreate, onEdit }) {
  const [pages, setPages] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      landingPageService
        .getAll({ searchTerm: appliedSearch, page, limit: PAGE_SIZE })
        .then((res) => {
          setPages(res.data || []);
          setCount(Number(res.meta?.count) || 0);
          setError("");
        })
        .catch((err) => setError(err.message || "Landing pages fetch failed."))
        .finally(() => setLoading(false)),
    [appliedSearch, page],
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  async function runAction(id, action) {
    setBusyId(id);
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(err.message || "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  function handleDuplicate(item) {
    runAction(item.Id, () => landingPageService.duplicate(item.Id));
  }

  function handleDelete(item) {
    if (!window.confirm(`"${item.title}" landing page delete করবেন?`)) return;
    runAction(item.Id, () => landingPageService.delete(item.Id));
  }

  function handleToggleStatus(item) {
    runAction(item.Id, () =>
      landingPageService.update(item.Id, { status: !item.status }),
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Landing Pages</h1>
          <p className="text-xs text-gray-500">
            Offer landing page create, edit, duplicate ও delete করুন।
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={DEMO_PREVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-purple-100 px-4 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-200"
          >
            <ExternalLink size={14} />
            Demo Preview
          </a>
          <button
            type="button"
            onClick={onCreate}
            className="flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-600"
          >
            <Plus size={14} />
            Create New
          </button>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedSearch(search.trim());
          setPage(1);
        }}
        className="flex items-center gap-2 rounded-xl bg-white p-3 shadow"
      >
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Title বা product দিয়ে search করুন..."
          className="w-full max-w-sm rounded border border-gray-200 px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="submit"
          className="flex items-center gap-1 rounded bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
        >
          <Search size={12} />
          Search
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-gray-500">
                <th className="px-3 py-3 font-semibold">#</th>
                <th className="px-3 py-3 font-semibold">Banner</th>
                <th className="px-3 py-3 font-semibold">Title</th>
                <th className="px-3 py-3 font-semibold">Price</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="px-3 py-3 text-center font-semibold">Status</th>
                <th className="px-3 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && pages.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && pages.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    কোনো landing page নেই। “Create New” দিয়ে শুরু করুন।
                  </td>
                </tr>
              )}
              {pages.map((item, index) => {
                const isOffer = item.pageType === OFFER_PAGE_TYPE;
                const busy = busyId === item.Id;
                return (
                  <tr
                    key={item.Id}
                    className="border-b border-gray-50 hover:bg-gray-50/60"
                  >
                    <td className="px-3 py-2.5 text-gray-400">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      {item.bannerImageUrl ? (
                        <img
                          src={imageUrl(item.bannerImageUrl)}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-100" />
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-gray-800">
                        {item.title}
                      </p>
                      {!isOffer && (
                        <span
                          className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
                          title="পুরনো design — শুধু duplicate বা delete করা যাবে"
                        >
                          Old design
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {Number(item.price) > 0 ? `৳${Number(item.price)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleToggleStatus(item)}
                        title={item.status ? "Active" : "Inactive"}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors disabled:opacity-50 ${
                          item.status ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            item.status ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={getFrontendLandingUrl(item.Id)}
                          target="_blank"
                          rel="noreferrer"
                          title="View"
                          className="flex h-7 w-7 items-center justify-center rounded bg-emerald-100 text-emerald-600 transition hover:bg-emerald-200"
                        >
                          <ExternalLink size={13} />
                        </a>
                        {isOffer && (
                          <ActionBtn
                            title="Edit"
                            disabled={busy}
                            onClick={() => onEdit(item)}
                            className="bg-blue-100 text-blue-600 hover:bg-blue-200"
                          >
                            <Edit2 size={13} />
                          </ActionBtn>
                        )}
                        <ActionBtn
                          title="Duplicate"
                          disabled={busy}
                          onClick={() => handleDuplicate(item)}
                          className="bg-purple-100 text-purple-600 hover:bg-purple-200"
                        >
                          <Copy size={13} />
                        </ActionBtn>
                        <ActionBtn
                          title="Delete"
                          disabled={busy}
                          onClick={() => handleDelete(item)}
                          className="bg-red-100 text-red-500 hover:bg-red-200"
                        >
                          <Trash2 size={13} />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
          <span>
            Total {count} · Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <ActionBtn
              title="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <ChevronLeft size={14} />
            </ActionBtn>
            <ActionBtn
              title="Next page"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <ChevronRight size={14} />
            </ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ title, disabled, onClick, className, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}
