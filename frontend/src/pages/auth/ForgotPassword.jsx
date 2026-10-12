import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "./Login";
import client, { payload } from "../../api/client";
import endpoints from "../../api/endpoints";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await client.post(endpoints.auth.forgotPassword, { email });
      sessionStorage.setItem("resetEmail", email);
      navigate("/reset-password", { state: { email } });
    } catch {
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send a one-time code if this email belongs to an account."
    >
      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <span className="form-label">Email address</span>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Requesting code..." : "Send reset code"}
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
