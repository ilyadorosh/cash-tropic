# ActInLove Feature - Complete Guide

## 🚀 What is ActInLove?

Generate beautiful, personalized webpages using AI. Perfect for sending heartfelt messages to loved ones through shareable URLs.

## ✨ Live Example

**Try it now:**
- Visit: `yourdomain.com/from/ilya/to/mideia`
- Or with a message: `yourdomain.com/from/ilya/to/mideia/say/imissyou`

The page will:
1. Show a beautiful loading animation
2. Generate personalized HTML using AI
3. Display the result full-screen
4. Cache for instant future loads

## 📋 Prerequisites

- PostgreSQL database
- OpenAI API key
- Node.js environment
- Next.js application

## ⚡ Quick Setup (5 Minutes)

### 1. Run Database Migration

```bash
psql $POSTGRES_URL -f drizzle/migrations/001_actinlove_tables.sql
```

### 2. Set Environment Variables

```bash
export POSTGRES_URL="your_postgres_url"
export OPENAI_API_KEY="your_openai_key"
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Create Your First Profiles

Visit: `http://localhost:3000/admin/profiles`

Click "Create New Profile" and add:

**Profile 1:**
- Username: `ilya`
- Context: `Loves cinema and meaningful conversations. Creative person who values genuine connections.`

**Profile 2:**
- Username: `mideia`
- Context: `Enjoys cinema and thoughtful experiences. Has a warm, caring personality.`

### 5. Visit Your First Page!

Open in browser:
```
http://localhost:3000/from/ilya/to/mideia
```

Watch the magic happen! ✨

## 🎯 Features

### Phase 1 (Backend) ✅
- ✅ Profile management system
- ✅ AI-powered page generation (GPT-4)
- ✅ Automatic caching in database
- ✅ Beautiful admin UI
- ✅ RESTful API

### Phase 2 (Frontend) ✅
- ✅ Dynamic URL routing
- ✅ Beautiful loading states
- ✅ Full-screen HTML display
- ✅ Error handling with helpful messages
- ✅ Responsive mobile design
- ✅ Cached content indicator

## 🔗 URLs You Can Use

### Admin Interface

```
/admin/profiles
```
Manage profiles: create, edit, delete

### Public Pages

```
/from/{username}/to/{username}
```
Basic personalized page

```
/from/{username}/to/{username}/say/{message}
```
Page with custom message included

## 🎨 How It Works

1. **User visits URL** → `/from/alice/to/bob`
2. **Loading screen** → Beautiful gradient with spinner
3. **Backend checks cache** → Is this page already generated?
4. **Generate or retrieve** → Use LLM or fetch from database
5. **Display page** → Full-screen personalized content
6. **Show badge** → ✨ Cached indicator if from cache

## 📖 API Endpoints

### Profile Management

```bash
# List all profiles
GET /api/admin/profiles

# Create/update profile
POST /api/admin/profiles
{
  "username": "alice",
  "context": "Your context here"
}

# Delete profile
DELETE /api/admin/profiles?username=alice
```

### Page Generation

```bash
# Generate page
POST /api/generate-page
{
  "from": "alice",
  "to": "bob",
  "say": "hello"  // optional
}
```

## 🧪 Testing

### Using the Admin Interface

1. Go to `/admin/profiles`
2. Create two profiles
3. Visit `/from/profile1/to/profile2`
4. See the generated page!

### Using cURL

```bash
# Test profile creation
curl -X POST http://localhost:3000/api/admin/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "context": "Test user context"
  }'

# Test page generation
curl -X POST http://localhost:3000/api/generate-page \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test",
    "to": "test",
    "say": "hello"
  }'
```

### Test Scripts

```bash
# Comprehensive testing
./scripts/test-actinlove.sh

# Or with Node.js
node scripts/test-actinlove-api.js
```

## 💡 Pro Tips

1. **Rich Context = Better Pages**
   - Add detailed, meaningful context to profiles
   - Include interests, personality traits, shared memories
   - The more context, the more personalized the output

2. **Cache is Smart**
   - Same URL = same cached page
   - Different message = new page generated
   - Check for ✨ badge to see cache hits

3. **URL Sharing**
   - URLs are clean and memorable
   - Perfect for sharing via text, email, QR codes
   - No authentication needed for viewing

4. **Mobile First**
   - All pages are fully responsive
   - Loading states look great on phones
   - Touch-friendly admin interface

## 🎭 Use Cases

### Personal Messages
- Birthday wishes
- Anniversary greetings
- Thank you notes
- Apologies
- Love letters

### Special Occasions
- Holidays
- Graduations
- New jobs
- Moving away

### Just Because
- "Thinking of you"
- "Miss you"
- "Proud of you"
- Random acts of kindness

## 🔐 Security Notes

For production deployment:

1. **Add Authentication**
   - Protect `/admin/profiles` route
   - Consider API key for generation endpoint

2. **Sanitize HTML**
   - Use DOMPurify or similar
   - Prevent XSS attacks

3. **Rate Limiting**
   - Limit API calls per IP
   - Prevent abuse of LLM generation

4. **Environment Variables**
   - Never commit API keys
   - Use proper secret management

## 📊 Performance

- **First generation**: 3-5 seconds (LLM processing)
- **Cached loads**: < 1 second (database lookup)
- **Mobile performance**: Optimized for all devices
- **Caching**: Automatic and transparent

## 📚 Documentation

- **[Phase 1 Docs](./ACTINLOVE_PHASE1.md)** - Backend implementation details
- **[Phase 2 Docs](./ACTINLOVE_PHASE2.md)** - Frontend implementation details
- **[Examples](./ACTINLOVE_EXAMPLES.md)** - Code samples and usage
- **[Summary](./ACTINLOVE_SUMMARY.md)** - High-level overview

## 🐛 Troubleshooting

### "Profile not found" Error

**Problem**: Profiles don't exist in database

**Solution**: Create profiles in `/admin/profiles` first

### "Invalid URL format" Error

**Problem**: URL doesn't match expected pattern

**Solution**: Use `/from/{user}/to/{user}` or `/from/{user}/to/{user}/say/{msg}`

### Loading Forever

**Problem**: API key not configured or LLM error

**Solution**: 
- Check `OPENAI_API_KEY` environment variable
- Check server logs for errors
- Verify OpenAI API is accessible

### Styles Not Working

**Problem**: SCSS not compiling

**Solution**: 
- Ensure `sass` is installed: `npm install sass`
- Restart dev server

## 🎉 You're All Set!

You now have a complete AI-powered webpage generation system!

### What You Can Do

1. ✅ Create profiles for anyone
2. ✅ Generate personalized pages instantly
3. ✅ Share beautiful URLs
4. ✅ Enjoy automatic caching
5. ✅ Use on any device

### Share Your Creations

Create amazing personalized pages and share the URLs with:
- Text messages
- Emails
- QR codes
- Social media
- Anywhere you want!

---

**Need help?** Check the detailed documentation in the `docs/` directory.

**Found a bug?** Open an issue on GitHub.

**Have ideas?** Contributions welcome! 🚀
