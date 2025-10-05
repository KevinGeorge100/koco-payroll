const axios = require('axios');

async function testAPI() {
    try {
        console.log('Testing employee creation via API...');
        
        const newEmployee = {
            firstName: 'Test',
            lastName: 'Employee',
            email: 'test.api@example.com',
            phone: '555-0123',
            dateOfBirth: '1990-01-01',
            hireDate: '2024-01-01',
            salary: 50000,
            employeeNumber: 'API001',
            address: '123 API Test St'
        };
        
        console.log('Sending POST request to API...');
        
        const response = await axios.post('http://localhost:5000/api/employees', newEmployee, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API Response:', response.status, response.statusText);
        console.log('Response data:', response.data);
        
    } catch (error) {
        console.error('API Error:', error.response?.status, error.response?.statusText);
        console.error('Error data:', error.response?.data);
        console.error('Full error:', error.message);
    }
}

testAPI();