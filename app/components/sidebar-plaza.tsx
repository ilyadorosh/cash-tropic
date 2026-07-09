"use client";

/* The mini plaza — the sidebar's empty space is the effortless selector.
   Models and masks stand as little people; one tap switches who you're
   talking to (models) or opens a new chat wearing a system prompt (masks).
   No dropdowns, no menus, no walking required — the walkable Plaza and the
   3D city are one tap away for when you want the experience.

   Perf: pure DOM, no canvas, no animation loop — costs nothing while idle. */

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store";
import { ModelType } from "../store/config";
import { Mask, useMaskStore } from "../store/mask";
import { ServiceProvider, Path } from "../constant";
import { useAllModels } from "../utils/hooks";
import { showToast } from "./ui-lib";
import { hueOf } from "./plaza-utils";

const MAX_MODELS = 8;
const MAX_MASKS = 4;

// the same little person the big Plaza draws, in CSS: body + head circles
function Person(props: {
  hue: number;
  label: string;
  title: string;
  current?: boolean;
  square?: boolean; // masks are the square-ish folks
  onClick: () => void;
}) {
  const { hue, label, title, current, square, onClick } = props;
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        width: 54,
        padding: "4px 0",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <span style={{ position: "relative", width: 24, height: 24 }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: square ? "30%" : "50%",
            background: `hsl(${hue} 55% 55%)`,
            border: current
              ? "2px solid #e6b800"
              : `2px solid hsl(${hue} 45% 38%)`,
            boxShadow: current
              ? "0 0 7px rgba(230,184,0,0.65)"
              : "0 1px 2px rgba(0,0,0,0.25)",
            boxSizing: "border-box",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: 3,
            transform: "translateX(-50%)",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: `hsl(${hue} 35% 30%)`,
          }}
        />
      </span>
      <span
        style={{
          fontSize: 9,
          lineHeight: "11px",
          maxWidth: 54,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "var(--black)",
          opacity: current ? 0.95 : 0.7,
          fontWeight: current ? 700 : 400,
        }}
      >
        {label}
      </span>
    </button>
  );
}

export default function SidebarPlaza() {
  const chatStore = useChatStore();
  const maskStore = useMaskStore();
  const navigate = useNavigate();
  const allModels = useAllModels();

  const session = chatStore.currentSession();
  const currentModel = session.mask.modelConfig.model;
  const currentProvider = session.mask.modelConfig?.providerName;

  const models = useMemo(() => {
    const available = allModels.filter((m) => m.available);
    const def = available.find((m) => m.isDefault);
    const ordered = def
      ? [def, ...available.filter((m) => m !== def)]
      : available;
    return ordered.slice(0, MAX_MODELS);
  }, [allModels]);

  const masks = useMemo(
    () => maskStore.getAll().slice(0, MAX_MASKS),
    [maskStore],
  );

  const pickModel = (name: string, provider?: string) => {
    chatStore.updateCurrentSession((s) => {
      s.mask.modelConfig.model = name as ModelType;
      if (provider)
        s.mask.modelConfig.providerName = provider as ServiceProvider;
      s.mask.syncGlobalConfig = false;
    });
    showToast(`now talking to ${name}`);
  };

  const pickMask = (mask: Mask) => {
    chatStore.newSession(mask);
    navigate(Path.Chat);
    showToast(`new chat as ${mask.name}`);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.5,
    color: "var(--black)",
    padding: "2px 4px 0",
  };
  const rowStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
  };

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: "1px solid var(--border-in-light, rgba(128,128,128,0.2))",
        marginTop: 6,
        paddingTop: 4,
        // plaza floor
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 17px, rgba(128,128,128,0.07) 17px, rgba(128,128,128,0.07) 18px)," +
          "repeating-linear-gradient(90deg, transparent, transparent 17px, rgba(128,128,128,0.07) 17px, rgba(128,128,128,0.07) 18px)",
        borderRadius: 8,
      }}
    >
      <div style={labelStyle}>models — tap to talk</div>
      <div style={rowStyle}>
        {models.map((m) => {
          const provider = m?.provider?.providerName;
          return (
            <Person
              key={`${m.name}@${provider}`}
              hue={hueOf(provider || m.name)}
              label={m.displayName || m.name}
              title={`${m.displayName || m.name} (${provider ?? "?"})`}
              current={
                m.name === currentModel &&
                (!currentProvider || provider === currentProvider)
              }
              onClick={() => pickModel(m.name, provider)}
            />
          );
        })}
      </div>
      <div style={labelStyle}>masks — tap for a new chat</div>
      <div style={rowStyle}>
        {masks.map((mask) => (
          <Person
            key={mask.id}
            square
            hue={hueOf(mask.name)}
            label={mask.name}
            title={`${mask.name} — system prompt + model config`}
            onClick={() => pickMask(mask)}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, padding: "4px 4px 6px" }}>
        <button
          style={miniDoor}
          title="open the walkable plaza"
          onClick={() => {
            navigate(Path.Chat);
            // ChatActions listens for this; slight delay so the chat mounts
            setTimeout(() => window.dispatchEvent(new Event("open-plaza")), 80);
          }}
        >
          ⚡ plaza
        </button>
        <button
          style={miniDoor}
          title="the 3D city — models, temperature, the world"
          onClick={() => (window.location.href = "/game")}
        >
          🎮 city
        </button>
        <button
          style={miniDoor}
          title="all masks"
          onClick={() => navigate(Path.Masks)}
        >
          🎭 masks
        </button>
      </div>
    </div>
  );
}

const miniDoor: React.CSSProperties = {
  flex: 1,
  fontSize: 10.5,
  padding: "5px 2px",
  borderRadius: 8,
  border: "1px solid var(--border-in-light, rgba(128,128,128,0.3))",
  background: "var(--white)",
  color: "var(--black)",
  cursor: "pointer",
};
