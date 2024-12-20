"use client";
import { useState } from "react";

export default function MessagesPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch messages from PostgreSQL
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fetch-messages", { method: "GET" });
      const data = await res.json();
      setMessages(data.messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Move 9th message in Redis and save to PostgreSQL
  const moveMessage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/move-message", { method: "POST" });
      if (!res.ok) throw new Error("Failed to move message");
      alert("Message moved and saved!");
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error("Error moving message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Messages</h1>
      <button onClick={fetchMessages} disabled={loading}>
        {loading ? "Loading..." : "Fetch Messages"}
      </button>
      <button onClick={moveMessage} disabled={loading}>
        {loading ? "Processing..." : "Move 9th Message"}
      </button>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}
