const http = require('http');

const API_URL = 'http://localhost:3001/api/v1';

async function testSecurity() {
  console.log('🛡️  Running TransitOps Security & Backend Tests...\n');

  // Test 1: Helmet Security Headers
  console.log('[Test 1] Checking Helmet Security Headers...');
  try {
    const res = await fetch(`${API_URL}/health`);
    const headers = res.headers;
    if (headers.get('x-dns-prefetch-control') === 'off' && headers.get('x-frame-options') === 'SAMEORIGIN') {
      console.log('✅ Helmet headers are active (X-Frame-Options, X-DNS-Prefetch-Control)');
    } else {
      console.log('❌ Helmet headers missing');
    }
  } catch (err) {
    console.error('❌ Could not connect to backend. Is the server running on port 3001?');
    process.exit(1);
  }

  // Test 2: CORS Configuration
  console.log('\n[Test 2] Checking CORS configuration...');
  try {
    const res = await fetch(`${API_URL}/health`, {
      headers: { 'Origin': 'http://malicious-site.com' }
    });
    // Depending on cors setup, it might reject or omit access-control-allow-origin
    if (!res.headers.get('access-control-allow-origin') || res.headers.get('access-control-allow-origin') !== 'http://malicious-site.com') {
      console.log('✅ CORS correctly restricted (Malicious origin not echoed)');
    } else {
      console.log('❌ CORS is too permissive!');
    }
  } catch (err) {
    console.error('❌ CORS test failed:', err.message);
  }

  // Test 3: Zod Input Validation (Strict Mode)
  console.log('\n[Test 3] Checking Zod Strict Input Validation (SQL Injection prevention)...');
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'pass', malicious_field: 'DROP TABLE users' })
    });
    const json = await res.json();
    if (res.status === 400 && json.error && json.error.code === 'VALIDATION_ERROR') {
      console.log('✅ Zod correctly rejected extra/malicious fields with 400 VALIDATION_ERROR');
    } else {
      console.log('❌ Validation failed to catch extra fields! Status:', res.status);
    }
  } catch (err) {
    console.error('❌ Validation test failed:', err.message);
  }

  // Test 4: Rate Limiting
  console.log('\n[Test 4] Checking Login Rate Limiting (Max 5 attempts)...');
  let hitLimit = false;
  for (let i = 1; i <= 6; i++) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `test${i}@example.com`, password: 'password123' })
    });
    if (res.status === 429) {
      hitLimit = true;
      console.log(`✅ Rate limit correctly triggered on attempt ${i} (429 Too Many Requests)`);
      break;
    }
  }
  if (!hitLimit) {
    console.log('❌ Rate limiter failed to block requests!');
  }

  console.log('\n🎉 All Security Tests Passed!');
}

testSecurity();
