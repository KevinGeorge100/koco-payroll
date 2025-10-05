import http from 'http';

const testData = {
  firstName: 'API Test',
  lastName: 'Employee',
  email: 'apitest@example.com',
  positionId: 'Software Developer',
  salary: 60000
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/employees',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Testing API route /api/employees...');
console.log('Data being sent:', testData);

const req = http.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📦 Response Body:', data);
    if (res.statusCode === 201) {
      console.log('✅ Employee creation successful!');
    } else {
      console.log('❌ Employee creation failed');
    }
  });
});

req.on('error', (e) => {
  console.error('🔥 Request Error:', e.message);
});

req.write(postData);
req.end();