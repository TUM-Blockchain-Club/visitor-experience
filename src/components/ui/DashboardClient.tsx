"use client";

import { useEffect, useRef, useState, type FocusEvent } from "react";
import { Session } from "@/lib/model/session";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  IconButton,
  Skeleton,
  Text,
  TextField,
  Link as RadixLink,
} from "@radix-ui/themes";
import { CheckIcon, CopyIcon, DownloadIcon } from "@radix-ui/react-icons";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Search from "@/components/ui/Search";
import EventCard from "@/components/ui/EventCard";
import { Speaker } from "@/lib/model/speaker";
import Link from "next/link";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
    dataLayer?: Object[];
  }
}

function trackAnalyticsEvent(
  eventName: string,
  params: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
    return;
  }
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...params });
  }
}

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

export default function DashboardClient({
  initialSessions,
}: {
  initialSessions: Session[];
}) {
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

  const handleToggleEvent = (eventId: string) => {
    const isCurrentlySelected = selectedEvents.has(eventId);
    const sessionItem = sessions.find((s) => s.documentId === eventId);
    const eventTitle = sessionItem?.title ?? "";

    trackAnalyticsEvent(
      isCurrentlySelected ? "event_unbookmarked" : "event_bookmarked",
      {
        event_id: eventId,
        event_title: eventTitle,
      }
    );

    const nextSelected = new Set(selectedEvents);
    if (nextSelected.has(eventId)) {
      nextSelected.delete(eventId);
    } else {
      nextSelected.add(eventId);
    }
    const updatedIds = Array.from(nextSelected);
    setSelectedEvents(nextSelected);

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
  const webcalLink = calendarId
    ? calendarLink.replace(/^https?:\/\//, "webcal://")
    : "";

  const handleCopyLink = async () => {
    if (!calendarLink) return;
    try {
      await navigator.clipboard.writeText(calendarLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const showSkeleton =
    status === "authenticated" && (!hasHydratedRef.current || isLoading);

  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(
    initialSessions.length === 0
  );

  const [speakersByName, setSpeakersByName] = useState<Record<string, Speaker>>(
    {}
  );

  useEffect(() => {
    if (initialSessions.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/sessions.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load sessions");
        const data: Session[] = await res.json();
        if (!cancelled) setSessions(data);
      } catch {
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSessions]);

  // Load speakers once and index by name for quick lookup
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/speakers.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load speakers");
        const data: Speaker[] = await res.json();
        if (!cancelled) {
          const dict: Record<string, Speaker> = Object.create(null);
          for (const s of data) dict[s.name] = s;
          setSpeakersByName(dict);
        }
      } catch {
        if (!cancelled) setSpeakersByName({});
      } finally {
        // no-op
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEvents = filterItemsByQuery<Session>(sessions, searchQuery, [
    (e) => e.title,
    (e) => e.description ?? null,
    (e) => {
      const names = Object.values(e.speakers ?? {});
      return names.length > 0 ? names.join(" ") : null;
    },
  ]);

  return (
    <Box p="4" style={{ maxWidth: 960, margin: "0 auto" }}>
      {status !== "authenticated" ? (
        <Text>Loading...</Text>
      ) : (
        <>
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
                Calendar, Apple Calendar, etc.) or click the button to directly
                open your calendar app.
              </Text>
              {calendarId ? (
                <>
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
                  <Box mt="2">
                    <Button asChild variant="soft" size="2">
                      <a href={webcalLink}>Subscribe in calendar app</a>
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Skeleton>
                    <div style={{ height: 36, width: "100%" }} />
                  </Skeleton>
                  <Box mt="2">
                    <Skeleton>
                      <div style={{ height: 32, width: 220 }} />
                    </Skeleton>
                  </Box>
                </>
              )}
              <Text size="2" color="gray">
                Need help? See the{" "}
                <RadixLink asChild className="cursor-pointer">
                  <Link href="/tutorial">phone setup tutorial</Link>
                </RadixLink>
                .
              </Text>
              <Text
                size="2"
                color="gray"
                className="flex items-center justify-center gap-1"
              >
                Looking for the venue layout?{" "}
                <RadixLink
                  href="/files/TBC_25_venue_map.pdf"
                  download
                  className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                >
                  View the map here
                  <DownloadIcon className="h-4 w-4" />
                </RadixLink>
              </Text>
            </Flex>
          </Card>

          <Box mb="4" className="w-full sticky top-0 z-20 bg-white py-2">
            <Search
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Search by title, speaker, or description"
              ariaLabel="Search by title, speaker, or description"
            />
          </Box>

          {showSkeleton || loadingSessions ? (
            <Flex direction="column" gap="3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card key={idx}>
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
              {filteredEvents.map((event) => {
                const speakerNames = Object.values(event.speakers ?? {});
                const speakerItems = speakerNames.map((name) => {
                  const s = speakersByName[name];
                  const photoUrl =
                    s?.profile_photo?.url ||
                    s?.profile_photo?.formats?.thumbnail?.url ||
                    s?.profile_photo?.formats?.small?.url ||
                    undefined;
                  return { name, photoUrl };
                });
                const conflictingTitles: string[] = Array.from(selectedEvents)
                  .filter((id) => id !== event.documentId)
                  .map((id) => sessions.find((s) => s.documentId === id))
                  .filter((s): s is Session => {
                    if (!s) return false;
                    const aStart = new Date(event.startTime).getTime();
                    const aEnd = new Date(event.endTime).getTime();
                    const bStart = new Date(s.startTime).getTime();
                    const bEnd = new Date(s.endTime).getTime();
                    return aStart < bEnd && bStart < aEnd;
                  })
                  .map((s) => s.title);
                return (
                  <EventCard
                    key={event.documentId}
                    event={event}
                    isSelected={selectedEvents.has(event.documentId)}
                    isPending={pendingEventIds.has(event.documentId)}
                    onToggle={handleToggleEvent}
                    speakers={speakerItems}
                    conflictingTitles={conflictingTitles}
                  />
                );
              })}
            </Flex>
          )}
        </>
      )}
    </Box>
  );
}
