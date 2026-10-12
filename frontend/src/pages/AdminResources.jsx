import { useEffect, useState } from "react";

import {
  Plus,
  Tags,
  Users,
  Trash2,
  Pencil,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { toast } from "react-toastify";

import client, { payload } from "../api/client";
import endpoints from "../api/endpoints";
import LoadingScreen from "../components/ui/LoadingScreen";

const arr = (data) =>
  Array.isArray(data)
    ? data
    : data?.categories || data?.users || data?.items || data?.results || [];

export function CategoriesPage() {
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const response = await client.get(endpoints.categories);

      setItems(arr(payload(response)));
    } catch (error) {
      console.error(
        "Failed to fetch categories:",
        error.response?.data || error.message,
      );

      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(event) {
    event.preventDefault();

    try {
      if (editing) {
        await client.patch(`${endpoints.categories}/${editing}`, form);

        toast.success("Category updated successfully");
      } else {
        await client.post(endpoints.categories, form);

        toast.success("Category created successfully");
      }

      setForm({
        name: "",
        description: "",
      });

      setEditing(null);

      await load();
    } catch (error) {
      console.error(
        "Failed to save category:",
        error.response?.data || error.message,
      );

      toast.error(error.response?.data?.message || "Failed to save category");
    }
  }

  async function remove(id) {
    const confirmed = window.confirm(
      "Delete this category? Existing tickets may still reference it.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await client.delete(`${endpoints.categories}/${id}`);

      toast.success("Category deleted successfully");

      await load();
    } catch (error) {
      console.error(
        "Failed to delete category:",
        error.response?.data || error.message,
      );

      toast.error(error.response?.data?.message || "Failed to delete category");
    }
  }

  function cancelEditing() {
    setEditing(null);

    setForm({
      name: "",
      description: "",
    });
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">ADMINISTRATION</p>

        <h1 className="page-title">Category management</h1>

        <p className="mt-2 text-sm text-slate-500">
          Create and maintain ticket categories.
        </p>
      </div>

      <form
        onSubmit={save}
        className="panel grid gap-3 p-5 sm:grid-cols-[1fr_1.4fr_auto_auto]"
      >
        <input
          className="input"
          required
          minLength={2}
          maxLength={100}
          placeholder="Category name"
          value={form.name}
          onChange={(event) =>
            setForm({
              ...form,
              name: event.target.value,
            })
          }
        />

        <input
          className="input"
          maxLength={500}
          placeholder="Description (optional)"
          value={form.description}
          onChange={(event) =>
            setForm({
              ...form,
              description: event.target.value,
            })
          }
        />

        <button type="submit" className="btn-primary">
          <Plus size={16} />

          {editing ? "Save changes" : "Add category"}
        </button>

        {editing && (
          <button
            type="button"
            className="btn-secondary"
            onClick={cancelEditing}
          >
            Cancel
          </button>
        )}
      </form>

      <section className="panel divide-y divide-slate-100">
        {items.map((category) => (
          <div
            key={category._id}
            className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <Tags size={18} />
              </div>

              <div className="min-w-0">
                <p className="break-words font-semibold text-slate-800">
                  {category.name}
                </p>

                <p className="mt-1 break-words text-xs text-slate-500">
                  {category.description || "No description"}
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                    category.isActive === false
                      ? "bg-slate-100 text-slate-500"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {category.isActive === false ? "Inactive" : "Active"}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="btn-secondary px-3 py-2"
                onClick={() => {
                  setEditing(category._id);

                  setForm({
                    name: category.name || "",
                    description: category.description || "",
                  });
                }}
              >
                <Pencil size={14} />
                Edit
              </button>

              <button
                type="button"
                className="btn-secondary px-3 py-2 text-rose-600"
                onClick={() => remove(category._id)}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}

        {!items.length && (
          <div className="p-12 text-center text-sm text-slate-500">
            No categories found.
          </div>
        )}
      </section>
    </div>
  );
}

export function UsersPage() {
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load() {
    try {
      const response = await client.get(endpoints.users);

      setItems(arr(payload(response)));
    } catch (error) {
      console.error(
        "Failed to fetch users:",
        error.response?.data || error.message,
      );

      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(user) {
    try {
      await client.patch(`${endpoints.users}/${user._id}/status`, {
        isActive: user.isActive === false,
      });

      toast.success(
        user.isActive === false
          ? "Account activated successfully"
          : "Account deactivated successfully",
      );

      await load();
    } catch (error) {
      console.error(
        "Failed to update user status:",
        error.response?.data || error.message,
      );

      toast.error(
        error.response?.data?.message || "Failed to update user status",
      );
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const visible = items.filter((user) =>
    `${user.fullName || ""} ${user.email || ""} ${user.role || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">ADMINISTRATION</p>

        <h1 className="page-title">User management</h1>

        <p className="mt-2 text-sm text-slate-500">
          Review accounts and activate or deactivate access.
        </p>
      </div>

      <input
        className="input max-w-lg"
        placeholder="Search name, email, or role..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <section className="panel overflow-hidden">
        <div className="divide-y divide-slate-100">
          {visible.map((user) => (
            <div
              key={user._id}
              className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 font-bold text-indigo-700">
                  {(user.fullName || user.email || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {user.fullName || "Unnamed user"}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {user.phone || "No phone"} ·{" "}
                    {user.isVerified ? "Verified" : "Not verified"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                  {user.role || "customer"}
                </span>

                <span
                  className={`text-xs font-semibold ${
                    user.isActive === false
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }`}
                >
                  {user.isActive === false ? "Inactive" : "Active"}
                </span>

                <button
                  type="button"
                  className="btn-secondary px-3 py-2"
                  onClick={() => toggle(user)}
                >
                  {user.isActive === false ? (
                    <>
                      <CheckCircle2 size={14} />
                      Activate
                    </>
                  ) : (
                    <>
                      <XCircle size={14} />
                      Deactivate
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {!visible.length && (
            <div className="p-12 text-center text-sm text-slate-500">
              No users match this search.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}