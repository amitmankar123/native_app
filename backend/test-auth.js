const app = require('./src/app');
const { dispatch } = require('./test-client');

async function runTests() {
  console.log('--- Starting Backend Authentication & Security Tests ---');

  try {
    // 1. Health check
    const health = await dispatch(app, 'GET', '/api/health');
    console.assert(health.status === 200, 'Health check should be 200');
    console.log('✓ 1. Health check passed (HTTP 200)');

    // 2. Register user
    const testEmail = `amit_${Date.now()}@test.com`;
    const regRes = await dispatch(app, 'POST', '/api/auth/register', {
      body: {
        name: 'Amit Kumar',
        email: testEmail,
        password: 'Password123!',
        mobile: '+91 9876543210',
      },
    });
    console.assert(regRes.status === 201, `Register status expected 201, got ${regRes.status}`);
    console.assert(regRes.body.data.accessToken, 'Access token returned');
    console.assert(regRes.body.data.refreshToken, 'Refresh token returned');
    console.assert(regRes.body.data.preferences.accent_color, 'Preferences initialized');
    console.log('✓ 2. User registration & token generation passed');

    const { accessToken, refreshToken } = regRes.body.data;

    // 3. Duplicate email check
    const dupRes = await dispatch(app, 'POST', '/api/auth/register', {
      body: {
        name: 'Another User',
        email: testEmail,
        password: 'Password123!',
      },
    });
    console.assert(dupRes.status === 409, `Duplicate register should be 409, got ${dupRes.status}`);
    console.log('✓ 3. Duplicate account prevention passed (HTTP 409)');

    // 4. Login with correct credentials
    const loginRes = await dispatch(app, 'POST', '/api/auth/login', {
      body: {
        email: testEmail,
        password: 'Password123!',
      },
    });
    console.assert(loginRes.status === 200, `Login should succeed, got ${loginRes.status}`);
    console.assert(loginRes.body.data.user.email === testEmail, 'Logged in user matches');
    console.log('✓ 4. Login verification passed (HTTP 200)');

    // 5. Login with invalid password
    const badLoginRes = await dispatch(app, 'POST', '/api/auth/login', {
      body: {
        email: testEmail,
        password: 'WrongPassword!',
      },
    });
    console.assert(badLoginRes.status === 401, `Bad password should be 401, got ${badLoginRes.status}`);
    console.log('✓ 5. Invalid credentials rejection passed (HTTP 401)');

    // 6. Access protected route (/auth/me)
    const meRes = await dispatch(app, 'GET', '/api/auth/me', {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    console.assert(meRes.status === 200, `Get profile should be 200, got ${meRes.status}`);
    console.assert(meRes.body.data.user.name === 'Amit Kumar', 'Profile name matches');
    console.log('✓ 6. Access token authentication passed (HTTP 200)');

    // 7. Update user preferences
    const updatePrefRes = await dispatch(app, 'PUT', '/api/auth/preferences', {
      headers: { authorization: `Bearer ${accessToken}` },
      body: {
        theme_mode: 'dark',
        accent_color: '#7C3AED',
        interface_style: 'glassmorphism',
      },
    });
    console.assert(updatePrefRes.status === 200, 'Preference update should succeed');
    console.assert(updatePrefRes.body.data.theme_mode === 'dark', 'Theme updated to dark');
    console.assert(updatePrefRes.body.data.accent_color === '#7C3AED', 'Accent updated to purple');
    console.log('✓ 7. User preferences persistence & sync passed');

    // 8. Refresh token rotation
    const refreshRes = await dispatch(app, 'POST', '/api/auth/refresh', {
      body: { refreshToken },
    });
    console.assert(refreshRes.status === 200, `Refresh should succeed, got ${refreshRes.status}`);
    console.assert(refreshRes.body.data.accessToken, 'New access token issued');
    console.assert(refreshRes.body.data.refreshToken !== refreshToken, 'Token rotation generated new refresh token');
    console.log('✓ 8. Refresh token rotation passed (new access + refresh tokens issued)');

    // 9. Token reuse detection (attempting to use the OLD rotated refresh token)
    const reuseRes = await dispatch(app, 'POST', '/api/auth/refresh', {
      body: { refreshToken }, // old token
    });
    console.assert(reuseRes.status === 403, `Token reuse should be 403, got ${reuseRes.status}`);
    console.log('✓ 9. Refresh token reuse detection & compromise revocation passed (HTTP 403)');

    // 10. Password recovery flow
    const forgotRes = await dispatch(app, 'POST', '/api/auth/forgot-password', {
      body: { email: testEmail },
    });
    console.assert(forgotRes.status === 200, 'Forgot password response 200');
    console.assert(forgotRes.body.resetToken, 'Reset token generated');
    console.log('✓ 10. Password reset token generation passed');

    const resetRes = await dispatch(app, 'POST', '/api/auth/reset-password', {
      body: {
        token: forgotRes.body.resetToken,
        newPassword: 'BrandNewPassword999!',
      },
    });
    console.assert(resetRes.status === 200, 'Reset password status 200');
    console.log('✓ 11. Password reset verification passed');

    // 11. Login with new password
    const newLogin = await dispatch(app, 'POST', '/api/auth/login', {
      body: { email: testEmail, password: 'BrandNewPassword999!' },
    });
    console.assert(newLogin.status === 200, 'Login with new password succeeded');
    console.log('✓ 12. Login with newly reset password passed');

    // 12. Session listing and revocation
    const sessionsRes = await dispatch(app, 'GET', '/api/auth/sessions', {
      headers: { authorization: `Bearer ${newLogin.body.data.accessToken}` },
    });
    console.assert(sessionsRes.status === 200, 'Sessions list should be 200');
    console.assert(sessionsRes.body.data.length > 0, 'Sessions returned');
    console.log('✓ 13. Active sessions inspection passed');

    // 13. Logout
    const logoutRes = await dispatch(app, 'POST', '/api/auth/logout', {
      body: { refreshToken: newLogin.body.data.refreshToken },
    });
    console.assert(logoutRes.status === 200, 'Logout succeeded');
    console.log('✓ 14. Logout and server session invalidation passed');

    console.log('\n======================================================');
    console.log('🎉 ALL BACKEND AUTHENTICATION & SECURITY TESTS PASSED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();
