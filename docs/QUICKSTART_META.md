# Quick Start: Meta Features

This guide helps you quickly get started with the Luxury Plan Compute and Money Gather systems.

## For Players

### What are Meta Features?

**Meta features** are special systems that enhance your gameplay experience:

1. **Subscription Plans** - Different tiers that unlock premium features
2. **Money Gathering** - Automatic passive income from your properties and businesses

### Subscription Tiers

Choose a plan that fits your playstyle:

| Tier | Price | Best For |
|------|-------|----------|
| **Free** | $0 | Casual players trying out the game |
| **Basic** | $4.99/mo | Regular players who want cloud saves |
| **Luxury** | $9.99/mo | Dedicated players who want exclusive content |
| **Premium** | $19.99/mo | Hardcore players who want everything |

### Key Benefits by Tier

**Free Tier:**
- Basic gameplay access
- 1 save slot
- Standard money rates

**Basic Tier:**
- 3 save slots
- Cloud saves
- Multiplayer access
- 25% more passive income
- No ads

**Luxury Tier:** (Most Popular! 🌟)
- 10 save slots
- 50% more passive income
- Exclusive missions
- Premium interiors
- Create guilds
- Priority support

**Premium Tier:**
- Unlimited saves
- 2x passive income boost
- All exclusive content
- Beta access
- VIP support

### Money Gathering

Your properties and businesses automatically generate money:

#### Income Rates
- **Apartment**: $50/hour
- **House**: $100/hour
- **Shop**: $150 every 30 minutes
- **Restaurant**: $200 every 30 minutes
- **Factory**: $500/hour
- **Office**: $300/hour

#### How It Works

1. **Buy Properties**: Purchase properties during missions
2. **Automatic Income**: They generate money over time
3. **Collect Anytime**: Open the game to collect accumulated income
4. **Plan Multipliers**: Higher tier plans boost your income!

#### Example

If you own:
- 1 Shop ($150/30min)
- 1 Factory ($500/hour)

With **Luxury** plan (1.5x multiplier):
- Shop: $225 every 30 minutes
- Factory: $750 per hour
- **Total: $1,950/hour** of passive income!

## For Developers

### Quick Integration

```typescript
import { GameManager } from '@/app/game/GameManager';

// Initialize game
const gameManager = new GameManager();
await gameManager.loadGame('userId');

// Check user's plan features
if (gameManager.hasFeature('exclusiveMissions')) {
  // Show exclusive content
}

// Collect passive income
const collected = gameManager.collectPassiveIncome();
console.log(`Collected $${collected}`);

// Get money statistics
const stats = gameManager.getMoneyStats();
console.log(`Balance: $${stats.currentBalance}`);
console.log(`Passive income: $${stats.passiveIncomePerHour}/hour`);
```

### API Endpoints

#### Check Plan Features
```bash
GET /api/game/plan?action=features
```

#### Get Pricing
```bash
GET /api/game/plan?action=pricing
```

#### Collect Money
```bash
POST /api/game/money
Content-Type: application/json

{
  "action": "collect",
  "userId": "user123"
}
```

#### Get Money Stats
```bash
GET /api/game/money?userId=user123&action=stats
```

## Testing Locally

1. **Start the dev server:**
```bash
npm run dev
# or
yarn dev
```

2. **Test the APIs:**
```bash
# Get plan features
curl http://localhost:3000/api/game/plan?action=features

# Get money stats
curl http://localhost:3000/api/game/money?userId=test&action=stats
```

3. **In-Game Usage:**
- Load your game save
- Buy properties during gameplay
- Check stats to see passive income
- Plan upgrades will multiply your income!

## Common Scenarios

### Scenario 1: New Player
- Starts with Free tier
- $500 starting money
- No passive income yet
- Buy first property → starts earning passive income

### Scenario 2: Upgrade to Luxury
- Pays $9.99/month
- Existing passive income × 1.5
- Example: $1,000/hour → $1,500/hour
- Unlocks exclusive missions for more earning opportunities

### Scenario 3: Property Empire
- Owns multiple properties
- Each generates passive income
- Higher tier multiplies ALL income
- Premium tier (2x) makes a huge difference!

## Tips & Tricks

1. **Start Small**: Buy affordable properties first
2. **Upgrade Smart**: Luxury tier offers best value for money boost
3. **Check Often**: Collect your passive income regularly
4. **Diversify**: Own different types of properties
5. **Missions**: Complete missions to buy more properties
6. **Compound Growth**: Use earned money to buy more properties

## Need Help?

- **Documentation**: See `/docs/META_FEATURES.md` for complete details
- **Issues**: Report bugs on GitHub
- **Questions**: Check the FAQ in main README

## Next Steps

1. ✅ Features implemented
2. ✅ APIs working
3. ⏳ Payment integration (coming soon)
4. ⏳ UI components (coming soon)
5. ⏳ Admin dashboard (coming soon)

---

**Ready to start earning? Load the game and start building your property empire!** 🏠💰🎮
