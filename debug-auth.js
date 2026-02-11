// Debug script - Check authentication status
// Run this in browser console (F12)

console.log('=== Authentication Debug ===');

// Check localStorage
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('Token exists:', !!token);
console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
console.log('User exists:', !!user);

if (user && user !== 'undefined') {
    try {
        const parsedUser = JSON.parse(user);
        console.log('User data:', parsedUser);
    } catch (e) {
        console.error('Failed to parse user:', e);
    }
}

// Test API call
console.log('\n=== Testing Speaker API ===');
fetch('http://localhost:5000/api/speakers', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
    .then(res => res.json())
    .then(data => console.log('API Response:', data))
    .catch(err => console.error('API Error:', err));
