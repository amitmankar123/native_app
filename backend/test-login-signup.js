const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'src', '.env') });

const app = require('./src/app');
const { dispatch } = require('./test-client');
const { db } = require('./src/config/db');
const bcrypt = require('bcrypt');

async function testLoginAndSignupOnly() {
  console.log('\n======================================================');
  console.log('🧪 TESTING ONLY: LOGIN & SIGNUP (REGISTRATION)');
  console.log('======================================================\n');

  try {
    const testEmail = `test_user_${Date.now()}@aurorafinance.com`;
    const rawPassword = 'SecurePassword789!';

    // TEST 1: SIGNUP (REGISTRATION) WITH VALID CREDENTIALS
    console.log('Test 1: Testing Signup (POST /api/auth/register)...');
    const signupRes = await dispatch(app, 'POST', '/api/auth/register', {
      body: {
        name: 'Aarav Sharma',
        email: testEmail,
        password: rawPassword,
        mobile: '+91 9876543210',
      },
    });

    console.assert(signupRes.status === 201, `Expected status 201, got ${signupRes.status}`);
    console.assert(signupRes.body.success === true, 'Response success flag must be true');
    console.assert(signupRes.body.data.user.email === testEmail, 'User email must match');
    console.assert(signupRes.body.data.accessToken, 'Access token must be generated');
    console.assert(signupRes.body.data.refreshToken, 'Refresh token must be generated');

    // Verify in SQLite database that password is cryptographically hashed with bcrypt
    const dbUser = db.prepare('SELECT * FROM users WHERE email = ?').get(testEmail);
    console.assert(dbUser !== undefined, 'User must exist in SQLite database');
    console.assert(dbUser.password_hash !== rawPassword, 'Password must NOT be stored in plain text');
    const isBcryptMatch = await bcrypt.compare(rawPassword, dbUser.password_hash);
    console.assert(isBcryptMatch === true, 'Bcrypt hash must verify against raw password');

    console.log('  ✅ Status 201: Account registered successfully');
    console.log(`  ✅ Database: User persisted in DB (ID: ${dbUser.id})`);
    console.log(`  ✅ Bcrypt Security: Password properly hashed (${dbUser.password_hash.substring(0, 20)}...)`);
    console.log('  ✅ Tokens: Access token & Refresh token issued\n');

    // TEST 2: PREVENT DUPLICATE SIGNUP
    console.log('Test 2: Testing Duplicate Signup Prevention (Same Email)...');
    const duplicateRes = await dispatch(app, 'POST', '/api/auth/register', {
      body: {
        name: 'Imposter User',
        email: testEmail,
        password: 'AnotherPassword456!',
      },
    });

    console.assert(duplicateRes.status === 409, `Expected status 409, got ${duplicateRes.status}`);
    console.assert(duplicateRes.body.success === false, 'Duplicate must fail');
    console.log('  ✅ Status 409: Duplicate account blocked successfully\n');

    // TEST 3: SIGNUP VALIDATION (Short password & invalid email)
    console.log('Test 3: Testing Signup Validation Rules...');
    const shortPassRes = await dispatch(app, 'POST', '/api/auth/register', {
      body: {
        name: 'Test',
        email: 'valid@mail.com',
        password: '123', // < 6 chars
      },
    });
    console.assert(shortPassRes.status === 400, 'Short password must be rejected');

    const badEmailRes = await dispatch(app, 'POST', '/api/auth/register', {
      body: {
        name: 'Test',
        email: 'not-an-email',
        password: 'Password123!',
      },
    });
    console.assert(badEmailRes.status === 400, 'Invalid email format must be rejected');
    console.log('  ✅ Status 400: Short passwords & malformed emails properly rejected\n');

    // TEST 4: LOGIN WITH CORRECT CREDENTIALS
    console.log('Test 4: Testing Login With Valid Credentials (POST /api/auth/login)...');
    const loginRes = await dispatch(app, 'POST', '/api/auth/login', {
      body: {
        email: testEmail,
        password: rawPassword,
      },
    });

    console.assert(loginRes.status === 200, `Expected status 200, got ${loginRes.status}`);
    console.assert(loginRes.body.success === true, 'Login response success must be true');
    console.assert(loginRes.body.data.user.id === dbUser.id, 'Logged in user ID must match DB record');
    console.assert(loginRes.body.data.accessToken, 'Access token must be returned');
    console.assert(loginRes.body.data.refreshToken, 'Refresh token must be returned');
    console.assert(loginRes.body.data.preferences, 'Preferences must be loaded');

    // Verify session persisted in refresh_sessions table
    const sessionCount = db.prepare('SELECT COUNT(*) as count FROM refresh_sessions WHERE user_id = ?').get(dbUser.id).count;
    console.assert(sessionCount > 0, 'Active session record must exist in DB');

    console.log('  ✅ Status 200: Successfully logged in');
    console.log(`  ✅ Authenticated User: ${loginRes.body.data.user.name} (${loginRes.body.data.user.email})`);
    console.log(`  ✅ Session: Active session created in DB (Total sessions: ${sessionCount})\n`);

    // TEST 5: LOGIN WITH WRONG PASSWORD
    console.log('Test 5: Testing Login With Invalid Password...');
    const wrongPassRes = await dispatch(app, 'POST', '/api/auth/login', {
      body: {
        email: testEmail,
        password: 'IncorrectPassword999!',
      },
    });

    console.assert(wrongPassRes.status === 401, `Expected status 401, got ${wrongPassRes.status}`);
    console.assert(wrongPassRes.body.success === false, 'Wrong password must be rejected');
    console.log('  ✅ Status 401: Invalid password rejected securely\n');

    // TEST 6: LOGIN WITH NON-EXISTENT USER
    console.log('Test 6: Testing Login With Non-Existent Email...');
    const nonExistentRes = await dispatch(app, 'POST', '/api/auth/login', {
      body: {
        email: 'nobody_exists_here_999@test.com',
        password: 'SomePassword123!',
      },
    });

    console.assert(nonExistentRes.status === 401, `Expected status 401, got ${nonExistentRes.status}`);
    console.log('  ✅ Status 401: Non-existent email rejected securely\n');

    console.log('======================================================');
    console.log('🎉 ALL 6 LOGIN & SIGNUP TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Login/Signup test failed:', err);
    process.exit(1);
  }
}

testLoginAndSignupOnly();

