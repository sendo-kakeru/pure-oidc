import { Avatar, Button, DropdownMenu, Text } from "@radix-ui/themes";
import { Form, Link } from "react-router";
import type { User } from "~/features/auth/user";

export default function Header({ me }: { me: User | undefined }) {
  return (
    <header className="p-4 shadow-2xl">
      <div className=" px-4 max-w-6xl flex items-center justify-end mx-auto">
        {me ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="ghost" className="!gap-x-2">
                <Avatar src={me.image} fallback="U" radius="full" size="3" />
                <Text size="4">{me.name}</Text>
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item asChild>
                <Form method="post" action="/api/auth/logout" className="!p-0">
                  <Button type="submit">ログアウト</Button>
                </Form>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        ) : (
          <Button asChild>
            <Link to="/login">ログイン</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
