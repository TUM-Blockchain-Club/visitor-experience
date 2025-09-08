import { Box, Card, Flex, Heading, Text, Button } from "@radix-ui/themes";
import Link from "next/link";

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams?.email;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8 sm:px-8 md:px-24">
      <Box className="w-full">
        <Card size="3" className="w-full max-w-md">
          <Flex direction="column" gap="4" className="w-full">
            <Heading className="text-center" size="6">
              Check your inbox
            </Heading>
            <Text as="p" size="3" className="text-center">
              {email ? (
                <>
                  We sent a sign-in link to <strong>{email}</strong>.
                </>
              ) : (
                <>We sent you a sign-in link.</>
              )}
              <br />
              Please check your email and follow the link to continue.
            </Text>
            <Text as="p" size="2" className="text-center opacity-80">
              Didn’t get it? Wait a minute, then check your spam folder or try
              again.
            </Text>
            <Flex justify="center">
              <Button asChild>
                <Link href="/">Return to sign in</Link>
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Box>
    </main>
  );
}
