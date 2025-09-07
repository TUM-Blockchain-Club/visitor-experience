"use client";

import { Box, Button, Card, Flex, Heading, TextField } from "@radix-ui/themes";
import { useState } from "react";
import { Text } from "@radix-ui/themes";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Save email to localStorage
      window.localStorage.setItem("emailForSignIn", email);
      setMessage("Check your email! We have sent you a sign-in link.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Card size="3">
        <Flex direction="column" gap="4" width="400px">
          <Heading className="text-center" size="6">
            Sign in to continue
          </Heading>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="2">
                <Text as="label" htmlFor="email">
                  Email
                </Text>
                <TextField.Root
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  placeholder="your.email@example.com"
                  required
                />
              </Flex>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Get sign-in link"}
              </Button>
            </Flex>
          </form>
          {message && (
            <Text className="mt-4 text-center text-green-600">{message}</Text>
          )}
          {error && (
            <Text className="mt-4 text-center text-red-600">{error}</Text>
          )}
        </Flex>
      </Card>
    </Box>
  );
}
