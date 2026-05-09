"use client";

import { Key, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_INTEGRATIONS = [
  {
    name: "MetaAPI",
    description: "Sincronizare automată cu MT4/MT5",
    icon: "🔄",
    phase: "Phase 2",
  },
  {
    name: "Cloudinary",
    description: "Stocare screenshot-uri tranzacții",
    icon: "📸",
    phase: "Phase 2",
  },
  {
    name: "TwelveData",
    description: "Date de piață în timp real",
    icon: "📊",
    phase: "Phase 4",
  },
  {
    name: "Stripe",
    description: "Management abonament",
    icon: "💳",
    phase: "Phase 5",
  },
];

export function ApiKeysTab() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
          <Key className="w-4 h-4 text-zinc-400" />
          Chei API și integrări
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Conectează-ți brokerii și serviciile externe. Cheile sunt criptate AES-256.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-6">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-amber-300 text-sm">
            Toate cheile API sunt criptate înainte de stocare și nu sunt vizibile după salvare.
          </p>
        </div>

        <div className="space-y-3">
          {API_INTEGRATIONS.map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{integration.name}</p>
                  <p className="text-xs text-zinc-500">{integration.description}</p>
                </div>
              </div>
              <Badge className="bg-zinc-800 border-zinc-700 text-zinc-500 text-xs">
                {integration.phase}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
