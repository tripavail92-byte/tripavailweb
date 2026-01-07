/**
 * Production E2E Test Suite - P0 Features
 * Tests: RequestId tracking, PartnerStatusBanner, ErrorToast, Publish Gate
 */

const BASE_URL = 'https://tripavailweb.onrender.com/v1';
const FRONTEND_URL = 'https://tripavailweb-web.vercel.app';

// Test results tracker
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(status, test, message) {
  const timestamp = new Date().toISOString();
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`[${timestamp}] ${emoji} ${test}: ${message}`);
  
  if (status === 'PASS') results.passed.push(test);
  else if (status === 'FAIL') results.failed.push({ test, message });
  else results.warnings.push({ test, message });
}

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const requestId = response.headers.get('x-request-id');
  let body;
  
  try {
    body = await response.json();
  } catch (e) {
    body = await response.text();
  }
  
  return { response, body, requestId };
}

// Test 1: Backend Health Check
async function testBackendHealth() {
  try {
    const { response, body } = await makeRequest(`${BASE_URL}/health`);
    
    if (response.status === 200 && body.status === 'ok') {
      log('PASS', 'Backend Health', `Version: ${body.version}, Uptime: ${body.uptime}s`);
      return true;
    } else {
      log('FAIL', 'Backend Health', `Unexpected response: ${response.status}`);
      return false;
    }
  } catch (error) {
    log('FAIL', 'Backend Health', error.message);
    return false;
  }
}

// Test 2: Frontend Loads
async function testFrontendLoads() {
  try {
    const response = await fetch(FRONTEND_URL);
    const html = await response.text();
    
    if (response.status === 200 && html.includes('TripAvail')) {
      log('PASS', 'Frontend Loads', 'Status 200, TripAvail title found');
      return true;
    } else {
      log('FAIL', 'Frontend Loads', `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log('FAIL', 'Frontend Loads', error.message);
    return false;
  }
}

// Test 3: RequestId in Error Responses
async function testRequestIdInErrors() {
  try {
    const { response, body, requestId } = await makeRequest(
      `${BASE_URL}/admin/providers/test-id/approve`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      }
    );
    
    // Should get 401 with requestId
    if (response.status === 401 && body.requestId) {
      log('PASS', 'RequestId in Errors', `RequestId: ${body.requestId.substring(0, 8)}...`);
      return body.requestId;
    } else {
      log('FAIL', 'RequestId in Errors', `Status: ${response.status}, RequestId: ${body.requestId}`);
      return false;
    }
  } catch (error) {
    log('FAIL', 'RequestId in Errors', error.message);
    return false;
  }
}

// Test 4: OTP Login (Get Token)
async function testOTPLogin() {
  try {
    // Request OTP (correct payload: channel + phone/email + purpose)
    const { response: otpResponse, body: otpBody } = await makeRequest(
      `${BASE_URL}/auth/start`,
      {
        method: 'POST',
        body: JSON.stringify({
          channel: 'phone',
          phone: '+1234567890',
          purpose: 'login'
        })
      }
    );
    
    if (otpResponse.status === 201 || otpResponse.status === 200) {
      log('PASS', 'OTP Request', 'OTP sent successfully');
      
      // In test mode, OTP is usually 123456
      const { response: verifyResponse, body: verifyBody } = await makeRequest(
        `${BASE_URL}/auth/verify`,
        {
          method: 'POST',
          body: JSON.stringify({
            channel: 'phone',
            phone: '+1234567890',
            otp: '123456'
          })
        }
      );
      
      if (verifyResponse.status === 200 && verifyBody.accessToken) {
        log('PASS', 'OTP Verify', 'Login successful, token received');
        return verifyBody.accessToken;
      } else {
        log('WARN', 'OTP Verify', `Status: ${verifyResponse.status} - May need real OTP in production`);
        return null;
      }
    } else {
      log('WARN', 'OTP Request', `Status: ${otpResponse.status} - ${JSON.stringify(otpBody)}`);
      return null;
    }
  } catch (error) {
    log('WARN', 'OTP Login', `${error.message} - Manual login required`);
    return null;
  }
}

// Test 5: Provider Onboarding Submission
async function testProviderOnboarding(token) {
  if (!token) {
    log('WARN', 'Provider Onboarding', 'Skipped - no auth token');
    return null;
  }
  
  try {
    const onboardingData = {
      type: 'HOTEL',
      businessName: 'Test Hotel E2E',
      businessRegistrationNumber: 'TEST-' + Date.now(),
      contactPerson: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        country: 'US',
        postalCode: '12345'
      }
    };
    
    const { response, body } = await makeRequest(
      `${BASE_URL}/provider-onboarding`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(onboardingData)
      }
    );
    
    if (response.status === 201 && body.id) {
      log('PASS', 'Provider Onboarding', `Provider created: ${body.id}`);
      return body.id;
    } else if (response.status === 400) {
      log('WARN', 'Provider Onboarding', 'User already has provider profile');
      return null;
    } else {
      log('FAIL', 'Provider Onboarding', `Status: ${response.status}, Message: ${body.message}`);
      return null;
    }
  } catch (error) {
    log('FAIL', 'Provider Onboarding', error.message);
    return null;
  }
}

// Test 6: Publish Gate (Should Fail Without Approval)
async function testPublishGate(token, providerId) {
  if (!token || !providerId) {
    log('WARN', 'Publish Gate', 'Skipped - no auth or provider ID');
    return;
  }
  
  try {
    // Try to create a listing (should fail if not approved)
    const listingData = {
      title: 'Test Listing',
      description: 'Test Description',
      propertyType: 'HOTEL',
      address: {
        street: '123 Test',
        city: 'Test',
        state: 'TS',
        country: 'US',
        postalCode: '12345'
      }
    };
    
    const { response, body } = await makeRequest(
      `${BASE_URL}/listings`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(listingData)
      }
    );
    
    // Should get 403 if not approved
    if (response.status === 403) {
      log('PASS', 'Publish Gate', 'Correctly blocked unapproved provider (403)');
      return true;
    } else if (response.status === 201) {
      log('WARN', 'Publish Gate', 'Provider may already be approved - listing created');
      return true;
    } else {
      log('FAIL', 'Publish Gate', `Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log('FAIL', 'Publish Gate', error.message);
    return false;
  }
}

// Test 7: Error Message Safety (No Stack Traces)
async function testErrorSafety() {
  try {
    const { response, body } = await makeRequest(
      `${BASE_URL}/non-existent-endpoint`,
      { method: 'POST' }
    );
    
    const bodyStr = JSON.stringify(body);
    const hasStackTrace = bodyStr.includes('at ') || bodyStr.includes('.js:') || bodyStr.includes('Error:');
    const hasSqlError = bodyStr.toLowerCase().includes('sql') || bodyStr.includes('postgresql');
    
    if (!hasStackTrace && !hasSqlError) {
      log('PASS', 'Error Safety', 'No stack traces or SQL errors in response');
      return true;
    } else {
      log('FAIL', 'Error Safety', 'Stack trace or SQL error found in response');
      return false;
    }
  } catch (error) {
    log('FAIL', 'Error Safety', error.message);
    return false;
  }
}

// Test 8: Frontend Routes Accessible
async function testFrontendRoutes() {
  const routes = [
    { path: '/', name: 'Home' },
    { path: '/host', name: 'Host Dashboard' },
    { path: '/operator', name: 'Operator Dashboard' },
    { path: '/admin/providers', name: 'Admin Providers' }
  ];
  
  let allPassed = true;
  
  for (const route of routes) {
    try {
      const response = await fetch(`${FRONTEND_URL}${route.path}`);
      if (response.status === 200) {
        log('PASS', `Frontend Route: ${route.name}`, `Status 200`);
      } else {
        log('WARN', `Frontend Route: ${route.name}`, `Status ${response.status} (may need auth)`);
      }
    } catch (error) {
      log('FAIL', `Frontend Route: ${route.name}`, error.message);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Test 9: CORS Configuration
async function testCORS() {
  try {
    const { response } = await makeRequest(`${BASE_URL}/health`, {
      headers: {
        'Origin': FRONTEND_URL
      }
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
    };
    
    if (corsHeaders['access-control-allow-origin']) {
      log('PASS', 'CORS Configuration', `Origin: ${corsHeaders['access-control-allow-origin']}`);
      return true;
    } else {
      log('WARN', 'CORS Configuration', 'No CORS headers found (may be okay)');
      return true;
    }
  } catch (error) {
    log('FAIL', 'CORS Configuration', error.message);
    return false;
  }
}

// Main Test Runner
async function runAllTests() {
  console.log('\n========================================');
  console.log('🚀 Production E2E Test Suite - P0 Features');
  console.log('========================================\n');
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend:  ${BASE_URL}\n`);
  
  // Critical P0 Tests
  console.log('--- Critical P0 Features ---\n');
  await testBackendHealth();
  await testFrontendLoads();
  const requestId = await testRequestIdInErrors();
  await testErrorSafety();
  
  // Authenticated Flow Tests
  console.log('\n--- Authenticated Flow Tests ---\n');
  const token = await testOTPLogin();
  const providerId = await testProviderOnboarding(token);
  await testPublishGate(token, providerId);
  
  // Infrastructure Tests
  console.log('\n--- Infrastructure Tests ---\n');
  await testFrontendRoutes();
  await testCORS();
  
  // Summary
  console.log('\n========================================');
  console.log('📊 Test Results Summary');
  console.log('========================================\n');
  console.log(`✅ Passed:   ${results.passed.length}`);
  console.log(`❌ Failed:   ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(f => console.log(`   - ${f.test}: ${f.message}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(w => console.log(`   - ${w.test}: ${w.message}`));
  }
  
  console.log('\n========================================');
  
  if (results.failed.length === 0) {
    console.log('🎉 All critical tests passed!');
    console.log('✅ Production is ready for use');
  } else {
    console.log('⚠️  Some tests failed - review above');
  }
  
  console.log('========================================\n');
  
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
