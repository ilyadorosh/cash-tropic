"use client";

import React, { useState, useEffect } from "react";
import styles from "./profiles.module.scss";
import AuthGuard from "@/app/components/AuthGuard";

interface Profile {
  id: string;
  username: string;
  context: string;
  createdAt: string;
}

export default function AdminProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({ username: "", context: "" });
  const [isNewProfile, setIsNewProfile] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/profiles");
      const data = await response.json();

      if (data.success) {
        setProfiles(data.profiles);
      } else {
        setError(data.error || "Failed to fetch profiles");
      }
    } catch (err) {
      setError("Failed to fetch profiles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchProfiles();
        setEditingProfile(null);
        setIsNewProfile(false);
        setFormData({ username: "", context: "" });
      } else {
        setError(data.error || "Failed to save profile");
      }
    } catch (err) {
      setError("Failed to save profile");
      console.error(err);
    }
  };

  const handleDelete = async (username: string) => {
    if (!confirm(`Are you sure you want to delete profile "${username}"?`)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `/api/admin/profiles?username=${encodeURIComponent(username)}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.success) {
        await fetchProfiles();
      } else {
        setError(data.error || "Failed to delete profile");
      }
    } catch (err) {
      setError("Failed to delete profile");
      console.error(err);
    }
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({ username: profile.username, context: profile.context });
    setIsNewProfile(false);
  };

  const handleNewProfile = () => {
    setEditingProfile(null);
    setFormData({ username: "", context: "" });
    setIsNewProfile(true);
  };

  const handleCancel = () => {
    setEditingProfile(null);
    setIsNewProfile(false);
    setFormData({ username: "", context: "" });
    setError(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Profile Management</h1>
        <p className={styles.subtitle}>
          Manage profiles for the ActInLove feature
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {!editingProfile && !isNewProfile && (
        <button className={styles.newButton} onClick={handleNewProfile}>
          + Create New Profile
        </button>
      )}

      {(editingProfile || isNewProfile) && (
        <div className={styles.form}>
          <h2>{isNewProfile ? "New Profile" : "Edit Profile"}</h2>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="e.g., ilya, mideia"
              disabled={!!editingProfile}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="context">Context</label>
            <textarea
              id="context"
              value={formData.context}
              onChange={(e) =>
                setFormData({ ...formData, context: e.target.value })
              }
              placeholder="Enter context about this person (interests, personality, memories, etc.)"
              rows={10}
              className={styles.textarea}
            />
          </div>

          <div className={styles.formActions}>
            <button onClick={handleSave} className={styles.saveButton}>
              Save
            </button>
            <button onClick={handleCancel} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.profileList}>
        <h2>Existing Profiles ({profiles.length})</h2>
        {profiles.length === 0 ? (
          <p className={styles.emptyState}>
            No profiles yet. Create one to get started!
          </p>
        ) : (
          <div className={styles.profiles}>
            {profiles.map((profile) => (
              <div key={profile.id} className={styles.profileCard}>
                <div className={styles.profileHeader}>
                  <h3>{profile.username}</h3>
                  <div className={styles.profileActions}>
                    <button
                      onClick={() => handleEdit(profile)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(profile.username)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <AuthGuard>
                  <div className={styles.profileContext}>
                    {profile.context || (
                      <em className={styles.noContext}>No context provided</em>
                    )}
                  </div>
                </AuthGuard>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
