import { createCookieSessionStorage } from "react-router";

export const sessionStorage = createCookieSessionStorage<{
  oauth_state: string;
  pkce_code_verifier: string;
  // @todo: oidc実装時に検証追加
  // oauth_nonce: string;
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
