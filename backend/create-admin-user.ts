import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('Creating admin user...');

  try {
    const admin = await prisma.user.upsert({
      where: { email: 'admin@tripavail.com' },
      update: {
        role: 'ADMIN',
        emailVerified: true,
        phoneVerified: true,
      },
      create: {
        id: 'admin-user-001',
        email: 'admin@tripavail.com',
        phone: '+1234567890',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        emailVerified: true,
        phoneVerified: true,
      },
    });

    console.log('✅ Admin user created/updated:', admin.email, '| Role:', admin.role);
    console.log('   ID:', admin.id);
    console.log('\nYou can now login with:');
    console.log('   Email: admin@tripavail.com');
    console.log('   Phone: +1234567890');
    console.log('   OTP: 123456 (test mode)');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
