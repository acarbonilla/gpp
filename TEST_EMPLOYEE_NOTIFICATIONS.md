# 🧪 Employee Notification Test Guide

## 🎯 **Test Objective**
Verify that employees receive real-time notifications when their visitors are checked in from the lobby.

## 📋 **Prerequisites**
- Backend server running on `http://localhost:8000`
- Frontend server running on `http://localhost:3000`
- At least one employee user account
- At least one lobby attendant user account
- At least one approved visitor scheduled for today

## 🔧 **Test Setup**

### **Step 1: Create Test Data**
1. **Login as Employee** (`http://localhost:3000/login`)
   - Create a visit request for today
   - Note the visitor name and scheduled time

2. **Login as Lobby Attendant** (separate browser/tab)
   - Go to `/lobby` to see today's visitors
   - Verify the employee's visitor appears in the list

## 🧪 **Test Scenarios**

### **Scenario 1: Real-time Check-in Notification**
**Goal**: Employee receives notification immediately when visitor is checked in

**Steps**:
1. **Employee Dashboard** (Browser 1)
   - Login as employee
   - Go to `/my-visitors` or dashboard
   - Open browser console (F12) to see debug logs
   - Note: Should see "NotificationSystem: Processing visitors: X" logs

2. **Lobby Check-in** (Browser 2)
   - Login as lobby attendant
   - Go to `/lobby`
   - Find the employee's visitor
   - Click "Check In" button
   - Verify check-in is successful

3. **Employee Notification** (Browser 1)
   - Wait up to 30 seconds for auto-refresh
   - OR click "Refresh" button manually
   - Check notification bell in navbar
   - Should see "Your Visitor Has Arrived" notification
   - Console should show: "NotificationSystem: Found checked-in visitor: [Name]"

**Expected Result**: ✅ Employee receives notification within 30 seconds

### **Scenario 2: Manual Refresh Test**
**Goal**: Verify manual refresh updates notifications immediately

**Steps**:
1. **Employee Dashboard**
   - Login as employee
   - Go to `/my-visitors`
   - Click "Refresh" button
   - Verify data updates immediately

2. **Lobby Check-in**
   - Check in a visitor from lobby

3. **Employee Manual Refresh**
   - Click "Refresh" button again
   - Check notifications immediately
   - Should see new notification

**Expected Result**: ✅ Manual refresh shows notifications immediately

### **Scenario 3: Auto-refresh Test**
**Goal**: Verify 30-second auto-refresh works

**Steps**:
1. **Employee Dashboard**
   - Login as employee
   - Go to `/my-visitors`
   - Note the current time

2. **Lobby Check-in**
   - Check in a visitor from lobby

3. **Wait and Observe**
   - Wait up to 30 seconds
   - Watch for automatic data refresh
   - Check notifications

**Expected Result**: ✅ Auto-refresh updates within 30 seconds

## 🔍 **Debug Information**

### **Console Logs to Look For**
```
NotificationSystem: Processing visitors: X
NotificationSystem: Current user: [username]
NotificationSystem: Is employee: true
NotificationSystem: Processing employee visitor: [visitor_name] for employee: [employee_name]
NotificationSystem: Found checked-in visitor: [visitor_name]
```

### **API Endpoints to Monitor**
- `GET /api/my-visitors/` - Should return data with `employee_name` field
- `POST /api/visit-log/check-in/` - Should update visit log
- `GET /api/lobby/today-visitors/` - Should show updated check-in status

### **Database Verification**
```sql
-- Check visit log was created
SELECT * FROM core_visitlog WHERE check_in_time IS NOT NULL ORDER BY check_in_time DESC LIMIT 5;

-- Check visit request status
SELECT id, visitor_id, employee_id, status, scheduled_time FROM core_visitrequest WHERE status = 'approved' ORDER BY scheduled_time DESC LIMIT 5;
```

## 🚨 **Troubleshooting**

### **Issue: No notifications appear**
**Check**:
1. Console logs for "NotificationSystem" messages
2. Network tab for API calls to `/api/my-visitors/`
3. Verify `employee_name` field is present in API response
4. Check if visitor data is being populated in `VisitorContext`

### **Issue: Notifications appear but are wrong**
**Check**:
1. Verify `employee_name` matches current username
2. Check notification timing (should be within 30 minutes of check-in)
3. Verify visitor status is 'approved'

### **Issue: Auto-refresh not working**
**Check**:
1. Console for JavaScript errors
2. Network tab for failed API calls
3. Verify 30-second interval is running

## ✅ **Success Criteria**

The test is successful if:
- [ ] Employee receives notification within 30 seconds of check-in
- [ ] Manual refresh shows notifications immediately
- [ ] Auto-refresh updates data every 30 seconds
- [ ] Console shows proper debug logs
- [ ] API returns data with `employee_name` field
- [ ] Notification bell shows unread count
- [ ] Clicking notification navigates to correct page

## 📝 **Test Results**

**Date**: _______________
**Tester**: _______________

| Scenario | Status | Notes |
|----------|--------|-------|
| Real-time Check-in | ⭕ Pass / ❌ Fail | |
| Manual Refresh | ⭕ Pass / ❌ Fail | |
| Auto-refresh | ⭕ Pass / ❌ Fail | |

**Overall Result**: ⭕ **PASS** / ❌ **FAIL**

**Issues Found**:
- _________________________________
- _________________________________

**Next Steps**:
- _________________________________
- _________________________________ 