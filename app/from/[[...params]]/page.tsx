"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.scss";

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
}

export default function ActInLovePage({ params }: PageParams) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    const generatePage = async () => {
      try {
        // Parse the URL parameters
        // URL pattern: /from/{username}/to/{username} or /from/{username}/to/{username}/say/{message}
        // params.params will be: [username, 'to', username] or [username, 'to', username, 'say', message]
        const urlParams = params.params || [];

        if (urlParams.length < 3) {
          setError(
            "Invalid URL format. Expected: /from/{username}/to/{username} or /from/{username}/to/{username}/say/{message}",
          );
          setLoading(false);
          return;
        }

        // Extract from and to parameters
        // urlParams[0] = fromUser
        // urlParams[1] = 'to'
        // urlParams[2] = toUser
        // urlParams[3] = 'say' (optional)
        // urlParams[4] = message (optional)
        if (urlParams[1] !== "to") {
          setError("Invalid URL format. Missing 'to' keyword.");
          setLoading(false);
          return;
        }

        const fromUser = urlParams[0];
        const toUser = urlParams[2];

        // Check if there's a custom message
        let customMessage: string | undefined;
        if (urlParams.length >= 5 && urlParams[3] === "say") {
          customMessage = urlParams[4];
        }

        // Call the generate-page API
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
          setLoading(false);
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
  }, [params]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <h2 className={styles.loadingText}>Creating something special...</h2>
          <p className={styles.loadingSubtext}>
            Generating a personalized page just for you
          </p>
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
      <div
        className={styles.generatedContent}
        dangerouslySetInnerHTML={{ __html: generatedHtml }}
      />
    </div>
  );
}
