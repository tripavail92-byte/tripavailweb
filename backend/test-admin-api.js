const axios = require('axios');

const BASE_URL = 'http://localhost:4100/v1';

// Test credentials
const TEST_ADMIN = {
  email: 'admin@tripavail.com',
  phone: '+1234567890',
};

async function testAdminAPI() {
  console.log('🧪 Testing Admin Panel API\n');

  try {
    // Step 1: Send OTP for admin login
    console.log('1️⃣ Sending OTP to admin phone...');
    const otpResponse = await axios.post(`${BASE_URL}/auth/send-otp`, {
      phoneOrEmail: TEST_ADMIN.phone,
    });
    console.log('✅ OTP sent:', otpResponse.data.message);

    // Step 2: Login with OTP (use 123456 as test OTP)
    console.log('\n2️⃣ Logging in with OTP...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      phoneOrEmail: TEST_ADMIN.phone,
      otp: '123456',
    });
    
    const token = loginResponse.data.access_token;
    const user = loginResponse.data.user;
    console.log('✅ Logged in as:', user.email, '| Role:', user.role);

    if (user.role !== 'ADMIN') {
      console.log('❌ User is not an admin. Creating admin user...');
      // We'll need to manually update the database
      process.exit(1);
    }

    // Step 3: Test Dashboard endpoint
    console.log('\n3️⃣ Testing GET /admin/dashboard...');
    const dashboardResponse = await axios.get(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Dashboard stats:', dashboardResponse.data);

    // Step 4: Test Users endpoint
    console.log('\n4️⃣ Testing GET /admin/users...');
    const usersResponse = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Total users:', usersResponse.data.count);
    console.log('   Sample:', usersResponse.data.users.slice(0, 2));

    // Step 5: Test Providers endpoint
    console.log('\n5️⃣ Testing GET /admin/providers...');
    const providersResponse = await axios.get(`${BASE_URL}/admin/providers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Total providers:', providersResponse.data.count);

    // Step 6: Test Audit Logs endpoint
    console.log('\n6️⃣ Testing GET /admin/audit-logs...');
    const auditResponse = await axios.get(`${BASE_URL}/admin/audit-logs?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Recent audit logs:', auditResponse.data.count);

    console.log('\n✅ All admin API tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testAdminAPI();
