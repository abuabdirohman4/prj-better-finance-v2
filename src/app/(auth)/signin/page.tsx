import { signIn } from "./actions";

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Better Finance</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola keuangan dengan lebih cerdas</p>
        </div>

        <SignInError searchParams={searchParams} />

        <form action={signIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="kamu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Masuk
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Belum punya akun?{" "}
          <a href="/signup" className="text-blue-600 font-medium hover:underline">
            Daftar
          </a>
        </p>
      </div>
    </div>
  );
}

async function SignInError({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  if (!params.message) return null;
  return (
    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
      ⚠️ {params.message}
    </div>
  );
}
