import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in order to respect foreign keys)
  console.log('🧹 Cleaning existing data...');
  await prisma.ledgerEntry.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.tourDeparture.deleteMany();
  await prisma.pickup.deleteMany();
  await prisma.itineraryDay.deleteMany();
  await prisma.tourPackage.deleteMany();
  await prisma.hotelPackage.deleteMany();
  await prisma.inventoryNight.deleteMany();
  await prisma.room.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.providerOnboarding.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.authOtp.deleteMany();
  await prisma.review.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  console.log('👤 Creating users...');
  const traveler1 = await prisma.user.create({
    data: {
      email: 'traveler@example.com',
      phone: '+1234567890',
      password: '$2b$10$mockHashedPassword123',
      firstName: 'John',
      lastName: 'Traveler',
      role: 'TRAVELER',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const traveler2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      phone: '+1234567891',
      password: '$2b$10$mockHashedPassword456',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'TRAVELER',
      emailVerified: true,
      phoneVerified: false,
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@tripavail.com',
      phone: '+1234567892',
      password: '$2b$10$mockHashedPasswordAdmin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const hotelOwner = await prisma.user.create({
    data: {
      email: 'hotel@example.com',
      phone: '+1234567893',
      password: '$2b$10$mockHashedPasswordHotel',
      firstName: 'Sarah',
      lastName: 'Hotelowner',
      role: 'TRAVELER',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const tourOperator = await prisma.user.create({
    data: {
      email: 'tours@example.com',
      phone: '+1234567894',
      password: '$2b$10$mockHashedPasswordTour',
      firstName: 'Mike',
      lastName: 'Adventures',
      role: 'TRAVELER',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // 2. Create Provider Profiles
  console.log('🏢 Creating provider profiles...');
  const hotelProvider = await prisma.providerProfile.create({
    data: {
      userId: hotelOwner.id,
      providerType: 'HOTEL_MANAGER',
      businessName: 'Sunset Resort & Spa',
      businessDescription: 'Luxury beachfront resort with world-class amenities',
      verificationStatus: 'APPROVED',
      verifiedAt: new Date(),
      bankName: 'Chase Bank',
      bankAccount: '****1234',
    },
  });

  const tourProvider = await prisma.providerProfile.create({
    data: {
      userId: tourOperator.id,
      providerType: 'TOUR_OPERATOR',
      businessName: 'Mountain Adventures Co',
      businessDescription: 'Expert-guided mountain and hiking tours',
      verificationStatus: 'APPROVED',
      verifiedAt: new Date(),
      bankName: 'Bank of America',
      bankAccount: '****5678',
    },
  });

  // 3. Create Provider Onboarding (completed)
  console.log('📋 Creating onboarding records...');
  await prisma.providerOnboarding.create({
    data: {
      providerId: hotelProvider.id,
      currentStep: 5,
      completedSteps: { steps: [1, 2, 3, 4, 5] },
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.providerOnboarding.create({
    data: {
      providerId: tourProvider.id,
      currentStep: 14,
      completedSteps: { steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Create Listings (Hotels)
  console.log('🏨 Creating hotel listings...');
  const hotel1 = await prisma.listing.create({
    data: {
      providerId: hotelProvider.id,
      name: 'Sunset Resort & Spa',
      address: '123 Beach Boulevard',
      city: 'Miami',
      latitude: 25.7617,
      longitude: -80.1918,
      description:
        'Experience luxury at our 5-star beachfront resort. Featuring panoramic ocean views, infinity pools, spa facilities, and gourmet dining.',
      status: 'PUBLISHED',
      checkInTime: '15:00',
      checkOutTime: '11:00',
    },
  });

  const hotel2 = await prisma.listing.create({
    data: {
      providerId: hotelProvider.id,
      name: 'Urban Boutique Hotel',
      address: '456 Downtown Street',
      city: 'New York',
      latitude: 40.7128,
      longitude: -74.006,
      description:
        'Chic boutique hotel in the heart of Manhattan. Modern design, rooftop bar, and walking distance to major attractions.',
      status: 'PUBLISHED',
      checkInTime: '14:00',
      checkOutTime: '12:00',
    },
  });

  // 5. Create Rooms
  console.log('🛏️ Creating rooms...');
  const deluxeRoom = await prisma.room.create({
    data: {
      listingId: hotel1.id,
      name: 'Deluxe Ocean View',
      capacity: 2,
      bedConfig: '1 King Bed',
      basePrice: 299.99,
      totalUnits: 20,
    },
  });

  const suiteRoom = await prisma.room.create({
    data: {
      listingId: hotel1.id,
      name: 'Presidential Suite',
      capacity: 4,
      bedConfig: '1 King Bed + 2 Queen Beds',
      basePrice: 899.99,
      totalUnits: 5,
    },
  });

  const standardRoom = await prisma.room.create({
    data: {
      listingId: hotel2.id,
      name: 'Standard Room',
      capacity: 2,
      bedConfig: '1 Queen Bed',
      basePrice: 199.99,
      totalUnits: 30,
    },
  });

  // 6. Create Inventory (next 90 days)
  console.log('📅 Creating inventory for next 90 days...');
  const rooms = [deluxeRoom, suiteRoom, standardRoom];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const room of rooms) {
    const inventoryData = [];
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      inventoryData.push({
        roomId: room.id,
        date,
        totalUnits: room.totalUnits,
        availableUnits: room.totalUnits,
        basePrice: room.basePrice,
      });
    }
    await prisma.inventoryNight.createMany({ data: inventoryData });
  }

  // 7. Create Hotel Packages
  console.log('🎁 Creating hotel packages...');
  await prisma.hotelPackage.create({
    data: {
      providerId: hotelProvider.id,
      listingId: hotel1.id,
      templateId: 'weekend-getaway',
      name: 'Romantic Weekend Escape',
      description:
        '2 nights in Deluxe Ocean View with breakfast, couples spa treatment, and champagne on arrival.',
      status: 'PUBLISHED',
      pricePerPerson: 599.99,
      inclusions: [
        '2 nights accommodation',
        'Daily breakfast',
        'Couples spa treatment',
        'Welcome champagne',
      ],
      exclusions: ['Airfare', 'Lunch and dinner', 'Travel insurance'],
      availabilityRule: 'WEEKEND_ONLY',
      publishedAt: new Date(),
    },
  });

  await prisma.hotelPackage.create({
    data: {
      providerId: hotelProvider.id,
      listingId: hotel1.id,
      templateId: 'honeymoon',
      name: 'Honeymoon Paradise Package',
      description:
        '5 nights of pure romance with ocean view suite, spa treatments, candlelit dinners, and more.',
      status: 'PUBLISHED',
      pricePerPerson: 2499.99,
      inclusions: [
        '5 nights in Presidential Suite',
        'Daily breakfast',
        '2 spa treatments per person',
        '1 candlelit beach dinner',
        'Room decorated with flowers',
      ],
      exclusions: ['Airfare', 'Additional meals', 'Excursions'],
      availabilityRule: 'FLEXIBLE',
      publishedAt: new Date(),
    },
  });

  // 8. Create Tour Packages
  console.log('⛰️ Creating tour packages...');
  const tourPackage = await prisma.tourPackage.create({
    data: {
      providerId: tourProvider.id,
      tripType: 'Adventure',
      name: 'Rocky Mountain Hiking Expedition',
      description:
        '5-day guided hiking adventure through the Rocky Mountains. Experience breathtaking views, wildlife encounters, and camping under the stars.',
      duration: 5,
      status: 'PUBLISHED',
      basePrice: 1299.99,
      maxSeats: 12,
      publishedAt: new Date(),
    },
  });

  // 9. Create Itinerary
  console.log('📖 Creating itinerary...');
  await prisma.itineraryDay.createMany({
    data: [
      {
        packageId: tourPackage.id,
        day: 1,
        title: 'Arrival and Base Camp Setup',
        description:
          'Meet at the trailhead, gear check, and hike to base camp (4 miles). Evening orientation and campfire.',
      },
      {
        packageId: tourPackage.id,
        day: 2,
        title: 'Summit Trail to Eagle Peak',
        description:
          'Early morning start for 8-mile summit hike. Packed lunch at the peak. Return to base camp.',
      },
      {
        packageId: tourPackage.id,
        day: 3,
        title: 'Wildlife Photography and Forest Trail',
        description:
          'Guided nature walk with wildlife spotting. Photography workshop. Afternoon free time.',
      },
      {
        packageId: tourPackage.id,
        day: 4,
        title: 'Lake Alpine Circuit',
        description:
          '10-mile loop around Alpine Lake. Swimming and fishing opportunities. Sunset viewing.',
      },
      {
        packageId: tourPackage.id,
        day: 5,
        title: 'Return Journey',
        description:
          'Pack up camp and hike back to trailhead (4 miles). Group photos and farewell.',
      },
    ],
  });

  // 10. Create Pickup Locations
  console.log('📍 Creating pickup locations...');
  await prisma.pickup.createMany({
    data: [
      {
        packageId: tourPackage.id,
        city: 'Denver',
        location: 'Denver International Airport - Arrivals Gate',
        latitude: 39.8561,
        longitude: -104.6737,
      },
      {
        packageId: tourPackage.id,
        city: 'Boulder',
        location: 'Boulder Bus Station',
        latitude: 40.0176,
        longitude: -105.2797,
      },
    ],
  });

  // 11. Create Tour Departures (next 4 months)
  console.log('🚌 Creating tour departures...');
  const departuresData = [];
  for (let i = 0; i < 4; i++) {
    const departureDate = new Date(today);
    departureDate.setMonth(departureDate.getMonth() + i);
    departureDate.setDate(15); // 15th of each month
    departuresData.push({
      packageId: tourPackage.id,
      departureDate,
      availableSeats: 12,
      status: 'AVAILABLE',
    });
  }
  await prisma.tourDeparture.createMany({ data: departuresData });

  // 12. Create Sample Bookings
  console.log('📑 Creating sample bookings...');
  const completedBooking = await prisma.booking.create({
    data: {
      userId: traveler1.id,
      providerId: hotelProvider.id,
      productType: 'STAY',
      productId: hotel1.id,
      status: 'COMPLETED',
      checkIn: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      checkOut: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      guests: 2,
      totalPrice: 899.97,
      currency: 'USD',
      priceSnapshot: {
        roomType: 'Deluxe Ocean View',
        nights: 3,
        basePrice: 299.99,
        subtotal: 899.97,
        taxes: 89.99,
        fees: 25.0,
        total: 1014.96,
      },
      idempotencyKey: randomUUID(),
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: completedBooking.id,
      amount: 1014.96,
      currency: 'USD',
      provider: 'STRIPE',
      providerTxnId: 'pi_mock_' + randomUUID().substring(0, 8),
      status: 'succeeded',
    },
  });

  // Ledger entries for completed booking
  await prisma.ledgerEntry.createMany({
    data: [
      {
        bookingId: completedBooking.id,
        type: 'DEBIT',
        account: 'TRAVELER',
        amount: 1014.96,
        currency: 'USD',
        description: 'Payment for booking',
      },
      {
        bookingId: completedBooking.id,
        type: 'CREDIT',
        account: 'PROVIDER_EARNINGS',
        amount: 913.46,
        currency: 'USD',
        description: 'Provider earnings (90%)',
      },
      {
        bookingId: completedBooking.id,
        type: 'CREDIT',
        account: 'COMMISSION',
        amount: 101.5,
        currency: 'USD',
        description: 'Platform commission (10%)',
      },
    ],
  });

  // Confirmed booking
  await prisma.booking.create({
    data: {
      userId: traveler2.id,
      providerId: tourProvider.id,
      productType: 'TOUR_PACKAGE',
      productId: tourPackage.id,
      status: 'CONFIRMED',
      checkIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      checkOut: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      guests: 2,
      totalPrice: 2599.98,
      currency: 'USD',
      priceSnapshot: {
        packageName: 'Rocky Mountain Hiking Expedition',
        guests: 2,
        pricePerPerson: 1299.99,
        subtotal: 2599.98,
        taxes: 260.0,
        fees: 50.0,
        total: 2909.98,
      },
      idempotencyKey: randomUUID(),
    },
  });

  // 13. Create Sample Reviews
  console.log('⭐ Creating reviews...');
  await prisma.review.createMany({
    data: [
      {
        userId: traveler1.id,
        rating: 5,
        comment:
          'Amazing stay! The ocean view was breathtaking and the staff was incredibly friendly. Highly recommend!',
      },
      {
        userId: traveler2.id,
        rating: 4,
        comment:
          'Great experience overall. The hiking guides were knowledgeable and the scenery was spectacular.',
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - Users: ${await prisma.user.count()}`);
  console.log(`  - Provider Profiles: ${await prisma.providerProfile.count()}`);
  console.log(`  - Listings: ${await prisma.listing.count()}`);
  console.log(`  - Rooms: ${await prisma.room.count()}`);
  console.log(`  - Inventory Records: ${await prisma.inventoryNight.count()}`);
  console.log(`  - Hotel Packages: ${await prisma.hotelPackage.count()}`);
  console.log(`  - Tour Packages: ${await prisma.tourPackage.count()}`);
  console.log(`  - Tour Departures: ${await prisma.tourDeparture.count()}`);
  console.log(`  - Bookings: ${await prisma.booking.count()}`);
  console.log(`  - Reviews: ${await prisma.review.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
