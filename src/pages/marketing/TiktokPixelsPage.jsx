import { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { tiktokPixelService } from '../../services/marketingService';

export default function TiktokPixelsPage({ onCreate, onEdit }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await tiktokPixelService.getAll({ limit: 100 });
      setItems(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchItems(); }, []);

  async function remove(id) {
    if (!window.confirm('Delete this TikTok pixel?')) return;
    await tiktokPixelService.delete(id);
    fetchItems();
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">TikTok Pixel Manage</h1>
        <button onClick={onCreate} className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> Create
        </button>
      </div>
      <div className="rounded bg-white p-4 shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr><th className="p-3">SL</th><th className="p-3">Pixel Code</th><th className="p-3">Test Event</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading...</td></tr> : items.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-400">No data available</td></tr> : items.map((item, i) => (
              <tr key={item.Id} className="border-b">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">{item.pixelCode}</td>
                <td className="p-3">{item.testEventCode || '-'}</td>
                <td className="p-3"><span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">{item.status}</span></td>
                <td className="p-3">
                  <button onClick={() => onEdit(item)} className="mr-2 rounded bg-indigo-600 p-2 text-white"><Edit2 size={14} /></button>
                  <button onClick={() => remove(item.Id)} className="rounded bg-rose-500 p-2 text-white"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
