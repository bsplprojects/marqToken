import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Table, Pill, Btn, Empty, dt } from "../ui";
import { toast } from "sonner";
import { UserPlus, Trash2, ShieldCheck } from "lucide-react";

const ROLES = ["SUPER_ADMIN", "FINANCE_ADMIN", "MLM_ADMIN", "OPERATIONS_ADMIN", "SUPPORT_ADMIN", "VIEW_ONLY"];

export default function AdminUsers() {
  const qc = useQueryClient();
  const { can } = useAdminAuth();
  const { data } = useAdminData("adm-admins", "/admins");
  const { data: roles } = useAdminData("adm-roles", "/roles");
  const canEdit = can("admin_users", true);
  const [form, setForm] = useState({ address: "", name: "", email: "", role: "VIEW_ONLY" });

  const create = async () => {
    try {
      await adminApi.post("/admins", form);
      toast.success("Admin created");
      setForm({ address: "", name: "", email: "", role: "VIEW_ONLY" });
      qc.invalidateQueries({ queryKey: ["adm-admins"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };
  const update = async (address, body) => {
    try { await adminApi.put(`/admins/${address}`, body); toast.success("Updated"); qc.invalidateQueries({ queryKey: ["adm-admins"] }); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };
  const remove = async (address) => {
    if (!window.confirm("Remove this admin?")) return;
    try { await adminApi.delete(`/admins/${address}`); toast.success("Removed"); qc.invalidateQueries({ queryKey: ["adm-admins"] }); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <div>
      <AHeader title="Admin Users & Roles" subtitle="RBAC — grant wallet addresses admin roles with scoped permissions." />

      {canEdit && (
        <Panel title="Add Admin" className="p-5 mb-5">
          <div className="grid sm:grid-cols-5 gap-3">
            <input data-testid="newadmin-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Wallet 0x…"
              className="sm:col-span-2 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none focus:border-amber-400/40" />
            <input data-testid="newadmin-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name"
              className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40" />
            <select data-testid="newadmin-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="bg-slate-900 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200 outline-none">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <Btn testid="newadmin-create" onClick={create} disabled={!form.address || !form.name}><UserPlus className="h-4 w-4" /> Add</Btn>
          </div>
        </Panel>
      )}

      <Panel title="Administrators" className="mb-5">
        {data && data.length ? (
          <Table testid="admins-table" columns={[{ label: "Admin" }, { label: "Email" }, { label: "Role" }, { label: "Status" },
            { label: "Last Login" }, { label: "" }]}>
            {data.map((a) => (
              <tr key={a.address} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-3"><div className="text-white text-sm">{a.name}</div><div className="font-mono-merq text-[10px] text-slate-500">{a.short}</div></td>
                <td className="px-5 py-3 text-slate-400 text-sm">{a.email || "—"}</td>
                <td className="px-5 py-3">
                  {canEdit ? (
                    <select data-testid={`admin-role-${a.address}`} value={a.role} onChange={(e) => update(a.address, { role: e.target.value })}
                      className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-amber-300 outline-none">
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : <span className="text-amber-300 text-xs">{a.role}</span>}
                </td>
                <td className="px-5 py-3"><Pill status={a.status} /></td>
                <td className="px-5 py-3 text-slate-500 text-xs">{dt(a.last_login)}</td>
                <td className="px-5 py-3 text-right">
                  {canEdit && <button data-testid={`admin-delete-${a.address}`} onClick={() => remove(a.address)} className="text-rose-400 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>}
                </td>
              </tr>
            ))}
          </Table>
        ) : <Empty />}
      </Panel>

      <Panel title="Permission Matrix" className="p-5">
        {roles && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="font-mono-merq text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="text-left px-3 py-2">Module</th>
                  {ROLES.map((r) => <th key={r} className="px-2 py-2 text-center">{r.replace("_ADMIN", "").replace("_", " ")}</th>)}
                </tr>
              </thead>
              <tbody>
                {roles.modules.map((mod) => (
                  <tr key={mod} className="border-t border-white/5">
                    <td className="px-3 py-2 text-slate-300 capitalize">{mod.replace("_", " ")}</td>
                    {ROLES.map((r) => {
                      const lvl = roles.roles[r]?.[mod];
                      return <td key={r} className="px-2 py-2 text-center">
                        {lvl === "edit" ? <span className="text-emerald-400">✓ edit</span> : lvl === "view" ? <span className="text-slate-500">view</span> : <span className="text-slate-700">—</span>}
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
