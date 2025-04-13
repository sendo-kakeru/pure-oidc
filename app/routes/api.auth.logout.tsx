import { redirect } from "react-router";
import { sessionStorage } from "~/features/auth/sessionStorage";
import { flashMessage } from "~/libs/flash-message";

export async function action({ request }: { request: Request }) {
  const headers = new Headers();
  const authSession = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  const { cookie } = await flashMessage.set({
    request,
    data: {
      message: "ログアウトしました。",
    },
  });
  headers.set("Set-Cookie", await sessionStorage.destroySession(authSession));
  headers.append("Set-Cookie", cookie);
  return redirect("/", { headers });
}
