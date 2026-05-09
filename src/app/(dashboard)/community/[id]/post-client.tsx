"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft, Send, Trash2, TrendingUp, MessageSquare, Loader2, X, ChevronLeft,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface ReactionSummary {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: PostUser;
}

interface Post {
  id: string;
  title: string | null;
  content: string | null;
  symbol: string | null;
  tags: string[];
  imageUrls: string[];
  upvotes: number;
  createdAt: string;
  user: PostUser;
  reactions: ReactionSummary[];
  comments: Comment[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJIS: { emoji: string; label: string }[] = [
  { emoji: "🔥", label: "Hot" },
  { emoji: "🚀", label: "Bullish" },
  { emoji: "💡", label: "Idee" },
  { emoji: "💯", label: "Perfect" },
  { emoji: "👀", label: "Urmăresc" },
  { emoji: "❤️", label: "Apreciez" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "acum";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} zile`;
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

function getInitials(name: string | null) {
  return (name ?? "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserAvatar({ user, size = 9 }: { user: PostUser; size?: number }) {
  return (
    <Avatar className={`h-${size} w-${size} shrink-0`}>
      <AvatarImage src={user.image ?? undefined} />
      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold">
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function ImageLightbox({
  urls,
  onClose,
  initial,
}: {
  urls: string[];
  onClose: () => void;
  initial: number;
}) {
  const [idx, setIdx] = React.useState(initial);
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, urls.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, urls.length]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/60 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      {urls.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.max(i - 1, 0)); }}
            disabled={idx === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.min(i + 1, urls.length - 1)); }}
            disabled={idx === urls.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5 rotate-180" />
          </button>
        </>
      )}
      <img
        src={urls[idx]}
        alt="chart"
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      {urls.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={cn("w-1.5 h-1.5 rounded-full transition-all", i === idx ? "bg-white" : "bg-white/30")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostImages({ urls }: { urls: string[] }) {
  const [lightbox, setLightbox] = React.useState<number | null>(null);
  if (!urls.length) return null;

  return (
    <>
      {urls.length === 1 ? (
        <div
          className="mt-4 rounded-xl overflow-hidden border border-zinc-700/50 cursor-zoom-in"
          onClick={() => setLightbox(0)}
        >
          <img src={urls[0]} alt="chart" className="w-full max-h-[400px] object-cover" />
        </div>
      ) : (
        <div
          className={cn(
            "mt-4 grid gap-1 rounded-xl overflow-hidden",
            urls.length === 2 ? "grid-cols-2" : urls.length === 3 ? "grid-cols-3" : "grid-cols-2"
          )}
        >
          {urls.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden bg-zinc-800 cursor-zoom-in"
              onClick={() => setLightbox(i)}
            >
              <img src={url} alt="chart" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              {i === 3 && urls.length > 4 && (
                <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">+{urls.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {lightbox !== null && (
        <ImageLightbox urls={urls} onClose={() => setLightbox(null)} initial={lightbox} />
      )}
    </>
  );
}

function ReactionBar({
  reactions,
  postId,
  onReact,
}: {
  reactions: ReactionSummary[];
  postId: string;
  onReact: (emoji: string) => void;
}) {
  const map = Object.fromEntries(reactions.map((r) => [r.emoji, r]));
  const totalReactions = reactions.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {EMOJIS.map(({ emoji, label }) => {
          const r = map[emoji];
          const count = r?.count ?? 0;
          const reacted = r?.reacted ?? false;
          return (
            <button
              key={emoji}
              title={label}
              onClick={() => onReact(emoji)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all duration-150 select-none font-medium",
                reacted
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200 shadow-sm shadow-indigo-500/10"
                  : "bg-zinc-800/70 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-600"
              )}
            >
              <span className="text-base">{emoji}</span>
              {count > 0 && <span className="tabular-nums text-xs">{count}</span>}
            </button>
          );
        })}
      </div>
      {totalReactions > 0 && (
        <p className="text-[11px] text-zinc-600">
          {totalReactions} {totalReactions === 1 ? "reacție" : "reacții"} totale
        </p>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
}: {
  comment: Comment;
  currentUserId: string;
}) {
  return (
    <div className="flex gap-3">
      <UserAvatar user={comment.user} size={8} />
      <div className="flex-1 min-w-0">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-zinc-300">
              {comment.user.name ?? "Trader"}
            </span>
            {comment.user.id === currentUserId && (
              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">
                Tu
              </span>
            )}
            <span className="text-[10px] text-zinc-600 ml-auto">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PostClient({
  post: initial,
  currentUserId,
}: {
  post: Post;
  currentUserId: string;
}) {
  const { toast } = useToast();
  const [post, setPost] = React.useState(initial);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const isOwner = post.user.id === currentUserId;

  async function toggleReaction(emoji: string) {
    const res = await fetch(`/api/community/posts/${post.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) return;
    const { action } = await res.json();

    setPost((p) => {
      const existing = p.reactions.find((r) => r.emoji === emoji);
      let newReactions: ReactionSummary[];
      if (action === "added") {
        if (existing) {
          newReactions = p.reactions.map((r) =>
            r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r
          );
        } else {
          newReactions = [...p.reactions, { emoji, count: 1, reacted: true }];
        }
      } else {
        newReactions = p.reactions.map((r) =>
          r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1), reacted: false } : r
        );
      }
      return { ...p, reactions: newReactions };
    });
  }

  async function submitComment() {
    const trimmed = comment.trim();
    if (!trimmed) return;
    setSubmitting(true);
    const res = await fetch(`/api/community/posts/${post.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    });
    if (res.ok) {
      const newComment = await res.json();
      setPost((p) => ({
        ...p,
        comments: [
          ...p.comments,
          { ...newComment, createdAt: new Date(newComment.createdAt).toISOString() },
        ],
      }));
      setComment("");
    } else {
      toast({ title: "Eroare la trimitere", variant: "destructive" });
    }
    setSubmitting(false);
  }

  async function deletePost() {
    if (!confirm("Ești sigur că vrei să ștergi această postare?")) return;
    setDeleting(true);
    const res = await fetch(`/api/community/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/community";
    } else {
      toast({ title: "Eroare la ștergere", variant: "destructive" });
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Back nav */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Înapoi la comunitate
      </Link>

      {/* ── Post card ───────────────────────────────────────── */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Card header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <UserAvatar user={post.user} size={10} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-zinc-200">{post.user.name ?? "Trader"}</span>
                <span className="text-zinc-700">·</span>
                <span className="text-xs text-zinc-500">{timeAgo(post.createdAt)}</span>
                {post.symbol && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                      <TrendingUp className="h-2.5 w-2.5" />
                      {post.symbol}
                    </span>
                  </>
                )}
              </div>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={deletePost}
                disabled={deleting}
                className="h-8 w-8 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
                title="Șterge postarea"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* Title */}
          {post.title && (
            <h1 className="text-xl font-black text-zinc-100 mt-4 mb-3 leading-snug">{post.title}</h1>
          )}

          {/* Content */}
          <p className="text-[15px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{post.content ?? ""}</p>

          {/* Images */}
          <PostImages urls={post.imageUrls} />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium text-zinc-500 bg-zinc-800 border border-zinc-700/50 px-2.5 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reaction bar */}
        <div className="px-6 py-4 border-t border-zinc-800/60">
          <ReactionBar reactions={post.reactions} postId={post.id} onReact={toggleReaction} />
        </div>

        {/* Comment count */}
        <div className="px-6 py-3 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-500">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>
            {post.comments.length === 0
              ? "Niciun răspuns încă — fii primul!"
              : `${post.comments.length} ${post.comments.length === 1 ? "răspuns" : "răspunsuri"}`}
          </span>
        </div>
      </div>

      {/* ── Reply form ──────────────────────────────────────── */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-400">Lasă un răspuns</h3>
        <textarea
          ref={textareaRef}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none transition-colors leading-relaxed"
          placeholder="Scrie un comentariu, întrebare sau analiză..."
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitComment();
          }}
        />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-zinc-700">Ctrl+Enter pentru a trimite rapid</p>
          <Button
            onClick={submitComment}
            disabled={submitting || !comment.trim()}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Trimite
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Comments thread ─────────────────────────────────── */}
      {post.comments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2 px-1">
            <MessageSquare className="h-4 w-4" />
            Răspunsuri ({post.comments.length})
          </h3>
          <div className="space-y-2.5">
            {post.comments.map((c) => (
              <CommentItem key={c.id} comment={c} currentUserId={currentUserId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
