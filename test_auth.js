// Authentication test script
// Run this in browser console to test login and API access

console.log('🔐 Testing Authentication...');

// Step 1: Check if user is already logged in
const token = localStorage.getItem('accessToken');
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

console.log('Current token exists:', !!token);
console.log('Current user info:', userInfo);

if (!token) {
    console.log('❌ No token found. You need to login first.');
    console.log('Go to http://localhost:3000/login and login as an employee.');
    return;
}

// Step 2: Test the token with a simple API call
async function testAuth() {
    try {
        console.log('🔍 Testing token with /api/user-info/...');
        
        const response = await fetch('http://localhost:8000/api/user-info/', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            console.log('✅ Token is valid! User data:', userData);
            
            // Now test the my-visitors endpoint
            console.log('🔍 Testing /api/my-visitors/...');
            
            const visitorsResponse = await fetch('http://localhost:8000/api/my-visitors/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (visitorsResponse.ok) {
                const visitorsData = await visitorsResponse.json();
                console.log('✅ My visitors API works! Data:', visitorsData);
                console.log('Visitor count:', visitorsData.length);
                
                if (visitorsData.length > 0) {
                    console.log('First visitor:', visitorsData[0]);
                    console.log('Has employee_name:', 'employee_name' in visitorsData[0]);
                }
            } else {
                console.log('❌ My visitors API failed:', visitorsResponse.status, visitorsResponse.statusText);
                const errorText = await visitorsResponse.text();
                console.log('Error details:', errorText);
            }
            
        } else {
            console.log('❌ Token is invalid or expired:', response.status, response.statusText);
            console.log('You need to login again.');
            
            // Clear invalid token
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userInfo');
            console.log('Cleared invalid token from localStorage');
        }
        
    } catch (error) {
        console.log('❌ Network error:', error);
        console.log('Make sure the backend server is running on http://localhost:8000');
    }
}

// Step 3: Login function (if needed)
async function login(username, password) {
    try {
        console.log(`🔐 Attempting to login as ${username}...`);
        
        const response = await fetch('http://localhost:8000/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Login successful!');
            console.log('Token received:', !!data.access_token);
            
            // Store the token
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('userInfo', JSON.stringify(data.user));
            
            console.log('Token stored in localStorage');
            
            // Test the API again
            await testAuth();
            
        } else {
            const errorData = await response.json();
            console.log('❌ Login failed:', errorData);
        }
        
    } catch (error) {
        console.log('❌ Login error:', error);
    }
}

// Run the test
testAuth();

console.log('\n📝 If you need to login, run:');
console.log('login("your_username", "your_password")');
console.log('\n📝 Example:');
console.log('login("employee1", "password123")'); 