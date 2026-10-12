import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthLayout } from "./Login";
import { useAuth } from "../../context/AuthContext";

export default function VerifyOtp() {
  const location = useLocation(),
    navigate = useNavigate();
  const [email, setEmail] = useState(
    location.state?.email ||
      sessionStorage.getItem("pendingVerificationEmail") ||
      "",
  );
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const { verifyOtp } = useAuth();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await verifyOtp({ email, otp });
      toast.success("Email verified. You can now sign in.");
      navigate("/login");
    } catch {
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the verification code sent by the backend email service."
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
          />
        </label>
        <label className="block">
          <span className="form-label">6-digit verification code</span>
          <input
            className="input text-center text-xl tracking-[.4em]"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength="6"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
          />
        </label>
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Verifying..." : "Verify email"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-semibold text-indigo-600">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
