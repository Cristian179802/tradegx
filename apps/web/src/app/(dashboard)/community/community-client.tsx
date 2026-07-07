"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import Link from "next/link";
import {
  Plus, MessageSquare, Loader2, Users,
  X, Sparkles, ChevronRight,
  Globe, Lock, Copy, Check, Crown, Shield, LogIn, Hash,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamSummary {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  avatarUrl: string | null;
  inviteCode: string | null;
  myRole: "OWNER" | "ADMIN" | "MEMBER" | null;
  _count: { members: number; posts: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAM_COLORS = [
  "from-indigo-600 to-violet-600",
  "from-rose-600 to-pink-600",
  "from-emerald-600 to-teal-600",
  "from-amber-600 to-orange-600",
  "from-sky-600 to-cyan-600",
  "from-fuchsia-600 to-purple-600",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null) {
  return (name ?? "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function teamColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
}

// ─── Create Team Modal ────────────────────────────────────────────────────────

function CreateTeamModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (team: TeamSummary) => void;
}) {
  const t = useTranslations("community");
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", description: "", isPublic: true });

  function reset() {
    setForm({ name: "", description: "", isPublic: true });
  }

  async function submit() {
    if (form.name.trim().length < 3) return;
    setSubmitting(true);
    const res = await fetch("/api/community/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim() || null,
        isPublic: form.isPublic,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const team: TeamSummary = {
        id: data.id,
        name: data.name,
        description: data.description ?? null,
        isPublic: data.isPublic,
        avatarUrl: data.avatarUrl ?? null,
        inviteCode: data.inviteCode ?? null,
        myRole: "OWNER",
        _count: { members: data.memberCount ?? data._count?.members ?? 1, posts: data.postCount ?? data._count?.posts ?? 0 },
      };
      onCreated(team);
      reset();
      onClose();
      toast({ title: t("createdToast", { name: team.name }) });
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ title: err.error ?? t("createErr"), variant: "destructive" });
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md gap-0 p-0 overflow-hidden">
        <div className="border-b border-zinc-800 px-6 py-4">
          <DialogTitle className="text-zinc-100 font-bold text-base">{t("modalTitle")}</DialogTitle>
          <p className="text-[11px] text-zinc-600 mt-0.5">{t("modalSub")}</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
              {t("nameLabel")}
            </label>
            <input
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder={t("namePlaceholder")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={50}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
              {t("descLabel")}
            </label>
            <textarea
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder={t("descPlaceholder")}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={300}
            />
          </div>

          {/* Visibility toggle */}
          <div className="flex gap-3">
            <button
              onClick={() => setForm({ ...form, isPublic: true })}
              className={cn(
                "flex-1 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all",
                form.isPublic
                  ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-200"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              )}
            >
              <Globe className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-bold">{t("public")}</p>
                <p className="text-[10px] opacity-70">{t("publicHint")}</p>
              </div>
              {form.isPublic && <Check className="h-3.5 w-3.5 ml-auto text-indigo-400" />}
            </button>
            <button
              onClick={() => setForm({ ...form, isPublic: false })}
              className={cn(
                "flex-1 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all",
                !form.isPublic
                  ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-200"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              )}
            >
              <Lock className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-bold">{t("private")}</p>
                <p className="text-[10px] opacity-70">{t("privateHint")}</p>
              </div>
              {!form.isPublic && <Check className="h-3.5 w-3.5 ml-auto text-indigo-400" />}
            </button>
          </div>

          {!form.isPublic && (
            <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
              <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                {t("inviteNote")}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800 px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => { onClose(); reset(); }} className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800">
            {t("cancel")}
          </Button>
          <Button
            onClick={submit}
            disabled={form.name.trim().length < 3 || submitting}
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-5 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {t("createBtn")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({
  team,
  onJoin,
  joining,
}: {
  team: TeamSummary;
  onJoin?: (teamId: string) => void;
  joining?: boolean;
}) {
  const t = useTranslations("community");
  const [copied, setCopied] = React.useState(false);
  const grad = teamColor(team.name);

  function copyCode() {
    if (!team.inviteCode) return;
    navigator.clipboard.writeText(team.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const roleBadge = team.myRole === "OWNER"
    ? <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full"><Crown className="h-2.5 w-2.5" />{t("owner")}</span>
    : team.myRole === "ADMIN"
    ? <span className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-full"><Shield className="h-2.5 w-2.5" />{t("admin")}</span>
    : null;

  return (
    <div className="group relative bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-200">
      {/* Top color strip */}
      <div className={`h-1 w-full bg-gradient-to-r ${grad}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar letter */}
          <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-black text-lg shrink-0 shadow-lg`}>
            {team.name[0]?.toUpperCase() ?? "T"}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-zinc-100 truncate">{team.name}</h3>
              {roleBadge}
              <span className={cn(
                "inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
                team.isPublic
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  : "text-zinc-500 bg-zinc-800 border border-zinc-700"
              )}>
                {team.isPublic ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                {team.isPublic ? t("publicBadge") : t("privateBadge")}
              </span>
            </div>
            {team.description && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">{team.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                <Users className="h-3 w-3" />
                {t("memberCount", { n: team._count.members })}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                <MessageSquare className="h-3 w-3" />
                {t("postCount", { n: team._count.posts })}
              </span>
            </div>
          </div>
        </div>

        {/* Owner invite code */}
        {team.inviteCode && team.myRole === "OWNER" && (
          <div className="mt-3 flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-3 py-2">
            <Lock className="h-3 w-3 text-zinc-500 shrink-0" />
            <span className="flex-1 text-xs font-mono text-zinc-400 tracking-wider">{team.inviteCode}</span>
            <button
              onClick={copyCode}
              className="text-zinc-600 hover:text-indigo-400 transition-colors"
              title={t("copyCode")}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}

        {/* Action button */}
        <div className="mt-3">
          {team.myRole ? (
            <Link
              href={`/community/teams/${team.id}`}
              className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-xl py-2 transition-all"
            >
              {t("enterCommunity")}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              onClick={() => onJoin?.(team.id)}
              disabled={joining}
              className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl py-2 transition-all disabled:opacity-60"
            >
              {joining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
              {joining ? t("joining") : t("join")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CommunityClient({
  currentUserId,
  stats,
  myTeams: initialMyTeams,
  publicTeams: initialPublicTeams,
}: {
  currentUserId: string;
  stats: { totalUsers: number; totalTeams: number };
  myTeams: TeamSummary[];
  publicTeams: TeamSummary[];
}) {
  const t = useTranslations("community");
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [codeInput, setCodeInput] = React.useState("");
  const [joiningId, setJoiningId] = React.useState<string | null>(null);
  const [joinByCodeLoading, setJoinByCodeLoading] = React.useState(false);
  const [myTeams, setMyTeams] = React.useState(initialMyTeams);
  const [publicTeams, setPublicTeams] = React.useState(initialPublicTeams);

  async function joinTeam(teamId: string) {
    setJoiningId(teamId);
    const res = await fetch(`/api/community/teams/${teamId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const joined = publicTeams.find((t) => t.id === teamId);
      if (joined) {
        setMyTeams((prev) => [...prev, { ...joined, myRole: "MEMBER" as const, inviteCode: null }]);
        setPublicTeams((prev) => prev.filter((t) => t.id !== teamId));
      }
      toast({ title: t("joinedToast") });
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ title: err.error ?? t("joinErr"), variant: "destructive" });
    }
    setJoiningId(null);
  }

  async function joinByCode() {
    const code = codeInput.trim().toUpperCase();
    if (code.length < 6) return;
    setJoinByCodeLoading(true);
    const res = await fetch("/api/community/teams/join-by-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      const data = await res.json();
      const asMyTeam: TeamSummary = {
        id: data.id,
        name: data.name,
        description: data.description ?? null,
        isPublic: data.isPublic,
        avatarUrl: data.avatarUrl ?? null,
        inviteCode: null,
        myRole: "MEMBER",
        _count: data._count ?? { members: 1, posts: 0 },
      };
      setMyTeams((prev) => prev.some((t) => t.id === data.id) ? prev : [...prev, asMyTeam]);
      setPublicTeams((prev) => prev.filter((t) => t.id !== data.id));
      setCodeInput("");
      toast({ title: t("joinedCodeToast", { name: data.name }) });
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ title: err.error ?? t("codeInvalid"), variant: "destructive" });
    }
    setJoinByCodeLoading(false);
  }

  function handleCreated(team: TeamSummary) {
    setMyTeams((prev) => [team, ...prev]);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-900/40 bg-gradient-to-br from-indigo-950/70 via-zinc-900/90 to-violet-950/50 p-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-60 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-32 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full mb-3">
              <span>🌍</span>
              {t("heroBadge")}
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">{t("heroTitle")}</h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
              {t("heroSub")}
            </p>
            <div className="flex items-center gap-5 mt-4">
              <div className="flex items-center gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-zinc-300 font-semibold">{stats.totalUsers.toLocaleString()}</span>
                <span className="text-zinc-600">{t("tradersLabel")}</span>
              </div>
              {stats.totalTeams > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  <span className="text-zinc-300 font-semibold">{stats.totalTeams}</span>
                  <span className="text-zinc-600">{t("communitiesActive")}</span>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={() => setCreateOpen(true)}
            className="shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/20 border-0"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t("createHeroBtn")}
          </Button>
        </div>
      </div>

      {/* ── Join by code ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-indigo-500/50 transition-colors">
        <Hash className="h-4 w-4 text-zinc-600 shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none font-mono tracking-widest uppercase"
          placeholder={t("codePlaceholder")}
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && joinByCode()}
          maxLength={12}
        />
        <button
          onClick={joinByCode}
          disabled={codeInput.trim().length < 6 || joinByCodeLoading}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {joinByCodeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
          {t("joinWithCode")}
        </button>
      </div>

      {/* ── My communities ───────────────────────────────────── */}
      {myTeams.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-zinc-200">{t("myCommunities")}</h2>
            <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded-full">
              {myTeams.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </div>
      )}

      {/* ── Discover ─────────────────────────────────────────── */}
      {publicTeams.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-200">{t("discover")}</h2>
            <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded-full">
              {publicTeams.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {publicTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onJoin={joinTeam}
                joining={joiningId === team.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────── */}
      {myTeams.length === 0 && publicTeams.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-28 text-center">
          <div className="text-6xl mb-4">🏘️</div>
          <p className="text-zinc-400 font-semibold text-xl">{t("emptyTitle")}</p>
          <p className="text-zinc-600 text-sm mt-2 mb-8 max-w-xs mx-auto leading-relaxed">
            {t("emptyBody")}
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t("createFirst")}
          </Button>
        </div>
      )}

      <CreateTeamModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
