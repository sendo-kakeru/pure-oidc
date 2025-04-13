import { data, Link as RRLink } from "react-router";
import type { Route } from "./+types/_index";
import { Link } from "@radix-ui/themes";

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <Link asChild>
      <RRLink to="/login">ログインページへ</RRLink>
    </Link>
  );
}
