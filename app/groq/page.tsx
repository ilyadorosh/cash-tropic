"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function GroqPage() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlPrompt = searchParams.get("prompt");
    if (urlPrompt) {
      setPrompt(urlPrompt);
      handleSubmit(urlPrompt);
    }
  }, [searchParams]);

  const handleSubmit = async (promptText?: string) => {
    const textToSubmit = promptText || prompt;
    
    if (!textToSubmit.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: textToSubmit }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError("Failed to send request");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Groq API Test</h1>
      
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="prompt" style={{ display: "block", marginBottom: "5px" }}>
            Prompt:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            cols={80}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
            placeholder="Enter your prompt here..."
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#ccc" : "#007cba",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Sending..." : "Submit"}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: "20px", color: "red" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div style={{ marginTop: "20px" }}>
          <h2>Response:</h2>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}