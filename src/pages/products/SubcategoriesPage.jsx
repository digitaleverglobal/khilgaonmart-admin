import { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useCategories, useSubcategories } from '../../hooks/useProducts';
import { subcategoryService } from '../../services/productService';
import { imageUrl } from '../../utils/assetUrl';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 10;

export default function SubcategoriesPage({ onNavigate, onEditSubcategory }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const { data: subcategories, meta, loading, error, refetch } = useSubcategories({ searchTerm: search || undefined, page, limit: PAGE_SIZE });
  const { data: categories } = useCategories({ limit: 200 });
  const categoryById = new Map(categories.map((category) => [String(category.Id), category.name]));

  async function handleDelete(id) {
    if (!window.confirm('এই subcategory মুছে ফেলবেন?')) return;
    try {
      await subcategoryService.delete(id);
      refetch();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleToggleStatus(sub) {
    const active = sub.status === 'Active' || sub.status === 'active';
    const nextStatus = active ? 'Inactive' : 'Active';
    setStatusUpdatingId(sub.Id);
    try {
      await subcategoryService.update(sub.Id, {
        name: sub.name,
        categoryId: sub.categoryId || null,
        status: nextStatus,
      });
      refetch();
    } catch (e) {
      alert(e.message || 'Subcategory status update করতে সমস্যা হয়েছে');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Subcategories</h1>
        <button
          onClick={() => onNavigate && onNavigate('create_subcategory')}
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
        >
          <Plus size={14} /> Add Subcategory
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #0B3A4D, #156B8C)' }}>
          <span className="text-white font-semibold text-sm">All Subcategories ({meta?.count ?? subcategories.length})</span>
          <input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="text-xs px-3 py-1.5 rounded-lg border-0 focus:outline-none w-36" />
        </div>
        {loading && <div className="text-center py-8 text-gray-400 text-xs">Loading...</div>}
        {error && <div className="text-center py-8 text-red-400 text-xs">{error}</div>}
        {!loading && !error && (
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-gray-500 font-semibold">#</th>
                <th className="px-4 py-3 text-left text-gray-500 font-semibold">Image</th>
                <th className="px-4 py-3 text-left text-gray-500 font-semibold">Category</th>
                <th className="px-4 py-3 text-left text-gray-500 font-semibold">Subcategory</th>
                <th className="px-4 py-3 text-center text-gray-500 font-semibold">Status</th>
                <th className="px-4 py-3 text-center text-gray-500 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">কোনো সাবক্যাটাগরি পাওয়া যায়নি</td></tr>
              )}
              {subcategories.map((sub, i) => (
                <tr key={sub.Id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-3">
                    {sub.image ? (
                      <img src={imageUrl(sub.image)} alt={sub.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{categoryById.get(String(sub.categoryId)) || '-'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{sub.name}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={sub.status} /></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Btn icon={<Edit2 size={12} />} color="bg-blue-100 text-blue-600 hover:bg-blue-200" onClick={() => onEditSubcategory && onEditSubcategory(sub)} />
                      <Btn icon={<Trash2 size={12} />} color="bg-red-100 text-red-500 hover:bg-red-200" onClick={() => handleDelete(sub.Id)} />
                      <StatusToggleBtn
                        active={sub.status === 'Active' || sub.status === 'active'}
                        loading={statusUpdatingId === sub.Id}
                        onClick={() => handleToggleStatus(sub)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !error && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={meta?.count ?? 0} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === 'Active' || status === 'active';
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

function Btn({ icon, color, onClick }) {
  return <button onClick={onClick} className={`w-6 h-6 rounded flex items-center justify-center transition ${color}`}>{icon}</button>;
}

function StatusToggleBtn({ active, loading, onClick }) {
  return (
    <button
      type="button"
      title={active ? 'Make Inactive' : 'Make Active'}
      onClick={onClick}
      disabled={loading}
      className={`w-6 h-6 rounded flex items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-60 ${active ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
    </button>
  );
}
