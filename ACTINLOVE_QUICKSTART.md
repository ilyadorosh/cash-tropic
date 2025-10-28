# ActInLove Feature - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### What is ActInLove?

Generate beautiful, personalized webpages using AI. Perfect for sending heartfelt messages to loved ones.

**Example URLs (Phase 2):**
- `yourdomain.com/from/ilya/to/mideia`
- `yourdomain.com/from/ilya/to/mideia/say/imissyou`

## 📋 Prerequisites

- PostgreSQL database
- OpenAI API key
- Node.js environment

## ⚡ Quick Setup

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

### 4. Create Your First Profile

Visit: `http://localhost:3000/admin/profiles`

Click "Create New Profile" and add:
- **Username:** ilya
- **Context:** Loves cinema and meaningful conversations

### 5. Generate Your First Page

```bash
curl -X POST http://localhost:3000/api/generate-page \
  -H "Content-Type: application/json" \
  -d '{
    "from": "ilya",
    "to": "mideia",
    "say": "hello"
  }'
```

## 📚 Full Documentation

- **[Phase 1 Documentation](./docs/ACTINLOVE_PHASE1.md)** - Complete technical docs
- **[Usage Examples](./docs/ACTINLOVE_EXAMPLES.md)** - Code samples and examples
- **[Implementation Summary](./docs/ACTINLOVE_SUMMARY.md)** - Overview of what was built

## 🧪 Testing

```bash
# Bash test script
./scripts/test-actinlove.sh

# Node.js test script
node scripts/test-actinlove-api.js
```

## 🎯 What You Get

- ✅ Profile management system
- ✅ AI-powered page generation (GPT-4)
- ✅ Automatic caching
- ✅ Beautiful admin UI
- ✅ RESTful API

## 🔗 API Endpoints

- `GET /api/admin/profiles` - List profiles
- `POST /api/admin/profiles` - Create/update profile
- `DELETE /api/admin/profiles?username=X` - Delete profile
- `POST /api/generate-page` - Generate page

## 🎨 Features

- Beautiful, responsive HTML generation
- Context-aware AI prompts
- Database caching for performance
- Full CRUD operations
- Comprehensive error handling

## 📖 Learn More

See the full documentation in the `docs/` directory for:
- Detailed API documentation
- Usage examples
- Architecture decisions
- Testing guides

## 💡 Pro Tips

1. Add rich context to profiles for better AI-generated content
2. Generated pages are cached - same inputs = same output
3. Use the admin UI for quick profile management
4. Test with the provided scripts before production

## 🎯 Next Steps

Phase 2 will add:
- Dynamic routing (`/from/X/to/Y`)
- Frontend display pages
- Loading animations
- URL sharing

---

**Ready to create beautiful AI-generated pages!** 🚀
