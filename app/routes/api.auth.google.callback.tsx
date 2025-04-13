import { redirect } from "react-router";
import type { Route } from "./+types/api.auth.google";
import { flashMessage } from "~/libs/flash-message";
import { env } from "env.server";

export type GoogleProfile = {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
};

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
  const error = url.searchParams.get("error");
  if (error) {
    return errorRedirectWithFlash({
      request,
      message: "ログインに失敗しました。",
    });
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return errorRedirectWithFlash({
      request,
      message: "認可コードが見つかりませんでした。",
    });
  }

  let tokens: GoogleOAuthTokens | undefined;
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
    console.log("Google OAuth tokens:", tokens);
  } catch (err) {
    console.error("Token fetch error:", err);
    return errorRedirectWithFlash({
      request,
      message: "Googleトークン取得中にエラーが発生しました。",
    });
  }

  if (!tokens?.access_token) {
    return errorRedirectWithFlash({
      request,
      message: "アクセストークンが取得できませんでした。",
    });
  }

  try {
    const getProfileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!getProfileResponse.ok) {
      console.error(
        "Failed to fetch userinfo:",
        await getProfileResponse.text()
      );
      return errorRedirectWithFlash({
        request,
        message: "ユーザープロフィールの取得に失敗しました。",
      });
    }

    const profile: GoogleProfile = await getProfileResponse.json();
    return Response.json(profile);
  } catch (err) {
    console.error("Profile fetch error:", err);
    return errorRedirectWithFlash({
      request,
      message: "Googleユーザー情報取得中にエラーが発生しました。",
    });
  }
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
