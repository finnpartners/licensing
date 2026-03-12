import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: string;
    userEmail: string;
    userName: string;
    oauthState?: string;
    postLoginRedirect?: string;
  }
}
