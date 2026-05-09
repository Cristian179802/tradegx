"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Key, Lock, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Unplug, Plug, Eye, EyeOff, Loader2, RefreshCw, Link2,
  AlertCircle, Wifi, WifiOff,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface IntegrationState {
  service: string;
  isActive: boolean;
  hasKey: boolean;
  maskedKey: string | null;
  config: Record<string, string> | null;
  updatedAt?: string;
}

interface MetaApiAccount {
  id: string;
  name: string;
  login: string;
  server: string;
  platform: string;
  connectionStatus: string;
  balance: number;
  currency: string;
  linkedTradingAccountId: string | null;
}

interface TradingAccount {
  id: string;
  name: string;
  type: string;
  metaApiId: string | null;
}

// ─── Definitions ─────────────────────────────────────────────────────────────

const INTEGRATIONS = [
  {
    id: "metaapi",
    name: "MetaAPI",
    description: "Sincronizare automată tranzacții MT4/MT5 de la broker",
    icon: "🔄",
    available: true,
    fields: [
      {
        key: "apiKey",
        label: "MetaAPI Token",
        placeholder: "Introduceți MetaAPI token-ul",
        type: "password" as const,
        hint: "dashboard.metaapi.cloud → API tokens",
      },
    ],
    docsUrl: "https://metaapi.cloud/docs/client/",
  },
  {
    id: "twelvedata",
    name: "TwelveData",
    description: "Prețuri live, cotații și date de piață în timp real",
    icon: "📊",
    available: true,
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "Introduceți TwelveData API key",
        type: "password" as const,
        hint: "twelvedata.com/account → API key",
      },
    ],
    docsUrl: "https://twelvedata.com/docs",
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    description: "Stocare cloud pentru screenshot-uri tranzacții",
    icon: "📸",
    available: true,
    fields: [
      {
        key: "cloudName",
        label: "Cloud Name",
        placeholder: "ex: dq1234abc",
        type: "text" as const,
        hint: "Cloudinary Dashboard → Cloud Name",
      },
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "123456789012345",
        type: "text" as const,
        hint: "",
      },
      {
        key: "apiSecret",
        label: "API Secret",
        placeholder: "••••••••••••••••",
        type: "password" as const,
        hint: "Nu expune API Secret în cod sau repo public",
      },
    ],
    docsUrl: "https://cloudinary.com/documentation",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Management abonament — gestionat automat de platformă",
    icon: "💳",
    available: false,
    phase: "Phase 5",
    fields: [],
    docsUrl: "https://stripe.com/docs",
  },
];

// ─── MetaAPI Accounts Panel ───────────────────────────────────────────────────

function MetaApiPanel() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<MetaApiAccount[]>([]);
  const [tradingAccounts, setTradingAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [linking, setLinking] = useState<Record<string, string>>({});
  const [daysBack, setDaysBack] = useState<Record<string, number>>({});
  const [syncResults, setSyncResults] = useState<Record<string, string>>({});

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/metaapi/accounts");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAccounts(data.accounts ?? []);
      setTradingAccounts(data.tradingAccounts ?? []);
      // Pre-populate linking state from existing links
      const initial: Record<string, string> = {};
      for (const acc of data.accounts ?? []) {
        if (acc.linkedTradingAccountId) initial[acc.id] = acc.linkedTradingAccountId;
      }
      setLinking(initial);
    } catch {
      toast({ title: "Nu s-au putut încărca conturile MetaAPI", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  async function handleSync(metaApiAccountId: string) {
    const tradingAccountId = linking[metaApiAccountId];
    if (!tradingAccountId) {
      toast({ title: "Selectează un cont TradeGX înainte de sync", variant: "destructive" });
      return;
    }
    setSyncing((p) => ({ ...p, [metaApiAccountId]: true }));
    setSyncResults((p) => ({ ...p, [metaApiAccountId]: "" }));
    try {
      const res = await fetch("/api/integrations/metaapi/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaApiAccountId,
          tradingAccountId,
          daysBack: daysBack[metaApiAccountId] ?? 90,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncResults((p) => ({ ...p, [metaApiAccountId]: data.message }));
      toast({ title: "Sincronizare completă", description: data.message });
    } catch (err: any) {
      toast({ title: "Eroare sync", description: err.message, variant: "destructive" });
    } finally {
      setSyncing((p) => ({ ...p, [metaApiAccountId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="mt-4 space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-zinc-800/40 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className="mt-4 flex items-center gap-2 text-zinc-500 text-sm">
        <AlertCircle className="w-4 h-4" />
        Niciun cont MT4/MT5 găsit în MetaAPI. Adaugă un cont pe{" "}
        <a href="https://app.metaapi.cloud" target="_blank" rel="noopener noreferrer"
          className="text-indigo-400 hover:underline">app.metaapi.cloud</a>.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Conturi MT4/MT5 detectate
        </p>
        <button onClick={loadAccounts} className="text-zinc-600 hover:text-zinc-300 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {accounts.map((acc) => (
        <div key={acc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          {/* Account header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-zinc-100">{acc.name}</p>
                <Badge className={
                  acc.connectionStatus === "CONNECTED"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px]"
                    : "bg-zinc-800 border-zinc-700 text-zinc-500 text-[10px]"
                }>
                  {acc.connectionStatus === "CONNECTED" ? (
                    <><Wifi className="w-2.5 h-2.5 mr-1" />Conectat</>
                  ) : (
                    <><WifiOff className="w-2.5 h-2.5 mr-1" />Deconectat</>
                  )}
                </Badge>
                <Badge className="bg-zinc-800 border-zinc-700 text-zinc-500 text-[10px]">
                  {acc.platform?.toUpperCase() ?? "MT5"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Login: {acc.login} · {acc.server}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-bold text-zinc-100">
                {acc.balance?.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} {acc.currency}
              </p>
            </div>
          </div>

          {/* Link to TradeGX account */}
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs flex items-center gap-1">
              <Link2 className="w-3 h-3" /> Leagă de contul TradeGX
            </Label>
            <select
              value={linking[acc.id] ?? ""}
              onChange={(e) => setLinking((p) => ({ ...p, [acc.id]: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">— Selectează cont —</option>
              {tradingAccounts.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.name} ({ta.type})
                </option>
              ))}
            </select>
          </div>

          {/* Days back + Sync */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-zinc-500 text-xs whitespace-nowrap">Ultimele</Label>
              <select
                value={daysBack[acc.id] ?? 90}
                onChange={(e) => setDaysBack((p) => ({ ...p, [acc.id]: parseInt(e.target.value) }))}
                className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
              >
                <option value={7}>7 zile</option>
                <option value={30}>30 zile</option>
                <option value={90}>90 zile</option>
                <option value={180}>6 luni</option>
                <option value={365}>1 an</option>
              </select>
            </div>

            <Button
              size="sm"
              onClick={() => handleSync(acc.id)}
              disabled={syncing[acc.id] || !linking[acc.id]}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
            >
              {syncing[acc.id] ? (
                <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Se sincronizează...</>
              ) : (
                <><RefreshCw className="w-3 h-3 mr-1.5" />Sync acum</>
              )}
            </Button>

            {syncResults[acc.id] && (
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {syncResults[acc.id]}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TwelveData Status Panel ─────────────────────────────────────────────────

function TwelveDataPanel() {
  const [quote, setQuote] = useState<{ price: string; percent_change: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/integrations/twelvedata/quote?symbols=EUR/USD")
      .then((r) => r.json())
      .then((d) => {
        const q = d.quotes?.["EUR/USD"] ?? d.quotes?.["EURUSD"];
        if (q?.price) setQuote(q);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (!quote) {
    return (
      <div className="mt-3 text-xs text-zinc-500 flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5" />
        Test conexiune eșuat. Verifică API key-ul.
      </div>
    );
  }

  const isPositive = parseFloat(quote.percent_change) >= 0;

  return (
    <div className="mt-3 flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5">
      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      <div>
        <p className="text-xs text-zinc-400">Conexiune verificată — EUR/USD live</p>
        <p className="text-sm font-mono font-bold text-zinc-100">
          {parseFloat(quote.price).toFixed(5)}{" "}
          <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
            {isPositive ? "▲" : "▼"} {Math.abs(parseFloat(quote.percent_change)).toFixed(3)}%
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  state,
  onSave,
  onDisconnect,
}: {
  integration: (typeof INTEGRATIONS)[number];
  state?: IntegrationState;
  onSave: (service: string, data: Record<string, string>) => Promise<void>;
  onDisconnect: (service: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});

  const isConnected = state?.isActive && state?.hasKey;
  const allFilled = integration.fields.every((f) => !!values[f.key]?.trim());

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(integration.id, values);
      setValues({});
      setExpanded(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await onDisconnect(integration.id);
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{integration.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-zinc-100">{integration.name}</p>
              {"phase" in integration && integration.phase && (
                <Badge className="bg-zinc-800 border-zinc-700 text-zinc-500 text-xs">
                  {integration.phase}
                </Badge>
              )}
              {isConnected && (
                <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />Conectat
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{integration.description}</p>
          </div>
        </div>

        {integration.available ? (
          <div className="flex items-center gap-2 shrink-0">
            {isConnected && (
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs h-7"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <><Unplug className="w-3 h-3 mr-1" />Deconectează</>}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-200 h-7 w-7 p-0"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <Badge className="bg-zinc-800/50 border-zinc-700/50 text-zinc-600 text-xs">În curând</Badge>
        )}
      </div>

      {/* ── Connected info bar ── */}
      {isConnected && !expanded && (
        <div className="px-5 pb-3 flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500 bg-zinc-800/50 rounded px-2 py-0.5">
            {state?.maskedKey ?? "••••••••••••"}
          </span>
          {state?.updatedAt && (
            <span className="text-xs text-zinc-600">
              · {new Date(state.updatedAt).toLocaleDateString("ro-RO")}
            </span>
          )}
        </div>
      )}

      {/* ── MetaAPI: show accounts panel when connected ── */}
      {integration.id === "metaapi" && isConnected && !expanded && (
        <div className="px-5 pb-5">
          <MetaApiPanel />
        </div>
      )}

      {/* ── TwelveData: show live quote test when connected ── */}
      {integration.id === "twelvedata" && isConnected && !expanded && (
        <div className="px-5 pb-4">
          <TwelveDataPanel />
        </div>
      )}

      {/* ── Expandable form ── */}
      {expanded && integration.available && (
        <div className="px-5 pb-5 border-t border-zinc-800 pt-4 space-y-4">
          {integration.fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">{field.label}</Label>
              <div className="relative">
                <Input
                  type={field.type === "password" && !showPassword[field.key] ? "password" : "text"}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 pr-10"
                />
                {field.type === "password" && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    onClick={() => setShowPassword((p) => ({ ...p, [field.key]: !p[field.key] }))}
                  >
                    {showPassword[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {field.hint && <p className="text-xs text-zinc-600">{field.hint}</p>}
            </div>
          ))}

          <div className="flex items-center gap-3 pt-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !allFilled}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {saving ? (
                <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Se verifică...</>
              ) : (
                <><Plug className="w-3 h-3 mr-1.5" />Conectează</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-zinc-300"
              onClick={() => { setExpanded(false); setValues({}); }}
            >
              Anulează
            </Button>
            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
            >
              Documentație →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Tab ────────────────────────────────────────────────────────────────

export function ApiKeysTab() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<IntegrationState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/integrations")
      .then((r) => r.json())
      .then((d) => setIntegrations(d.integrations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function getState(service: string) {
    return integrations.find((i) => i.service === service);
  }

  async function handleSave(service: string, values: Record<string, string>) {
    const body: Record<string, unknown> = { service };
    if (service === "cloudinary") {
      body.config = values;
    } else {
      body.apiKey = values.apiKey;
    }

    const res = await fetch("/api/user/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      toast({ title: "Eroare conectare", description: data.error, variant: "destructive" });
      throw new Error(data.error);
    }

    setIntegrations((prev) => {
      const exists = prev.find((i) => i.service === service);
      return exists
        ? prev.map((i) => (i.service === service ? { ...i, ...data.integration } : i))
        : [...prev, data.integration];
    });

    toast({
      title: "Conectat cu succes!",
      description: `${service.charAt(0).toUpperCase() + service.slice(1)} a fost conectat și verificat.`,
    });
  }

  async function handleDisconnect(service: string) {
    const res = await fetch("/api/user/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service, disconnect: true }),
    });
    if (!res.ok) {
      toast({ title: "Eroare la deconectare", variant: "destructive" });
      return;
    }
    setIntegrations((prev) => prev.filter((i) => i.service !== service));
    toast({ title: "Deconectat", description: `${service} a fost deconectat.` });
  }

  const connectedCount = integrations.filter((i) => i.isActive).length;
  const availableCount = INTEGRATIONS.filter((i) => i.available).length;

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
          <Key className="w-4 h-4 text-zinc-400" />
          Chei API și integrări
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Conectează-ți brokerii și serviciile externe. Cheile sunt criptate și mascate după salvare.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-amber-300 text-sm">
            Toate cheile API sunt criptate înainte de stocare și nu sunt vizibile după salvare.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-zinc-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {INTEGRATIONS.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                state={getState(integration.id)}
                onSave={handleSave}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        )}

        {!loading && (
          <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {connectedCount} din {availableCount} conectate
            </div>
            {connectedCount === availableCount && (
              <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs">
                Toate integrările active 🎉
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
