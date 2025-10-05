const http = require('http');

const testData = {
  firstName: 'Test',
  lastName: 'Employee',
  email: 'test@example.com',
  positionId: 'Software Developer',
  salary: 50000
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

console.log('Testing employee creation API...');
console.log('Data:', testData);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:', data);
    try {
      const jsonResponse = JSON.parse(data);
      console.log('Parsed Response:', JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('Response is not JSON:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
});

req.write(postData);
req.end();