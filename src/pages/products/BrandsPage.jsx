import { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useBrands } from '../../hooks/useProducts';
import { brandService } from '../../services/productService';
import { imageUrl } from '../../utils/assetUrl';

export default function BrandsPage({ onNavigate, onEditBrand }) {
  const [search, setSearch] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const { data: brands, meta, loading, error, refetch } = useBrands({ searchTerm: search, limit: 100 });

  async function handleDelete(id) {
    if (!window.confirm('এই brand মুছে ফেলবেন?')) return;
    try {
      await brandService.delete(id);
      refetch();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleToggleStatus(brand) {
    const active = brand.status === 'Active' || brand.status === 'active';
    const nextStatus = active ? 'Inactive' : 'Active';
    setStatusUpdatingId(brand.Id);
    try {
      await brandService.update(brand.Id, {
        name: brand.name,
        logo: brand.logo || null,
        status: nextStatus,
      });
      refetch();
    } catch (e) {
      alert(e.message || 'Brand status update করতে সমস্যা হয়েছে');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Brands</h1>
        <button
          onClick={() => onNavigate && onNavigate('create_brand')}
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
        >
          <Plus size={14} /> Add Brand
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #0B3A4D, #156B8C)' }}>
          <span className="text-white font-semibold text-sm">All Brands ({meta?.count ?? brands.length})</span>
          <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border-0 focus:outline-none w-36" />
        </div>
        {loading && <div className="text-center py-8 text-gray-400 text-xs">Loading...</div>}
        {error && <div className="text-center py-8 text-red-400 text-xs">{error}</div>}
        {!loading && !error && (
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['#', 'Logo', 'Brand Name', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brands.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">কোনো ব্র্যান্ড পাওয়া যায়নি</td></tr>
              )}
              {brands.map((brand, i) => (
                <tr key={brand.Id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    {brand.logo ? (
                      <img src={imageUrl(brand.logo)} alt={brand.name} className="w-10 h-10 rounded-lg object-contain border border-gray-200 bg-white p-1" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-yellow-100 border border-yellow-200 rounded-lg flex items-center justify-center text-[9px] text-amber-600 font-bold">
                        {brand.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{brand.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={brand.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => onEditBrand && onEditBrand(brand)} className="w-6 h-6 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center"><Edit2 size={12} /></button>
                      <button onClick={() => handleDelete(brand.Id)} className="w-6 h-6 rounded bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center"><Trash2 size={12} /></button>
                      <StatusToggleBtn
                        active={brand.status === 'Active' || brand.status === 'active'}
                        loading={statusUpdatingId === brand.Id}
                        onClick={() => handleToggleStatus(brand)}
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
