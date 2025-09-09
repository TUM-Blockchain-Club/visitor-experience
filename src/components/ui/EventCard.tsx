import {
  Box,
  Card,
  Checkbox,
  Flex,
  Heading,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { ConferenceEvent } from "@/lib/mockEvents";

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
}: {
  event: ConferenceEvent;
  onToggle: (eventId: string) => void;
  isSelected: boolean;
  isPending: boolean;
}) {
  return (
    <Card>
      <Flex align="start" justify="between" gap="4" wrap="nowrap">
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
            onCheckedChange={() => onToggle(event.id)}
            size="3"
            disabled={isPending}
          />
        )}
      </Flex>
    </Card>
  );
}
