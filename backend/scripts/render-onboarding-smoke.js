const base = 'http://localhost:4100/v1';

async function post(path, body, token) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    json = { raw: text, parseError: String(err) };
  }
  if (!res.ok) {
    throw new Error(`POST ${path} ${res.status}: ${text}`);
  }
  return json;
}

async function otpLogin(email) {
  const start = await post('/auth/start', { channel: 'email', email, purpose: 'login' });
  const code = start.code || start.data?.code || start?.otp || start?.data?.otp;
  if (!code) {
    throw new Error(`No OTP code in start response: ${JSON.stringify(start)}`);
  }
  const verify = await post('/auth/verify', { channel: 'email', email, code });
  const token = verify.accessToken || verify.token || verify.data?.accessToken;
  const user = verify.user || verify.data?.user;
  if (!token) {
    throw new Error(`No accessToken in verify response: ${JSON.stringify(verify)}`);
  }
  return { token, user };
}

async function startOnboarding(token, providerType) {
  const res = await post('/provider-onboarding/start', { providerType }, token);
  return res.profile.id;
}

async function completeSteps(token, providerId, totalSteps) {
  for (let step = 1; step <= totalSteps; step++) {
    const res = await fetch(`${base}/provider-onboarding/${providerId}/step`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ step, data: {} }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PATCH /provider-onboarding/${providerId}/step ${res.status}: ${text}`);
    }
  }
}

async function submit(token, providerType) {
  return await post(`/provider-onboarding/${providerType}/submit`, {}, token);
}

async function get(path, token) {
  const res = await fetch(base + path, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    json = { raw: text, parseError: String(err) };
  }
  if (!res.ok) {
    throw new Error(`GET ${path} ${res.status}: ${text}`);
  }
  return json;
}

async function adminAction(adminToken, providerId, action, reason) {
  const path = `/admin/providers/${providerId}/${action}`;
  const body = action === 'reject' ? { reason } : {};
  return await post(path, body, adminToken);
}

(async () => {
  const ts = Date.now();
  const providerEmail = `render.smoke.provider+${ts}@example.com`;
  const adminEmail = 'admin.smoke@test.com';

  console.log('Login provider via OTP:', providerEmail);
  const providerAuth = await otpLogin(providerEmail);
  console.log('Provider user id', providerAuth.user?.id);

  console.log('\nStart HOTEL onboarding');
  const hotelProviderId = await startOnboarding(providerAuth.token, 'HOTEL_MANAGER');
  console.log('Hotel providerProfileId', hotelProviderId);
  const listAfterStart = await get('/provider-onboarding/list', providerAuth.token);
  console.log('Onboarding list (provider view)', listAfterStart);
  await completeSteps(providerAuth.token, hotelProviderId, 7);
  const hotelStatus = await get(`/provider-onboarding/${hotelProviderId}/status`, providerAuth.token);
  console.log('Hotel status pre-submit', hotelStatus);
  const hotelSubmit1 = await submit(providerAuth.token, 'HOTEL_MANAGER');
  console.log('Hotel submit ->', hotelSubmit1.status);

  console.log('Login admin via OTP:', adminEmail);
  const adminAuth = await otpLogin(adminEmail);
  console.log('Admin user id', adminAuth.user?.id);

  const rejectHotel = await adminAction(adminAuth.token, hotelProviderId, 'reject', 'Smoke rejection');
  console.log('Hotel reject status', rejectHotel.provider?.verificationStatus || rejectHotel.verificationStatus);

  const hotelResubmit = await submit(providerAuth.token, 'HOTEL_MANAGER');
  console.log('Hotel resubmit ->', hotelResubmit.status);

  const approveHotel = await adminAction(adminAuth.token, hotelProviderId, 'approve');
  console.log('Hotel approve status', approveHotel.provider?.verificationStatus || approveHotel.verificationStatus);

  console.log('\nStart TOUR onboarding');
  const tourProviderId = await startOnboarding(providerAuth.token, 'TOUR_OPERATOR');
  console.log('Tour providerProfileId', tourProviderId);
  await completeSteps(providerAuth.token, tourProviderId, 14);
  const tourSubmit1 = await submit(providerAuth.token, 'TOUR_OPERATOR');
  console.log('Tour submit ->', tourSubmit1.status);

  const rejectTour = await adminAction(adminAuth.token, tourProviderId, 'reject', 'Smoke rejection');
  console.log('Tour reject status', rejectTour.provider?.verificationStatus || rejectTour.verificationStatus);

  const tourResubmit = await submit(providerAuth.token, 'TOUR_OPERATOR');
  console.log('Tour resubmit ->', tourResubmit.status);

  const approveTour = await adminAction(adminAuth.token, tourProviderId, 'approve');
  console.log('Tour approve status', approveTour.provider?.verificationStatus || approveTour.verificationStatus);

  console.log('\nDONE');
})().catch((err) => {
  console.error('Smoke run failed', err);
  process.exitCode = 1;
});
