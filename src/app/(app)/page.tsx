export default function DashboardPage() {
  return (
    <div className="px-4 py-6">
      {/* Gradient Header */}
      <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-100 text-sm">Selamat datang 👋</p>
          <h1 className="text-2xl font-bold mt-1">Better Finance</h1>
          <p className="text-blue-100 text-sm mt-3">Net Worth</p>
          <p className="text-3xl font-bold">Rp —</p>
        </div>
        {/* Wave decorasi */}
        <svg
          className="absolute bottom-0 right-0 text-white/10"
          width="120"
          height="120"
          viewBox="0 0 120 120"
        >
          <circle cx="100" cy="100" r="80" fill="currentColor" />
        </svg>
      </div>

      {/* Placeholder cards */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Akun & Saldo</p>
          <p className="text-gray-400 text-sm mt-2">Belum ada data. Setup Supabase dulu.</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Transaksi Terbaru</p>
          <p className="text-gray-400 text-sm mt-2">Belum ada transaksi.</p>
        </div>
      </div>
    </div>
  );
}
