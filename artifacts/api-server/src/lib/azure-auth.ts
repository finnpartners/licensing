import * as jose from "jose";

let cachedJWKS: ReturnType<typeof jose.createRemoteJWKSet> | null = null;
let cachedTenantId: string | null = null;

interface AzureConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
}

export function getAzureConfig(): AzureConfig {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;
  const redirectUri = process.env.AZURE_REDIRECT_URI;

  if (!clientId || !clientSecret || !tenantId || !redirectUri) {
    throw new Error(
      "Missing Azure AD configuration. Set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, and AZURE_REDIRECT_URI."
    );
  }

  return { clientId, clientSecret, tenantId, redirectUri };
}

export function getAuthorizeUrl(state: string): string {
  const config = getAzureConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    response_mode: "query",
    scope: "openid email profile",
    state,
  });

  return `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

interface TokenResponse {
  id_token: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export async function exchangeCodeForTokens(code: string): Promise<{ idToken: string; accessToken: string }> {
  const config = getAzureConfig();

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
    scope: "openid email profile",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Azure token exchange failed:", errorBody);
    throw new Error("Failed to exchange authorization code for tokens");
  }

  const data = (await response.json()) as TokenResponse;
  return {
    idToken: data.id_token,
    accessToken: data.access_token,
  };
}

export async function verifyIdToken(idToken: string): Promise<{
  oid: string;
  email: string;
  name: string;
}> {
  const config = getAzureConfig();

  if (!cachedJWKS || cachedTenantId !== config.tenantId) {
    const jwksUrl = `https://login.microsoftonline.com/${config.tenantId}/discovery/v2.0/keys`;
    cachedJWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
    cachedTenantId = config.tenantId;
  }

  const { payload } = await jose.jwtVerify(idToken, cachedJWKS, {
    issuer: `https://login.microsoftonline.com/${config.tenantId}/v2.0`,
    audience: config.clientId,
  });

  const oid = (payload.oid as string) || (payload.sub as string);
  const email = (payload.preferred_username as string) || (payload.email as string) || "";
  const name = (payload.name as string) || email;

  if (!oid) {
    throw new Error("ID token missing user identifier (oid/sub)");
  }

  return { oid, email, name };
}
