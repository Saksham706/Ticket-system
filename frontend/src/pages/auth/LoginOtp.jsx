import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "./Login";
import { useAuth } from "../../context/AuthContext";

export default function LoginOtp() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const { loginOtp, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();
  async function request(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await loginOtp({ email });
      setStep(2);
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function verify(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await verifyLoginOtp({ email, otp });
      navigate("/dashboard");
    } catch {
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      title="Sign in with OTP"
      subtitle={
        step === 1
          ? "We'll email you a one-time verification code."
          : "Enter the code sent to your inbox."
      }
    >
      {step === 1 ? (
        <form onSubmit={request} className="space-y-5">
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
            {busy ? "Sending code..." : "Send sign-in code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-5">
          <label className="block">
            <span className="form-label">Email</span>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="form-label">One-time code</span>
            <input
              className="input text-center tracking-[.4em]"
              required
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
          </label>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Verifying..." : "Verify and sign in"}
          </button>
        </form>
      )}
      <p className="mt-7 text-center text-sm text-slate-500">
        <Link to="/login" className="font-semibold text-indigo-600">
          Back to password login
        </Link>
      </p>
    </AuthLayout>
  );
}
