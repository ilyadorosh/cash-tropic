"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./page.module.scss";
import chatStyles from "@/app/components/chat.module.scss";
import { IconButton } from "@/app/components/button";
import CopyIcon from "@/app/icons/copy.svg";
import DownloadIcon from "@/app/icons/download.svg";
import LoadingIcon from "@/app/icons/three-dots.svg";
import BotIcon from "@/app/icons/bot.svg";
import SendWhiteIcon from "@/app/icons/send-white.svg";
import { copyToClipboard } from "@/app/utils";

interface PageParams {
  params: {
    params?: string[];
  };
}

interface GeneratePageResponse {
  success: boolean;
  html?: string;
  cached?: boolean;
  error?: string;
  details?: string;
  fromProfile?: { username: string; context: string };
  toProfile?: { username: string; context: string };
}

interface UserResponse {
  id: string;
  fromProfileId: string;
  toProfileId: string;
  responseText: string;
  createdAt: Date;
}

export default function ActInLovePage({ params }: PageParams) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [isCached, setIsCached] = useState(false);
  const [fromProfile, setFromProfile] = useState<{
    username: string;
    context: string;
  } | null>(null);
  const [toProfile, setToProfile] = useState<{
    username: string;
    context: string;
  } | null>(null);
  const [userResponse, setUserResponse] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generatePage = async () => {
      try {
        const urlParams = params.params || [];

        if (urlParams.length < 3) {
          setError(
            "Invalid URL format. Expected: /from/{username}/to/{username} or /from/{username}/to/{username}/say/{message}",
          );
          setLoading(false);
          return;
        }

        if (urlParams[1] !== "to") {
          setError("Invalid URL format. Missing 'to' keyword.");
          setLoading(false);
          return;
        }

        const fromUser = urlParams[0];
        const toUser = urlParams[2];
        let customMessage: string | undefined;
        if (urlParams.length >= 5 && urlParams[3] === "say") {
          customMessage = urlParams[4];
        }

        const response = await fetch("/api/generate-page", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromUser,
            to: toUser,
            say: customMessage,
          }),
        });

        const data: GeneratePageResponse = await response.json();

        if (data.success && data.html) {
          setGeneratedHtml(data.html);
          setIsCached(data.cached || false);
          if (data.fromProfile) {
            setFromProfile(data.fromProfile);
          }
          if (data.toProfile) {
            setToProfile(data.toProfile);
          }
          setLoading(false);

          // Fetch responses after page loads
          await fetchResponses(fromUser, toUser);
        } else {
          setError(data.error || "Failed to generate page");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error generating page:", err);
        setError("An unexpected error occurred while generating the page");
        setLoading(false);
      }
    };

    generatePage();
  }, [params.params]);

  const fetchResponses = async (fromUsername: string, toUsername: string) => {
    try {
      setLoadingResponses(true);
      const response = await fetch("/api/get-responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromUsername,
          toUsername,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResponses(data.responses || []);
      }
    } catch (err) {
      console.error("Error fetching responses:", err);
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleCopyHtml = () => {
    copyToClipboard(generatedHtml);
  };

  const handleDownloadHtml = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedHtml], { type: "text/html" });
    element.href = URL.createObjectURL(file);
    element.download = "generated-page.html";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSubmitResponse = async () => {
    console.log("[Submit] fromProfile:", fromProfile);
    console.log("[Submit] toProfile:", toProfile);
    console.log("[Submit] userResponse:", userResponse);

    if (!fromProfile || !toProfile) {
      alert("❌ Profiles not loaded yet. Please refresh the page.");
      return;
    }

    if (!userResponse.trim()) {
      alert("Please enter a response message");
      return;
    }

    setSubmittingResponse(true);
    try {
      const requestBody = {
        fromUsername: toProfile.username,
        toUsername: fromProfile.username,
        responseText: userResponse,
      };

      console.log("[Submit Response] Sending:", requestBody);

      const response = await fetch("/api/save-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("[Submit Response] Got response:", data);

      if (data.success) {
        setUserResponse("");
        alert("✨ Response saved! They'll see it soon!");
        // Refresh responses
        await fetchResponses(fromProfile.username, toProfile.username);
      } else {
        alert("Failed to save response: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("[Submit Response] Error:", err);
      alert("Error submitting response: " + (err as Error).message);
    } finally {
      setSubmittingResponse(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <BotIcon />
          <LoadingIcon />
          <h2>Creating something special...</h2>
          <p>Generating a personalized page just for you</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>Oops! Something went wrong</h2>
          <p className={styles.errorMessage}>{error}</p>
          <div className={styles.errorHelp}>
            <h3>How to use ActInLove:</h3>
            <ul>
              <li>
                <code>/from/username1/to/username2</code>
              </li>
              <li>
                <code>/from/username1/to/username2/say/yourmessage</code>
              </li>
            </ul>
            <p>
              Make sure both profiles exist in the{" "}
              <a href="/admin/profiles">admin panel</a>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {isCached && (
        <div className={styles.cachedBadge}>
          <span>✨ Cached</span>
        </div>
      )}

      <div className={styles.contentScroll} ref={scrollRef}>
        {/* Profile Info */}
        {fromProfile && toProfile && (
          <div className={styles.profileInfo}>
            <div className={styles.profileCard}>
              <h4>{fromProfile.username}</h4>
              <p>{fromProfile.context}</p>
            </div>
            <div className={styles.arrow}>→</div>
            <div className={styles.profileCard}>
              <h4>{toProfile.username}</h4>
              <p>{toProfile.context}</p>
            </div>
          </div>
        )}

        {/* Preview Section */}
        <div className={styles.previewSection}>
          <h3>Generated Page Preview</h3>
          <div
            className={styles.generatedContent}
            dangerouslySetInnerHTML={{ __html: generatedHtml }}
          />
        </div>

        {/* Previous Responses Section */}
        {responses.length > 0 && (
          <div className={styles.responsesSection}>
            <h3>💬 Previous Responses ({responses.length})</h3>
            <div className={styles.responsesList}>
              {responses.map((resp: any) => {
                const responseDate = new Date(resp.createdAt);
                const formattedDate = responseDate.toLocaleString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                });

                return (
                  <div key={resp.id} className={styles.responseCard}>
                    <div className={styles.responseHeader}>
                      <span className={styles.responseAuthor}>
                        {toProfile?.username}
                      </span>
                      <span className={styles.responseTime}>
                        {formattedDate}
                      </span>
                    </div>
                    <p className={styles.responseText}>{resp.responseText}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Source Code Section */}
        <div className={styles.sourceSection}>
          <div className={styles.sourceHeader}>
            <h3>HTML Source</h3>
            <div className={styles.sourceActions}>
              <IconButton
                icon={<CopyIcon />}
                text="Copy"
                onClick={handleCopyHtml}
                title="Copy HTML to clipboard"
                bordered
              />
              <IconButton
                icon={<DownloadIcon />}
                text="Download"
                onClick={handleDownloadHtml}
                title="Download as HTML file"
                bordered
              />
            </div>
          </div>
          <textarea
            className={chatStyles["chat-input"]}
            value={generatedHtml}
            readOnly
            rows={20}
          />
        </div>

        {/* User Response Section */}
        <div className={styles.responseSection}>
          <h3>💝 Share Your Response</h3>
          <p className={styles.responseSubtext}>
            {toProfile?.username && fromProfile?.username
              ? `How would ${toProfile.username} like to respond to ${fromProfile.username}?`
              : "Share your thoughts..."}
          </p>
          <textarea
            className={chatStyles["chat-input"]}
            value={userResponse}
            onChange={(e) => setUserResponse(e.currentTarget.value)}
            placeholder="Write your response here... This will be saved to the database!"
            rows={8}
          />
          <div className={styles.responseActions}>
            <IconButton
              icon={<SendWhiteIcon />}
              text="Save Response"
              className={styles.submitBtn}
              type="primary"
              onClick={handleSubmitResponse}
              disabled={submittingResponse}
            />
            {submittingResponse && (
              <span className={styles.submitting}>Saving...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
