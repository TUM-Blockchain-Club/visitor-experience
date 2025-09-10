import Link from "next/link";
import {
  Box,
  Card,
  Flex,
  Heading,
  Separator,
  Text,
  Callout,
  Link as RadixLink,
} from "@radix-ui/themes";

export default function TutorialPage() {
  return (
    <Box p="4" style={{ maxWidth: 960, margin: "0 auto" }}>
      <Heading size="7" mb="4">
        Phone Setup: Subscribe to Your Calendar
      </Heading>

      <Text as="p" size="3" color="gray" mb="4">
        Follow these steps on your phone (iPhone/iPad or Android) to sign in,
        choose sessions, and subscribe to your personal calendar URL so your
        phone calendar stays in sync.
      </Text>

      <Separator my="4" size="4" />

      <Flex direction="column" gap="4">
        <Card>
          <Box p="3">
            <Heading as="h2" size="4" mb="2">
              1. Sign in
            </Heading>
            <Text as="p" size="3">
              Go to the home page and enter your email address. We’ll send you a
              magic link via email. Tap the link on your phone to complete
              sign-in.
            </Text>
          </Box>
        </Card>

        <Card>
          <Box p="3">
            <Heading as="h2" size="4" mb="2">
              2. Browse sessions and bookmark
            </Heading>
            <Text as="p" size="3">
              On the dashboard, browse sessions and toggle the bookmark icon to
              add or remove a session from your personal calendar selection.
              Conflicts are highlighted when times overlap.
            </Text>
          </Box>
        </Card>

        <Card>
          <Box p="3">
            <Heading as="h2" size="4" mb="2">
              3. Get your personal calendar URL
            </Heading>
            <Text as="p" size="3" mb="2">
              A personal calendar URL is shown at the top of the dashboard. Copy
              this URL—this is your private ICS feed that contains all
              bookmarked sessions.
            </Text>
            <Callout.Root color="orange" role="alert" size="1">
              <Callout.Text size="2">
                Keep this link private. Anyone with the link can view the event
                times and titles you bookmarked.
              </Callout.Text>
            </Callout.Root>
          </Box>
        </Card>

        <Card>
          <Box p="3">
            <Heading as="h2" size="4" mb="2">
              4. Subscribe on your phone
            </Heading>

            <Box mb="3">
              <Heading as="h3" size="3" mb="1">
                iPhone or iPad (Apple Calendar)
              </Heading>
              <Text as="p" size="3">
                Open{" "}
                <strong>
                  Settings → Calendar → Accounts → Add Account → Other → Add
                  Subscribed Calendar
                </strong>
                , paste your personal URL, tap <strong>Next</strong>, then
                <strong> Save</strong>. The subscribed calendar will appear in
                the Apple Calendar app.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" size="3" mb="1">
                Android (Google Calendar)
              </Heading>
              <Text as="p" size="3">
                The Google Calendar app doesn’t add calendars by URL directly.
                On your phone, open a browser to
                <strong> calendar.google.com</strong> (sign in), tap
                <strong> Add calendar → From URL</strong>, paste your personal
                link, and add it. Then open the Google Calendar app and ensure
                the new subscribed calendar is visible under Settings.
              </Text>
            </Box>
          </Box>
        </Card>

        <Card>
          <Box p="3">
            <Heading as="h2" size="4" mb="2">
              5. Keep it synced
            </Heading>
            <Text as="p" size="3" mb="2">
              Your calendar app will periodically refresh your subscribed ICS
              feed. If you change your selections, the feed updates
              automatically on the next refresh.
            </Text>

            <Callout.Root color="orange" role="alert" size="1">
              <Callout.Text size="2">
                If possible, set the sync/refresh interval as small as possible
                (typically 5 minutes) for near real-time updates. However, some
                calendar apps won't let you configure the interval.
              </Callout.Text>
            </Callout.Root>
          </Box>
        </Card>

        <Card>
          <Box p="3">
            <Heading as="h2" size="4" mb="2">
              6. Where to find your link later
            </Heading>
            <Text as="p" size="3">
              Return to the <Link href="/dashboard">dashboard</Link> any time to
              copy your personal calendar URL again.
            </Text>
          </Box>
        </Card>
      </Flex>

      <Separator my="5" size="4" />

      <Text as="p" size="2" color="gray">
        Questions? See the privacy policy or reach out to us at{" "}
        <RadixLink asChild>
          <Link href="mailto:it@tum-blockchain.com">it@tum-blockchain.com</Link>
        </RadixLink>
        .
      </Text>
    </Box>
  );
}
