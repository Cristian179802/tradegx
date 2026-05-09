"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft, Users, Lock, Globe, Copy, Check, LogOut, Trash2,
  Plus, TrendingUp, MessageSquare, Loader2, ImagePlus, X, ChevronRight,
  Crown, Shield, UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamUser { id: string; name: string | null; image: string | null }
interface ReactionSummary { emoji: string; count: number; reacted: boolean }
interface Post {
  id: string; title: string | null; content: string | null; symbol: string | null;
  tags: string[]; imageUrls: string[]; upvotes: number; createdAt: string;
  user: TeamUser; _count: { comments: number }; reactions: ReactionSummary[];
}
interface Member {
  id: string; userId: string; role: string; joinedAt: string; user: TeamUser;
}
interface Team {
  id: string; name: string; description: string | null; isPublic: boolean;
  inviteCode: string | null; createdAt: string; isMember: boolean;
  isOwner: boolean; role: string | null; members: Member[]; posts: Post[];
}

const EMOJIS = ["🔥","🚀","💡","💯","👀","❤️"];
const SUGGESTED_TAGS = ["SMC","ICT","OB","FVG","BOS","CHoCH","LONG","SHORT","H1","H4","M15"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "acum";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}z`;
}

function UserAvatar({ user, size = 8 }: { user: TeamUser; size?: number }) {
  const initials = (user.name ?? "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <Avatar className={`h-${size} w-${size} shrink-0`}>
      <AvatarImage src={user.image ?? undefined} />
      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold">{initials}</AvatarFallback>
    </Avatar>
  );
}

// ─── Post Card (same design as community feed) ─────────────────────────────────

function PostCard({ post, onReact, onDelete, currentUserId }: {
  post: Post; onReact: (id: string, e: string) => void; onDelete: (id: string) => void; currentUserId: string;
}) {
  const map = Object.fromEntries(post.reactions.map((r) => [r.emoji, r]));
  return (
    <article className="group bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <UserAvatar user={post.user} size={9} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-zinc-200">{post.user.name ?? "Trader"}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-xs text-zinc-600">{timeAgo(post.createdAt)}</span>
              {post.symbol && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                  <TrendingUp className="h-2.5 w-2.5" />{post.symbol}
                </span>
              )}
            </div>
          </div>
          {post.user.id === currentUserId && (
            <button onClick={() => onDelete(post.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Link href={`/community/${post.id}`} className="block">
          {post.title && <h3 className="text-[15px] font-bold text-zinc-100 mb-1.5 line-clamp-2">{post.title}</h3>}
          <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">{post.content ?? ""}</p>
          {post.imageUrls.length > 0 && (
            <div className="mt-3 rounded-xl overflow-hidden border border-zinc-700/50">
              <img src={post.imageUrls[0]} alt="" className="w-full max-h-60 object-cover" />
            </div>
          )}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.map((t) => <span key={t} className="text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700/50 px-2 py-0.5 rounded-full">#{t}</span>)}
            </div>
          )}
        </Link>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800/50">
          <div className="flex gap-1.5 flex-wrap">
            {EMOJIS.map((emoji) => {
              const r = map[emoji];
              return (
                <button key={emoji} onClick={() => onReact(post.id, emoji)}
                  className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all",
                    r?.reacted ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200" : "bg-zinc-800/70 border-zinc-700/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300")}>
                  {emoji}{r?.count ? <span>{r.count}</span> : null}
                </button>
              );
            })}
          </div>
          <Link href={`/community/${post.id}`} className="ml-auto flex items-center gap-1 text-xs text-zinc-600 hover:text-indigo-400 transition-colors">
            <MessageSquare className="h-3.5 w-3.5" />{post._count.comments}<ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Create Post in Team ───────────────────────────────────────────────────────

function CreatePostInTeam({ teamId, onCreated }: { teamId: string; onCreated: (p: Post) => void }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", content: "", symbol: "", tags: [] as string[], imageUrls: [] as string[] });
  const [tagInput, setTagInput] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean && !form.tags.includes(clean) && form.tags.length < 5) setForm((f) => ({ ...f, tags: [...f.tags, clean] }));
  }

  async function uploadFile(file: File) {
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) { const { url } = await res.json(); setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, url] })); }
    else toast({ title: "Upload eșuat", variant: "destructive" });
    setUploading(false);
  }

  async function submit() {
    if (!form.title.trim() || form.content.trim().length < 10) return;
    setSubmitting(true);
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title.trim(), content: form.content.trim(), symbol: form.symbol.trim().toUpperCase() || null, tags: form.tags, imageUrls: form.imageUrls, teamId }),
    });
    if (res.ok) {
      const post = await res.json(); onCreated(post);
      setForm({ title: "", content: "", symbol: "", tags: [], imageUrls: [] }); setOpen(false);
      toast({ title: "Postare publicată! 🚀" });
    } else toast({ title: "Eroare", variant: "destructive" });
    setSubmitting(false);
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full flex items-center gap-3 bg-zinc-900/50 border border-dashed border-zinc-700 hover:border-indigo-500/50 rounded-2xl px-5 py-4 text-sm text-zinc-500 hover:text-zinc-300 transition-all">
      <Plus className="h-4 w-4" /> Postează ceva în această comunitate...
    </button>
  );

  return (
    <div className="bg-zinc-900 border border-indigo-500/30 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2 bg-zinc-800/70 border border-zinc-700 rounded-xl px-4 py-2.5">
        <TrendingUp className="h-4 w-4 text-zinc-500" />
        <input className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none" placeholder="Simbol (EURUSD...)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} />
      </div>
      <input className="w-full bg-transparent border-b border-zinc-800 pb-2 text-lg font-bold text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-600 transition-colors" placeholder="Titlu postare..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea className="w-full bg-transparent text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed min-h-[100px]" placeholder="Descrie setup-ul sau ideea ta..." rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />

      {/* Tags: custom input + suggestions */}
      <div className="space-y-2">
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full">
                #{t} <button onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))}><X className="h-2.5 w-2.5 hover:text-white" /></button>
              </span>
            ))}
          </div>
        )}
        {form.tags.length < 5 && (
          <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-1.5">
            <input className="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none" placeholder="Scrie un tag (8ema, rsi, ob...) și apasă Enter"
              value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); setTagInput(""); } }} />
            {tagInput && <button onClick={() => { addTag(tagInput); setTagInput(""); }} className="text-[10px] text-indigo-400 hover:text-indigo-300">+ Adaugă</button>}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_TAGS.filter((t) => !form.tags.includes(t)).slice(0, 8).map((t) => (
            <button key={t} onClick={() => addTag(t)} className="text-[10px] text-zinc-600 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-400 px-2 py-0.5 rounded-full transition-colors">+{t}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => fileRef.current?.click()} disabled={uploading || form.imageUrls.length >= 4} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? "Se încarcă..." : `Imagini (${form.imageUrls.length}/4)`}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={async (e) => { for (const f of Array.from(e.target.files ?? [])) await uploadFile(f); e.target.value = ""; }} />
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-zinc-500">Anulează</Button>
          <Button size="sm" onClick={submit} disabled={submitting || form.title.trim().length < 3 || form.content.trim().length < 10}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white">
            {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Publică 🚀
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main TeamClient ───────────────────────────────────────────────────────────

export function TeamClient({ team: initial, currentUserId }: { team: Team; currentUserId: string }) {
  const { toast } = useToast();
  const [team, setTeam] = React.useState(initial);
  const [copied, setCopied] = React.useState(false);
  const [joining, setJoining] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  function copyCode() {
    if (!team.inviteCode) return;
    navigator.clipboard.writeText(team.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Cod copiat! 📋" });
  }

  async function joinTeam() {
    setJoining(true);
    const res = await fetch(`/api/community/teams/${team.id}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (res.ok) {
      setTeam((t) => ({ ...t, isMember: true, role: "MEMBER", members: [...t.members, { id: Date.now().toString(), userId: currentUserId, role: "MEMBER", joinedAt: new Date().toISOString(), user: { id: currentUserId, name: "Tu", image: null } }] }));
      toast({ title: "Te-ai alăturat comunității! 🎉" });
    } else toast({ title: "Eroare la alăturare", variant: "destructive" });
    setJoining(false);
  }

  async function leaveTeam() {
    if (!confirm("Ești sigur că vrei să părăsești această comunitate?")) return;
    setLeaving(true);
    const res = await fetch(`/api/community/teams/${team.id}/leave`, { method: "POST" });
    if (res.ok) { setTeam((t) => ({ ...t, isMember: false, role: null, members: t.members.filter((m) => m.userId !== currentUserId) })); toast({ title: "Ai părăsit comunitatea" }); }
    else toast({ title: "Eroare", variant: "destructive" });
    setLeaving(false);
  }

  async function deleteTeam() {
    if (!confirm("Ești sigur? Toate postările din această comunitate vor fi șterse.")) return;
    setDeleting(true);
    const res = await fetch(`/api/community/teams/${team.id}`, { method: "DELETE" });
    if (res.ok) window.location.href = "/community";
    else { toast({ title: "Eroare la ștergere", variant: "destructive" }); setDeleting(false); }
  }

  async function toggleReaction(postId: string, emoji: string) {
    const res = await fetch(`/api/community/posts/${postId}/react`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emoji }) });
    if (!res.ok) return;
    const { action } = await res.json();
    setTeam((t) => ({
      ...t,
      posts: t.posts.map((p) => {
        if (p.id !== postId) return p;
        const existing = p.reactions.find((r) => r.emoji === emoji);
        let reactions: ReactionSummary[];
        if (action === "added") {
          reactions = existing ? p.reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r) : [...p.reactions, { emoji, count: 1, reacted: true }];
        } else {
          reactions = p.reactions.map((r) => r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1), reacted: false } : r);
        }
        return { ...p, reactions };
      }),
    }));
  }

  async function deletePost(postId: string) {
    if (!confirm("Ștergi această postare?")) return;
    const res = await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
    if (res.ok) setTeam((t) => ({ ...t, posts: t.posts.filter((p) => p.id !== postId) }));
  }

  const roleIcon = (role: string) => role === "OWNER" ? <Crown className="h-3 w-3 text-amber-400" /> : role === "ADMIN" ? <Shield className="h-3 w-3 text-indigo-400" /> : null;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Back */}
      <Link href="/community" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Înapoi la comunitate
      </Link>

      {/* ── Team Header Card ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #4f46e5 0%, transparent 50%)" }} />
        <div className="relative">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-black shrink-0 shadow-lg shadow-indigo-500/20">
              {team.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl font-black text-zinc-100">{team.name}</h1>
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  team.isPublic ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" : "text-amber-400 bg-amber-500/10 border-amber-500/25")}>
                  {team.isPublic ? <><Globe className="h-2.5 w-2.5" /> Publică</> : <><Lock className="h-2.5 w-2.5" /> Privată</>}
                </span>
              </div>
              {team.description && <p className="text-sm text-zinc-400 leading-relaxed">{team.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {team.members.length} membri</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {team.posts.length} postări</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!team.isMember && (
                <Button onClick={joinTeam} disabled={joining} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-3.5 w-3.5 mr-1.5" />Alătură-te</>}
                </Button>
              )}
              {team.isMember && !team.isOwner && (
                <Button onClick={leaveTeam} disabled={leaving} variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40">
                  {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogOut className="h-3.5 w-3.5 mr-1.5" />Ieși</>}
                </Button>
              )}
              {team.isOwner && (
                <Button onClick={deleteTeam} disabled={deleting} variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10">
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>

          {/* Invite code (owner only) */}
          {team.isOwner && team.inviteCode && (
            <div className="mt-4 flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3">
              <div className="flex-1">
                <p className="text-[10px] text-zinc-500 mb-0.5">Cod de invitație — trimite-l membrilor</p>
                <p className="text-sm font-mono font-bold text-amber-300 tracking-widest">{team.inviteCode}</p>
              </div>
              <button onClick={copyCode} className={cn("flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all",
                copied ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700")}>
                {copied ? <><Check className="h-3.5 w-3.5" /> Copiat!</> : <><Copy className="h-3.5 w-3.5" /> Copiază</>}
              </button>
            </div>
          )}

          {/* Members preview */}
          <div className="mt-4 flex items-center gap-1">
            {team.members.slice(0, 8).map((m) => (
              <div key={m.id} className="relative" title={`${m.user.name ?? "Trader"} — ${m.role}`}>
                <UserAvatar user={m.user} size={7} />
                {(m.role === "OWNER" || m.role === "ADMIN") && (
                  <span className="absolute -bottom-0.5 -right-0.5">{roleIcon(m.role)}</span>
                )}
              </div>
            ))}
            {team.members.length > 8 && (
              <span className="text-xs text-zinc-600 ml-2">+{team.members.length - 8} membri</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Posts feed ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400">Postări în comunitate</h2>
        </div>

        {team.isMember && (
          <CreatePostInTeam
            teamId={team.id}
            onCreated={(p) => setTeam((t) => ({ ...t, posts: [p, ...t.posts] }))}
          />
        )}

        {team.posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-zinc-400 font-semibold">Nicio postare încă</p>
            <p className="text-zinc-600 text-sm mt-1">{team.isMember ? "Fii primul care postează!" : "Alătură-te pentru a posta."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {team.posts.map((post) => (
              <PostCard key={post.id} post={post} onReact={toggleReaction} onDelete={deletePost} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
