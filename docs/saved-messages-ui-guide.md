# Saved Messages UI Guide

## UI Changes Overview

This document describes the visual changes and user interactions for the Saved Messages feature.

## Message Action Buttons

### Before
Each message in the chat had action buttons:
- Edit (pencil icon)
- Retry (reload icon) 
- Delete (trash icon)
- Pin (pin icon)
- Save (upload icon) - **was non-functional, only logged to console**
- Translate (flag icon)
- Copy (copy icon)

### After
Each message now has **functional Save and Insert buttons**:
- Edit (pencil icon)
- Retry (reload icon)
- Delete (trash icon)
- Pin (pin icon)
- **Save (upload icon)** - ✅ Now saves message to storage
- **Insert (return icon)** - ✅ NEW - Inserts message into input
- Translate (flag icon)
- Copy (copy icon)

## Save Button Interaction

### Visual Flow
```
User hovers over message
    ↓
Action buttons appear
    ↓
User clicks "Save" button (upload icon)
    ↓
Toast notification appears: "Message saved successfully! Use /saved to access it."
    [Show Saved] button in toast
    ↓
(Optional) Click "Show Saved" button
    ↓
Chat input auto-populates with "/saved "
```

### What Happens Behind the Scenes
1. Message content extracted
2. Sent to `/api/save-message` endpoint
3. Saved to three locations:
   - `data/saved_messages.json` file
   - Redis (if configured)
   - Browser localStorage (Zustand store)
4. Success confirmation shown

## Insert Button Interaction

### Visual Flow
```
User hovers over message
    ↓
Action buttons appear
    ↓
User clicks "Insert" button (return icon)
    ↓
Message content immediately appears in chat input
    ↓
Input automatically focused for editing
    ↓
User can edit and send as new message
```

## Prompt Hint Integration

### Accessing Saved Messages
```
User types "/saved" in chat input
    ↓
Prompt hints dropdown appears below input
    ↓
Shows list of saved messages formatted as:
    💾 [First 30 characters of message]...
    Full message content shown as preview
    ↓
User can:
    - Type more to search: "/saved meeting notes"
    - Use arrow keys to navigate list
    - Press Enter to select
    - Click on a suggestion
    ↓
Selected message content fills chat input
```

### Prompt Hints Visual

```
┌─────────────────────────────────────────────┐
│ Chat Input:                                 │
│ /saved meet_                                │
└─────────────────────────────────────────────┘
         ↓ Dropdown appears
┌─────────────────────────────────────────────┐
│ 💾 Meeting notes from yesterday...          │
│ [Full content preview below]                │
├─────────────────────────────────────────────┤
│ 💾 Meeting agenda for next week...          │
│ [Full content preview below]                │
├─────────────────────────────────────────────┤
│ 💾 Meeting action items...                  │
│ [Full content preview below]                │
└─────────────────────────────────────────────┘
```

## Toast Notifications

### Save Success Toast
```
┌─────────────────────────────────────────────┐
│ ✓ Message saved successfully!               │
│   Use /saved to access it.                  │
│                                              │
│                        [Show Saved]  [✕]    │
└─────────────────────────────────────────────┘
```

### Save Error Toast
```
┌─────────────────────────────────────────────┐
│ ✗ Failed to save message.                   │
│   Please try again.                         │
│                                              │
│                                      [✕]    │
└─────────────────────────────────────────────┘
```

## Icon Legend

- 📤 **Upload Icon (Save)**: Saves the message to persistent storage
- ↩️ **Return Icon (Insert)**: Inserts message content into chat input
- 💾 **Floppy Disk Emoji**: Indicates a saved message in prompt hints

## User Workflows

### Workflow 1: Save for Later Reference
```
1. Have a conversation with AI assistant
2. AI provides useful information
3. Hover over AI's message
4. Click "Save" button
5. See confirmation toast
6. Continue conversation or close chat
7. Later: Type "/saved" to find and reuse the information
```

### Workflow 2: Quick Message Reuse
```
1. See a message (yours or AI's) you want to send again
2. Click "Insert" button next to message
3. Message appears in input
4. Edit if needed
5. Send as new message
```

### Workflow 3: Build Message Library
```
1. Save multiple useful messages/prompts over time
2. Access them via "/saved" when needed
3. Search saved messages: "/saved {keyword}"
4. Quick access to frequently used content
```

## Accessibility

- All buttons have text labels for screen readers
- Keyboard navigation supported:
  - Tab to focus buttons
  - Enter to activate
  - Arrow keys to navigate prompt hints
  - Escape to close prompt hints
- Toast notifications are aria-live regions
- Focus management on insert action

## Mobile Considerations

- Action buttons appear on tap/long-press (platform dependent)
- Toast notifications positioned for mobile screens
- Prompt hints sized appropriately for mobile keyboards
- Touch-friendly button sizes maintained

## Performance Notes

- Saved messages loaded from localStorage on page load
- Search is instant with Fuse.js fuzzy matching
- Backend save is asynchronous, doesn't block UI
- Toast auto-dismisses after 3 seconds (standard)
