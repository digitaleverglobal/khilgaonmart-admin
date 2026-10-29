import { useCallback, useEffect, useState } from 'react';
import { customerService } from '../../services/customerService';

const TYPE_LABELS = {
  earn: 'Order delivered',
  earn_reversal: 'Delivery reversed',
  redeem: 'Used on order',
  redeem_refund: 'Refund (cancel/return)',
  adjust: 'Staff adjustment',
  expire: 'Expired',
  bonus_signup: 'Sign-up bonus',
  bonus_first_order: 'First order bonus',
  bonus_review: 'Review bonus',
  bonus_referral: 'Referral bonus',
};

const fmt = (v) => Number(v || 0).toLocaleString('en-US');
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-GB') : '—');

// Reward points for one customer, with a staff adjustment form.
export default function CustomerRewardsCard({ customerId }) {
  const [rewards, setRewards] = useState(null);
  const [error, setError] = useState('');
  const [points, setPoints] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await customerService.getRewards(customerId);
      setRewards(res.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Reward points load করতে সমস্যা হয়েছে');
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  async function handleAdjust(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await customerService.adjustRewards(customerId, { points: Number(points), note });
      setRewards(res.data);
      setPoints('');
      setNote('');
      setMessage('Points updated');
    } catch (err) {
      setMessage(err.message || 'Adjust failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded bg-white p-6 shadow-sm">
      <div className="mb-5 rounded bg-orange-500 py-2 text-center text-sm font-bold text-white">Reward Points</div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!rewards && !error && <p className="text-xs text-gray-400">Loading...</p>}
      {rewards && (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Balance</p>
              <p className="text-2xl font-extrabold text-gray-800">{fmt(rewards.balance)} <span className="text-sm font-semibold">points</span></p>
              <p className="text-xs text-gray-500">Worth ৳{fmt(rewards.balanceValue)}</p>
              {rewards.tier && (
                <p className="mt-2 text-xs text-gray-600">
                  Tier: <b>{rewards.tier.current.name}</b> · 12-month spend ৳{fmt(rewards.tier.spend)}
                </p>
              )}
              {rewards.expiringSoon && (
                <p className="mt-1 text-xs text-amber-600">
                  {fmt(rewards.expiringSoon.points)} points expire on {fmtDate(rewards.expiringSoon.date)}
                </p>
              )}
              {rewards.referralCode && <p className="mt-1 text-xs text-gray-600">Referral code: <b>{rewards.referralCode}</b></p>}
            </div>

            <form onSubmit={handleAdjust} className="space-y-2 rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-700">Adjust points</p>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="e.g. 50 or -20"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason (required)"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
              <button type="submit" disabled={saving}
                className="w-full rounded-lg bg-teal-500 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              {message && <p className="text-xs text-gray-600">{message}</p>}
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  {['Date', 'Type', 'Details', 'Points', 'Expires'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rewards.transactions.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">No points yet</td></tr>
                )}
                {rewards.transactions.map((t) => (
                  <tr key={t.Id} className="border-b border-gray-50">
                    <td className="px-3 py-2 text-gray-500">{fmtDate(t.createdAt)}</td>
                    <td className="px-3 py-2 text-gray-700">{TYPE_LABELS[t.type] || t.type}</td>
                    <td className="px-3 py-2 text-gray-500">{[t.invoiceId, t.note].filter(Boolean).join(' · ')}</td>
                    <td className={`px-3 py-2 font-bold ${t.points >= 0 ? 'text-green-600' : 'text-orange-500'}`}>
                      {t.points >= 0 ? '+' : ''}{fmt(t.points)}
                    </td>
                    <td className="px-3 py-2 text-gray-400">{t.points > 0 ? fmtDate(t.expiresAt) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
