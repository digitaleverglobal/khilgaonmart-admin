import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, ToggleLeft, ToggleRight, Search, X, ArrowLeft } from 'lucide-react';
import { comboOfferService, productService } from '../../services/productService';
import { imageUrl } from '../../utils/assetUrl';
import { parseJson, sellableUnits } from '../../utils/variants';

const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400 bg-white';
const fmt = (value) => Number(value || 0).toLocaleString('en-US');

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.readAsDataURL(file);
  });
}

function productImages(product) {
  return [product.file, ...parseJson(product.images, []), ...parseJson(product.gallery, [])].filter(Boolean);
}

// Combo Offer: a list of offers; clicking a title (or Create) opens the offer form.
export default function ComboOfferPage() {
  const [editing, setEditing] = useState(null); // null = list, 'new' = create, id = edit

  if (editing !== null) {
    return <ComboOfferForm id={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />;
  }
  return <ComboOfferList onCreate={() => setEditing('new')} onEdit={(id) => setEditing(id)} />;
}

function ComboOfferList({ onCreate, onEdit }) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    comboOfferService.getAll({ searchTerm: search || undefined, limit: 100 })
      .then((res) => { if (active) { setRows(res.data || []); setError(''); } })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, tick]);

  async function handleDelete(id) {
    if (!window.confirm('এই combo offer মুছে ফেলবেন?')) return;
    try {
      await comboOfferService.delete(id);
      setTick((t) => t + 1);
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleToggleStatus(combo) {
    setStatusUpdatingId(combo.Id);
    try {
      await comboOfferService.update(combo.Id, { status: combo.status === 'Active' ? 'Inactive' : 'Active' });
      setTick((t) => t + 1);
    } catch (e) {
      alert(e.message || 'Status update করতে সমস্যা হয়েছে');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Combo Offer</h1>
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
        >
          <Plus size={14} /> Create Combo Offer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #0B3A4D, #156B8C)' }}>
          <span className="text-white font-semibold text-sm">All Combo Offers ({rows.length})</span>
          <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border-0 focus:outline-none w-36" />
        </div>
        {loading && <div className="text-center py-8 text-gray-400 text-xs">Loading...</div>}
        {error && <div className="text-center py-8 text-red-400 text-xs">{error}</div>}
        {!loading && !error && (
          <table className="w-full min-w-[860px] text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['#', 'Image', 'Combo Offer Title', 'Products', 'Regular Price', 'Discount', 'Offer Price', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">কোনো combo offer নেই</td></tr>
              )}
              {rows.map((combo, i) => (
                <tr key={combo.Id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    {combo.image ? (
                      <img src={imageUrl(combo.image)} alt={combo.title} className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white" />
                    ) : (
                      <div className="w-10 h-10 bg-rose-50 border border-rose-200 rounded-lg" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onEdit(combo.Id)} className="font-semibold text-blue-700 hover:underline text-left">
                      {combo.title}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{combo.items?.length || 0}</td>
                  <td className="px-4 py-3 text-gray-500 line-through">{fmt(combo.regularPrice)} Tk</td>
                  <td className="px-4 py-3 text-red-500">{fmt(combo.discount)} Tk</td>
                  <td className="px-4 py-3 font-bold text-gray-800">{fmt(combo.offerPrice)} Tk</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${combo.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {combo.status === 'Active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => onEdit(combo.Id)} className="w-6 h-6 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center"><Edit2 size={12} /></button>
                      <button onClick={() => handleDelete(combo.Id)} className="w-6 h-6 rounded bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center"><Trash2 size={12} /></button>
                      <button
                        type="button"
                        title={combo.status === 'Active' ? 'Make Inactive' : 'Make Active'}
                        onClick={() => handleToggleStatus(combo)}
                        disabled={statusUpdatingId === combo.Id}
                        className={`w-6 h-6 rounded flex items-center justify-center transition disabled:opacity-60 ${combo.status === 'Active' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
                      >
                        {statusUpdatingId === combo.Id ? <Loader2 size={12} className="animate-spin" /> : combo.status === 'Active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
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

function ProductPicker({ onAdd, addedKeys }) {
  const [term, setTerm] = useState('');
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = term.trim();
    if (!query) return undefined;
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      productService.getAll({ searchTerm: query, limit: 10 })
        .then((res) => {
          if (!active) return;
          setUnits((res.data || [])
            .filter((product) => product.status !== 'Inactive')
            .flatMap((product) => sellableUnits(product, productImages(product)))
            .filter((unit) => unit.variantId));
        })
        .catch(() => { if (active) setUnits([]); })
        .finally(() => { if (active) setLoading(false); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [term]);

  return (
    <div>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            if (!e.target.value.trim()) setUnits([]);
          }}
          placeholder="Product name বা SKU দিয়ে search করুন..."
          className={`${inputCls} pl-8`}
        />
      </div>
      {(loading || units.length > 0 || term.trim()) && (
        <div className="mt-1 border border-gray-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-gray-100">
          {loading && <div className="px-3 py-3 text-xs text-gray-400">Searching...</div>}
          {!loading && units.length === 0 && <div className="px-3 py-3 text-xs text-gray-400">কোনো পণ্য পাওয়া যায়নি</div>}
          {!loading && units.map((unit) => {
            const added = addedKeys.has(`${unit.productId}:${unit.variantId}`);
            return (
              <div key={unit.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
                {unit.images[0] ? (
                  <img src={imageUrl(unit.images[0])} alt="" className="w-9 h-9 rounded object-cover border border-gray-200" />
                ) : <div className="w-9 h-9 rounded bg-gray-100" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{unit.baseName}</p>
                  <p className="text-[11px] text-gray-500 truncate">{unit.variant || 'Default'} · Stock {unit.stock}</p>
                </div>
                <span className="text-xs font-bold text-gray-700">{fmt(unit.price)} Tk</span>
                <button
                  type="button"
                  onClick={() => onAdd(unit)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded text-white ${added ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                >
                  {added ? '+1 More' : 'Add to Cart'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ComboOfferForm({ id, onDone }) {
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [imageName, setImageName] = useState('No file chosen');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([]);
  const [regularPrice, setRegularPrice] = useState('');
  const [regularTouched, setRegularTouched] = useState(false);
  const [discount, setDiscount] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);

  const productsTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0),
    [items],
  );
  const addedKeys = useMemo(() => new Set(items.map((item) => `${item.productId}:${item.variantId}`)), [items]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    comboOfferService.getById(id)
      .then((res) => {
        if (!alive) return;
        const combo = res.data || {};
        setTitle(combo.title || '');
        setImage(combo.image || '');
        setDescription(combo.description || '');
        setItems((combo.items || []).map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          variant: item.variant || '',
          price: Number(item.price) || 0,
          image: item.image || '',
          qty: Number(item.qty) || 1,
          available: item.available,
        })));
        setRegularPrice(combo.regularPrice ?? '');
        setRegularTouched(true);
        setDiscount(combo.discount ?? '');
        setOfferPrice(combo.offerPrice ?? '');
        setSortOrder(combo.sortOrder ?? 0);
        setActive(combo.status !== 'Inactive');
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  // Until the admin types a regular price, it follows the selected products' total.
  function changeItems(next) {
    setItems(next);
    if (regularTouched) return;
    const total = next.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
    setRegularPrice(total || '');
    setOfferPrice(Math.max(0, total - Number(discount || 0)) || '');
  }

  function addUnit(unit) {
    const idx = items.findIndex((item) => item.productId === unit.productId && item.variantId === unit.variantId);
    if (idx !== -1) {
      changeItems(items.map((item, i) => (i === idx ? { ...item, qty: item.qty + 1 } : item)));
      return;
    }
    changeItems([...items, {
      productId: unit.productId,
      variantId: unit.variantId,
      name: unit.baseName,
      variant: unit.variant,
      price: unit.price,
      image: unit.images[0] || '',
      qty: 1,
      available: true,
    }]);
  }

  function updateQty(idx, qty) {
    changeItems(items.map((item, i) => (i === idx ? { ...item, qty: Math.max(1, Math.floor(Number(qty) || 1)) } : item)));
  }

  function changeRegular(value) {
    setRegularTouched(true);
    setRegularPrice(value);
    setOfferPrice(Math.max(0, Number(value || 0) - Number(discount || 0)));
  }

  function changeDiscount(value) {
    setDiscount(value);
    setOfferPrice(Math.max(0, Number(regularPrice || 0) - Number(value || 0)));
  }

  function changeOffer(value) {
    setOfferPrice(value);
    setDiscount(Math.max(0, Number(regularPrice || 0) - Number(value || 0)));
  }

  async function handleSubmit() {
    if (!title.trim()) { setError('Combo offer title দিন।'); return; }
    if (active && !items.length) { setError('অন্তত একটি পণ্য add করুন।'); return; }
    if (active && !(Number(offerPrice) > 0)) { setError('Offer price দিন।'); return; }
    setError('');
    setSaving(true);
    const payload = {
      title: title.trim(),
      image: image || null,
      description: description || null,
      items: items.map(({ productId, variantId, qty }) => ({ productId, variantId, qty })),
      regularPrice: Number(regularPrice) || 0,
      discount: Number(discount) || 0,
      offerPrice: Number(offerPrice) || 0,
      sortOrder: Number(sortOrder) || 0,
      status: active ? 'Active' : 'Inactive',
    };
    try {
      if (id) await comboOfferService.update(id, payload);
      else await comboOfferService.create(payload);
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex-1 p-8 text-center text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">{id ? 'Edit Combo Offer' : 'Create Combo Offer'}</h1>
        <button type="button" onClick={onDone} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
          <ArrowLeft size={14} /> Manage
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Combo Offer Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Combo Offer Image</label>
              <label className="flex items-center border border-gray-300 rounded overflow-hidden cursor-pointer w-full">
                <span className="bg-white border-r border-gray-300 px-3 py-2 text-xs text-gray-600 whitespace-nowrap hover:bg-gray-50 transition">Choose file</span>
                <span className="px-3 text-xs text-gray-400 flex-1 truncate">{imageName}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setImageName(file.name);
                    setImage(await readImageFile(file));
                  }}
                />
              </label>
              {image && (
                <div className="relative inline-block mt-2">
                  <img src={imageUrl(image)} alt={title || 'Combo'} className="w-24 h-24 rounded-lg object-cover border border-gray-200" />
                  <button type="button" onClick={() => { setImage(''); setImageName('No file chosen'); }} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-y`} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
            <h2 className="text-sm font-bold text-gray-800">Offer Products</h2>
            <ProductPicker onAdd={addUnit} addedKeys={addedKeys} />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Product', 'Variation', 'Price', 'Qty', 'Total', ''].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-6 text-gray-400">উপরে search করে পণ্য add করুন</td></tr>
                  )}
                  {items.map((item, idx) => (
                    <tr key={`${item.productId}:${item.variantId}`} className="border-b border-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {item.image ? <img src={imageUrl(item.image)} alt="" className="w-8 h-8 rounded object-cover border border-gray-200" /> : <div className="w-8 h-8 rounded bg-gray-100" />}
                          <span className="font-semibold text-gray-800">{item.name}</span>
                          {item.available === false && <span className="text-[10px] text-red-500 font-bold">Unavailable</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{item.variant || 'Default'}</td>
                      <td className="px-3 py-2">{fmt(item.price)} Tk</td>
                      <td className="px-3 py-2">
                        <input type="number" min={1} value={item.qty} onChange={(e) => updateQty(idx, e.target.value)} className="w-16 border border-gray-300 rounded px-2 py-1 text-xs" />
                      </td>
                      <td className="px-3 py-2 font-semibold">{fmt(item.price * item.qty)} Tk</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => changeItems(items.filter((_, i) => i !== idx))} className="w-6 h-6 rounded bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-800">Pricing</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price</label>
              <input type="number" min={0} value={regularPrice} onChange={(e) => changeRegular(e.target.value)} className={inputCls} />
              <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
                <span>Products total: {fmt(productsTotal)} Tk</span>
                {Number(regularPrice) !== productsTotal && (
                  <button type="button" onClick={() => changeRegular(productsTotal)} className="text-blue-600 hover:underline">Use total</button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
              <input type="number" min={0} value={discount} onChange={(e) => changeDiscount(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offer Price *</label>
              <input type="number" min={0} value={offerPrice} onChange={(e) => changeOffer(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <button
                type="button"
                onClick={() => setActive((v) => !v)}
                className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 ${active ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ${active ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="button" onClick={handleSubmit} disabled={saving} className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2 rounded-lg transition">
              {saving ? 'Saving...' : id ? 'Update' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
