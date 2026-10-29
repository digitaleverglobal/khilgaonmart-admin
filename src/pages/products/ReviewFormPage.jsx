import { useEffect, useMemo, useState } from 'react';
import { Video } from 'lucide-react';
import { reviewService } from '../../services/productService';
import { useProducts } from '../../hooks/useProducts';
import { orderService } from '../../services/orderService';

const fieldCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400';

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
    >
      <span className={`mt-1 inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );
}

export default function ReviewFormPage({ mode = 'create', review, onNavigate }) {
  const [productId, setProductId] = useState(review?.productId || '');
  const [customerName, setCustomerName] = useState(review?.customerName || '');
  const [rating, setRating] = useState(review?.rating || '');
  const [comment, setComment] = useState(review?.comment || '');
  const [status, setStatus] = useState((review?.status || 'approved') !== 'pending');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const isEdit = mode === 'edit';

  const { data: products } = useProducts({ limit: 50 });
  const selectedProduct = products.find((product) => String(product.Id) === String(productId));

  useEffect(() => {
    let active = true;
    orderService.getOrders({ page: 1, limit: 500, sortBy: 'Id', sortOrder: 'DESC' })
      .then((res) => {
        if (active) setOrders(res.data || []);
      })
      .catch(() => {
        if (active) setOrders([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const customerOptions = useMemo(() => {
    const names = orders
      .map((order) => order.customerName?.trim())
      .filter(Boolean);
    if (customerName && !names.includes(customerName)) names.unshift(customerName);
    return [...new Set(names)];
  }, [orders, customerName]);

  async function handleSubmit() {
    if (!customerName.trim() || !rating) { setError('Customer name and rating are required.'); return; }
    setError('');
    setSaving(true);
    try {
      const payload = {
        productId: productId || null,
        productName: selectedProduct?.name || review?.productName || null,
        customerName: customerName.trim(),
        rating: Number(rating),
        comment: comment.trim(),
        status: status ? 'approved' : 'pending',
      };
      if (isEdit) {
        await reviewService.update(review.Id, payload);
      } else {
        await reviewService.create(payload);
      }
      onNavigate && onNavigate('reviews');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-bold text-gray-800">Review {isEdit ? 'Edit' : 'Create'}</h1>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button type="button" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-full transition">
            <Video size={14} />
            টিউটোরিয়াল দেখুন
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('reviews')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2 rounded-full transition"
          >
            Manage
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-3">Product</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={fieldCls}>
              <option value="">Choose ...</option>
              {products.map((p) => (
                <option key={p.Id} value={p.Id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 mb-3">Customer Name *</label>
            <select
              value={customerName}
              onChange={(e) => { setCustomerName(e.target.value); setError(''); }}
              className={fieldCls}
            >
              <option value="">Choose ...</option>
              {customerOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 mb-3">Rating *</label>
            <select value={rating} onChange={(e) => { setRating(e.target.value); setError(''); }} className={fieldCls}>
              <option value="">Choose ...</option>
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 mb-3">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className={`${fieldCls} resize-y`}
            />
          </div>

          <div className="lg:col-span-2">
            <span className="block text-sm font-bold text-gray-500 mb-2">Status (Approved)</span>
            <Toggle checked={status} onChange={setStatus} />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="mt-6 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded transition"
        >
          {saving ? 'Saving...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
