"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, Trash2, ZoomIn, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Screenshot {
  id: string;
  url: string;
  type: string;
}

const TYPE_LABELS: Record<string, string> = {
  ENTRY: "Intrare",
  EXIT: "Ieșire",
  ANALYSIS: "Analiză",
};

const TYPE_COLORS: Record<string, string> = {
  ENTRY: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  EXIT: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  ANALYSIS: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export function ScreenshotGallery({
  tradeId,
  initial,
}: {
  tradeId: string;
  initial: Screenshot[];
}) {
  const { toast } = useToast();
  const [screenshots, setScreenshots] = React.useState<Screenshot[]>(initial);
  const [uploading, setUploading] = React.useState(false);
  const [lightbox, setLightbox] = React.useState<string | null>(null);
  const [uploadType, setUploadType] = React.useState<"ENTRY" | "EXIT" | "ANALYSIS">("ENTRY");
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Format neacceptat", description: "Folosește JPEG, PNG sau WEBP", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Fișier prea mare", description: "Maxim 8 MB", variant: "destructive" });
      return;
    }
    if (screenshots.length >= 5) {
      toast({ title: "Maxim 5 screenshot-uri per trade", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(`/api/trades/${tradeId}/screenshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mimeType: file.type, type: uploadType }),
      });

      if (res.ok) {
        const shot = await res.json();
        setScreenshots((prev) => [...prev, shot]);
        toast({ title: "Screenshot adăugat" });
      } else {
        const err = await res.json();
        toast({ title: "Eroare upload", description: err.error, variant: "destructive" });
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deleteScreenshot(id: string) {
    const res = await fetch(`/api/trades/${tradeId}/screenshots/${id}`, { method: "DELETE" });
    if (res.ok) {
      setScreenshots((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Screenshot șters" });
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value as typeof uploadType)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="ENTRY">Intrare</option>
          <option value="EXIT">Ieșire</option>
          <option value="ANALYSIS">Analiză</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-700 text-zinc-400 hover:text-zinc-100 text-xs h-8"
          disabled={uploading || screenshots.length >= 5}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5 mr-1.5" />
          )}
          {uploading ? "Se încarcă..." : "Adaugă screenshot"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {screenshots.length > 0 && (
          <span className="text-xs text-zinc-600">{screenshots.length}/5</span>
        )}
      </div>

      {/* Gallery grid */}
      {screenshots.length === 0 ? (
        <div
          className="border border-dashed border-zinc-800 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-700 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <ImageIcon className="h-6 w-6 text-zinc-700 mx-auto mb-1.5" />
          <p className="text-xs text-zinc-600">Niciun screenshot. Click pentru a adăuga.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {screenshots.map((shot) => (
            <div
              key={shot.id}
              className="relative group rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video"
            >
              <Image
                src={shot.url}
                alt={`Screenshot ${shot.type}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  className="h-7 w-7 rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-300 hover:text-white"
                  onClick={() => setLightbox(shot.url)}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  className="h-7 w-7 rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-300 hover:text-rose-400"
                  onClick={() => deleteScreenshot(shot.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="absolute top-1.5 left-1.5">
                <Badge className={cn("text-[10px] py-0 px-1.5 border", TYPE_COLORS[shot.type] ?? TYPE_COLORS.ENTRY)}>
                  {TYPE_LABELS[shot.type] ?? shot.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image src={lightbox} alt="Screenshot" fill className="object-contain" sizes="100vw" />
          </div>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
