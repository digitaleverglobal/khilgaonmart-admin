import { LogIn, Mail, Phone, PlayCircle } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { toOrderStatusKey } from '../../utils/orderStatuses';
import { formatInvoiceNumber } from '../../utils/invoiceNumber';
import CustomerRewardsCard from './CustomerRewardsCard';

const STATUS_LABELS = {
  pre_order: 'Pre Order',
  pending: 'Pending',
  packaging: 'Packaging',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  returned: 'Returned',
  on_hold: 'On Hold',
  in_courier: 'In Courier',
  delivered: 'Delivered',
  incomplete: 'Incomplete',
};

function invoiceNumber(order) {
  return formatInvoiceNumber(order, '');
}

function formatDateTime(order) {
  const date = order.orderDate || order.createdAt;
  if (!date) return '—';
  const parsed = new Date(order.createdAt || order.orderDate);
  const dateText = new Date(date).toLocaleDateString('en-GB');
  const timeText = Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return timeText ? `${dateText}, ${timeText}` : dateText;
}

export default function CustomerViewPage({ customer, onNavigate, onLoginAs, onOpenOrder }) {
  const phone = customer?.customerPhone || '';
  const { orders, loading } = useOrders({
    search: phone,
    page: 1,
    limit: 50,
  });

  const totalAmount = orders.reduce((sum, order) => sum + (Number(order.totalBill) || 0), 0);

  const address = customer?.customerAddress || customer?.customerArea || '';
  const district = customer?.customerDistrict || '';
  const upzilla = customer?.customerUpzilla || customer?.customerThana || '';

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Customer Profile</h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">
            <PlayCircle size={14} />
            টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={() => onNavigate && onNavigate('customer_list')} className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700">
            Customer List
          </button>
          <button type="button" onClick={() => onLoginAs && onLoginAs(customer)} className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-600">
            <LogIn size={14} />
            Login
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[520px_1fr]">
        <section className="rounded bg-white p-6 shadow-sm">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-3 flex h-5 w-28 items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-xs text-gray-400">
              profile-image
            </div>
            <h2 className="text-base font-bold text-gray-800">
              {customer?.customerName || '—'}
            </h2>
            <div className="mt-1 flex items-center gap-1">
              <a href={phone ? `tel:${phone}` : undefined} className="inline-flex items-center gap-1 rounded bg-teal-500 px-3 py-1 text-xs font-semibold text-white">
                <Phone size={12} />
                Call
              </a>
              <button type="button" className="inline-flex items-center gap-1 rounded bg-rose-500 px-3 py-1 text-xs font-semibold text-white">
                <Mail size={12} />
                Email
              </button>
            </div>
          </div>

          <h3 className="mb-4 text-xs font-bold uppercase text-gray-800">About Me :</h3>
          <div className="space-y-0">
            {customer?.customerCode && <InfoRow label="Customer ID" value={customer.customerCode} />}
            <InfoRow label="Full Name" value={customer?.customerName || '—'} />
            <InfoRow label="Mobile" value={phone || '—'} />
            <InfoRow label="Email" value={customer?.email || '—'} />
            <InfoRow label="Address" value={address || '—'} />
            <InfoRow label="District" value={district || '—'} />
            <InfoRow label="Upzilla" value={upzilla || '—'} />
          </div>
        </section>

        <section className="rounded bg-white p-6 shadow-sm">
          <div className="mb-5 rounded bg-indigo-600 py-2 text-center text-sm font-bold text-white">
            Order
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  {['SL', 'Invoice', 'Name', 'Date', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-gray-500 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      No orders found
                    </td>
                  </tr>
                )}
                {!loading && orders.map((order, index) => {
                  const key = toOrderStatusKey(order.status);
                  return (
                    <tr
                      key={order.Id}
                      onClick={() => onOpenOrder && onOpenOrder(order)}
                      className={`border-b border-gray-100 hover:bg-gray-50/70 ${onOpenOrder ? 'cursor-pointer' : ''}`}
                    >
                      <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        {onOpenOrder ? (
                          <button type="button" className="font-semibold text-sky-600 hover:underline">
                            {invoiceNumber(order)}
                          </button>
                        ) : (
                          <span className="text-gray-600">{invoiceNumber(order)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.customerName}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDateTime(order)}</td>
                      <td className="px-4 py-3 text-gray-600">৳{Number(order.totalBill || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{STATUS_LABELS[key] || order.status || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              {!loading && orders.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-200">
                    <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-700">
                      Total Amount ({orders.length} orders)
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">৳{totalAmount.toLocaleString()}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>

      {/* Customers from the Customer List (not order rows) have reward points. */}
      {customer?.customerCode && <CustomerRewardsCard customerId={customer.Id} />}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-[170px_1fr] border-b border-gray-200 px-3 py-3 text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-500">{value}</span>
    </div>
  );
}
