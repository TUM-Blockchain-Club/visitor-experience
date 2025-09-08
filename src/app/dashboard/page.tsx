"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOCK_EVENTS, ConferenceEvent } from "@/lib/mockEvents";

function formatEventTime(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  // Example format: 14:00 - 16:00
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
    <div
      className={`p-4 border rounded-lg ${
        isSelected ? "bg-blue-100 border-blue-400" : "bg-white"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{event.title}</h3>
          <p className="text-sm text-gray-600">
            {formatEventTime(event.startTime, event.endTime)}
          </p>
          <p className="text-gray-800 mt-2">{event.description}</p>
        </div>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(event.id)}
          className="ml-4 h-6 w-6"
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignOut = async () => {
    router.push("/");
  };

  const handleToggleEvent = (eventId: string) => {
    setCalendarUrl(null); // Reset link on selection change
    setSelectedEvents((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(eventId)) {
        newSelection.delete(eventId);
      } else {
        newSelection.add(eventId);
      }
      return newSelection;
    });
  };

  const handleSaveCalendar = async () => {
    setLoading(true);
    setError("");
    setCalendarUrl(null);

    try {
      const res = await fetch("/api/calendar/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedEventIds: Array.from(selectedEvents) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save calendar.");

      // Form the new, correct link
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
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Conference Program</h1>
          <p className="text-gray-600">Signed in as:</p>
        </div>
        <div>
          <button
            onClick={handleSaveCalendar}
            disabled={loading || selectedEvents.size === 0}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mr-4 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Get Calendar Link"}
          </button>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </header>

      {error && (
        <p className="text-red-500 bg-red-100 p-3 rounded-md my-4">{error}</p>
      )}

      {calendarUrl && (
        <div className="my-4 p-4 bg-blue-100 border border-blue-300 rounded-md">
          <h3 className="font-bold">Your personal calendar link:</h3>
          <p className="text-sm text-gray-700">
            Copy this link and add it to your calendar application (Google
            Calendar, Apple Calendar, etc.)
          </p>
          <input
            type="text"
            readOnly
            value={calendarUrl}
            className="mt-2 w-full p-2 border rounded-md bg-gray-50"
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}

      <div className="space-y-4">
        {MOCK_EVENTS.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isSelected={selectedEvents.has(event.id)}
            onToggle={handleToggleEvent}
          />
        ))}
      </div>
    </div>
  );
}
