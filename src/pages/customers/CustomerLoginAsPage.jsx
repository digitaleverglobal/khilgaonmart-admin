import { useState } from "react";
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  Package,
  ChevronDown,
} from "lucide-react";

const NAV_LINKS = [
  "NEW ARRIVALS",
  "ATTAR & OILS",
  "PERFUMES",
  "SPECIAL OFFERS",
  "BY BRAND",
];

const SIDEBAR_LINKS = [
  { icon: User, label: "My Account", key: "account" },
  { icon: Package, label: "My Order", key: "orders" },
  { icon: Settings, label: "Profile Edit", key: "edit" },
  { icon: Settings, label: "Change Password", key: "password" },
  { icon: LogOut, label: "Logout", key: "logout" },
];

const MOCK_ORDERS_CUSTOMER = [
  {
    id: 1,
    invoice: "000001",
    date: "29-11-2025",
    amount: 2441,
    status: "Delivered",
  },
  {
    id: 2,
    invoice: "000027",
    date: "29-11-2025",
    amount: 770,
    status: "Confirmed",
  },
  {
    id: 3,
    invoice: "000058",
    date: "11-12-2025",
    amount: 1258,
    status: "Pending",
  },
  {
    id: 4,
    invoice: "000100",
    date: "07-02-2026",
    amount: 1429,
    status: "Pending",
  },
  {
    id: 5,
    invoice: "000290",
    date: "21-04-2026",
    amount: 360,
    status: "Delivered",
  },
];

export default function CustomerLoginAsPage({ customer, onBack }) {
  const [activeTab, setActiveTab] = useState("account");

  const name = customer?.name ?? "Md Zadu Mia";
  const phone = customer?.phone ?? "01742892725";
  const email = customer?.email ?? "";
  const address = customer?.address ?? "জোতাতিারজিতা";

  return (
    <div
      className="flex-1 overflow-y-auto flex flex-col"
      style={{ background: "#f5f5f5" }}
    >
      {/* Top bar (admin back) */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-1.5 flex items-center gap-3">
        <span className="text-xs text-yellow-800 font-medium">
          ⚠ Viewing as customer: <strong>{name}</strong>
        </span>
        <button
          type="button"
          onClick={onBack}
          className="ml-auto text-xs text-indigo-600 hover:underline font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Black navbar */}
      <header className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search Product..."
              className="flex-1 text-xs text-gray-700 bg-transparent focus:outline-none"
            />
            <Search size={14} className="text-gray-400" />
          </div>

          {/* Logo */}
          <div className="flex-1 flex justify-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{
                background: "linear-gradient(135deg, #F8CB2E, #F17A23)",
              }}
            >
              <span style={{ fontFamily: "serif", fontSize: 18 }}>وجيه</span>
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-5">
            <button className="flex flex-col items-center gap-0.5 text-white hover:text-yellow-300 transition">
              <User size={16} />
              <span className="text-[10px]">ACCOUNT</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 text-white hover:text-yellow-300 relative transition">
              <ShoppingCart size={16} />
              <span className="text-[10px]">CART</span>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                1
              </span>
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav className="border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 py-2">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                className="flex items-center gap-1 text-xs text-gray-300 hover:text-white transition whitespace-nowrap"
              >
                {link}
                {(link === "ATTAR & OILS" ||
                  link === "PERFUMES" ||
                  link === "BY BRAND") && <ChevronDown size={11} />}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex gap-5 items-start">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-500">Hello</p>
            <p className="text-sm font-bold text-gray-800">{name}</p>
          </div>
          <nav className="py-1">
            {SIDEBAR_LINKS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => item.key !== "logout" && setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition ${
                  activeTab === item.key
                    ? "bg-gray-100 text-gray-900 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon size={13} className="text-gray-400" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
          {activeTab === "account" && (
            <AccountTab
              name={name}
              phone={phone}
              email={email}
              address={address}
            />
          )}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "edit" && (
            <EditTab
              name={name}
              phone={phone}
              email={email}
              address={address}
            />
          )}
          {activeTab === "password" && <PasswordTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white"
              style={{
                background: "linear-gradient(135deg, #F8CB2E, #F17A23)",
              }}
            >
              <span style={{ fontFamily: "serif", fontSize: 20 }}>وجيه</span>
            </div>
            <span className="text-white font-bold">Khilgaon Mart</span>
          </div>

          {/* Useful Links */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">USEFUL LINK</p>
            {[
              "Refund & Return Policy",
              "Terms & Conditions",
              "Privacy Policy",
              "How To order",
            ].map((l) => (
              <p
                key={l}
                className="text-xs text-gray-400 hover:text-white cursor-pointer mb-1.5"
              >
                {l}
              </p>
            ))}
          </div>

          {/* Customer Links */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">
              CUSTOMER LINK
            </p>
            {["Register", "Login", "Forgot Password?", "Contact"].map((l) => (
              <p
                key={l}
                className="text-xs text-gray-400 hover:text-white cursor-pointer mb-1.5"
              >
                {l}
              </p>
            ))}
          </div>

          {/* Follow Us */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">FOLLOW US</p>
            <div className="flex gap-2 mb-4">
              {["f", "in", "yt", "wa", "m"].map((s) => (
                <button
                  key={s}
                  className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center transition"
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 font-semibold mb-1">
              DELIVERY PARTNER
            </p>
            <div className="flex gap-2">
              <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                SteadFast
              </span>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                Pathao
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 text-center py-2">
          <p className="text-xs text-gray-500">
            © Khilgaon Mart<span className="text-blue-400">DigitalEver</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function AccountTab({ name, phone, email, address }) {
  return (
    <div className="p-6">
      <h2 className="text-base font-bold text-gray-800 mb-4">My Account</h2>
      <table className="w-full text-sm">
        <tbody>
          {[
            ["Name", name],
            ["Phone", phone],
            ["Email", email || "—"],
            ["Address", address || "—"],
            ["District", "—"],
            ["Area", "—"],
            ["Image", null],
          ].map(([label, value]) => (
            <tr key={label} className="border-b border-gray-100">
              <td className="py-3 pr-8 text-gray-500 w-36">{label}</td>
              <td className="py-3 text-gray-800">
                {label === "Image" ? (
                  <div className="w-14 h-14 rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-2xl">
                    👤
                  </div>
                ) : (
                  value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTab() {
  return (
    <div className="p-6">
      <h2 className="text-base font-bold text-gray-800 mb-4">My Orders</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["SL", "Invoice", "Date", "Amount", "Status"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left text-gray-500 font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_ORDERS_CUSTOMER.map((o, i) => (
              <tr
                key={o.id}
                className="border-b border-gray-50 hover:bg-gray-50/60 transition"
              >
                <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                <td className="px-3 py-2.5 font-mono text-gray-700">
                  {o.invoice}
                </td>
                <td className="px-3 py-2.5 text-gray-500">{o.date}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800">
                  ৳{o.amount.toLocaleString()}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      o.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : o.status === "Confirmed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditTab({ name, phone, email, address }) {
  const [form, setForm] = useState({ name, phone, email, address });
  function set(f, v) {
    setForm((p) => ({ ...p, [f]: v }));
  }
  return (
    <div className="p-6">
      <h2 className="text-base font-bold text-gray-800 mb-4">Profile Edit</h2>
      <form className="space-y-4 max-w-lg" onSubmit={(e) => e.preventDefault()}>
        {[
          ["name", "Name"],
          ["phone", "Phone"],
          ["email", "Email"],
          ["address", "Address"],
        ].map(([key, label]) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {label}
            </label>
            <input
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
        ))}
        <button
          type="submit"
          className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

function PasswordTab() {
  return (
    <div className="p-6">
      <h2 className="text-base font-bold text-gray-800 mb-4">
        Change Password
      </h2>
      <form className="space-y-4 max-w-lg" onSubmit={(e) => e.preventDefault()}>
        {["Current Password", "New Password", "Confirm New Password"].map(
          (label) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {label}
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          ),
        )}
        <button
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
