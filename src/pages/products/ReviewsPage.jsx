import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Star } from 'lucide-react';
import { useReviews } from '../../hooks/useProducts';
import { reviewService } from '../../services/productService';

const exportButtons = ['Copy', 'Print', 'PDF'];

export default function ReviewsPage({ onNavigate, onEditReview }) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const params = { searchTerm: search, limit: 100 };
  if (activeTab !== 'all') params.status = activeTab;

  const { data: reviews, meta, loading, error, refetch } = useReviews(params);

  const tabs = [
    { key: 'all', label: `All Reviews (${meta?.count ?? reviews.length})` },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
  ];

  async function handleDelete(id) {
    if (!window.confirm('এই review মুছে ফেলবেন?')) return;
    try {
      await reviewService.delete(id);
      refetch();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                activeTab === tab.key
                  ? 'border-sky-400 bg-white text-sky-500'
                  : 'border-pink-400 bg-white text-pink-500 hover:bg-pink-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('create_review')}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition"
          >
            <Plus size={14} />
            Create
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            {exportButtons.map((label) => (
              <button
                key={label}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-4 py-2 border-r border-gray-200 last:border-r-0 first:rounded-l last:rounded-r transition"
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 md:justify-end">
            Search:
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-44 border border-gray-200 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
        </div>

        {loading && <div className="text-center py-8 text-gray-400 text-xs">Loading...</div>}
        {error && <div className="text-center py-8 text-red-400 text-xs">{error}</div>}
        {!loading && !error && (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[940px] text-xs">
              <thead>
                <tr className="bg-gray-100 border-y border-gray-200">
                  <th className="px-4 py-3 font-bold text-gray-500 text-left w-20">SL</th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-left">Customer</th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-left">Product</th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-left">Comment</th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-left">Rating</th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-left">Status</th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 && (
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <td colSpan={7} className="py-5 text-center text-sm text-gray-500">No data available in table</td>
                  </tr>
                )}
                {reviews.map((review, index) => (
                  <tr key={review.Id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200`}>
                    <td className="px-4 py-4 text-gray-600">{index + 1}</td>
                    <td className="px-4 py-4 font-semibold text-gray-800">{review.customerName}</td>
                    <td className="px-4 py-4 text-gray-600">{review.productName || '—'}</td>
                    <td className="px-4 py-4 text-gray-600 max-w-xs truncate">{review.comment || '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={11} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={review.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onEditReview && onEditReview(review)} className="flex h-7 w-8 items-center justify-center rounded bg-indigo-600 hover:bg-indigo-700 text-white transition">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(review.Id)} className="flex h-7 w-8 items-center justify-center rounded bg-red-500 hover:bg-red-600 text-white transition">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-gray-100 px-0 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-gray-500">
            Showing {reviews.length ? 1 : 0} to {reviews.length} of {meta?.count ?? reviews.length} entries
          </p>
          <div className="flex items-center gap-2 sm:justify-end">
            <button className="flex h-8 w-8 items-center justify-center rounded text-gray-300 hover:bg-gray-100">
              <ChevronLeft size={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded text-gray-300 hover:bg-gray-100">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${isApproved ? 'bg-teal-100 text-teal-600' : isPending ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
      {status}
    </span>
  );
}
