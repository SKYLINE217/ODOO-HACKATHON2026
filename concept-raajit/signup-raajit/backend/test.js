const http = require('http');

const API_BASE = 'http://localhost:3001/api/v1/auth';

async function fetchAPI(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              body: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              body: data
            });
          }
        });
      }
    );

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting API Tests ---');

  const randomEmail = `test_${Date.now()}@example.com`;

  // Test 1: Signup with short password
  console.log('\n[Test 1] Signup with short password');
  let res = await fetchAPI('/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: randomEmail,
      password: 'short',
      role: 'driver'
    })
  });
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${JSON.stringify(res.body)}`);

  // Test 2: Successful Signup
  console.log('\n[Test 2] Successful Signup');
  res = await fetchAPI('/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: randomEmail,
      password: 'Password123!',
      role: 'driver'
    })
  });
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${JSON.stringify(res.body)}`);

  // Test 3: Duplicate Signup
  console.log('\n[Test 3] Duplicate Signup');
  res = await fetchAPI('/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User 2',
      email: randomEmail,
      password: 'Password123!',
      role: 'driver'
    })
  });
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${JSON.stringify(res.body)}`);

  // Test 4: Login with wrong password
  console.log('\n[Test 4] Login with wrong password');
  res = await fetchAPI('/login', {
    method: 'POST',
    body: JSON.stringify({
      email: randomEmail,
      password: 'WrongPassword123!'
    })
  });
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${JSON.stringify(res.body)}`);

  // Test 5: Successful Login
  console.log('\n[Test 5] Successful Login');
  res = await fetchAPI('/login', {
    method: 'POST',
    body: JSON.stringify({
      email: randomEmail,
      password: 'Password123!'
    })
  });
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${JSON.stringify(res.body)}`);
  
  const token = res.body.data ? res.body.data.token : null;

  if (token) {
    // Test 6: Get /me with valid token
    console.log('\n[Test 6] Get /me with valid token');
    res = await fetchAPI('/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(res.body)}`);
  }

  // Test 7: Get /me with invalid token
  console.log('\n[Test 7] Get /me with invalid token');
  res = await fetchAPI('/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer invalid_token`
    }
  });
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${JSON.stringify(res.body)}`);

  console.log('\n--- Tests Complete ---');
}

runTests().catch(console.error);
