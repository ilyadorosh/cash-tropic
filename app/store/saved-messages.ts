import Fuse from "fuse.js";
import { StoreKey } from "../constant";
import { nanoid } from "nanoid";
import { createPersistStore } from "../utils/store";

export interface SavedMessage {
  id: string;
  content: string;
  role: string;
  savedAt: number;
  sessionId?: string;
}

export const SavedMessageSearchService = {
  ready: false,
  engine: new Fuse<SavedMessage>([], { keys: ["content"] }),
  allSavedMessages: [] as SavedMessage[],

  init(savedMessages: SavedMessage[]) {
    if (this.ready) {
      return;
    }
    this.allSavedMessages = savedMessages;
    this.engine.setCollection(savedMessages);
    this.ready = true;
  },

  remove(id: string) {
    this.engine.remove((doc) => doc.id === id);
  },

  add(message: SavedMessage) {
    this.engine.add(message);
  },

  search(text: string) {
    if (text.length === 0) {
      return this.allSavedMessages;
    }
    return this.engine.search(text).map((v) => v.item);
  },
};

export const useSavedMessageStore = createPersistStore(
  {
    messages: {} as Record<string, SavedMessage>,
  },

  (set, get) => ({
    add(message: SavedMessage) {
      const messages = get().messages;
      message.id = message.id || nanoid();
      message.savedAt = message.savedAt || Date.now();
      messages[message.id] = message;

      set(() => ({
        messages: messages,
      }));

      SavedMessageSearchService.add(message);

      return message.id;
    },

    get(id: string) {
      return get().messages[id];
    },

    remove(id: string) {
      const messages = get().messages;
      delete messages[id];

      SavedMessageSearchService.remove(id);

      set(() => ({
        messages,
      }));
    },

    getAll() {
      const savedMessages = Object.values(get().messages ?? {});
      savedMessages.sort((a, b) => b.savedAt - a.savedAt);
      return savedMessages;
    },

    search(text: string) {
      if (text.length === 0) {
        return this.getAll();
      }
      return SavedMessageSearchService.search(text) as SavedMessage[];
    },
  }),
  {
    name: StoreKey.SavedMessage,
    version: 1,

    onRehydrateStorage(state) {
      return (state, error) => {
        if (error) {
          console.error("[SavedMessage] rehydrate error", error);
          return;
        }
        const savedMessages = state?.getAll() ?? [];
        SavedMessageSearchService.init(savedMessages);
      };
    },
  },
);
