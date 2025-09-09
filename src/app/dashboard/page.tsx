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
  IconButton,
} from "@radix-ui/themes";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { FocusEvent } from "react";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import Search from "@/components/ui/Search";
import EventCard from "@/components/ui/EventCard";

type TextSelector<T> = (item: T) => string | null | undefined;

function filterItemsByQuery<T>(
  items: readonly T[],
  query: string,
  selectors: readonly TextSelector<T>[]
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) return items.slice();
  return items.filter((item) =>
    selectors.some((selectText) => {
      const text = selectText(item);
      if (!text) return false;
      return text.toLowerCase().includes(normalizedQuery);
    })
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [pendingEventIds, setPendingEventIds] = useState<Set<string>>(
    new Set()
  );
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
    // Compute next selection immediately for responsive UI
    const nextSelected = new Set(selectedEvents);
    if (nextSelected.has(eventId)) {
      nextSelected.delete(eventId);
    } else {
      nextSelected.add(eventId);
    }
    const updatedIds = Array.from(nextSelected);
    setSelectedEvents(nextSelected);

    // Mark this event as pending
    setPendingEventIds((prev) => new Set(prev).add(eventId));

    const existing = swrData?.calendar ?? null;
    if (status === "authenticated") {
      const doRequest = async () => {
        if (existing) {
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
            throw new Error(putData.message || "Failed to update calendar.");
          return {
            calendar: { ...existing, selectedEventIds: updatedIds },
          } as CalendarResponse;
        } else if (!hasAutoCreatedRef.current) {
          hasAutoCreatedRef.current = true;
          const postRes = await fetch("/api/calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedEventIds: updatedIds }),
          });
          const postData: CalendarResponse & { message?: string } =
            await postRes.json();
          if (!postRes.ok)
            throw new Error(postData.message || "Failed to create calendar.");
          return postData as CalendarResponse;
        }
        return { calendar: existing } as CalendarResponse;
      };

      void mutate(doRequest, {
        optimisticData: {
          calendar: existing
            ? { ...existing, selectedEventIds: updatedIds }
            : existing,
        },
        rollbackOnError: true,
        revalidate: false,
        populateCache: true,
      })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Update failed.");
          // Revert local selection on error
          setSelectedEvents(new Set(selectedEvents));
        })
        .finally(() => {
          setPendingEventIds((prev) => {
            const clone = new Set(prev);
            clone.delete(eventId);
            return clone;
          });
        });
    } else {
      // Not authenticated guard: just remove pending marker
      setPendingEventIds((prev) => {
        const clone = new Set(prev);
        clone.delete(eventId);
        return clone;
      });
    }
  };
  const calendarId = swrData?.calendar?.id ?? null;
  const calendarLink = calendarId
    ? `${
        typeof window !== "undefined" ? window.location.origin : ""
      }/api/calendar/${calendarId}`
    : "";

  const handleCopyLink = async () => {
    if (!calendarLink) return;
    try {
      await navigator.clipboard.writeText(calendarLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Best-effort copy; ignore errors
    }
  };

  const showSkeleton =
    status === "authenticated" && (!hasHydratedRef.current || isLoading);

  const filteredEvents = filterItemsByQuery<ConferenceEvent>(
    MOCK_EVENTS,
    searchQuery,
    [
      (e) => e.title,
      // Add more selectors in the future, e.g., (e) => e.description
    ]
  );

  return (
    <Box p="4" style={{ maxWidth: 960, margin: "0 auto" }}>
      <Flex align="center" justify="between" mb="6" wrap="wrap" gap="3">
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
              className="w-full"
              readOnly
              value={calendarLink}
              onFocus={(e: FocusEvent<HTMLInputElement>) =>
                e.currentTarget.select()
              }
            >
              <TextField.Slot side="right" className="shrink-0">
                <IconButton
                  size="1"
                  aria-label={copied ? "Copied" : "Copy calendar link"}
                  onClick={handleCopyLink}
                  type="button"
                  variant="ghost"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </IconButton>
              </TextField.Slot>
            </TextField.Root>
          ) : (
            <Skeleton>
              <div style={{ height: 36, width: "100%" }} />
            </Skeleton>
          )}
        </Flex>
      </Card>

      <Box mb="4" className="w-full">
        <Search
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search events"
          ariaLabel="Search events"
        />
      </Box>

      {showSkeleton ? (
        <Flex direction="column" gap="3">
          {MOCK_EVENTS.map((event) => (
            <Card key={event.id}>
              <Flex align="start" justify="between" gap="4" wrap="wrap">
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
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isSelected={selectedEvents.has(event.id)}
              isPending={pendingEventIds.has(event.id)}
              onToggle={handleToggleEvent}
            />
          ))}
        </Flex>
      )}
    </Box>
  );
}
