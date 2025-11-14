# Saved Messages Feature

## Overview

The Saved Messages feature allows users to save individual chat messages for later use. Saved messages can be accessed via prompt shortcuts and inserted back into the chat input.

## Features

### 1. Save Message
- Click the "Save" button next to any message in the chat
- Message is saved to:
  - Local storage (via Zustand persist)
  - Backend file: `data/saved_messages.json`
  - Redis (if configured with Upstash)
- Displays success toast with quick action to view saved messages

### 2. Insert Message
- Click the "Insert" button next to any message
- Message content is populated into the chat input
- Input is automatically focused for editing/sending

### 3. Access Saved Messages via Prompt
- Type `/saved` in the chat input
- Saved messages appear as prompt suggestions
- Use arrow keys to navigate, Enter to select
- Selected message content fills the chat input
- Search functionality: Type `/saved <search term>` to filter saved messages

## Technical Implementation

### Storage Architecture
- **Local Storage**: Zustand store with persistence (`saved-message-store`)
- **Backend File**: JSON file at `data/saved_messages.json`
- **Redis**: Optional storage via Upstash (keys: `saved_message:{id}`)

### API Endpoints

#### POST `/api/save-message`
Save a new message.

**Request Body:**
```json
{
  "content": "Message text",
  "role": "user" | "assistant",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "unique-id",
    "content": "Message text",
    "role": "user",
    "savedAt": 1234567890,
    "sessionId": "optional-session-id"
  }
}
```

#### GET `/api/save-message`
Retrieve all saved messages.

**Response:**
```json
{
  "success": true,
  "messages": [...]
}
```

### Store Methods

**useSavedMessageStore:**
- `add(message)` - Add a saved message
- `get(id)` - Get message by ID
- `remove(id)` - Remove a message
- `getAll()` - Get all saved messages (sorted by savedAt desc)
- `search(text)` - Search messages using Fuse.js

### UI Components

**Chat Actions:**
- Save button: Uses `UploadIcon`, calls `onSaveMessage()`
- Insert button: Uses `ReturnIcon`, calls `onInsertMessage()`

**Prompt Integration:**
- Saved messages appear in prompt hints when typing `/saved`
- Display format: `💾 {first 30 chars}...`
- Full content shown in prompt preview

## Configuration

### Redis (Optional)
Set environment variables for Upstash Redis integration:
```
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

## File Structure

```
app/
  api/
    save-message/
      route.ts          # API endpoint for saving/retrieving messages
  store/
    saved-messages.ts   # Zustand store with persistence
  components/
    chat.tsx            # UI integration (Save/Insert buttons)
data/
  saved_messages.json   # Backend storage file (auto-generated)
  README.md            # Data directory documentation
```

## Usage Examples

### Save a Message
1. Have a conversation in the chat
2. Hover over any message to reveal action buttons
3. Click "Save" button
4. Toast notification confirms save
5. Click "Show Saved" in toast to open saved messages prompt

### Insert a Message
1. Click "Insert" button next to any message
2. Message content appears in chat input
3. Edit or send as needed

### Access via Prompt
1. Type `/saved` in chat input
2. See list of all saved messages
3. Type `/saved meeting` to search for messages containing "meeting"
4. Use arrow keys to navigate
5. Press Enter or click to select

## Notes

- Saved messages persist across sessions
- Each save creates a new entry (no duplicate prevention)
- Messages are stored with original role (user/assistant)
- Search is fuzzy and matches message content
- File storage uses JSON with pretty printing for readability
- Redis storage is optional and fails gracefully if unavailable
