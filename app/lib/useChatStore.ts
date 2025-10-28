"use client";

import { useEffect, useState, useCallback } from "react";

export type ChatId = string;

export interface ChatMeta {
  id: ChatId;
  title: string;          // first user message or a custom name
  createdAt: number;      // epoch ms
  updatedAt: number;      // epoch ms
  thumb?: string;         // optional base64 thumbnail
  snippet: string;        // short excerpt (first ~200 chars) – this is the "data" property we want to show
}

const STORAGE_KEY = "nextchat-map";
const UPDATE_EVENT = "chatstore:update";

/**
 * Custom hook for managing chat metadata in localStorage
 */
export function useChatStore() {
  const [chats, setChats] = useState<ChatMeta[]>([]);

  // Load chats from localStorage
  const loadChats = useCallback(() => {
    if (typeof window === "undefined") return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMeta[];
        setChats(parsed);
      }
    } catch (error) {
      console.error("Error loading chats from localStorage:", error);
      setChats([]);
    }
  }, []);

  // Save chats to localStorage
  const saveChats = useCallback((newChats: ChatMeta[]) => {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newChats));
      setChats(newChats);
      
      // Emit custom event to notify other components
      const event = new CustomEvent(UPDATE_EVENT, { detail: newChats });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error saving chats to localStorage:", error);
    }
  }, []);

  // Add a new chat
  const addChat = useCallback((chat: Omit<ChatMeta, "id" | "createdAt" | "updatedAt">) => {
    const newChat: ChatMeta = {
      ...chat,
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const newChats = [newChat, ...chats];
    saveChats(newChats);
    return newChat;
  }, [chats, saveChats]);

  // Update an existing chat
  const updateChat = useCallback((id: ChatId, updates: Partial<ChatMeta>) => {
    const newChats = chats.map(chat =>
      chat.id === id
        ? { ...chat, ...updates, updatedAt: Date.now() }
        : chat
    );
    saveChats(newChats);
  }, [chats, saveChats]);

  // Delete a chat
  const deleteChat = useCallback((id: ChatId) => {
    const newChats = chats.filter(chat => chat.id !== id);
    saveChats(newChats);
  }, [chats, saveChats]);

  // Get a specific chat
  const getChat = useCallback((id: ChatId) => {
    return chats.find(chat => chat.id === id);
  }, [chats]);

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Listen for updates from other tabs/components
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ChatMeta[]>;
      if (customEvent.detail) {
        setChats(customEvent.detail);
      } else {
        loadChats();
      }
    };

    window.addEventListener(UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(UPDATE_EVENT, handleUpdate);
  }, [loadChats]);

  return {
    chats,
    addChat,
    updateChat,
    deleteChat,
    getChat,
    loadChats,
  };
}
