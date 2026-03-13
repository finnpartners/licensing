import type { Request } from "express";

interface EasyAuthUser {
  id: string;
  email: string;
  name: string;
}

interface ClientPrincipalClaim {
  typ: string;
  val: string;
}

interface ClientPrincipal {
  auth_typ: string;
  claims: ClientPrincipalClaim[];
  name_typ: string;
  role_typ: string;
}

const ALLOWED_DOMAINS = (process.env.ALLOWED_AUTH_DOMAINS || "finnpartners.com")
  .split(",")
  .map((d) => d.trim().toLowerCase());

export function getEasyAuthUser(req: Request): EasyAuthUser | null {
  const principalHeader = req.headers["x-ms-client-principal"] as string | undefined;

  if (principalHeader) {
    try {
      const decoded = Buffer.from(principalHeader, "base64").toString("utf-8");
      const principal: ClientPrincipal = JSON.parse(decoded);

      console.log("Easy Auth claims:", JSON.stringify(principal.claims.map((c) => ({ typ: c.typ, val: c.val.substring(0, 30) }))));

      const idClaim = principal.claims.find(
        (c) => c.typ === "http://schemas.microsoft.com/identity/claims/objectidentifier" || c.typ === "oid"
      );
      const emailClaim = principal.claims.find(
        (c) =>
          c.typ === "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" ||
          c.typ === "preferred_username" ||
          c.typ === "email"
      );
      const nameClaim = principal.claims.find(
        (c) => c.typ === "name" || c.typ === "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
      );

      const id = idClaim?.val || req.headers["x-ms-client-principal-id"] as string | undefined;
      const email = emailClaim?.val || nameClaim?.val || req.headers["x-ms-client-principal-name"] as string || "";
      const name = nameClaim?.val || email;

      if (!id) {
        console.warn("Easy Auth: no ID found in claims or headers");
        return null;
      }

      const emailLower = email.toLowerCase();
      const domainMatch = ALLOWED_DOMAINS.some((domain) => emailLower.endsWith("@" + domain));
      if (!domainMatch) {
        console.warn(`Auth rejected: ${email} not in allowed domains (allowed: ${ALLOWED_DOMAINS.join(", ")})`);
        return null;
      }

      return { id, email, name };
    } catch (err) {
      console.error("Failed to parse x-ms-client-principal:", err);
    }
  }

  const id = req.headers["x-ms-client-principal-id"] as string | undefined;
  const name = req.headers["x-ms-client-principal-name"] as string | undefined;

  if (!id || !name) {
    return null;
  }

  const emailLower = name.toLowerCase();
  const domainMatch = ALLOWED_DOMAINS.some((domain) => emailLower.endsWith("@" + domain));
  if (!domainMatch) {
    console.warn(`Auth rejected: ${name} not in allowed domains (allowed: ${ALLOWED_DOMAINS.join(", ")})`);
    return null;
  }

  return { id, email: name, name };
}
