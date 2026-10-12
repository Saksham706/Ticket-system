import { useEffect, useState } from "react";
import { Save, LockKeyhole, UserRound } from "lucide-react";
import { toast } from "react-toastify";
import client, { payload } from "../api/client";
import endpoints from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
  });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    client
      .get(`${endpoints.users}/me`)
      .then((r) => {
        const u = payload(r)?.user || payload(r);
        if (u) {
          setForm({ fullName: u.fullName || "", phone: u.phone || "" });
          setUser((prev) => ({ ...prev, ...u }));
          localStorage.setItem("user", JSON.stringify({ ...user, ...u }));
        }
      })
      .catch(() => {});
  }, []);
  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const d = payload(await client.patch(`${endpoints.users}/me`, form));
      const u = d?.user || d;
      const next = { ...user, ...u, ...form };
      setUser(next);
      localStorage.setItem("user", JSON.stringify(next));
      toast.success("Profile updated");
    } catch {
    } finally {
      setSaving(false);
    }
  }
  async function changePassword(e) {
    e.preventDefault();
    if (password.newPassword.length < 8)
      return toast.error("New password must contain at least 8 characters");
    try {
      await client.patch(`${endpoints.users}/me/password`, password);
      setPassword({ currentPassword: "", newPassword: "" });
      toast.success("Password changed successfully");
    } catch {}
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="eyebrow">ACCOUNT SETTINGS</p>
        <h1 className="page-title">My profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your personal information and account security.
        </p>
      </div>
      <section className="panel p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <UserRound size={20} />
          </div>
          <div>
            <h2 className="section-title">Personal information</h2>
            <p className="text-xs text-slate-400">
              Your email and role are managed by the system.
            </p>
          </div>
        </div>
        <form onSubmit={saveProfile} className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="form-label">Full name</span>
            <input
              className="input"
              required
              minLength="2"
              maxLength="100"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </label>
          <label>
            <span className="form-label">Phone</span>
            <input
              className="input"
              required
              pattern="\+?[1-9][0-9]{7,14}"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            <span className="form-label">Email</span>
            <input
              className="input bg-slate-50"
              readOnly
              value={user?.email || ""}
            />
          </label>
          <label>
            <span className="form-label">Role</span>
            <input
              className="input bg-slate-50 capitalize"
              readOnly
              value={user?.role || "customer"}
            />
          </label>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </section>
      <section className="panel p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h2 className="section-title">Change password</h2>
            <p className="text-xs text-slate-400">
              Use at least 8 characters for your new password.
            </p>
          </div>
        </div>
        <form onSubmit={changePassword} className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="form-label">Current password</span>
            <input
              className="input"
              type="password"
              required
              autoComplete="current-password"
              value={password.currentPassword}
              onChange={(e) =>
                setPassword({ ...password, currentPassword: e.target.value })
              }
            />
          </label>
          <label>
            <span className="form-label">New password</span>
            <input
              className="input"
              type="password"
              required
              minLength="8"
              autoComplete="new-password"
              value={password.newPassword}
              onChange={(e) =>
                setPassword({ ...password, newPassword: e.target.value })
              }
            />
          </label>
          <div className="sm:col-span-2">
            <button className="btn-secondary">Update password</button>
          </div>
        </form>
      </section>
    </div>
  );
}
