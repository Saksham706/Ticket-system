import { useEffect, useState } from "react";
import { ArrowLeft, Paperclip, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import client, { payload } from "../api/client";
import endpoints from "../api/endpoints";

export default function NewTicket() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
  });
  const [categories, setCategories] = useState([]);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    client
      .get(endpoints.categories)
      .then((r) => {
        const d = payload(r);
        setCategories(Array.isArray(d) ? d : d?.categories || d?.items || []);
      })
      .catch(() => {});
  }, []);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const response = await client.post(endpoints.tickets, form);
      const data = payload(response);
      const ticket = data?.ticket || data;
      if (file && ticket?._id) {
        const upload = new FormData();
        upload.append("file", file);
        upload.append("ticketId", ticket._id);
        try {
          await client.post(endpoints.attachments, upload, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch {
          toast.warning(
            "Ticket was created, but the attachment did not upload. You can retry from the ticket page.",
          );
        }
      }
      toast.success(
        "Ticket created successfully. Email confirmation delivery is handled by the backend.",
      );
      navigate(ticket?._id ? `/tickets/${ticket._id}` : "/tickets");
    } catch {
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Back to tickets
      </Link>
      <div>
        <p className="eyebrow">NEW REQUEST</p>
        <h1 className="page-title">Create a ticket</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tell us what you need help with. We'll keep every reply in one
          conversation.
        </p>
      </div>
      <form onSubmit={submit} className="panel space-y-6 p-5 sm:p-8">
        <label className="block">
          <span className="form-label">Subject</span>
          <input
            className="input"
            required
            minLength="3"
            maxLength="200"
            placeholder="A short summary of the issue"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="form-label">Description</span>
          <textarea
            className="input min-h-[170px] resize-y"
            required
            minLength="5"
            maxLength="10000"
            placeholder="Describe what happened, what you expected, and any steps you've tried..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <span className="mt-1 block text-right text-xs text-slate-400">
            {form.description.length}/10000
          </span>
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="form-label">Category</span>
            <select
              className="input"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Choose category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!categories.length && (
              <span className="mt-1 block text-xs text-amber-600">
                No categories loaded. Check the backend GET /categories
                endpoint.
              </span>
            )}
          </label>
          <label className="block">
            <span className="form-label">Priority</span>
            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="form-label">
            Attachment{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4">
            <Paperclip size={18} className="text-slate-400" />
            <input
              type="file"
              className="min-w-0 flex-1 text-sm text-slate-500"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <span className="mt-1 block text-xs text-slate-400">
            The backend enforces allowed file types and size limits.
          </span>
        </label>
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <Link to="/tickets" className="btn-secondary">
            Cancel
          </Link>
          <button disabled={busy} className="btn-primary">
            {busy ? "Creating ticket..." : "Submit ticket"} <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
