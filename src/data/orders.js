export const orderStatuses = [
  { key: "all", label: "All Order", count: 182, color: "bg-cyan-500" },
  { key: "pending", label: "Pending", count: 138, color: "bg-blue-500" },
  { key: "confirmed", label: "Confirmed", count: 9, color: "bg-teal-500" },
  { key: "packaging", label: "Packaging", count: 4, color: "bg-purple-500" },
  { key: "in_courier", label: "In Courier", count: 1, color: "bg-indigo-500" },
  { key: "delivered", label: "Delivered", count: 25, color: "bg-green-500" },
  { key: "cancelled", label: "Cancelled", count: 4, color: "bg-red-500" },
  { key: "returned", label: "Returned", count: 1, color: "bg-amber-500" },
  { key: "incomplete", label: "Incomplete", count: 25, color: "bg-orange-500" },
  { key: "on_hold", label: "On Hold", count: 0, color: "bg-gray-500" },
];

const couriers = ["Pathao", "Steadfast", "Redx", "Paperfly", "eCourier"];
const courierColors = {
  Pathao: "bg-pink-100 text-pink-700",
  Steadfast: "bg-blue-100 text-blue-700",
  Redx: "bg-red-100 text-red-700",
  Paperfly: "bg-purple-100 text-purple-700",
  eCourier: "bg-green-100 text-green-700",
};

const statusColors = {
  pending: "bg-blue-500 text-white",
  confirmed: "bg-teal-500 text-white",
  packaging: "bg-purple-500 text-white",
  in_courier: "bg-indigo-500 text-white",
  delivered: "bg-green-500 text-white",
  cancelled: "bg-red-500 text-white",
  returned: "bg-amber-500 text-white",
  incomplete: "bg-orange-500 text-white",
  on_hold: "bg-gray-400 text-white",
};

const products = [
  "Naira Cut Three Piece For Women",
  "Cozy Long Sleeve Flannel Shirt",
  "Long Sleeve Flannel Shirt Premium",
  "Premium High Quality Airb Freshener",
  "International USA Body Spray",
  "NEBRAS by Lattafa Perfume",
  "Oud Mood Premium Fragrance",
  "Pink Summer Scent Collection",
  "VOYAGE Eau de Parfum",
  "AJEEB MUSK Arabian Perfume",
  "Cotton Casual Kurti for Women",
  "Silk Embroidered Saree",
  "Men Premium Polo Shirt",
  "Kids Summer Collection Dress",
  "Leather Wallet Men Premium",
];

const customers = [
  {
    name: "Abdul Rahman",
    phone: "01712-345678",
    area: "Dhaka",
    district: "Dhaka",
  },
  {
    name: "Fatima Khatun",
    phone: "01812-456789",
    area: "Chittagong",
    district: "Chittagong",
  },
  {
    name: "MD. AMINUL ISLAM",
    phone: "01912-567890",
    area: "Sylhet",
    district: "Sylhet",
  },
  {
    name: "Rabeya Information",
    phone: "01612-678901",
    area: "Rajshahi",
    district: "Rajshahi",
  },
  {
    name: "Nazmul Hasan",
    phone: "01512-789012",
    area: "Khulna",
    district: "Khulna",
  },
  {
    name: "Tamanna Akter",
    phone: "01312-890123",
    area: "Barisal",
    district: "Barisal",
  },
  {
    name: "Habib Fashion",
    phone: "01412-901234",
    area: "Comilla",
    district: "Comilla",
  },
  {
    name: "Md. Dolu Mia",
    price: 1130,
    phone: "01712-012345",
    area: "Narsingdi",
    district: "Narsingdi",
  },
  {
    name: "Md. Asim Mia",
    phone: "01812-123456",
    area: "Gazipur",
    district: "Gazipur",
  },
  {
    name: "Hasibul Hasan Mizan",
    phone: "01912-234567",
    area: "Mymensingh",
    district: "Mymensingh",
  },
  { name: "Alim", phone: "01612-345678", area: "Tangail", district: "Tangail" },
  {
    name: "Shehab Khan",
    phone: "01512-456789",
    area: "Cumilla",
    district: "Cumilla",
  },
  {
    name: "Nasrin Akter",
    phone: "01312-567890",
    area: "Narayanganj",
    district: "Narayanganj",
  },
  {
    name: "Karim Uddin",
    phone: "01412-678901",
    area: "Jessore",
    district: "Jessore",
  },
  {
    name: "Sadia Islam",
    phone: "01712-789012",
    area: "Feni",
    district: "Feni",
  },
  {
    name: "Mohammod Ali",
    phone: "01812-890123",
    area: "Bogura",
    district: "Bogura",
  },
  {
    name: "Rumana Begum",
    phone: "01912-901234",
    area: "Pabna",
    district: "Pabna",
  },
  {
    name: "Zahirul Islam",
    phone: "01612-012345",
    area: "Noakhali",
    district: "Noakhali",
  },
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const statusKeys = [
  "pending",
  "pending",
  "pending",
  "pending",
  "confirmed",
  "packaging",
  "in_courier",
  "delivered",
  "delivered",
  "cancelled",
  "returned",
  "incomplete",
  "incomplete",
  "on_hold",
  "pending",
];

export const ordersData = Array.from({ length: 182 }, (_, i) => {
  const customer = customers[i % customers.length];
  const product = products[i % products.length];
  const courier = couriers[i % couriers.length];
  const statusKey = statusKeys[i % statusKeys.length];
  const bill = randomBetween(500, 5000);
  const advance = randomBetween(0, 200);
  const orderId = `KM-${100 + i}`;
  const date = new Date("2026-05-01");
  date.setDate(date.getDate() + Math.floor(i / 3));
  const dateStr = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = `${String(randomBetween(8, 22)).padStart(2, "0")}:${String(randomBetween(0, 59)).padStart(2, "0")}`;
  const qty = randomBetween(1, 4);
  const fraudScore = randomBetween(1, 5);

  return {
    id: i + 1,
    orderId,
    customer,
    product,
    qty,
    bill,
    advance,
    courier,
    courierColor: courierColors[courier],
    status: statusKey,
    statusColor: statusColors[statusKey],
    statusLabel:
      orderStatuses.find((s) => s.key === statusKey)?.label || statusKey,
    fraudScore,
    date: dateStr,
    time: timeStr,
  };
});
