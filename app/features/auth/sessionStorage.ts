import { createCookieSessionStorage } from "react-router";
import type { User } from "./user";

export const sessionStorage = createCookieSessionStorage<{
  oauth_state: string;
  pkce_code_verifier: string;
  oauth_nonce: string;
  me: User;
}>({
  cookie: {
    name: "auth_message_session",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  },
});
