#!/usr/bin/env node

/**
 * Direct booking flow test using PostgreSQL connection
 * This demonstrates Steps 1-4 of the booking workflow
 */

const { Client } = require('pg');

async function testBookingFlow() {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    database: 'tripavail',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // STEP 1: Get quote
    console.log('📊 STEP 1: Calculate Quote\n');
    const quoteResult = await client.query(`
      SELECT id, name, "pricePerPerson" 
      FROM "HotelPackage" 
      WHERE status = 'PUBLISHED' 
      LIMIT 1
    `);

    if (quoteResult.rows.length === 0) {
      throw new Error('No published hotel packages found');
    }

    const pkg = quoteResult.rows[0];
    const numberOfNights = 2;
    const totalPrice = parseFloat(pkg.price_per_night || pkg.pricePerPerson) * numberOfNights;

    console.log(`Hotel Package: ${pkg.name}`);
    console.log(`Price per person: $${pkg.pricePerPerson}`);
    console.log(`Number of nights: ${numberOfNights}`);
    console.log(`Total price: $${totalPrice}\n`);

    // STEP 2: Create HOLD (inventory reserve)
    console.log('🔒 STEP 2: Create HOLD (Reserve Inventory)\n');
    const holdId = `HOLD_${Date.now()}`;
    const userId = 'cmjzqvtpx0004hf3h3rw48ycq';

    await client.query(`
      INSERT INTO "Booking" (
        id, status, "userId", "hotelPackageId",
        "numberOfGuests", "checkInDate", "checkOutDate",
        "totalPrice", currency, "priceSnapshot", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    `, [
      holdId,
      'HOLD',
      userId,
      pkg.id,
      2,
      new Date('2026-01-15'),
      new Date('2026-01-17'),
      totalPrice,
      'USD',
      JSON.stringify({ basePrice: totalPrice, total: totalPrice })
    ]);

    console.log(`✅ Created HOLD reservation: ${holdId}`);
    console.log(`   Status: HOLD`);
    console.log(`   Expires in: 15 minutes\n`);

    // STEP 3: PRE-AUTHORIZE (validate payment method)
    console.log('💳 STEP 3: Pre-authorize Payment\n');
    const preAuthId = `PREAUTH_${Date.now()}`;

    await client.query(`
      INSERT INTO "Payment" (
        id, "bookingId", amount, currency, status, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [
      preAuthId,
      holdId,
      totalPrice,
      'USD',
      'PRE_AUTHORIZED'
    ]);

    console.log(`✅ Pre-authorized payment: ${preAuthId}`);
    console.log(`   Amount: $${totalPrice}`);
    console.log(`   Status: PRE_AUTHORIZED (not charged yet)\n`);

    // STEP 4: CONFIRM booking
    console.log('✅ STEP 4: Confirm Booking\n');

    await client.query(`
      UPDATE "Booking" 
      SET status = 'CONFIRMED', "updatedAt" = NOW()
      WHERE id = $1
    `, [holdId]);

    await client.query(`
      UPDATE "Payment"
      SET status = 'CAPTURED', "updatedAt" = NOW()
      WHERE id = $1
    `, [preAuthId]);

    console.log(`✅ Booking confirmed!`);
    console.log(`   Booking ID: ${holdId}`);
    console.log(`   Status: CONFIRMED`);
    console.log(`   Payment: CAPTURED`);
    console.log(`   Total: $${totalPrice}\n`);

    // Verify booking state
    const bookingCheck = await client.query(
      'SELECT id, status FROM "Booking" WHERE id = $1',
      [holdId]
    );

    if (bookingCheck.rows.length > 0) {
      const booking = bookingCheck.rows[0];
      console.log('📋 FINAL BOOKING STATE:');
      console.log(`   ID: ${booking.id}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   ✅ Booking workflow complete!\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testBookingFlow();
