import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router";

function NotesPage() {
const handleLogout = () => {
  localStorage.removeItem("isAuthenticated");
  navigate("/login", { replace: true });
};

  return (
    <div className="min-h-screen bg-[#faf9ff] text-slate-900">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 shadow-md shadow-purple-200 text-white font-bold text-xl">
              N
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Notes Workspace</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{ "User"}</p>
              <p className="text-xs text-slate-500">{ ""}</p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, { "User"}! 👋</h1>
          <p className="mt-2 text-slate-600">Your authentication with Express backend & Redux Toolkit is fully working.</p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-6">
              <h3 className="font-semibold text-purple-900">User ID</h3>
              <p className="mt-1 text-sm text-purple-700 font-mono">{ "N/A"}</p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-6">
              <h3 className="font-semibold text-purple-900">Email Address</h3>
              <p className="mt-1 text-sm text-purple-700">{ "N/A"}</p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-6">
              <h3 className="font-semibold text-purple-900">Account Created</h3>
              <p className="mt-1 text-sm text-purple-700">
                { "N/A" }
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default NotesPage;
