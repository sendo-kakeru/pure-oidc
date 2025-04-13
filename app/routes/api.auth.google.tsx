import type { Route } from "./+types/api.auth.google";
import crypto from "crypto";
import { env } from "env.server";
import { redirect } from "react-router";
import { sessionStorage } from "~/features/auth/sessionStorage";

export async function action({ request }: Route.ActionArgs) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const state = crypto.randomBytes(32).toString("hex");
  const nonce = crypto.randomBytes(32).toString("hex");
  session.set("oauth_state", state);
  // @todo: oidc実装時に検証追加
  // session.set("oauth_nonce", nonce);

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
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  const authorizationUrl = url.toString();
  return redirect(authorizationUrl, {
    headers: {
      "set-cookie": await sessionStorage.commitSession(session),
    },
  });
}
