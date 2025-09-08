"use client";

import { useEffect, useRef, useState } from "react";
import { MOCK_EVENTS, ConferenceEvent } from "@/lib/mockEvents";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Heading,
  Skeleton,
  Text,
  TextField,
} from "@radix-ui/themes";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

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
  const [error, setError] = useState("");
  const hasHydratedRef = useRef(false);
  const hasAutoCreatedRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  type CalendarDocument = {
    id: string;
    calendarId: string;
    ownerUserId: string;
    selectedEventIds: string[];
  };

  type CalendarResponse = { calendar: CalendarDocument | null };

  const fetcher = (url: string): Promise<CalendarResponse> =>
    fetch(url, { method: "GET" }).then((r) => r.json());

  const {
    data: swrData,
    error: swrError,
    isLoading,
    mutate,
  } = useSWR<CalendarResponse>(
    status === "authenticated" ? "/api/calendar" : null,
    fetcher
  );

  // Hydrate local state from SWR cache once
  useEffect(() => {
    if (status !== "authenticated") return;
    if (hasHydratedRef.current) return;
    if (!swrData) return;

    const ids: string[] = Array.isArray(swrData.calendar?.selectedEventIds)
      ? swrData.calendar!.selectedEventIds
      : [];
    setSelectedEvents(new Set(ids));
    hasHydratedRef.current = true;
  }, [swrData, status]);

  // Auto-create a calendar if none exists so the link is always available
  useEffect(() => {
    if (status !== "authenticated") return;
    if (!swrData) return;
    if (hasAutoCreatedRef.current) return;
    if (swrData.calendar !== null) return;

    hasAutoCreatedRef.current = true;
    (async () => {
      try {
        await mutate(
          async () => {
            const postRes = await fetch("/api/calendar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                selectedEventIds: Array.from(selectedEvents),
              }),
            });
            const postData: CalendarResponse & { message?: string } =
              await postRes.json();
            if (!postRes.ok)
              throw new Error(postData.message || "Failed to create calendar.");
            return postData;
          },
          { revalidate: false }
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create calendar."
        );
      }
    })();
  }, [mutate, selectedEvents, status, swrData]);

  if (status !== "authenticated") {
    return (
      <Box p="4" style={{ maxWidth: 960, margin: "0 auto" }}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents((previousSelected) => {
      const updated = new Set(previousSelected);
      if (updated.has(eventId)) {
        updated.delete(eventId);
      } else {
        updated.add(eventId);
      }
      const updatedIds = Array.from(updated);
      const existing = swrData?.calendar ?? null;
      if (status === "authenticated") {
        if (existing) {
          void mutate(
            async () => {
              const putRes = await fetch("/api/calendar", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  calendarId: existing.id,
                  selectedEventIds: updatedIds,
                }),
              });
              const putData = await putRes.json();
              if (!putRes.ok)
                throw new Error(
                  putData.message || "Failed to update calendar."
                );
              return {
                calendar: { ...existing, selectedEventIds: updatedIds },
              } as CalendarResponse;
            },
            {
              optimisticData: {
                calendar: { ...existing, selectedEventIds: updatedIds },
              },
              rollbackOnError: true,
              revalidate: false,
            }
          );
        } else if (!hasAutoCreatedRef.current) {
          hasAutoCreatedRef.current = true;
          void mutate(
            async () => {
              const postRes = await fetch("/api/calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ selectedEventIds: updatedIds }),
              });
              const postData: CalendarResponse & { message?: string } =
                await postRes.json();
              if (!postRes.ok)
                throw new Error(
                  postData.message || "Failed to create calendar."
                );
              return postData as CalendarResponse;
            },
            { revalidate: false }
          );
        }
      }
      return updated;
    });
  };
  const calendarId = swrData?.calendar?.id ?? null;
  const calendarLink = calendarId
    ? `${
        typeof window !== "undefined" ? window.location.origin : ""
      }/api/calendar/${calendarId}`
    : "";

  const showSkeleton =
    status === "authenticated" && (!hasHydratedRef.current || isLoading);

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
            color="red"
            variant="solid"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </Button>
        </Flex>
      </Flex>

      {(error || swrError) && (
        <Box mb="4">
          <Text color="red">{error || (swrError as Error)?.message}</Text>
        </Box>
      )}

      <Card mb="4">
        <Flex direction="column" gap="2">
          <Heading as="h3" size="3">
            Your personal calendar link
          </Heading>
          <Text size="2" color="gray">
            Copy this link and add it to your calendar application (Google
            Calendar, Apple Calendar, etc.)
          </Text>
          {calendarId ? (
            <TextField.Root
              readOnly
              value={calendarLink}
              onFocus={(e) => e.currentTarget.select()}
            />
          ) : (
            <Skeleton>
              <div style={{ height: 36, width: "100%" }} />
            </Skeleton>
          )}
        </Flex>
      </Card>

      {showSkeleton ? (
        <Flex direction="column" gap="3">
          {MOCK_EVENTS.map((event) => (
            <Card key={event.id}>
              <Flex align="start" justify="between" gap="4">
                <Box style={{ width: "100%" }}>
                  <Skeleton>
                    <div style={{ height: 24, width: "60%" }} />
                  </Skeleton>
                  <Box mt="2">
                    <Skeleton>
                      <div style={{ height: 16, width: "40%" }} />
                    </Skeleton>
                  </Box>
                  <Box mt="2">
                    <Skeleton>
                      <div style={{ height: 16, width: "90%" }} />
                    </Skeleton>
                  </Box>
                </Box>
                <Skeleton>
                  <div style={{ height: 24, width: 24 }} />
                </Skeleton>
              </Flex>
            </Card>
          ))}
        </Flex>
      ) : (
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
      )}
    </Box>
  );
}
