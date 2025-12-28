# Database Seed Data

## Overview

The seed script (`prisma/seed.ts`) populates the database with realistic sample data for development and testing.

## What Gets Seeded

### Users (5 total)

- **Traveler 1:** `traveler@example.com` / `+1234567890`
- **Traveler 2:** `jane@example.com` / `+1234567891`
- **Admin:** `admin@tripavail.com` / `+1234567892`
- **Hotel Owner:** `hotel@example.com` / `+1234567893`
- **Tour Operator:** `tours@example.com` / `+1234567894`

Password for all users: `$2b$10$mockHashedPassword...` (mock hashed)

### Provider Profiles (2)

1. **Sunset Resort & Spa** (Hotel Manager) - APPROVED
2. **Mountain Adventures Co** (Tour Operator) - APPROVED

### Listings

1. **Sunset Resort & Spa** (Miami) - Beach resort with 2 room types
2. **Urban Boutique Hotel** (NYC) - Downtown hotel with 1 room type

### Rooms & Inventory

- **Deluxe Ocean View:** $299.99/night, 20 units
- **Presidential Suite:** $899.99/night, 5 units
- **Standard Room:** $199.99/night, 30 units
- **Inventory:** 90 days pre-populated for all rooms

### Hotel Packages (2)

1. **Romantic Weekend Escape** - $599.99/person
2. **Honeymoon Paradise Package** - $2,499.99/person

### Tour Packages (1)

- **Rocky Mountain Hiking Expedition** - 5-day guided tour, $1,299.99/person
- **Departures:** 4 upcoming dates (15th of each month)
- **Itinerary:** 5 detailed days
- **Pickups:** Denver Airport & Boulder Bus Station

### Bookings (2)

1. **Completed Booking** - Traveler 1 stayed at Sunset Resort (3 nights)
2. **Confirmed Booking** - Traveler 2 booked Rocky Mountain tour (upcoming)

### Ledger Entries

- Complete double-entry accounting for completed booking
- Traveler debit, provider earnings, platform commission

### Reviews (2)

- 5-star review from Traveler 1
- 4-star review from Traveler 2

## Running the Seed

```bash
# Option 1: Via npm script
cd backend
npm run seed

# Option 2: Via Prisma CLI
npx prisma db seed

# Option 3: Direct execution
ts-node --transpile-only prisma/seed.ts
```

## Notes

- **Idempotent:** Seed script clears existing data before inserting
- **Foreign Keys:** Deletion happens in reverse dependency order
- **Passwords:** Mock hashed values (not secure, dev only)
- **Dates:** Inventory/departures generated dynamically from current date
- **Test Credentials:** Use any seeded email/phone for OTP auth testing

## Verification

```bash
# View data in Prisma Studio
npx prisma studio

# Check counts
npx prisma db execute --stdin < <(echo "SELECT 'users', COUNT(*) FROM \"User\" UNION ALL SELECT 'bookings', COUNT(*) FROM \"Booking\";")
```

## Production

⚠️ **Never run seed script in production!**

- Seed data is for development/staging only
- Use proper data migration strategy for production
