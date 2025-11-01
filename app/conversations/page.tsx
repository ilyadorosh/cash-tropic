"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./conversations.module.scss";
import chatStyles from "@/app/components/chat.module.scss";
import { IconButton } from "@/app/components/button";
import ReturnIcon from "@/app/icons/return.svg";

interface Conversation {
  id: string;
  fromUsername: string;
  toUsername: string;
  responseCount: number;
  lastResponseDate: string;
  latestResponse: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/get-all-responses");
      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.fromUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.toUsername.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerActions}>
            <IconButton
              icon={<ReturnIcon />}
              onClick={() => router.back()}
              title="Go back"
              bordered
            />
            <div>
              <h1>💬 Conversations</h1>
              <p className={styles.subtitle}>All your message exchanges</p>
            </div>
          </div>
        </div>
        <IconButton
          text="Profiles"
          onClick={() => router.push("/admin/profiles")}
          type="primary"
          title="Create a new profile"
        />
        <IconButton
          text="Pay $25"
          className={styles.payButton}
          onClick={() =>
            window.open("https://buy.stripe.com/test_fZucN65L40Wh5Py0UO8AE00")
          }
          type="primary"
          title="Create a new profile"
        />
        <IconButton
          text="Pay $1"
          className={styles.payButton}
          onClick={() =>
            window.open("https://buy.stripe.com/aFa14oaXO3Uw0IW6eR4Vy01")
          }
          type="primary"
          title="Create a new profile"
        />

        <p>cancel any time</p>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={chatStyles["chat-input"]}
          />
        </div>

        <div className={styles.conversationsList}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <p>Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No conversations yet. Create one!</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const formattedDate = new Date(
                conv.lastResponseDate,
              ).toLocaleString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });

              return (
                <div
                  key={conv.id}
                  className={styles.conversationCard}
                  onClick={() =>
                    router.push(
                      `/from/${conv.fromUsername}/to/${conv.toUsername}`,
                    )
                  }
                >
                  <div className={styles.conversationHeader}>
                    <div className={styles.conversationTitle}>
                      <span className={styles.fromUser}>
                        {conv.fromUsername}
                      </span>
                      <span className={styles.arrow}>→</span>
                      <span className={styles.toUser}>{conv.toUsername}</span>
                    </div>
                    <span className={styles.responseCount}>
                      {conv.responseCount} responses
                    </span>
                  </div>
                  <p className={styles.latestResponse}>{conv.latestResponse}</p>
                  <div className={styles.conversationFooter}>
                    <span className={styles.lastDate}>{formattedDate}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
