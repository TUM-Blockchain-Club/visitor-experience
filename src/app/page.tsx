import { SignInForm } from "@/components/auth/SignInForm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  if (session && session.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 sm:px-8 md:px-24">
      <SignInForm />
    </main>
  );
}
