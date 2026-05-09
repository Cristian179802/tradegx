"use client";

import { useState, useEffect } from "react";
import {
  Key, Lock, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  RefreshCw, Unplug, Plug, Eye, EyeOff, Loader2
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

// ─── Integration Definitions ─────────────────────────────────────────────────

const INTEGRATIONS = [
  {
    id: "metaapi",
    name: "MetaAPI",
    description: "Sincronizare automată tranzacții MT4/MT5 de la broker",
    icon: "🔄",
    phase: null,
    available: true,
    fields: [
      {
        key: "apiKey",
        label: "MetaAPI Token",
        placeholder: "Introduceți MetaAPI token-ul",
        type: "password" as const,
        hint: "Găsește token-ul în dashboard.metaapi.cloud → API tokens",
      },
    ],
    docsUrl: "https://metaapi.cloud/docs/client/",
    color: "indigo",
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    description: "Stocare cloud pentru screenshot-uri tranzacții",
    icon: "📸",
    phase: null,
    available: true,
    fields: [
      {
        key: "cloudName",
        label: "Cloud Name",
        placeholder: "ex: dq1234abc",
        type: "text" as const,
        hint: "Găsit în Cloudinary Dashboard → Cloud Name",
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
    color: "sky",
  },
  {
    id: "twelvedata",
    name: "TwelveData",
    description: "Date de piață în timp real (prețuri, indicatori)",
    icon: "📊",
    phase: "Phase 4",
    available: false,
    fields: [],
    docsUrl: "https://twelvedata.com/docs",
    color: "violet",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Management abonament — gestionat automat de platformă",
    icon: "💳",
    phase: "Phase 5",
    available: false,
    fields: [],
    docsUrl: "https://stripe.com/docs",
    color: "purple",
  },
];

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
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{integration.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-zinc-100">{integration.name}</p>
              {integration.phase && (
                <Badge className="bg-zinc-800 border-zinc-700 text-zinc-500 text-xs">
                  {integration.phase}
                </Badge>
              )}
              {isConnected && (
                <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Conectat
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{integration.description}</p>
          </div>
        </div>

        {integration.available && (
          <div className="flex items-center gap-2">
            {isConnected && (
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unplug className="w-3 h-3 mr-1" />}
                Deconectează
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-200"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {!integration.available && (
          <Badge className="bg-zinc-800/50 border-zinc-700/50 text-zinc-600 text-xs">
            În curând
          </Badge>
        )}
      </div>

      {/* Connected info */}
      {isConnected && !expanded && (
        <div className="px-5 pb-3 flex items-center gap-2">
          <div className="text-xs text-zinc-500 font-mono bg-zinc-800/50 rounded px-2 py-1">
            {state?.maskedKey ?? "••••••••••••"}
          </div>
          {state?.updatedAt && (
            <span className="text-xs text-zinc-600">
              Actualizat {new Date(state.updatedAt).toLocaleDateString("ro-RO")}
            </span>
          )}
        </div>
      )}

      {/* Expandable form */}
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
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 pr-10"
                />
                {field.type === "password" && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    onClick={() =>
                      setShowPassword((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                    }
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
              disabled={saving || integration.fields.some((f) => !values[f.key]?.trim())}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {saving ? (
                <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Se verifică...</>
              ) : (
                <><Plug className="w-3 h-3 mr-1.5" /> Conectează</>
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
      toast({ title: "Eroare", description: data.error, variant: "destructive" });
      throw new Error(data.error);
    }

    setIntegrations((prev) => {
      const existing = prev.find((i) => i.service === service);
      if (existing) {
        return prev.map((i) => (i.service === service ? { ...i, ...data.integration } : i));
      }
      return [...prev, data.integration];
    });

    toast({
      title: "Conectat cu succes!",
      description: `${service.charAt(0).toUpperCase() + service.slice(1)} a fost conectat.`,
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

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
          <Key className="w-4 h-4 text-zinc-400" />
          Chei API și integrări
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Conectează-ți brokerii și serviciile externe. Cheile sunt criptate și nu sunt vizibile după salvare.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Security notice */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-amber-300 text-sm">
            Toate cheile API sunt criptate înainte de stocare și nu sunt vizibile după salvare.
          </p>
        </div>

        {/* Integration cards */}
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

        {/* Stats */}
        {!loading && (
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {integrations.filter((i) => i.isActive).length} conectate
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <XCircle className="w-3.5 h-3.5 text-zinc-700" />
              {INTEGRATIONS.filter((i) => i.available).length - integrations.filter((i) => i.isActive).length} disponibile
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
