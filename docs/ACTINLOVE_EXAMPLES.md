# ActInLove Feature - Usage Examples

## Quick Start

### 1. Run Database Migration

First, ensure your PostgreSQL database is set up and run the migration:

```bash
# If using psql directly
psql $POSTGRES_URL -f drizzle/migrations/001_actinlove_tables.sql

# Or copy the SQL and run it in your database admin panel
```

### 2. Access Admin Interface

Navigate to the admin interface in your browser:

```
http://localhost:3000/admin/profiles
```

or in production:

```
https://yourdomain.com/admin/profiles
```

### 3. Create Your First Profiles

Using the admin interface, create two profiles:

**Profile 1:**
- Username: `ilya`
- Context:
```
A creative and thoughtful person who loves cinema and meaningful conversations.
Enjoys photography and art. Has a great sense of humor and appreciates genuine connections.
```

**Profile 2:**
- Username: `mideia`
- Context:
```
Loves cinema and thoughtful experiences. Has a warm, caring personality.
Appreciates art, music, and deep conversations. Values authentic relationships.
```

### 4. Generate Your First Page

#### Using cURL:

```bash
curl -X POST http://localhost:3000/api/generate-page \
  -H "Content-Type: application/json" \
  -d '{
    "from": "ilya",
    "to": "mideia",
    "say": "imissgoingtothecinemawithyou"
  }'
```

#### Using JavaScript/Fetch:

```javascript
const response = await fetch('/api/generate-page', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'ilya',
    to: 'mideia',
    say: 'imissgoingtothecinemawithyou'
  })
});

const data = await response.json();
if (data.success) {
  console.log('HTML:', data.html);
  console.log('Was cached:', data.cached);
}
```

#### Expected Response:

```json
{
  "success": true,
  "html": "<!DOCTYPE html><html>...</html>",
  "cached": false
}
```

The second time you make the same request, you'll get:

```json
{
  "success": true,
  "html": "<!DOCTYPE html><html>...</html>",
  "cached": true
}
```

## Advanced Examples

### Generate Different Messages

```bash
# Without custom message
curl -X POST http://localhost:3000/api/generate-page \
  -H "Content-Type: application/json" \
  -d '{"from": "ilya", "to": "mideia"}'

# With different custom messages
curl -X POST http://localhost:3000/api/generate-page \
  -H "Content-Type: application/json" \
  -d '{"from": "ilya", "to": "mideia", "say": "thankyouforeverything"}'

curl -X POST http://localhost:3000/api/generate-page \
  -H "Content-Type: application/json" \
  -d '{"from": "ilya", "to": "mideia", "say": "happybirthday"}'
```

### Programmatic Profile Management

```javascript
// Create a profile
const createProfile = async (username, context) => {
  const response = await fetch('/api/admin/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, context })
  });
  return response.json();
};

// Get all profiles
const getProfiles = async () => {
  const response = await fetch('/api/admin/profiles');
  return response.json();
};

// Delete a profile
const deleteProfile = async (username) => {
  const response = await fetch(`/api/admin/profiles?username=${username}`, {
    method: 'DELETE'
  });
  return response.json();
};

// Usage
await createProfile('john', 'A musician who loves jazz and poetry');
const { profiles } = await getProfiles();
console.log(profiles);
await deleteProfile('john');
```

## Full Example Workflow

```javascript
// 1. Create profiles
await fetch('/api/admin/profiles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'alice',
    context: 'A software engineer who loves hiking and reading sci-fi novels'
  })
});

await fetch('/api/admin/profiles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'bob',
    context: 'A graphic designer with a passion for minimalist art and coffee'
  })
});

// 2. Generate a page
const response = await fetch('/api/generate-page', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'alice',
    to: 'bob',
    say: 'letsgrabhikingthisweekend'
  })
});

const { html, cached } = await response.json();

// 3. Display the HTML
document.getElementById('content').innerHTML = html;
```

## Error Handling

```javascript
const generatePage = async (from, to, say = null) => {
  try {
    const response = await fetch('/api/generate-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, say })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate page');
    }

    return data;
  } catch (error) {
    console.error('Error generating page:', error);
    throw error;
  }
};

// Usage
try {
  const result = await generatePage('ilya', 'mideia', 'hello');
  console.log('Generated:', result.html);
} catch (error) {
  console.error('Failed:', error.message);
}
```

## Testing Script

A comprehensive testing script is provided. Run it with:

```bash
# Make sure your dev server is running
npm run dev

# In another terminal
./scripts/test-actinlove.sh
```

This will test all endpoints and show you the results.

## Next Steps (Phase 2)

In Phase 2, we'll add:
- Dynamic route handler for URLs like `/from/ilya/to/mideia`
- Beautiful frontend page to display generated content
- Loading states and animations
- Better error handling UI
- URL sharing capabilities

Stay tuned!
