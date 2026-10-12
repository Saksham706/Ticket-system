import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthLayout } from "./Login";
import client from "../../api/client";
import endpoints from "../../api/endpoints";

export default function ResetPassword() {
  const location = useLocation(),
    navigate = useNavigate();
  const [form, setForm] = useState({
    email: location.state?.email || sessionStorage.getItem("resetEmail") || "",
    otp: "",
    newPassword: "",
  });
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await client.post(endpoints.auth.resetPassword, form);
      toast.success("Password reset. Sign in with your new password.");
      navigate("/login");
    } catch {
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Use the code sent to your email to securely reset your password."
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="form-label">Email address</span>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="form-label">Reset code</span>
          <input
            className="input tracking-[.3em]"
            required
            maxLength="6"
            value={form.otp}
            onChange={(e) =>
              setForm({ ...form, otp: e.target.value.replace(/\D/g, "") })
            }
            placeholder="000000"
          />
        </label>
        <label className="block">
          <span className="form-label">New password</span>
          <input
            className="input"
            type="password"
            required
            minLength="8"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            placeholder="At least 8 characters"
          />
        </label>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Resetting..." : "Reset password"}
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">
        <Link to="/login" className="font-semibold text-indigo-600">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
