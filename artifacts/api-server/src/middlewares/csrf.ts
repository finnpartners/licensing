import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const CSRF_COOKIE = "finn.csrf";
const CSRF_HEADER = "x-csrf-token";

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    ensureCsrfCookie(req, res);
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || !timingSafeCompare(cookieToken, headerToken)) {
    res.status(403).json({ message: "Invalid CSRF token" });
    return;
  }

  next();
}

function ensureCsrfCookie(req: Request, res: Response): void {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
}

export function getCsrfToken(req: Request, res: Response): void {
  let token = req.cookies?.[CSRF_COOKIE];
  if (!token) {
    token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
  res.json({ token });
}
