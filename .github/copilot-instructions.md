# Cash Tropic (ChatGPT Next Web Fork)

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

Cash Tropic is a ChatGPT web application based on Next.js 14.1.1 with React 18.2.0. It supports both web deployment and cross-platform desktop applications via Tauri (Rust). The application provides an AI chat interface with support for multiple LLM providers (OpenAI, Google Gemini, Anthropic, Baidu, etc.).

## Working Effectively

### Prerequisites and Setup
- Node.js 20.19.5+ is required (>=18 minimum) - already available
- Yarn 1.22.22 is the preferred package manager (already available)
- NPM 10.8.2 also works as alternative (takes ~2.6 minutes like yarn)
- Rust 1.89.0+ for desktop app development (already available)
- Docker 28.0.4+ for containerized deployment (already available)

### Bootstrap and Build Process
```bash
# 1. Install dependencies (choose one)
yarn install
# OR
npm install --no-fund --no-audit
# TIMING: Takes ~2.5-2.6 minutes. NEVER CANCEL. Set timeout to 5+ minutes.

# 2. Build masks (prompt templates) - required before any build
yarn mask
# TIMING: Takes ~1 second

# 3. Build production application
yarn build
# STATUS: Currently FAILS due to missing exports in app/constant.ts
# See "Known Issues" section below for details
```

### Development Server
```bash
# Start development server with mask watching
yarn dev
# TIMING: Starts in ~2 seconds, but currently returns 500 errors
# Server starts on http://localhost:3000
# STATUS: Currently BROKEN - missing exports cause runtime errors
```

### Testing and Validation
```bash
# Lint code (currently has pre-existing errors)
yarn lint
# TIMING: ~3 seconds. FAILS with React Hook rule violations

# Format code with prettier
npx prettier --check .
# TIMING: ~1 second. Currently passes for most files

# Build mask templates
yarn mask
# TIMING: ~1 second. Works correctly

# Watch mask changes during development  
yarn mask:watch
# Used automatically by yarn dev
```

### Desktop Application (Tauri)
```bash
# Development mode (currently broken due to missing exports)
yarn app:dev
# TIMING: Initial build takes 5+ minutes. NEVER CANCEL. Set timeout to 10+ minutes.

# Production build (currently broken)
yarn app:build
# TIMING: Takes 10+ minutes. NEVER CANCEL. Set timeout to 15+ minutes.
```

## Known Issues and Current State

⚠️ **CRITICAL: The repository currently has build-breaking issues:**

1. **Missing Exports in app/constant.ts**: The file only exports `groqModels` but the codebase expects many more exports like `ModelProvider`, `ServiceProvider`, `DEFAULT_MODELS`, `ANTHROPIC_BASE_URL`, etc.

2. **Development Server Fails**: Starts but returns 500 errors due to missing constant exports

3. **Production Build Fails**: Cannot compile due to TypeScript errors from missing imports

4. **Linting Errors**: Pre-existing React Hook rule violations in app/components/chat.tsx

### Build Workarounds
If you need to test builds, temporarily add missing exports to app/constant.ts:
```typescript
// Add these exports to fix compilation:
export const ModelProvider = {};
export const ServiceProvider = {};
export const DEFAULT_MODELS = [];
export const ANTHROPIC_BASE_URL = "";
// ... (add other missing exports as needed)
```

## Validation Scenarios

### After Making Changes, Always Test:
1. **Basic compilation**: `yarn mask && timeout 600 yarn build` 
2. **Development server**: Start `yarn dev` and verify it responds without 500 errors
3. **Linting**: `yarn lint` - ensure no NEW errors beyond pre-existing ones  
4. **Formatting**: `npx prettier --check .` - should pass
5. **Mask building**: `yarn mask` - should complete successfully

### Manual Testing Scenarios:
- **If fixing constant exports**: Verify the web app loads and shows the chat interface
- **If modifying UI components**: Test both desktop and mobile layouts
- **If changing API routes**: Test with actual API keys (requires environment setup)

## Directory Structure and Key Locations

### Important Files and Directories:
- `/app` - Main Next.js application code (app router)
- `/app/constant.ts` - **BROKEN** - missing critical exports
- `/app/components/chat.tsx` - Main chat interface (has linting errors)
- `/app/api/` - API routes for various LLM providers
- `/src-tauri/` - Tauri desktop application configuration
- `/scripts/` - Build and setup scripts
- `/docs/` - Multi-language documentation

### Configuration Files:
- `package.json` - Dependencies and scripts (yarn preferred)
- `next.config.mjs` - Next.js configuration with webpack customization  
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.json` - ESLint configuration (currently has failing rules)
- `src-tauri/tauri.conf.json` - Desktop app configuration

### Environment and Deployment:
- `.env.template` - Environment variable template
- `Dockerfile` - Container configuration (sets Chinese npm registry)
- `docker-compose.yml` - Multi-service deployment setup
- `vercel.json` - Vercel deployment configuration

## Common Tasks

### Environment Setup:
```bash
# Copy environment template (optional for development)
cp .env.template .env.local
# Add your API keys:
# OPENAI_API_KEY=sk-xxx
# GOOGLE_API_KEY=xxx
```

### Registry Issues:
The Dockerfile sets a Chinese npm registry that may cause network issues:
```bash
# If yarn install fails, reset registry:
yarn config set registry https://registry.yarnpkg.com
yarn cache clean
yarn install
```

### Git Hooks:
- Husky is configured with pre-commit hooks
- Runs `lint-staged` which formats and lints changed files
- May fail due to existing linting errors

### Other Available Commands:
```bash
# Fetch prompt templates (may fail due to network restrictions)
yarn prompts
# TIMING: ~5 seconds. May fail with ENOTFOUND errors in restricted environments

# Export static build (also currently broken)
yarn export
# TIMING: ~1 minute (when working). Same issues as regular build

# Clear Next.js cache when needed
rm -rf .next

# Alternative package manager usage
npm run build  # equivalent to yarn build
npm run dev    # equivalent to yarn dev
```

## Docker Deployment

```bash
# Build container
docker build -t cash-tropic .

# Run with environment variables
docker run -d -p 3000:3000 \
  -e OPENAI_API_KEY=sk-xxx \
  -e CODE=your-password \
  cash-tropic
```

## Debugging Tips

### Build Failures:
1. Check if app/constant.ts has all required exports
2. Run `yarn mask` before any build command
3. Ensure Node.js version is 18+

### Runtime Errors:
1. Check browser console for missing imports
2. Verify environment variables are set correctly
3. Ensure API endpoints are accessible

### Development Issues:
1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && yarn install`
3. Check if mask templates are built: `yarn mask`

## CRITICAL TIMING WARNINGS

- **NEVER CANCEL** long-running builds or installs
- **yarn/npm install**: 2.5-2.6 minutes - set timeout to 5+ minutes
- **yarn build**: 1+ minutes (when working) - set timeout to 10+ minutes  
- **yarn export**: 1+ minutes (when working) - set timeout to 10+ minutes
- **yarn app:build**: 10+ minutes - set timeout to 15+ minutes
- **yarn app:dev**: 5+ minutes initial build - set timeout to 10+ minutes
- **yarn lint**: 3 seconds (fast but fails with current errors)
- **yarn mask**: 1 second (very fast, always works)
- **yarn prompts**: 5 seconds (may fail due to network restrictions)

Always wait for completion. These timing estimates are based on actual measurements and include safety buffers.