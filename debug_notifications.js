// Debug script for employee notifications
// Run this in browser console to check notification system

console.log('🔍 Debugging Employee Notifications...');

// Check if user is authenticated
const token = localStorage.getItem('accessToken');
console.log('Token exists:', !!token);

// Check current user info
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
console.log('User info:', userInfo);

// Check if visitor context has data
// This will work if you're on a page that uses VisitorContext
if (window.visitorContext) {
    console.log('Visitor context data:', window.visitorContext.visitors);
    console.log('Visitor count:', window.visitorContext.visitors.length);
} else {
    console.log('❌ Visitor context not found - you may not be on the right page');
}

// Check notification system
const notificationSystem = document.querySelector('[data-testid="notification-system"]');
console.log('Notification system element found:', !!notificationSystem);

// Check for notification bell
const notificationBell = document.querySelector('button[aria-label*="notification"], button[aria-label*="bell"]');
console.log('Notification bell found:', !!notificationBell);

// Check for unread count
const unreadCount = document.querySelector('[class*="bg-red-500"]');
console.log('Unread count badge found:', !!unreadCount);

// Test API call
async function testMyVisitorsAPI() {
    try {
        const response = await fetch('http://localhost:8000/api/my-visitors/', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ My visitors API response:', data);
            console.log('Visitor count:', data.length);
            
            if (data.length > 0) {
                const firstVisitor = data[0];
                console.log('First visitor:', firstVisitor);
                console.log('Has employee_name:', 'employee_name' in firstVisitor);
                console.log('Employee name:', firstVisitor.employee_name);
                console.log('Is checked in:', firstVisitor.is_checked_in);
                console.log('Check in time:', firstVisitor.check_in_time);
            }
        } else {
            console.log('❌ API call failed:', response.status, response.statusText);
        }
    } catch (error) {
        console.log('❌ API call error:', error);
    }
}

// Run the test
testMyVisitorsAPI();

console.log('🔍 Debug complete. Check the output above for issues.'); 