import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthLayout } from "./Login";
import client, { payload } from "../../api/client";
import endpoints from "../../api/endpoints";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = payload(await client.post(endpoints.auth.register, form));
      sessionStorage.setItem("pendingVerificationEmail", form.email);
      toast.success(result?.message || "Verification code sent to your email");
      navigate("/verify-otp", { state: { email: form.email } });
    } catch {
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get started with your support workspace"
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="form-label">Full name</span>
          <input
            className="input"
            required
            minLength="2"
            autoComplete="name"
            placeholder="Your full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="form-label">Email address</span>
          <input
            className="input"
            required
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="form-label">Phone number</span>
          <input
            className="input"
            required
            autoComplete="tel"
            placeholder="+91..."
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="form-label">Password</span>
          <input
            className="input"
            required
            minLength="8"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-indigo-600">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
