import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { NotebookPen, Mail, Lock, Eye, EyeOff } from "lucide-react";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

  if (email && password) {
    localStorage.setItem("isAuthenticated", "true");
    navigate("/notes");
  }
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] text-slate-900">
      <div className="min-h-screen grid lg:grid-cols-2">

        <section className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#f3efff] via-[#faf9ff] to-white px-12 py-10 xl:px-20">

          <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-purple-200/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col">

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 shadow-lg shadow-purple-200">
                <NotebookPen size={21} strokeWidth={1.8} className="text-white" />
              </div>

              <span className="text-2xl font-bold tracking-tight">
                notes
              </span>
            </div>

            <div className="flex flex-1 items-center">
              <div className="max-w-lg">

                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-2 text-sm font-medium text-purple-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  Your ideas, organized.
                </div>

                <h1 className="text-5xl font-bold leading-[1.1] tracking-tight xl:text-6xl">
                  Your thoughts
                  <br />
                  deserve a{" "}
                  <span className="text-purple-600">
                    beautiful home.
                  </span>
                </h1>

                <p className="mt-6 max-w-md text-lg leading-8 text-slate-500">
                  Capture your ideas, organize your thoughts, and
                  keep everything you need in one simple place.
                </p>

                
                <div className="mt-10 space-y-5">

                  <Feature
                    icon="✦"
                    title="Clean & Simple"
                    description="A distraction-free space for your thoughts."
                  />

                  <Feature
                    icon="⌁"
                    title="Fast & Organized"
                    description="Find your notes quickly whenever you need them."
                  />

                  <Feature
                    icon="✓"
                    title="Access Anywhere"
                    description="Your notes are always available when inspiration strikes."
                  />

                </div>

                <div className="relative mt-10 hidden xl:block">
                  <div className="relative w-72 rotate-[-4deg] rounded-2xl border border-purple-100 bg-white p-6 shadow-xl shadow-purple-100/60">
                    <div className="absolute -right-5 -top-5 flex h-12 w-12 rotate-12 items-center justify-center rounded-xl bg-purple-100 text-xl">
                      ✨
                    </div>

                    <div className="mb-5 h-1.5 w-16 rounded-full bg-purple-500" />

                    <p className="font-serif text-lg italic text-slate-600">
                      Capture ideas,
                      <br />
                      organize thoughts,
                      <br />
                      achieve more.
                    </p>

                    <div className="mt-6 space-y-2">
                      <div className="h-2 w-full rounded-full bg-slate-100" />
                      <div className="h-2 w-4/5 rounded-full bg-slate-100" />
                      <div className="h-2 w-3/5 rounded-full bg-slate-100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">

          <div className="w-full max-w-md">

            <div className="mb-10 flex justify-center lg:hidden">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 shadow-lg shadow-purple-200">
                  <NotebookPen size={21} strokeWidth={1.8} className="text-white" />
                </div>

                <span className="text-2xl font-bold">
                  notes
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-[0_20px_60px_rgba(91,61,170,0.08)] sm:p-9">

              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <NotebookPen size={28} strokeWidth={1.7} className="text-current" />
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Welcome back 👋
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Sign in to continue to your account
                </p>
              </div>

                           <form onSubmit={handleSubmit} className="space-y-5">

             
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={18} strokeWidth={1.8} />
                    </span>

                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Password
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-purple-600 transition hover:text-purple-700"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={18} strokeWidth={1.8} />
                    </span>

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                    </button>
                  </div>
                </div>
                  <button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 hover:shadow-purple-300 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Sign in
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-slate-500">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-purple-600 hover:text-purple-700"
                >
                  Sign up
                </Link>
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Lock size={18} strokeWidth={1.8} />
              <span>Your notes are private and secure</span>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}


function Feature({ icon, title, description }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm ring-1 ring-purple-100">
        <span className="text-lg">{icon}</span>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}


export default Login;