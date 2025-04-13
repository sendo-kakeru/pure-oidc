import type { Route } from "./+types/api.auth.google";
import crypto from "crypto";
import { env } from "env.server";
import { redirect } from "react-router";

export function action({}: Route.ActionArgs) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  url.searchParams.set(
    "redirect_uri",
    `${env.BASE_URL}/api/auth/google/callback`
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    [
      "openid",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" ")
  );
  url.searchParams.set("state", crypto.randomBytes(32).toString("hex"));
  url.searchParams.set("nonce", crypto.randomBytes(32).toString("hex"));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  const authorizationUrl = url.toString();
  return redirect(authorizationUrl);
}
