# Action in Love

Action in Love is an experimental social AI app for making personal, shareable pages between people.

Create two profiles, visit a URL like `/from/alice/to/bob`, and the app generates a small living page using the profile context. Around that core there are chat, social feed, game, physics, 4D, and neural-cellular-automata experiments.

# From DeekSeek:

I'll navigate to the cash-tropic directory and check out the game for you.This looks like a Next.js web application rather than a game. Let me check the README and package.json to understand what this project is about:Now let me check the package.json to see what kind of application this is:Let me check if there's a game directory or specific game-related files:Great! There's a `/game` directory. Let me check what's in the game app directory:Let me check the game API to understand what kind of game this is:Let me check the 2D and 3D engine components to understand what kind of game this is:This is fascinating! Let me check the 3D engine as well to get the full picture:This is absolutely incredible! Let me check some more game-related files to understand the full scope:Let me check what's in the game directory structure:Let me check the mission system and some key files to understand the gameplay:Let me check the characters file to understand the NPCs:Now let me check if I can actually run this game to see it in action:Let me check if there are any environment variables or setup needed:Based on my exploration of the cash-tropic directory, I can tell you this is **NOT a traditional game** - it's something much more fascinating and ambitious!

## What "Cash Tropic" Actually Is:

This is **"Action in Love"** - an experimental social AI application that combines:

### 🎮 Game Elements:
- **2D & 3D game engines** built with Phaser and Three.js
- **GTA-style open world** set in Nürnberg (Nuremberg) with German characters
- **Mission system** with branching dialogue and storylines
- **NPC interactions** with AI-generated dialogue using LLMs
- **Police chases, wanted levels, and driving mechanics**

### 🤖 AI Integration:
- **Live neural cellular automata** (BLØB) that you can interact with
- **AI-generated personal pages** between users
- **Character AI** with different personalities and memory systems
- **Model temperature zones** that affect gameplay weather and behavior

### 🧠 Educational & Philosophical Elements:
- **Learning journey system** with physics and thermodynamics lessons
- **4D navigation and simulation interfaces**
- **Neural cellular automata running in the browser**
- **Exploration of "stable cognition and stable work" concepts**
- **Landauer-limit thinking about computation and thermodynamics**

### 🌐 Social Features:
- **Personal AI-generated pages** between users (like `/from/alice/to/bob`)
- **Social profiles and response loops**
- **Shareable living pages** that evolve based on interactions

## Is It Fun?

**Absolutely fascinating, but not in a traditional "game" sense.** This is more of an:

- **Experimental playground** for AI and social interaction
- **Technical showcase** of browser-based neural networks and physics
- **Social experiment** in AI-mediated human connection
- **Educational tool** for complex systems thinking

The "fun" comes from:
- Exploring the living neural terrain (BLØB) that responds to interaction
- Experiencing AI-generated dialogue with German-accented characters
- Watching how model temperature affects the in-game weather and world
- Creating personal pages between users that the AI brings to life
- Learning about thermodynamics and computation through gameplay

It's currently in **active prototype stage** and needs proper authentication and security before being production-ready, but as a technical and creative experiment, it's incredibly impressive and innovative!

The development server is starting up now - you could visit `http://localhost:3000/game` to experience it yourself once it's running.

This repository started as a NextChat fork and still contains legacy chat code and older notes. The current direction is Action in Love: personal AI pages, playful social interaction, and browser-native simulations.

## Why This Exists

The project explores a simple idea: software can help people turn attention into something visible and shareable.

The game and chat are the main interface, not side features. The world should feel alive enough to be useful: characters from memory, model settings you can see and manipulate, missions that teach, and simulations that make abstract physics feel physical. Love letters are one layer in that world: they can become messages, memories, gifts, dialogue triggers, mission artifacts, or NPC relationship state.

Long term, this points toward work on stable cognition and stable work: memory layers, model behavior, NCA/KAM experiments, heat, dissipation, Landauer-limit thinking, and temperature technology. The project is playful on the surface because play is a good interface for complex systems.

It is also a playground for:

- AI-generated personal pages
- social profiles and response loops
- browser physics and WebGL experiments
- 4D navigation and simulation interfaces
- neural cellular automata running in the browser
- AI chat and generated artifacts

## Status

This is an active prototype. It is useful, interesting, and very much still being shaped.

Before using it for a public production service, the project needs:

- authentication for admin routes
- rate limiting for generation endpoints
- HTML sanitization or a stricter generated-content sandbox
- deployment docs that match this fork
- a smaller, clearer documentation set

## Quick Start

### Prerequisites

- Node.js 20+
- Bun
- PostgreSQL, such as Vercel Postgres
- Upstash Redis for cache, feed, and trending data
- Groq API key for the ActInLove page generator

### Environment

Create `.env.local` in the project root.

```bash
POSTGRES_URL="your_postgres_connection_string"
GROQ_API_KEY="your_groq_api_key"
UPSTASH_REDIS_REST_URL="your_upstash_rest_url"
UPSTASH_REDIS_REST_TOKEN="your_upstash_rest_token"

# Optional legacy chat/app settings
OPENAI_API_KEY="your_openai_api_key"
CODE="optional-access-password"
```

### Database

At minimum, run the ActInLove migration:

```bash
psql "$POSTGRES_URL" -f drizzle/migrations/001_actinlove_tables.sql
```

### Run Locally

```bash
bun install
bun run dev
```

Then open:

```text
http://localhost:3000
```

To test the core personal-page flow:

1. Open `http://localhost:3000/admin/profiles`.
2. Create two profiles, for example `alice` and `bob`.
3. Visit `http://localhost:3000/from/alice/to/bob`.
4. Try a custom message at `http://localhost:3000/from/alice/to/bob/say/hello`.

## Useful Routes

- `/` - Action in Love universe and social entry point
- `/admin/profiles` - create and manage profiles
- `/from/{from}/to/{to}` - generated personal page
- `/from/{from}/to/{to}/say/{message}` - generated page with a custom prompt
- `/conversations` - generated-page conversations
- `/chat` - legacy chat interface
- `/game` - browser game and simulation space
- `/4d` - 4D interaction prototype
- `/nca/player` - neural cellular automata lab

## Documentation

The docs are being cleaned up. The useful starting points are:

- [ActInLove quickstart](./ACTINLOVE_QUICKSTART.md)
- [Complete ActInLove guide](./ACTINLOVE_COMPLETE_GUIDE.md)
- [Project goal](./docs/PROJECT_GOAL.md)
- [ActInLove examples](./docs/ACTINLOVE_EXAMPLES.md)
- [NCA in the browser](./docs/nca-in-game.md)
- [4D implementation guide](./docs/4D_IMPLEMENTATION.md)

Some older files still describe upstream NextChat behavior or historical implementation phases. Treat those as reference notes until they are archived or rewritten.

## How To Help

There is plenty of room for contributors. Good first contributions include:

- pruning stale docs and fixing broken links
- documenting a clean deployment path
- adding auth and rate limiting around profile/admin/generation routes
- adding HTML sanitization or sandboxing for generated pages
- improving the `/from/.../to/...` user experience
- writing focused tests for profile creation and page generation
- polishing the 4D, NCA, and game demos into clearer experiences

If you are joining the project, start by running it locally, creating two profiles, and generating one page. That gives you the feel of the system faster than reading every historical note.

## Scripts

```bash
bun run dev       # local development
bun run build     # production build
bun run start     # start built app
bun run lint      # lint
```

ActInLove test helpers:

```bash
./scripts/test-actinlove.sh
node scripts/test-actinlove-api.js
```

## Security Notes

Generated pages are rendered as HTML. That is powerful, but it means production deployments should add sanitization, a strict content security policy, or an iframe/sandbox strategy before accepting untrusted generated content.

The profile admin routes are currently open. Protect them before running a public instance.

## License

[MIT](./LICENSE)
