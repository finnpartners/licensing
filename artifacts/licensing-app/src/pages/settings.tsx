import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Eye, EyeOff } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Settings() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/admin/api-key`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setApiKey(d.apiKey || ""))
      .catch(() => setApiKey(""));
  }, []);

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = apiKey ? apiKey.substring(0, 4) + "•".repeat(Math.max(0, apiKey.length - 8)) + apiKey.substring(apiKey.length - 4) : "";

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configuration and credentials"
      />

      <div className="space-y-6 max-w-2xl">
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-slate-900">FINN API Key</h3>
            <p className="text-sm text-slate-500 mt-1">
              Provide this key to WordPress sites for the FINN DEV Dashboard plugin settings.
            </p>
          </div>
          {apiKey === null ? (
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ) : apiKey ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-100 text-sm font-mono px-4 py-2.5 rounded-lg text-slate-700 select-all truncate">
                {visible ? apiKey : maskedKey}
              </code>
              <Button variant="outline" size="sm" onClick={() => setVisible(!visible)} className="shrink-0 h-10 px-3">
                {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 h-10 px-3">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2.5 rounded-lg">
              No FINN API Key configured. Set the <code className="font-mono font-semibold">FINN_API_KEY</code> environment variable.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
