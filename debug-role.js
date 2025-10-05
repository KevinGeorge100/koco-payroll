// DEBUG ROLE ISSUE
// Copy this into browser console (F12) while logged in to see what's happening

console.log('=== ROLE DEBUG TEST ===');

// Check localStorage for token
const token = localStorage.getItem('token');
console.log('1. Token in localStorage:', token ? 'EXISTS' : 'NOT FOUND');

if (token) {
    // Test the backend profile endpoint
    fetch('http://localhost:5000/api/auth/profile', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('2. Backend profile response:', data);
        console.log('3. Role from backend:', data.profile?.role);
        console.log('4. Expected: admin, Actual:', data.profile?.role);
        
        if (data.profile?.role === 'admin') {
            console.log('✅ Backend shows ADMIN role');
        } else {
            console.log('❌ Backend shows role:', data.profile?.role);
        }
    })
    .catch(error => {
        console.log('❌ Error fetching profile:', error);
    });
} else {
    console.log('❌ No token found - user not logged in');
}

// Check current React context state
console.log('5. Current window location:', window.location.href);
console.log('6. Run this after login to debug the issue');

console.log('=== END DEBUG ===');