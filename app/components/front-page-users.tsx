"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./front-page.module.scss";

interface Profile {
  id: string;
  username: string;
  context: string;
  createdAt: string;
}

export default function UsersPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [context, setContext] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/profiles");
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch profiles");
      }
    } catch {
      setError("Failed to fetch profiles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const resetForm = () => {
    setUsername("");
    setContext("");
    setEditing(null);
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      const res = await fetch("/api/admin/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), context }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchProfiles();
        resetForm();
      } else {
        setError(data.error || "Failed to save profile");
      }
    } catch {
      setError("Failed to save profile");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete profile "${name}"?`)) return;
    try {
      setBusy(true);
      setError(null);
      const res = await fetch(
        `/api/admin/profiles?username=${encodeURIComponent(name)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (data.success) {
        await fetchProfiles();
        if (editing === name) resetForm();
      } else {
        setError(data.error || "Failed to delete profile");
      }
    } catch {
      setError("Failed to delete profile");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = (p: Profile) => {
    setEditing(p.username);
    setUsername(p.username);
    setContext(p.context || "");
  };

  return (
    <div className={styles.panelBox}>
      <h2 className={styles.sectionTitle}>User Management</h2>
      <p className={styles.sectionNote}>
        Create, edit and remove profiles ({profiles.length} total).
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formRow}>
        <input
          type="text"
          placeholder="username"
          value={username}
          disabled={!!editing}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="context (interests, personality, memories…)"
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
        <button className={styles.button} onClick={handleSave} disabled={busy}>
          {editing ? "Save" : "+ Add"}
        </button>
        {editing && (
          <button className={styles.buttonSecondary} onClick={resetForm}>
            Cancel
          </button>
        )}
      </div>

      {loading ? (
        <p className={styles.muted}>Loading profiles…</p>
      ) : profiles.length === 0 ? (
        <p className={styles.muted}>
          No profiles yet — create the first one above.
        </p>
      ) : (
        <div className={styles.list}>
          {profiles.map((p) => (
            <div key={p.id} className={styles.listItem}>
              <div className={styles.listItemMain}>
                <div className={styles.listItemTitle}>{p.username}</div>
                <div className={styles.listItemSub}>
                  {p.context || <em>no context</em>}
                </div>
              </div>
              <div className={styles.listItemActions}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => handleEdit(p)}
                  disabled={busy}
                >
                  Edit
                </button>
                <button
                  className={styles.buttonDanger}
                  onClick={() => handleDelete(p.username)}
                  disabled={busy}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
