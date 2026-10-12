import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [values, setValues] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(values);
      navigate(location.state?.from?.pathname || "/dashboard", {
        replace: true,
      });
    } catch {
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your support workspace"
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="Work email">
          <input
            className="input"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
          />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input
              className="input pr-12"
              type={show ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={values.password}
              onChange={(e) =>
                setValues({ ...values, password: e.target.value })
              }
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-slate-400"
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Forgot password?
          </Link>
        </div>
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Signing in..." : "Sign in"} <ArrowRight size={17} />
        </button>
      </form>
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">OR</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <p className="mt-7 text-center text-sm text-slate-500">
        New to SupportDesk?{" "}
        <Link to="/register" className="font-semibold text-indigo-600">
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}


export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-32 -top-24 h-[480px] w-[480px] rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-28 h-[450px] w-[450px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500">
            <Activity size={23} />
          </div>
          <span className="text-xl font-bold">SupportDesk</span>
        </div>
        <div className="relative max-w-xl">
          <div className="mb-6 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-indigo-200">
            Customer support, simplified
          </div>
          <h1 className="text-5xl font-semibold leading-[1.12] tracking-tight xl:text-6xl">
            Every conversation.
            <br />
            <span className="text-indigo-300">One clear view.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
            Keep your team aligned, your customers informed, and every support
            request moving forward.
          </p>
        </div>
        <p className="relative text-xs text-slate-500">
          Secure ticketing · Email-connected support
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white">
                <Activity size={21} />
              </div>
              <span className="text-xl font-bold text-slate-900">
                SupportDesk
              </span>
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-2 mb-8 text-sm leading-6 text-slate-500">
            {subtitle}
          </p>
          {children}
          <p className="mt-10 text-center text-xs text-slate-400">
            By continuing, you agree to your organization's support policies.
          </p>
        </div>
      </section>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
