import { redirect, redirectDocument } from "react-router";
import type { Route } from "./+types/api.auth.google";
import { flashMessage } from "~/libs/flash-message";
import { env } from "env.server";
import { sessionStorage } from "~/features/auth/sessionStorage";
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";

export type GoogleOAuthTokens = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: "Bearer";
  id_token?: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);

  if (url.searchParams.get("error")) {
    return errorRedirectWithFlash({
      request,
      message: "ログインに失敗しました。",
    });
  }

  const authSession = await sessionStorage.getSession(
    request.headers.get("cookie")
  );

  const stateFromUrl = url.searchParams.get("state");
  const stateFromSession = authSession.get("oauth_state");
  if (!stateFromUrl || stateFromUrl !== stateFromSession) {
    console.warn("OAuth state mismatch");
    return errorRedirectWithFlash({
      request,
      message: "セキュリティ検証に失敗しました（state）。",
    });
  }

  const pkceCodeVerifier = authSession.get("pkce_code_verifier");
  if (!pkceCodeVerifier) {
    return errorRedirectWithFlash({
      request,
      message: "PKCE情報が見つかりませんでした。",
    });
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return errorRedirectWithFlash({
      request,
      message: "認可コードが見つかりませんでした。",
    });
  }

  let tokens: GoogleOAuthTokens;
  try {
    const getTokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: `${env.BASE_URL}/api/auth/google/callback`,
          grant_type: "authorization_code",
          code_verifier: pkceCodeVerifier,
        }),
      }
    );

    if (!getTokenResponse.ok) {
      console.error("Failed to fetch token:", await getTokenResponse.text());
      return errorRedirectWithFlash({
        request,
        message: "トークンの取得に失敗しました。",
      });
    }

    tokens = await getTokenResponse.json();
  } catch (err) {
    console.error("Token fetch error:", err);
    return errorRedirectWithFlash({
      request,
      message: "トークン取得中にエラーが発生しました。",
    });
  }

  if (!tokens.id_token) {
    return errorRedirectWithFlash({
      request,
      message: "IDトークンが返されませんでした。",
    });
  }

  let idTokenPayload: JWTPayload;
  try {
    const JWKS = createRemoteJWKSet(
      new URL("https://www.googleapis.com/oauth2/v3/certs")
    );

    const { payload } = await jwtVerify(tokens.id_token, JWKS, {
      issuer: "https://accounts.google.com",
      audience: env.GOOGLE_CLIENT_ID,
    });

    const nonceFromSession = authSession.get("oauth_nonce");
    if (payload.nonce !== nonceFromSession) {
      console.warn("OIDC nonce mismatch", {
        fromToken: payload.nonce,
        fromSession: nonceFromSession,
      });
      return errorRedirectWithFlash({
        request,
        message: "セキュリティ検証（nonce）に失敗しました。",
      });
    }

    idTokenPayload = payload;
  } catch (err) {
    console.error("ID Token verification failed:", err);
    return errorRedirectWithFlash({
      request,
      message: "IDトークンの検証に失敗しました。",
    });
  }

  authSession.unset("oauth_state");
  authSession.unset("oauth_nonce");
  authSession.unset("pkce_code_verifier");

  if (typeof idTokenPayload.email !== "string") {
    return errorRedirectWithFlash({
      request,
      message: "メールアドレスが取得できませんでした。",
    });
  }
  if (typeof idTokenPayload.name !== "string") {
    return errorRedirectWithFlash({
      request,
      message: "名前が取得できませんでした。",
    });
  }
  if (typeof idTokenPayload.picture !== "string") {
    return errorRedirectWithFlash({
      request,
      message: "プロフィール画像が取得できませんでした。",
    });
  }
  authSession.set("me", {
    name: idTokenPayload.name,
    email: idTokenPayload.email,
    image: idTokenPayload.picture,
  });

  const { cookie } = await flashMessage.set({
    request,
    data: {
      message: "ログインしました。",
    },
  });
  headers.set("Set-Cookie", await sessionStorage.commitSession(authSession));
  headers.append("Set-Cookie", cookie);
  return redirectDocument("/", { headers });
}

async function errorRedirectWithFlash({
  request,
  message,
}: {
  request: Request;
  message: string;
}) {
  const { cookie } = await flashMessage.set({
    request,
    data: {
      color: "red",
      message,
    },
  });

  return redirect("/login", {
    headers: { "Set-Cookie": cookie },
  });
}
