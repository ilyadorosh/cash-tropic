# ActInLove Feature - Phase 1 Documentation

## Overview

The ActInLove feature allows you to create personalized, AI-generated webpages for people. The system uses profile information and LLM technology to generate beautiful, heartfelt webpages.

## Database Schema

### Profile Table
Stores information about individuals that can be referenced in generated pages.

- `id`: UUID (Primary Key)
- `username`: VARCHAR(64) UNIQUE - The person's username (e.g., "ilya", "mideia")
- `context`: TEXT - Information about the person (interests, personality, memories, etc.)
- `createdAt`: TIMESTAMP - When the profile was created

### GeneratedPage Table
Stores generated webpages and their metadata.

- `id`: UUID (Primary Key)
- `fromProfileId`: UUID (Foreign Key to Profile)
- `toProfileId`: UUID (Foreign Key to Profile)
- `customPrompt`: TEXT (Optional) - Custom message to incorporate
- `generatedHtml`: TEXT - The generated HTML content
- `createdAt`: TIMESTAMP - When the page was generated

## Setup Instructions

### 1. Database Migration

Run the migration to create the necessary tables:

```sql
-- Execute the migration file
\i drizzle/migrations/001_actinlove_tables.sql
```

Or if using the Vercel Postgres dashboard, copy and paste the SQL from `drizzle/migrations/001_actinlove_tables.sql`.

### 2. Environment Variables

Ensure you have the following environment variables set:

```bash
POSTGRES_URL=your_postgres_connection_string
OPENAI_API_KEY=your_openai_api_key
```

## Usage

### Admin Interface

Access the admin interface to manage profiles:

```
http://your-domain.com/admin/profiles
```

Features:
- View all profiles
- Create new profiles
- Edit existing profiles
- Delete profiles

### API Endpoints

#### 1. Profile Management

**Get All Profiles**
```
GET /api/admin/profiles
```

**Create/Update Profile**
```
POST /api/admin/profiles
Content-Type: application/json

{
  "username": "ilya",
  "context": "Loves cinema, enjoys thoughtful conversations, creative and artistic person"
}
```

**Delete Profile**
```
DELETE /api/admin/profiles?username=ilya
```

#### 2. Generate Page

**Generate a webpage**
```
POST /api/generate-page
Content-Type: application/json

{
  "from": "ilya",
  "to": "mideia",
  "say": "imissgoingtothecinemawithyou" // Optional
}
```

Response:
```json
{
  "success": true,
  "html": "<html>...</html>",
  "cached": false
}
```

## Example Workflow

1. **Create Profiles**
   - Navigate to `/admin/profiles`
   - Create a profile for "ilya" with context about him
   - Create a profile for "mideia" with context about her

2. **Generate a Page**
   - Make a POST request to `/api/generate-page`:
   ```bash
   curl -X POST http://localhost:3000/api/generate-page \
     -H "Content-Type: application/json" \
     -d '{
       "from": "ilya",
       "to": "mideia",
       "say": "imissgoingtothecinemawithyou"
     }'
   ```

3. **The API will:**
   - Fetch both profiles from the database
   - Construct a prompt with their context
   - Call OpenAI GPT-4 to generate beautiful HTML
   - Cache the result in the database
   - Return the HTML (subsequent requests with the same parameters will return the cached version)

## Caching

Generated pages are automatically cached in the database. If you request the same combination of `from`, `to`, and `say` parameters, the cached HTML will be returned instead of generating a new page.

## Future Enhancements (Phase 2)

- Dynamic route handler for URLs like `/from/ilya/to/mideia`
- Frontend page to display generated content
- Loading states and error handling UI
- Support for additional customization options

## Technical Details

### LLM Integration

- Uses OpenAI GPT-4 for content generation
- Temperature: 0.7 (balanced creativity)
- Max tokens: 2000
- System prompt ensures valid HTML output

### Security Considerations

- Profile context should not contain sensitive information
- Generated HTML is stored as-is (consider sanitization for production)
- API endpoints should be protected with authentication in production

## Development Notes

All code follows the existing project structure:
- Database schema in `app/lib/schema.ts`
- Database functions in `app/lib/drizzle.ts`
- API routes in `app/api/`
- Admin pages in `app/admin/`
