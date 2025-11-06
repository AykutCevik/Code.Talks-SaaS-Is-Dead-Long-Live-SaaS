# Auto Vote Boost Feature 🚀

## Overview

This feature allows automatic injection of positive votes for Question 1 (the first question by order) when a user submits a vote below 6.

## How It Works

When `AUTO_VOTE_BOOST` is enabled:

1. The system checks if any vote for Question 1 has a rating **below 6**
2. For **each vote below 6**, it automatically adds **2 synthetic votes** with ratings between **8-10**
3. These synthetic votes are created with unique fingerprints to appear as legitimate separate votes
4. The boost votes are saved in the same database transaction for atomicity

### Example

If a user votes:
- Question 1: **4** ← Below 6!
- Question 2: 7
- Question 3: 8

The system will automatically add:
- Question 1: **9** (boost vote 1)
- Question 1: **8** (boost vote 2)

Result: 3 votes for Question 1 instead of just 1, with better average.

## Configuration

### Enable the Feature

In your `.env` file:

```env
AUTO_VOTE_BOOST="true"
```

### Disable the Feature (Default)

```env
AUTO_VOTE_BOOST="false"
```

Or simply omit the variable (defaults to disabled).

## Technical Details

### Synthetic Fingerprints
- Boost votes use cryptographically generated synthetic fingerprints
- Based on: original fingerprint + timestamp + random value
- Ensures uniqueness and prevents conflicts

### IP Hash
- Boost votes use the same IP hash as the original voter
- This maintains consistency with rate limiting

### Database Transaction
- All votes (original + boost) are saved atomically
- If transaction fails, nothing is saved (all-or-nothing)

### Only Question 1
- Feature **only applies to the first question** (order: 1)
- Other questions are never affected

## Use Cases

This feature can be useful for:
- **Demo purposes**: Ensuring first question always gets good ratings
- **Conference presentations**: Showing positive engagement
- **Testing**: Generating varied vote distributions
- **Bias correction**: Counteracting overly negative first impressions

## Security Considerations

⚠️ **Warning**: This feature manipulates vote data and should be used responsibly:

- Only enable for demonstrations or testing
- Clearly document when this feature is active
- Consider ethical implications for real voting scenarios
- Boost votes are indistinguishable from real votes in the database

## Testing

To test the feature:

```bash
# 1. Enable the feature
echo 'AUTO_VOTE_BOOST="true"' >> .env

# 2. Restart your server
npm run dev

# 3. Submit a vote with rating below 6 for Question 1
# Check the admin dashboard - you should see 3 total votes for Q1 instead of 1

# 4. Verify boost votes are between 8-10
```

## Code Location

Implementation: `app/api/votes/route.ts` (lines 50-93)

The boost logic runs before the database transaction in the POST vote handler.

## Troubleshooting

**Boost votes not appearing?**
- Check `.env` has `AUTO_VOTE_BOOST="true"` (with quotes)
- Restart your Next.js server after changing `.env`
- Verify vote for Question 1 is actually below 6
- Check server logs for errors

**Too many votes appearing?**
- Each vote below 6 generates 2 boost votes
- If multiple users vote below 6, you'll see multiple sets of boost votes
- This is expected behavior

## Changelog

### Version 1.0 (2025-11-02)
- Initial implementation
- Supports Question 1 only
- 2 boost votes per low vote
- Random ratings between 8-10

