import type { Metadata } from "next";
import {
  Box,
  Container,
  Heading,
  Link as RadixLink,
  Section,
  Separator,
  Text,
} from "@radix-ui/themes";

export const metadata: Metadata = {
  title: "Privacy Policy – Visitor Experience",
  description:
    "How the Visitor Experience app for TUM Blockchain Conference 2025 collects, uses, and protects data.",
};

export default function PrivacyPage() {
  const updatedOn = new Date().toISOString().split("T")[0];

  return (
    <Container size="3" px="3" py="3">
      <Section size="3">
        <Heading as="h1" size="8">
          Privacy Policy
        </Heading>
        <Text as="p" color="gray">
          Updated: {updatedOn}
        </Text>
      </Section>

      <Section size="1">
        <Heading as="h2" size="6">
          Overview
        </Heading>
        <Text as="p" mt="2">
          This Visitor Experience app supports attendees of the TUM Blockchain
          Conference 2025. We keep data collection minimal and use it only to
          authenticate you, remember your bookmarked sessions, and generate a
          personal calendar feed.
        </Text>
      </Section>

      <Section size="1">
        <Heading as="h2" size="6">
          Data we collect
        </Heading>
        <Box asChild mt="2">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <Text>
                <strong>Email address</strong>: collected when you sign in using
                a magic link (Auth.js Email Provider via Gmail).
              </Text>
            </li>
            <li>
              <Text>
                <strong>Bookmarked event IDs</strong>: the sessions you choose
                on the dashboard so we can save and generate your calendar feed.
              </Text>
            </li>
            <li>
              <Text>
                <strong>Usage analytics</strong>: non-identifying metrics (e.g.,
                page views) and client-side error events to improve reliability,
                via Google Analytics 4 when enabled.
              </Text>
            </li>
          </ul>
        </Box>
      </Section>

      <Section size="1">
        <Heading as="h2" size="6">
          How we use your data
        </Heading>
        <Box asChild mt="2">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <Text>
                <strong>Authentication</strong>: we use your email to send a
                one-time sign-in link and to maintain your session.
              </Text>
            </li>
            <li>
              <Text>
                <strong>Personal calendar</strong>: we store your bookmarked
                event IDs and assign a private, non-guessable calendar ID to
                serve your ICS feed.
              </Text>
            </li>
            <li>
              <Text>
                <strong>Product reliability</strong>: we record aggregated usage
                and exception events to detect issues. We do not log tokens.
              </Text>
            </li>
          </ul>
        </Box>
        <Box mt="2">
          <Text>
            Your ICS feed URL embeds a random identifier. Treat it like a
            secret; anyone with the URL can access your event list.
          </Text>
        </Box>
      </Section>

      <Section size="1">
        <Heading as="h2" size="6">
          Cookies
        </Heading>
        <Text as="p" mt="2">
          We use an httpOnly session cookie managed by Auth.js to keep you
          signed in. In production, it is set with secure attributes. If Google
          Analytics is enabled, it may set additional cookies for measurement.
        </Text>
      </Section>

      <Section size="1">
        <Heading as="h2" size="6">
          Data retention
        </Heading>
        <Box asChild mt="2">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <Text>
                <strong>Email and bookmarked events</strong>: we delete your
                email and your bookmarked event selections (including your
                calendar ID mapping) after the conference concludes, no later
                than 30 days post-event.
              </Text>
            </li>
            <li>
              <Text>
                <strong>Analytics</strong>: retained by Google Analytics
                according to your browser settings and Google’s policies; we
                only use aggregated, non-identifying data.
              </Text>
            </li>
          </ul>
        </Box>
      </Section>

      <Section size="1">
        <Heading as="h2" size="6">
          Data sharing
        </Heading>
        <Box asChild mt="2">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <Text>
                <strong>Service providers</strong>: we use Firebase (Google) to
                store sessions/selections and Gmail (via Nodemailer) to send
                sign-in links.
              </Text>
            </li>
            <li>
              <Text>
                <strong>Analytics</strong>: GA4 is used for aggregated usage
                metrics and error tracking when enabled.
              </Text>
            </li>
            <li>
              <Text>
                <strong>Sales</strong>: we do not sell your personal data.
              </Text>
            </li>
          </ul>
        </Box>
      </Section>

      <Section size="1">
        <Heading as="h2" size="6">
          Security
        </Heading>
        <Box asChild mt="2">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <Text>
                Authentication via magic links; sessions stored in httpOnly
                cookies.
              </Text>
            </li>
            <li>
              <Text>
                Server-side verification and access control; non-guessable
                calendar IDs for feeds.
              </Text>
            </li>
            <li>
              <Text>
                Minimal logging; never logging tokens. Secrets are loaded from
                environment variables.
              </Text>
            </li>
          </ul>
        </Box>
      </Section>

      <Section size="1">
        <Heading as="h2" size="6">
          Your rights
        </Heading>
        <Text as="p" mt="2">
          You can request access to or deletion of your data at any time. For
          feed privacy, you may also stop sharing your ICS URL or request
          deletion early.
        </Text>
      </Section>

      <Section size="1">
        <Heading as="h2" size="6">
          Contact
        </Heading>
        <Text as="p" mt="2">
          For privacy inquiries, please contact the conference organizers via
          the contact information published on the conference website.
        </Text>
      </Section>

      <Separator my="4" size="4" />

      <Text as="p" mt="2">
        Return to <RadixLink href="/">Home</RadixLink>
      </Text>
    </Container>
  );
}
