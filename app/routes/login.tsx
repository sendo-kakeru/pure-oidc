import { Button, Heading } from "@radix-ui/themes";
import { Form } from "react-router";

export default function Login() {
  return (
    <>
      <Heading>ログイン</Heading>
      <Form method="post" action="/api/auth/google">
        <Button type="submit">Googleでログイン</Button>
      </Form>
    </>
  );
}
