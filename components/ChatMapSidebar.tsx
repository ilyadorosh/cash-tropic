"use client";

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore, ChatMeta } from "../app/lib/useChatStore";

const ChatMapSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { chats } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) {
      return chats;
    }

    const query = searchQuery.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(query) ||
        chat.snippet.toLowerCase().includes(query)
    );
  }, [chats, searchQuery]);

  // Sort chats by creation date (newest first)
  const sortedChats = useMemo(() => {
    return [...filteredChats].sort((a, b) => b.createdAt - a.createdAt);
  }, [filteredChats]);

  // Format date for display
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Truncate snippet to ~80 characters
  const truncateSnippet = (text: string, maxLength: number = 80): string => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength).trim() + "...";
  };

  // Handle chat item click
  const handleChatClick = (chat: ChatMeta) => {
    // Navigate to chat page with optional prompt query param
    const url = `/chat/${chat.id}?prompt=${encodeURIComponent(chat.snippet)}`;
    navigate(url);
  };

  // Handle keyboard navigation
  const handleKeyPress = (
    event: React.KeyboardEvent,
    chat: ChatMeta
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleChatClick(chat);
    }
  };

  return (
    <div
      style={{
        width: "260px",
        height: "100vh",
        backgroundColor: "#f5f5f5",
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: "#ffffff",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 600,
            color: "#333",
          }}
        >
          📍 Chat Map
        </h2>
      </div>

      {/* Search Input */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <input
          type="text"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search chats by title or snippet"
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d0d0d0",
            borderRadius: "4px",
            fontSize: "14px",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#4a90e2";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#d0d0d0";
          }}
        />
      </div>

      {/* Chat List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
        }}
      >
        {sortedChats.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: "#999",
              fontSize: "14px",
            }}
          >
            {searchQuery ? "No chats found" : "No chats yet..."}
          </div>
        ) : (
          sortedChats.map((chat) => (
            <div
              key={chat.id}
              role="button"
              tabIndex={0}
              onClick={() => handleChatClick(chat)}
              onKeyPress={(e) => handleKeyPress(e, chat)}
              aria-label={`Open chat: ${chat.title || "Untitled"}`}
              style={{
                padding: "12px",
                marginBottom: "8px",
                backgroundColor: "#ffffff",
                borderRadius: "6px",
                border: "1px solid #e0e0e0",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9f9f9";
                e.currentTarget.style.borderColor = "#4a90e2";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.borderColor = "#e0e0e0";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Title */}
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#333",
                  marginBottom: "4px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {chat.title || "Untitled"}
              </div>

              {/* Creation Date */}
              <div
                style={{
                  fontSize: "12px",
                  color: "#888",
                  marginBottom: "6px",
                }}
              >
                {formatDate(chat.createdAt)}
              </div>

              {/* Snippet Preview */}
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  lineHeight: "1.4",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {truncateSnippet(chat.snippet)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatMapSidebar;
