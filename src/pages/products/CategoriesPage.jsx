import { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useCategories } from '../../hooks/useProducts';
import { categoryService } from '../../services/productService';
import { imageUrl } from '../../utils/assetUrl';

export default function CategoriesPage({ onNavigate, onEditCategory }) {
  const [search, setSearch] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const { data: categories, meta, loading, error, refetch } = useCategories({ searchTerm: search, limit: 100 });

  async function handleDelete(id) {
    if (!window.confirm('এই category মুছে ফেলবেন?')) return;
    try {
      await categoryService.delete(id);
      refetch();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleToggleStatus(cat) {
    const active = cat.status === 'Active' || cat.status === 'active';
    const nextStatus = active ? 'Inactive' : 'Active';
    setStatusUpdatingId(cat.Id);
    try {
      await categoryService.update(cat.Id, {
        name: cat.name,
        status: nextStatus,
        isActive: Boolean(cat.isActive ?? cat.frontView),
        frontView: Boolean(cat.isActive ?? cat.frontView),
        imageFile: cat.imageFile || cat.image || null,
        image: cat.imageFile || cat.image || null,
        bannerImage: cat.bannerImage || null,
        sortOrder: cat.sortOrder ?? null,
        metaTitle: cat.metaTitle || '',
        metaDescription: cat.metaDescription || '',
      });
      refetch();
    } catch (e) {
      alert(e.message || 'Category status update করতে সমস্যা হয়েছে');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Categories</h1>
        <button
          onClick={() => onNavigate && onNavigate('create_category')}
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #0B3A4D, #156B8C)' }}>
          <span className="text-white font-semibold text-sm">All Categories ({meta?.count ?? categories.length})</span>
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 w-36"
          />
        </div>
        {loading && <div className="text-center py-8 text-gray-400 text-xs">Loading...</div>}
        {error && <div className="text-center py-8 text-red-400 text-xs">{error}</div>}
        {!loading && !error && (
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-gray-500 font-semibold">#</th>
                <th className="px-4 py-3 text-left text-gray-500 font-semibold">Image</th>
                <th className="px-4 py-3 text-left text-gray-500 font-semibold">Name</th>
                <th className="px-4 py-3 text-center text-gray-500 font-semibold">Front View</th>
                <th className="px-4 py-3 text-center text-gray-500 font-semibold">Status</th>
                <th className="px-4 py-3 text-center text-gray-500 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">কোনো ক্যাটাগরি পাওয়া যায়নি</td></tr>
              )}
              {categories.map((cat, i) => (
                <tr key={cat.Id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    {cat.imageFile || cat.image ? (
                      <img src={imageUrl(cat.imageFile || cat.image)} alt={cat.name} className="h-10 w-14 rounded border border-gray-200 object-cover" />
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-300">No image</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{cat.name}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={cat.isActive ?? cat.frontView ? 'Active' : 'Inactive'} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={cat.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Btn icon={<Edit2 size={12} />} color="bg-blue-100 text-blue-600 hover:bg-blue-200" onClick={() => onEditCategory && onEditCategory(cat)} />
                      <Btn icon={<Trash2 size={12} />} color="bg-red-100 text-red-500 hover:bg-red-200" onClick={() => handleDelete(cat.Id)} />
                      <StatusToggleBtn
                        active={cat.status === 'Active' || cat.status === 'active'}
                        loading={statusUpdatingId === cat.Id}
                        onClick={() => handleToggleStatus(cat)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === 'Active' || status === 'active';
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
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
