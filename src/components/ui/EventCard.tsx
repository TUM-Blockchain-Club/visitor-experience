import {
  Box,
  Card,
  Checkbox,
  Flex,
  Heading,
  Spinner,
  Text,
  Callout,
} from "@radix-ui/themes";
import { Avatar } from "@radix-ui/themes";
import { Session } from "@/lib/model/session";

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

export default function EventCard({
  event,
  onToggle,
  isSelected,
  isPending,
  speakers = [],
  conflictingTitles = [],
}: {
  event: Session;
  onToggle: (eventId: string) => void;
  isSelected: boolean;
  isPending: boolean;
  speakers?: { name: string; photoUrl?: string }[];
  conflictingTitles?: string[];
}) {
  return (
    <Card>
      <Flex align="start" justify="between" gap="4" wrap="nowrap">
        <Flex align="start" gap="1" direction="column">
          <Heading as="h3" size="3">
            {event.title}
          </Heading>
          <Text size="2" color="gray">
            {formatEventTime(event.startTime, event.endTime)}
          </Text>
          <Text size="2" color="gray">
            {event.room}
          </Text>
          {speakers.length > 0 && (
            <Box mt="2">
              <Flex align="center" gap="3" wrap="wrap">
                {speakers.map((s) => (
                  <Flex key={s.name} align="center" gap="2">
                    <Avatar
                      size="1"
                      radius="full"
                      src={s.photoUrl}
                      fallback={s.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    />
                    <Text size="1">{s.name}</Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          )}
          {event.description ? (
            <Box mt="3">
              <Text size="2">{event.description}</Text>
            </Box>
          ) : null}
          {conflictingTitles.length > 0 ? (
            <Box mt="1">
              <Callout.Root color="amber" role="alert" size="1">
                <Callout.Text size="1">Overlaps with:</Callout.Text>
                <Box mt="1">
                  <ul className="list-disc list-inside">
                    {conflictingTitles.map((title) => (
                      <Text as="span" size="1" asChild key={title}>
                        <li>{title}</li>
                      </Text>
                    ))}
                  </ul>
                </Box>
              </Callout.Root>
            </Box>
          ) : null}
        </Flex>
        {isPending ? (
          <Box
            style={{
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-busy="true"
            aria-live="polite"
          >
            <Spinner />
          </Box>
        ) : (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(event.documentId)}
            size="3"
            disabled={isPending}
          />
        )}
      </Flex>
    </Card>
  );
}
