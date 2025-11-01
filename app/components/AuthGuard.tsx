"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken"); // or sessionStorage
      if (token) {
        // Quick verify (add your backend call here if needed)
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div>
        Password: flush (or your key).{" "}
        <button
          onClick={() => {
            const pass = prompt("Password:");
            if (pass === "flush") {
              localStorage.setItem("authToken", "valid");
              setIsAuthenticated(true);
            }
          }}
        >
          Enter
        </button>
      </div>
    );
  }

  return children;
}
