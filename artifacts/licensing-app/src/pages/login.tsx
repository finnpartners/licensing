import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Login() {
  const [ssoEnabled, setSsoEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/auth/sso-status`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setSsoEnabled(data.ssoEnabled))
      .catch(() => setSsoEnabled(false));
  }, []);

  const handleLogin = () => {
    window.location.href = `${BASE}/api/auth/login?redirect=/dashboard`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 mx-4">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-950 mb-2 text-center">FINN Licensing</h2>
        <p className="text-slate-500 mb-8 text-center">Sign in with your organization account</p>

        {ssoEnabled === null && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          </div>
        )}

        {ssoEnabled === true && (
          <Button onClick={handleLogin} className="w-full text-base h-12 gap-3" variant="default">
            <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Sign in with Microsoft
          </Button>
        )}

        {ssoEnabled === false && (
          <div className="text-center text-sm text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-200">
            SSO is not available in this environment. Deploy to your live domain to enable sign-in.
          </div>
        )}

        <div className="mt-8 text-center text-sm text-slate-400">
          Internal system. Authorized access only.
        </div>
      </div>
    </div>
  );
}
