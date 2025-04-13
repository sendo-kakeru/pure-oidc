import type { Route } from "./+types/api.auth.google";
import crypto from "crypto";
import { env } from "env.server";
import { redirect } from "react-router";
import { sessionStorage } from "~/features/auth/sessionStorage";
import { generateCodeVerifier } from "~/utils";

export async function action({ request }: Route.ActionArgs) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const state = generateCodeVerifier();
  const nonce = generateCodeVerifier();
  const pkceCodeVerifier = generateCodeVerifier();

  session.set("oauth_state", state);
  session.set("pkce_code_verifier", pkceCodeVerifier);
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
  url.searchParams.set(
    "code_challenge",
    generateCodeChallenge(pkceCodeVerifier)
  );
  url.searchParams.set("code_challenge_method", "S256");

  const authorizationUrl = url.toString();
  return redirect(authorizationUrl, {
    headers: {
      "set-cookie": await sessionStorage.commitSession(session),
    },
  });
}

function generateCodeChallenge(codeVerifier: string): string {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest()
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
