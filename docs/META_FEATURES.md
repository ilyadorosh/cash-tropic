# Meta Features Documentation

## Overview

This document describes the meta features implementation: **Luxury Plan Compute** and **Money Gather** systems for the Cash Tropic game.

## Luxury Plan Compute

A subscription tier system that provides different levels of features and gameplay enhancements.

### Plan Tiers

1. **FREE** - Basic gameplay
2. **BASIC** - Enhanced features ($4.99/month)
3. **LUXURY** - Premium experience ($9.99/month) 
4. **PREMIUM** - Ultimate experience ($19.99/month)

### Features by Tier

| Feature | Free | Basic | Luxury | Premium |
|---------|------|-------|--------|---------|
| Save Slots | 1 | 3 | 10 | Unlimited |
| Cloud Save | ❌ | ✅ | ✅ | ✅ |
| Multiplayer | ❌ | ✅ | ✅ | ✅ |
| Passive Income Multiplier | 1.0x | 1.25x | 1.5x | 2.0x |
| Bonus Starting Money | $0 | $1,000 | $5,000 | $10,000 |
| Money Gather Boost | 1.0x | 1.2x | 1.5x | 2.0x |
| Exclusive Missions | ❌ | ❌ | ✅ | ✅ |
| Advanced Learning | ❌ | ✅ | ✅ | ✅ |
| Premium Interiors | ❌ | ❌ | ✅ | ✅ |
| Friends Limit | 10 | 50 | 200 | Unlimited |
| Guild Creation | ❌ | ❌ | ✅ | ✅ |
| Chat History | 7 days | 30 days | 90 days | Unlimited |
| Priority Support | ❌ | ❌ | ✅ | ✅ |
| Beta Access | ❌ | ❌ | ✅ | ✅ |
| Ad Free | ❌ | ✅ | ✅ | ✅ |

### API Usage

#### Get Plan Features
```typescript
GET /api/game/plan?action=features
```

Response:
```json
{
  "success": true,
  "plans": {
    "free": { ... },
    "basic": { ... },
    "luxury": { ... },
    "premium": { ... }
  }
}
```

#### Get Pricing
```typescript
GET /api/game/plan?action=pricing
```

Response:
```json
{
  "success": true,
  "pricing": {
    "free": { "monthly": 0, "yearly": 0 },
    "basic": { "monthly": 4.99, "yearly": 49.99 },
    "luxury": { "monthly": 9.99, "yearly": 99.99 },
    "premium": { "monthly": 19.99, "yearly": 199.99 }
  }
}
```

#### Upgrade Plan
```typescript
POST /api/game/plan
{
  "action": "upgrade",
  "userId": "user123",
  "planTier": "luxury",
  "durationMonths": 1
}
```

### Code Usage

```typescript
import { LuxuryPlanCompute, PlanTier } from '@/app/game/LuxuryPlanCompute';

// Create plan compute instance
const planCompute = new LuxuryPlanCompute();

// Check if user has a feature
if (planCompute.hasFeature('cloudSaveEnabled')) {
  // Enable cloud save
}

// Get specific feature value
const multiplier = planCompute.getFeature('passiveIncomeMultiplier');

// Compute money with plan multiplier
const effectiveIncome = planCompute.computeMoneyMultiplier(baseIncome);

// Upgrade plan
const newPlan = planCompute.upgradePlan(PlanTier.LUXURY, 1);
```

## Money Gather

A money collection and passive income system that tracks all income sources and provides aggregated statistics.

### Money Sources

Money can come from:
- **Property** - Owned buildings generate passive income
- **Business** - Owned businesses generate income
- **Investment** - Financial investments pay dividends
- **Mission** - Completed missions reward money
- **Passive** - General passive income sources

### Features

1. **Passive Income** - Automatic money collection over time
2. **Source Management** - Add/remove income sources
3. **Statistics Tracking** - Track total earned, spent, and balance
4. **Collection History** - View recent money collections
5. **Plan Integration** - Income multipliers based on subscription tier

### API Usage

#### Get Money Statistics
```typescript
GET /api/game/money?userId=user123&action=stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "totalEarned": 15000,
    "totalSpent": 5000,
    "currentBalance": 10000,
    "passiveIncomePerHour": 500,
    "activeSources": 3
  }
}
```

#### Get Active Sources
```typescript
GET /api/game/money?userId=user123&action=sources
```

#### Collect Money
```typescript
POST /api/game/money
{
  "action": "collect",
  "userId": "user123",
  "sourceId": "property_shop_123" // optional, collects from all if omitted
}
```

#### Auto-Collect Passive Income
```typescript
POST /api/game/money
{
  "action": "auto-collect",
  "userId": "user123"
}
```

#### Add Money Source
```typescript
POST /api/game/money
{
  "action": "add-source",
  "userId": "user123",
  "sources": [
    {
      "id": "property_shop_1",
      "name": "Downtown Shop",
      "type": "property",
      "baseIncome": 150,
      "frequency": 1800000, // 30 minutes in ms
      "lastCollected": 1234567890,
      "active": true
    }
  ]
}
```

### Code Usage

```typescript
import { MoneyGather, MoneySource } from '@/app/game/MoneyGather';
import { LuxuryPlanCompute } from '@/app/game/LuxuryPlanCompute';

// Create money gather system
const planCompute = new LuxuryPlanCompute();
const moneyGather = new MoneyGather(500, planCompute);

// Add a property source
const shopSource: MoneySource = {
  id: 'shop_1',
  name: 'My Shop',
  type: 'property',
  baseIncome: 150,
  frequency: 1800000, // 30 min
  lastCollected: Date.now(),
  active: true
};
moneyGather.addSource(shopSource);

// Collect from all sources
const results = moneyGather.collectAll();

// Auto-collect passive income
const passiveResults = moneyGather.autoCollect();

// Add/spend money
moneyGather.addMoney(1000, 'mission_reward');
moneyGather.spendMoney(500);

// Get statistics
const stats = moneyGather.getStats();
console.log(`Balance: $${stats.currentBalance}`);
console.log(`Passive income: $${stats.passiveIncomePerHour}/hour`);
```

## GameManager Integration

The `GameManager` class automatically initializes and manages both systems:

```typescript
import { GameManager } from '@/app/game/GameManager';

const gameManager = new GameManager();
await gameManager.loadGame('user123');

// Collect passive income
const collected = gameManager.collectPassiveIncome();

// Check plan features
if (gameManager.hasFeature('cloudSaveEnabled')) {
  await gameManager.saveGame();
}

// Get money stats
const stats = gameManager.getMoneyStats();
```

## GameState Integration

The player progress now includes:

```typescript
interface PlayerProgress {
  // ... existing fields
  plan?: UserPlan;
  moneyGatherState?: string; // Serialized MoneyGather state
}
```

## Property-Based Income

Properties automatically generate income:

```typescript
import { MoneyGather } from '@/app/game/MoneyGather';

// Create sources from owned properties
const ownedProperties = ['apartment', 'shop', 'factory'];
const sources = MoneyGather.createPropertySources(ownedProperties);

sources.forEach(source => moneyGather.addSource(source));
```

Property income rates:
- **Apartment**: $50/hour
- **House**: $100/hour
- **Shop**: $150/30min
- **Restaurant**: $200/30min
- **Factory**: $500/hour
- **Office**: $300/hour

## Persistence

Both systems are automatically saved:

1. **Plan** - Saved in `PlayerProgress.plan`
2. **Money Gather** - Serialized and saved in `PlayerProgress.moneyGatherState`

The GameManager handles serialization/deserialization automatically during save/load.

## Testing

Test the APIs:

```bash
# Get plan features
curl http://localhost:3000/api/game/plan?action=features

# Get pricing
curl http://localhost:3000/api/game/plan?action=pricing

# Get money stats
curl http://localhost:3000/api/game/money?userId=test&action=stats

# Collect money
curl -X POST http://localhost:3000/api/game/money \
  -H "Content-Type: application/json" \
  -d '{"action":"collect","userId":"test"}'
```

## Future Enhancements

1. **Payment Integration** - Add Stripe/PayPal for real subscriptions
2. **Referral System** - Earn plan upgrades by referring friends
3. **Seasonal Events** - Bonus multipliers during events
4. **Achievement Bonuses** - Unlock permanent bonuses
5. **Guild Bonuses** - Shared income pools for guilds
6. **Investment Mini-Game** - Stock market simulation
7. **Real Estate Management** - Buy/sell/upgrade properties
8. **Business Management** - Hire employees, set prices

## Security Considerations

⚠️ **Important**: In production:

1. Validate user authorization before plan changes
2. Verify payments before granting plan upgrades
3. Rate limit API endpoints
4. Sanitize user inputs
5. Use server-side validation for all money transactions
6. Encrypt sensitive plan data
7. Audit all money transactions

## Support

For issues or questions:
- GitHub Issues: [cash-tropic/issues](https://github.com/ilyadorosh/cash-tropic/issues)
- Documentation: See this file
- API Reference: Check API route files
