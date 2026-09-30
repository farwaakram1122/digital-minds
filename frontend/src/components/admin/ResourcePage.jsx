import { useEffect, useState } from "react";
import { api } from "../../services/api";
export default function ResourcePage({
  title,
  endpoint,
  fields,
  columns,
  moderation = false,
  readOnly = false,
}) {
  const [rows, setRows] = useState([]),
    [editing, setEditing] = useState(null),
    [error, setError] = useState("");
  const refresh = () =>
    api(endpoint)
      .then(setRows)
      .catch((e) => setError(e.message));
  useEffect(() => {
    refresh();
  }, [endpoint]);
  async function save(e) {
    e.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      for (const f of fields)
        if (f.type === "number")
          data[f.key] = data[f.key] === "" ? undefined : Number(data[f.key]);
        else if (f.type === "list")
          data[f.key] = data[f.key]
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
      await api(`${endpoint}${editing?.id ? "/" + editing.id : ""}`, {
        method: editing?.id ? "PATCH" : "POST",
        body: data,
      });
      setEditing(null);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }
  async function action(row, kind) {
    try {
      if (kind === "reset") {
        if (!window.confirm(`Reset password for ${row.email}? The old password will stop working.`)) return;
        const result = await api(`/admin/users/${row.id}/reset-password`, { method: "POST" });
        window.prompt(`New password for ${result.email} (copy now; shown only once):`, result.password);
        return;
      }
      if (kind === "delete") {
        if (!window.confirm("Remove this record?")) return;
        await api(`${endpoint}/${row.id || row._id}`, { method: "DELETE" });
      } else if (kind === "toggle") {
        await api(`${endpoint}/${row.id || row._id}`, { method: "PATCH", body: { active: row.active === false } });
      } else
        await api(`/admin/users/${row.id}/status`, {
          method: "PATCH",
          body: { status: kind },
        });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <>
      <div className="dash-heading">
        <div>
          <div className="eyebrow">ADMIN MANAGEMENT</div>
          <h1>{title}</h1>
          <p>Review and manage platform records.</p>
        </div>
        {!readOnly && !moderation && (
          <button className="btn btn-primary" onClick={() => setEditing({})}>
            Add {title.slice(0, -1)}
          </button>
        )}
      </div>
      {error && <div className="error-note">{error}</div>}
      {editing && (
        <form className="card padded form-grid two" onSubmit={save}>
          <h2 className="span-2">
            {editing.id ? "Edit" : "Add"} {title.slice(0, -1)}
          </h2>
          {fields.map((f) => (
            <label key={f.key}>
              {f.label}
              <input
                name={f.key}
                type={f.type === "number" ? "number" : "text"}
                step={f.type === "number" ? "any" : undefined}
                required={f.required}
                defaultValue={
                  Array.isArray(editing[f.key])
                    ? editing[f.key].join(", ")
                    : (editing[f.key] ?? "")
                }
              />
            </label>
          ))}
          <div className="span-2">
            <button className="btn btn-primary">Save</button>{" "}
            <button type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="card padded table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || row._id}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.render
                      ? c.render(row[c.key], row)
                      : Array.isArray(row[c.key])
                        ? row[c.key].join(", ")
                        : row[c.key] === "" || row[c.key] == null
                          ? "—"
                          : String(row[c.key])}
                  </td>
                ))}
                <td className="table-actions">
                  {moderation ? (
                    <>
                      {row.status !== "active" && (
                        <button onClick={() => action(row, "active")}>
                          Approve / Activate
                        </button>
                      )}
                      {row.status !== "suspended" && (
                        <button onClick={() => action(row, "suspended")}>
                          Suspend
                        </button>
                      )}
                      {title === "Farmers" && <button onClick={() => action(row, "reset")}>Reset password</button>}
                    </>
                  ) : readOnly ? (
                    <button onClick={() => action(row, "delete")}>
                      Remove
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditing({ ...row, id: row._id })}
                      >
                        Edit
                      </button>
                      {title === 'Markets' && <button onClick={() => action(row, 'toggle')}>{row.active === false ? 'Activate' : 'Deactivate'}</button>}
                      <button onClick={() => action(row, "delete")}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
