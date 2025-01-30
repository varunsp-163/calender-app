"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSession, signIn, signOut, getProviders } from "next-auth/react";
import axios from "axios"; // Import axios

const DashboardPage = () => {
  const [input, setInput] = useState("");
  const [parsedEvent, setParsedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();

  const handleParseInput = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/parse-input", {
        userInput: input,
      });
      console.log(response.data.output);
      setParsedEvent(response.data.output);
    } catch (error) {
      console.error("Error parsing input:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendToBackend = useMemo(() => {
    try {
      const jsonMatch = parsedEvent?.match(/```json\n([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
    } catch (error) {
      console.error("Error parsing Gemini output:", error);
      return null;
    }
  }, [parsedEvent]);

  const handleCreateEvent = async () => {
    if (!sendToBackend) return alert("Error in parsing JSON");

    try {
      const response = await axios.post("/api/create-event", {
        events: sendToBackend,
        tokens: session?.user?.tokens,
      });
      alert(response.data.message);
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event");
    }
  };

  return (
    <div className="p-8  bg-black h-screen">
      <h1 className="text-2xl font-bold mb-4 text-white">
        Sync Events with Google Calendar
      </h1>
      <textarea
        className="w-full p-2 border mb-4 rounded-xl"
        rows="4"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe your event (e.g., Meeting tomorrow at 3 PM)"
      />
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
        onClick={handleParseInput}
        disabled={loading}
      >
        {loading ? "Parsing..." : "Parse Event"}
      </button>

      {parsedEvent && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Parsed Event</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(sendToBackend, null, 2)}
          </pre>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded mt-2"
            onClick={handleCreateEvent}
          >
            Sync to Google Calendar
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-4">
          <p className="text-gray-500">Loading parsed event...</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
