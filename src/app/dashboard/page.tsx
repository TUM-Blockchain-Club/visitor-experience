"use client";

import { useEffect, useState } from "react";
import { MOCK_EVENTS, ConferenceEvent } from "@/lib/mockEvents";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Heading,
  Text,
  TextField,
} from "@radix-ui/themes";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function formatEventTime(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return `${start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function EventCard({
  event,
  onToggle,
  isSelected,
}: {
  event: ConferenceEvent;
  onToggle: (eventId: string) => void;
  isSelected: boolean;
}) {
  return (
    <Card>
      <Flex align="start" justify="between" gap="4">
        <Box>
          <Heading as="h3" size="3">
            {event.title}
          </Heading>
          <Text size="2" color="gray">
            {formatEventTime(event.startTime, event.endTime)}
          </Text>
          <Box mt="2">
            <Text>{event.description}</Text>
          </Box>
        </Box>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(event.id)}
          size="3"
        />
      </Flex>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <Box p="4" style={{ maxWidth: 960, margin: "0 auto" }}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  const handleToggleEvent = (eventId: string) => {
    setCalendarUrl(null);
    setSelectedEvents((previousSelected) => {
      const updated = new Set(previousSelected);
      if (updated.has(eventId)) {
        updated.delete(eventId);
      } else {
        updated.add(eventId);
      }
      return updated;
    });
  };

  const handleSaveCalendar = async () => {
    setLoading(true);
    setError("");
    setCalendarUrl(null);

    try {
      const response = await fetch("/api/calendar/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedEventIds: Array.from(selectedEvents) }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to save calendar.");

      const url = `${window.location.origin}/api/calendar/${data.calendarId}`;
      setCalendarUrl(url);
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
    <Box p="4" style={{ maxWidth: 960, margin: "0 auto" }}>
      <Flex align="center" justify="between" mb="6">
        <Box>
          <Heading size="6">Conference Program</Heading>
          <Text color="gray" size="2">
            Signed in as: {session?.user?.email ?? ""}
          </Text>
        </Box>
        <Flex gap="3">
          <Button
            onClick={handleSaveCalendar}
            disabled={loading || selectedEvents.size === 0}
          >
            {loading ? "Saving..." : "Get Calendar Link"}
          </Button>
          <Button
            color="red"
            variant="solid"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </Button>
        </Flex>
      </Flex>

      {error && (
        <Box mb="4">
          <Text color="red">{error}</Text>
        </Box>
      )}

      {calendarUrl && (
        <Card mb="4">
          <Flex direction="column" gap="2">
            <Heading as="h3" size="3">
              Your personal calendar link
            </Heading>
            <Text size="2" color="gray">
              Copy this link and add it to your calendar application (Google
              Calendar, Apple Calendar, etc.)
            </Text>
            <TextField.Root
              readOnly
              value={calendarUrl}
              onFocus={(e) => e.currentTarget.select()}
            />
          </Flex>
        </Card>
      )}

      <Flex direction="column" gap="3">
        {MOCK_EVENTS.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isSelected={selectedEvents.has(event.id)}
            onToggle={handleToggleEvent}
          />
        ))}
      </Flex>
    </Box>
  );
}
