"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "./button";
import styles from "./ActInLoveNav.module.scss";

export function ActInLoveNav() {
  const router = useRouter();

  return (
    <div className={styles.actinloveNav}>
      <div className={styles.navContent}>
        <div className={styles.navActions}>
          <IconButton
            text="View Conversations"
            onClick={() => router.push("/conversations")}
            title="See all your conversations"
            bordered
          />
          <IconButton
            text="Profiles"
            onClick={() => router.push("/admin/profiles")}
            title="Create new profiles or generate pages"
            type="primary"
          />
        </div>
      </div>
    </div>
  );
}
