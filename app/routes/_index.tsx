import { Link as RRLink } from "react-router";
import { Link } from "@radix-ui/themes";

export default function Home() {
  return (
    <Link asChild>
      <RRLink to="/login">ログインページへ</RRLink>
    </Link>
  );
}
