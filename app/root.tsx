import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { flashMessage } from "./libs/flash-message";
import FlashMessage from "./components/FlashMessage";
import { sessionStorage } from "./features/auth/sessionStorage";
import Header from "./components/Header";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const { data: flashMessageData, cookie } = await flashMessage.get({
    request,
  });
  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  const me = session.get("me");
  return data(
    {
      me,
      flashMessage: flashMessageData
        ? { ...flashMessageData, key: Date.now() }
        : undefined,
    },
    {
      headers: { "Set-Cookie": cookie },
    }
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <Theme className="p-4">
      <Header me={loaderData.me} />
      {loaderData.flashMessage?.message && (
        <FlashMessage
          color={loaderData.flashMessage.color ?? "green"}
          key={loaderData.flashMessage.key}
        >
          {loaderData.flashMessage.message}
        </FlashMessage>
      )}
      <div className="grid gap-y-12 px-4 max-w-6xl mx-auto py-8 lg:py-16 h-full shadow-2xl mt-16">
        <Outlet />
      </div>
    </Theme>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
