"use client";

import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  TextField,
  Text,
} from "@radix-ui/themes";
import { useState, useEffect } from "react";
import { getCsrfToken } from "next-auth/react";

export const SignInForm = () => {
  const [email, setEmail] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    getCsrfToken().then((token) => {
      setCsrfToken(token);
    });
  }, []);

  return (
    <Flex className="w-full" justify="center" align="center">
      <Card size="3" className="w-full max-w-md">
        <Flex direction="column" gap="4" className="w-full">
          <Heading className="text-center" size="6">
            Sign in to continue
          </Heading>
          <form
            className="space-y-4"
            action="/api/auth/signin/nodemailer"
            method="POST"
          >
            <input name="csrfToken" type="hidden" value={csrfToken} />
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="2">
                <Text as="label" htmlFor="email">
                  Email
                </Text>
                <TextField.Root
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  required
                  value={email}
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </Flex>
              <Button type="submit" className="w-full">
                Get Sign In Link
              </Button>
            </Flex>
          </form>
        </Flex>
      </Card>
    </Flex>
  );
};
