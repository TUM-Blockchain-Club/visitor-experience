import { SignInForm } from "@/components/auth/SignInForm";
import { Flex } from "@radix-ui/themes";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  if (session && session.user) {
    redirect("/dashboard");
  }

  return (
    <Flex
      className="min-h-dvh w-full px-4 sm:px-8 md:px-24 py-8"
      align="center"
      justify="center"
    >
      <SignInForm />
    </Flex>
  );
}
