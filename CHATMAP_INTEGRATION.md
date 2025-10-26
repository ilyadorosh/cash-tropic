# ChatMapSidebar Integration Guide

## Overview
The ChatMapSidebar component provides a visual navigation pane for browsing all stored chats in the NextChat UI.

## Files Created

### 1. `/app/lib/useChatStore.ts`
Custom React hook for managing chat metadata in localStorage.

**Key Features:**
- Stores chat data under the key `"nextchat-map"` in localStorage
- Emits custom DOM event `chatstore:update` when the list changes
- Provides methods: `addChat`, `updateChat`, `deleteChat`, `getChat`, `loadChats`

**Type Definitions:**
```typescript
export type ChatId = string;

export interface ChatMeta {
  id: ChatId;
  title: string;          // first user message or a custom name
  createdAt: number;      // epoch ms
  updatedAt: number;      // epoch ms
  thumb?: string;         // optional base64 thumbnail
  snippet: string;        // short excerpt (first ~200 chars)
}
```

### 2. `/components/ChatMapSidebar.tsx`
Client-side React component that renders the chat navigation sidebar.

**Key Features:**
- 260px wide vertical sidebar
- Header: "📍 Chat Map"
- Search input for filtering by title or snippet
- Scrollable list of chats (newest first)
- Each item shows: title, formatted date, snippet preview (~80 chars)
- Click navigation to `/chat/[id]` with `?prompt=` query param
- Inline styles with hover feedback
- Accessible with aria-labels and keyboard navigation (tabIndex)
- Empty state handling ("No chats yet...")

## Integration Steps

### Already Integrated:
The ChatMapSidebar has been added to the main Home component:

1. **Import added to** `/app/components/home.tsx`:
   ```typescript
   import ChatMapSidebar from "../../components/ChatMapSidebar";
   ```

2. **Component rendered** in the Screen component's renderContent function (line ~180):
   ```typescript
   return (
     <>
       <ChatMapSidebar />
       <SideBar className={isHome ? styles["sidebar-show"] : ""} />
       <WindowContent>
         ...
       </WindowContent>
     </>
   );
   ```

The sidebar will now appear on the left side of the interface, before the existing SideBar component.

## Optional: Query Param Handling for Chat Page

To pre-fill the textarea with the snippet when navigating to a chat, you can add this code to the Chat component:

```typescript
import { useSearchParams } from 'react-router-dom';

// Inside your Chat component:
const [searchParams] = useSearchParams();
const promptFromUrl = searchParams.get('prompt');

// In your useEffect or where you initialize the chat:
useEffect(() => {
  if (promptFromUrl) {
    // Set the prompt in your textarea/input
    // Example: setUserInput(promptFromUrl);
    // Or if using PromptContext: setPrompt(promptFromUrl);
  }
}, [promptFromUrl]);
```

## Usage

### Adding a Chat:
```typescript
import { useChatStore } from '../app/lib/useChatStore';

function MyComponent() {
  const { addChat } = useChatStore();
  
  const createNewChat = () => {
    addChat({
      title: "My Chat Title",
      snippet: "This is the first message or snippet from the chat...",
      thumb: "data:image/png;base64,..." // optional
    });
  };
}
```

### Updating a Chat:
```typescript
const { updateChat } = useChatStore();

updateChat(chatId, {
  title: "Updated Title",
  snippet: "Updated snippet..."
});
```

## Styling Notes

The component uses inline styles for simplicity and portability. Key style features:
- Clean, modern design with subtle shadows and borders
- Smooth hover transitions
- Responsive to user interactions
- Follows accessible design principles

## Accessibility

- Search input has `aria-label="Search chats by title or snippet"`
- Each chat item has `aria-label="Open chat: {title}"`
- All interactive elements are keyboard accessible (`tabIndex={0}`)
- Supports Enter and Space key for activation

## Browser Compatibility

- Uses modern JavaScript features (ES6+)
- Requires browser support for:
  - localStorage
  - CustomEvent API
  - React Hooks
  - CSS flexbox

## Future Enhancements (Optional)

- Responsive design for mobile (collapse to top bar)
- Thumbnail display if provided
- Delete/edit actions on chat items
- Drag-and-drop to reorder
- Export/import chat history
- Advanced search filters (by date range, etc.)
