"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, Info, X } from "lucide-react";

interface Account {
  id: string;
  name: string;
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Account[];
  defaultAccountId?: string;
}

export function ImportDialog({ open, onClose, onSuccess, accounts, defaultAccountId }: ImportDialogProps) {
  const { toast } = useToast();
  const [accountId, setAccountId] = React.useState(defaultAccountId ?? accounts[0]?.id ?? "");

  // Sync accountId when defaultAccountId changes (e.g. user switches account filter before opening)
  React.useEffect(() => {
    if (open) {
      setAccountId(defaultAccountId ?? accounts[0]?.id ?? "");
    }
  }, [open, defaultAccountId, accounts]);
  const [csvContent, setCsvContent] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [fileError, setFileError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ imported: number; errors: number } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError("");
    setResult(null);

    // Block non-CSV files
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "txt") {
      setFileError(
        `Fișierul „${file.name}" nu este suportat. Ai nevoie de un fișier .CSV exportat din MT4 sau MT5.`
      );
      setFileName("");
      setCsvContent("");
      // Reset input
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      // Quick sanity check — if it looks like binary/PDF, reject
      if (content.startsWith("%PDF") || content.includes("\x00")) {
        setFileError("Fișierul pare a fi un PDF sau binar, nu CSV. Exportă din MT4/MT5 ca fișier .CSV.");
        setFileName("");
        setCsvContent("");
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      setCsvContent(content);
    };
    reader.readAsText(file, "UTF-8");
  }

  function clearFile() {
    setFileName("");
    setCsvContent("");
    setFileError("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleImport() {
    if (!accountId || !csvContent) {
      toast({
        title: "Eroare",
        description: "Selectează un cont și un fișier CSV valid",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/trades/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, csvContent }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Eroare import", description: data.error, variant: "destructive" });
        return;
      }

      setResult({ imported: data.imported, errors: data.errors });
      if (data.imported > 0) {
        toast({
          title: "Import complet",
          description: `${data.imported} trade-uri importate${data.errors > 0 ? `, ${data.errors} omise` : ""}.`,
        });
        onSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setCsvContent("");
    setFileName("");
    setFileError("");
    setResult(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Import CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account selector */}
          <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Trade-urile vor fi importate în contul:
            </label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="bg-zinc-900 border-zinc-600 text-zinc-100 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-zinc-100">
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-zinc-500 mt-1.5">
              ⚠️ Asigură-te că selectezi contul corect înainte de import.
            </p>
          </div>

          {/* How to export — instructions */}
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-indigo-300">Cum exporti din MT4/MT5?</span>
            </div>
            <ol className="text-xs text-zinc-400 space-y-1 pl-4 list-decimal">
              <li>Deschide <span className="text-zinc-200 font-medium">MetaTrader 5</span></li>
              <li>View → Terminal → tab <span className="text-zinc-200 font-medium">„History"</span></li>
              <li>Click dreapta → <span className="text-zinc-200 font-medium">„Report"</span> → <span className="text-zinc-200 font-medium">„Open XML (Excel)"</span></li>
              <li>În Excel: File → Save As → alege tipul <span className="text-zinc-200 font-medium">CSV (Comma delimited)</span></li>
              <li>Uploadează fișierul <span className="text-zinc-200 font-medium">.csv</span> rezultat</li>
            </ol>
            <p className="text-[10px] text-amber-500/80 mt-1.5">
              ⚠️ „Save as Report" generează un fișier HTML interactiv fără trade-uri individuale — nu funcționează pentru import.
            </p>
          </div>

          {/* File upload */}
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-2">
              Fișier CSV (MT4/MT5/cTrader)
            </label>

            {fileName ? (
              <div className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3">
                <FileText className="h-5 w-5 text-indigo-400 shrink-0" />
                <span className="text-sm text-zinc-300 flex-1 truncate">{fileName}</span>
                <button onClick={clearFile} className="text-zinc-600 hover:text-zinc-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500/60 transition-colors"
              >
                <Upload className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Click pentru a selecta fișierul CSV</p>
                <p className="text-xs text-zinc-600 mt-1">Acceptat: .csv, .txt — NU pdf, html, xlsx</p>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {/* File error */}
          {fileError && (
            <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-3">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 leading-relaxed">{fileError}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-3 flex items-center gap-3 ${
              result.imported > 0
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : "bg-rose-500/10 border border-rose-500/20"
            }`}>
              {result.imported > 0 ? (
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <div className="text-sm">
                {result.imported > 0 ? (
                  <span className="text-emerald-400 font-medium">
                    {result.imported} trade-uri importate cu succes
                  </span>
                ) : (
                  <span className="text-rose-400 font-medium">
                    0 trade-uri importate — fișierul nu este în format MT4/MT5
                  </span>
                )}
                {result.errors > 0 && (
                  <span className="text-zinc-500 ml-2 text-xs">{result.errors} rânduri omise</span>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-zinc-600">
            Trade-urile deja importate (după Ticket ID) vor fi omise automat.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-zinc-700 text-zinc-300"
          >
            {result?.imported ? "Închide" : "Anulează"}
          </Button>
          {!result?.imported && (
            <Button
              onClick={handleImport}
              disabled={isLoading || !csvContent || !!fileError}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? "Se importă..." : "Importă"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
