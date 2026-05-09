"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Download, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function PrivacyTab() {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch("/api/user/export-data");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TradeGX-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complet", description: "Datele tale au fost descărcate." });
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut exporta.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== "STERGE CONTUL") return;
    setIsDeleting(true);

    try {
      const res = await fetch("/api/user/delete-account", { method: "DELETE" });
      if (!res.ok) throw new Error();
      await signOut({ redirect: false });
      router.push("/?deleted=true");
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut șterge contul.", variant: "destructive" });
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* GDPR Export */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-base">Export date (GDPR)</CardTitle>
          <CardDescription className="text-zinc-500">
            Descarcă toate datele tale conform GDPR. Include tranzacții, jurnal, setări și contul.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Descarcă datele mele
          </Button>
          <p className="text-xs text-zinc-600 mt-3">
            Fișierul JSON va conține toate datele asociate contului tău.
          </p>
        </CardContent>
      </Card>

      {/* Delete account */}
      <Card className="bg-zinc-900/50 border-rose-500/10 border">
        <CardHeader>
          <CardTitle className="text-rose-400 text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Zona periculoasă
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Aceste acțiuni sunt ireversibile. Procedează cu atenție.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-200">Ștergere cont</p>
              <p className="text-xs text-zinc-500 mt-1">
                Șterge permanent contul tău și toate datele asociate. Nu se poate recupera.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 shrink-0"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Șterge cont
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Confirmare ștergere cont
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Aceasta va șterge permanent contul tău, toate tranzacțiile, jurnalul și datele asociate.
              <strong className="text-white block mt-2">Această acțiune nu poate fi anulată.</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              Scrie <strong className="text-white">STERGE CONTUL</strong> pentru a confirma:
            </p>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="STERGE CONTUL"
              className="bg-zinc-950 border-zinc-700 text-white"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Anulează
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== "STERGE CONTUL" || isDeleting}
              className="bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Șterge permanent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
