import { useState } from 'react';
import { useSupplierAllList } from '../../hooks/useSuppliers';
import { supplierHistoryService } from '../../services/supplierService';

const PAYMENT_METHODS = ['Cash', 'Bkash', 'Nagad', 'Rocket', 'Bank Transfer', 'Cheque', 'Other'];

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

export default function PaymentAddPage({ mode = 'create', payment, onSave, onNavigate }) {
  const { data: suppliers, loading: suppliersLoading } = useSupplierAllList();

  const [form, setForm] = useState({
    paymentTitle: payment?.paymentTitle ?? '',
    supplierId: payment?.supplierId ?? '',
    amount: payment?.amount ?? '',
    due: payment?.due ?? '',
    method: payment?.method ?? '',
    status: payment?.status ?? 'Paid',
    date: payment?.date ?? todayDateOnly(),
    sender: payment?.sender ?? '',
    transactionId: payment?.transactionId ?? '',
    description: payment?.description ?? '',
    file: payment?.file ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const selectedSupplier = suppliers.find((s) => String(s.Id) === String(form.supplierId));
  const dueValue = form.due !== '' ? form.due : selectedSupplier?.netBalance ?? '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.paymentTitle || !form.supplierId || !form.amount || !form.method || !form.date) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        paymentTitle: form.paymentTitle.trim(),
        supplierId: Number(form.supplierId),
        amount: Number(form.amount),
        due: dueValue === '' ? undefined : Number(dueValue),
        method: form.method,
        status: form.status,
        date: form.date,
        sender: form.sender || undefined,
        transactionId: form.transactionId || undefined,
        description: form.description || undefined,
        file: form.file || undefined,
      };
      if (mode === 'edit' && payment?.Id) {
        await supplierHistoryService.update(payment.Id, payload);
      } else {
        await supplierHistoryService.create(payload);
      }
      onSave && onSave();
      onNavigate && onNavigate('payment_list');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">
          {mode === 'edit' ? 'Payment Edit' : 'Payment Entry'}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('payment_list')}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl shadow p-6">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Payment title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Payment Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.paymentTitle}
              onChange={(e) => set('paymentTitle', e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={form.supplierId}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, supplierId: e.target.value, due: '' }));
              }}
              required
              disabled={suppliersLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-600 focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">{suppliersLoading ? 'Loading...' : 'Select Supplier..'}</option>
              {suppliers.map((s) => (
                <option key={s.Id} value={s.Id}>{s.name}</option>
              ))}
            </select>
            {selectedSupplier && (
              <p className="mt-1 text-[11px] text-gray-500">
                Net Balance: <span className="font-semibold text-gray-700">{(selectedSupplier.netBalance || 0).toLocaleString()} ৳</span>
              </p>
            )}
          </div>

          {/* Amount + Due */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Due <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={dueValue}
                readOnly
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-gray-100 text-gray-600"
              />
            </div>
          </div>

          {/* Method + Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Method <span className="text-red-500">*</span>
              </label>
              <select
                value={form.method}
                onChange={(e) => set('method', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-600 focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Select Method..</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Sender + Transaction ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sender</label>
              <input
                type="text"
                value={form.sender}
                onChange={(e) => set('sender', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Transaction ID</label>
              <input
                type="text"
                value={form.transactionId}
                onChange={(e) => set('transactionId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Status + File reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-600 focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">File / Reference</label>
              <input
                type="text"
                value={form.file}
                onChange={(e) => set('file', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                placeholder="File name or reference (optional)"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2 rounded-lg transition"
            >
              {saving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Submit'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
