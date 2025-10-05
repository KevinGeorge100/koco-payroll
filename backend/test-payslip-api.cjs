require('dotenv').config();
const axios = require('axios');

async function testPayslipAPI() {
    try {
        console.log('Testing payslip API without authentication...');
        
        // First, let's check if we have the employee we created earlier
        const existingEmployee = 'e30f3574-2602-40b7-8a44-4f084cf4006c'; // From earlier test
        
        console.log(`\n1. Testing payslip generation for employee: ${existingEmployee}`);
        
        // Test payslip generation for October 2025
        const response = await axios.get(
            `http://localhost:5000/api/payslips/employee/${existingEmployee}/2025/10`
        );
        
        console.log('✅ Payslip API Response Status:', response.status);
        console.log('📄 Payslip Data:', JSON.stringify(response.data, null, 2));
        
        // Test available payslips endpoint
        console.log(`\n2. Testing available payslips for employee: ${existingEmployee}`);
        const listResponse = await axios.get(
            `http://localhost:5000/api/payslips/employee/${existingEmployee}`
        );
        
        console.log('✅ Available Payslips Response Status:', listResponse.status);
        console.log('📋 Available Payslips:', JSON.stringify(listResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ API Test Error:', error.response?.status, error.response?.statusText);
        console.error('Error details:', error.response?.data);
        console.error('Full error:', error.message);
    }
}

testPayslipAPI();