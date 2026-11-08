import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../adminApi";
import { AHeader, Panel, Empty, Btn, dt } from "../ui";
import { Plus, Trash2, Pencil, GripVertical, ExternalLink, Eye, EyeOff, Image, Link2, X, Upload, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

const API_BASE = process.env.REACT_APP_BACKEND_URL;

function LinkForm({ initial, onSave, onCancel, saving }) {
  const [name, setName] = useState(initial?.name || "");
  const [url, setUrl] = useState(initial?.url || "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(initial?.image_path ? `${API_BASE}/api/files/${initial.image_path}` : null);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) { toast.error("Name and URL are required"); return; }
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("url", url.trim());
    fd.append("active", active);
    if (imageFile) fd.append("image", imageFile);
    onSave(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 mb-2">Link Name</label>
          <input data-testid="link-name-input" value={name} onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-amber-400/40 focus:outline-none transition-colors"
            placeholder="e.g. Telegram Community" />
        </div>
        <div>
          <label className="block font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 mb-2">URL</label>
          <input data-testid="link-url-input" value={url} onChange={e => setUrl(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-amber-400/40 focus:outline-none transition-colors"
            placeholder="https://t.me/merqon" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
        <div className="flex-1">
          <label className="block font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 mb-2">Image</label>
          <div className="flex items-center gap-4">
            {preview ? (
              <div className="relative group">
                <img src={preview} alt="" className="h-20 w-20 rounded-xl object-cover border border-white/10" />
                <button type="button" onClick={() => { setPreview(null); setImageFile(null); }}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ) : (
              <label data-testid="link-image-upload" className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/3 px-5 py-4 hover:border-amber-400/40 transition-colors">
                <Upload className="h-5 w-5 text-slate-500" />
                <span className="text-sm text-slate-400">Upload Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>
            )}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className={`relative w-11 h-6 rounded-full transition-colors ${active ? "bg-amber-400" : "bg-slate-700"}`}
            onClick={() => setActive(!active)}>
            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm text-slate-300">{active ? "Active" : "Inactive"}</span>
        </label>
      </div>

      {/* Live Preview */}
      {(name || preview) && (
        <div>
          <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 mb-2">Preview</div>
          <div className="glass rounded-2xl border border-white/8 p-4 flex items-center gap-4 max-w-md">
            {preview ? (
              <img src={preview} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                <Link2 className="h-6 w-6 text-amber-400" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm truncate">{name || "Link Name"}</div>
              <div className="text-slate-500 text-xs truncate">{url || "https://..."}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Btn type="submit" testid="link-save-btn" disabled={saving}>{saving ? "Saving..." : initial ? "Update Link" : "Add Link"}</Btn>
        <Btn variant="ghost" onClick={onCancel} testid="link-cancel-btn">Cancel</Btn>
      </div>
    </form>
  );
}

export default function ImportantLinks() {
  const qc = useQueryClient();
  const { data: links = [], isLoading } = useQuery({ queryKey: ["adm-links"], queryFn: async () => (await adminApi.get("/important-links")).data });
  const [editing, setEditing] = useState(null); // null=list, "new"=create, {id,...}=edit
  const [saving, setSaving] = useState(false);

  const handleSave = async (fd) => {
    setSaving(true);
    try {
      if (editing === "new") {
        await adminApi.post("/important-links", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Link created");
      } else {
        await adminApi.put(`/important-links/${editing.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Link updated");
      }
      qc.invalidateQueries(["adm-links"]);
      setEditing(null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this link permanently?")) return;
    try {
      await adminApi.delete(`/important-links/${id}`);
      toast.success("Link deleted");
      qc.invalidateQueries(["adm-links"]);
    } catch (e) { toast.error("Failed to delete"); }
  };

  const handleMove = async (idx, dir) => {
    const arr = [...links];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    try {
      await adminApi.put("/important-links-reorder", { ids: arr.map(l => l.id) });
      qc.invalidateQueries(["adm-links"]);
    } catch { toast.error("Reorder failed"); }
  };

  const handleToggle = async (link) => {
    const fd = new FormData();
    fd.append("active", !link.active);
    try {
      await adminApi.put(`/important-links/${link.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      qc.invalidateQueries(["adm-links"]);
      toast.success(link.active ? "Link deactivated" : "Link activated");
    } catch { toast.error("Toggle failed"); }
  };

  return (
    <div>
      <AHeader title="Important Links" subtitle="Manage links shown to all members in their dashboard." testid="admin-important-links-header">
        {!editing && <Btn onClick={() => setEditing("new")} testid="add-link-btn"><Plus className="h-4 w-4" /> Add Link</Btn>}
      </AHeader>

      {editing ? (
        <Panel title={editing === "new" ? "New Link" : "Edit Link"} className="p-5">
          <LinkForm initial={editing === "new" ? null : editing} onSave={handleSave} onCancel={() => setEditing(null)} saving={saving} />
        </Panel>
      ) : (
        <Panel title={`All Links · ${links.length}`} className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center"><div className="h-8 w-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : links.length ? (
            <div className="divide-y divide-white/5">
              {links.map((link, idx) => (
                <div key={link.id} data-testid={`link-row-${link.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMove(idx, -1)} disabled={idx === 0}
                      className="text-slate-600 hover:text-amber-400 disabled:opacity-20 transition-colors p-0.5">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleMove(idx, 1)} disabled={idx === links.length - 1}
                      className="text-slate-600 hover:text-amber-400 disabled:opacity-20 transition-colors p-0.5">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {link.image_path ? (
                    <img src={`${API_BASE}/api/files/${link.image_path}`} alt=""
                      className="h-12 w-12 rounded-xl object-cover border border-white/10 flex-shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                      <Link2 className="h-5 w-5 text-amber-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm truncate">{link.name}</span>
                      {!link.active && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono-merq uppercase tracking-wide bg-slate-500/10 text-slate-500">
                          <EyeOff className="h-2.5 w-2.5" /> hidden
                        </span>
                      )}
                    </div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-amber-400 truncate block transition-colors">
                      {link.url}
                    </a>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleToggle(link)} data-testid={`toggle-link-${link.id}`}
                      className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-amber-400 transition-colors"
                      title={link.active ? "Deactivate" : "Activate"}>
                      {link.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setEditing(link)} data-testid={`edit-link-${link.id}`}
                      className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-amber-400 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(link.id)} data-testid={`delete-link-${link.id}`}
                      className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-rose-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="No important links yet. Click 'Add Link' to create one." />
          )}
        </Panel>
      )}
    </div>
  );
}
