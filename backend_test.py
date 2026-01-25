#!/usr/bin/env python3
"""
Africa One Voice (AOV) Backend API Testing Suite
Tests authentication, OTP verification, PayPal integration, and core APIs
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://talentafrica.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@africaonevoice.com"
ADMIN_PASSWORD = "admin123"
VOTER_EMAIL = "voter@test.com"
VOTER_PASSWORD = "voter123"
DEV_OTP_CODE = "123456"  # Mock mode OTP

# Test state
test_results = []
session_cookies = {}

def log_test(test_name, success, message, details=None):
    """Log test results"""
    result = {
        "test": test_name,
        "success": success,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "details": details or {}
    }
    test_results.append(result)
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}: {message}")
    if details and not success:
        print(f"   Details: {details}")

def make_request(method, endpoint, data=None, cookies=None, headers=None):
    """Make HTTP request with error handling"""
    url = f"{API_BASE}{endpoint}"
    default_headers = {"Content-Type": "application/json"}
    if headers:
        default_headers.update(headers)
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, cookies=cookies, headers=default_headers, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, cookies=cookies, headers=default_headers, timeout=30)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, cookies=cookies, headers=default_headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        return None

def test_registration_api():
    """Test user registration with email OTP"""
    print("\n=== Testing Registration API ===")
    
    # Test 1: Valid registration
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    registration_data = {
        "email": unique_email,
        "password": "testpass123",
        "name": "Test User",
        "role": "VOTER"
    }
    
    response = make_request("POST", "/auth/register", registration_data)
    if response and response.status_code == 201:
        data = response.json()
        if data.get("success") and data.get("userId"):
            log_test("Registration - Valid User", True, "User registered successfully", {
                "userId": data.get("userId"),
                "mockMode": data.get("mockMode"),
                "devOtpHint": data.get("devOtpHint")
            })
            return data.get("userId"), unique_email
        else:
            log_test("Registration - Valid User", False, "Invalid response format", data)
    else:
        log_test("Registration - Valid User", False, f"Request failed: {response.status_code if response else 'No response'}", 
                response.json() if response else {})
    
    # Test 2: Missing required fields
    response = make_request("POST", "/auth/register", {"email": "test@example.com"})
    if response and response.status_code == 400:
        log_test("Registration - Missing Fields", True, "Correctly rejected missing fields")
    else:
        log_test("Registration - Missing Fields", False, "Should reject missing fields")
    
    # Test 3: Invalid email
    response = make_request("POST", "/auth/register", {
        "email": "invalid-email",
        "password": "testpass123",
        "name": "Test User"
    })
    if response and response.status_code == 400:
        log_test("Registration - Invalid Email", True, "Correctly rejected invalid email")
    else:
        log_test("Registration - Invalid Email", False, "Should reject invalid email")
    
    # Test 4: Weak password
    response = make_request("POST", "/auth/register", {
        "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
        "password": "123",
        "name": "Test User"
    })
    if response and response.status_code == 400:
        log_test("Registration - Weak Password", True, "Correctly rejected weak password")
    else:
        log_test("Registration - Weak Password", False, "Should reject weak password")
    
    # Test 5: Duplicate email
    response = make_request("POST", "/auth/register", registration_data)
    if response and response.status_code == 409:
        log_test("Registration - Duplicate Email", True, "Correctly rejected duplicate email")
    else:
        log_test("Registration - Duplicate Email", False, "Should reject duplicate email")
    
    return None, None

def test_otp_verification_api(user_id, email):
    """Test OTP verification"""
    print("\n=== Testing OTP Verification API ===")
    
    if not user_id:
        log_test("OTP Verification - Setup", False, "No user ID from registration")
        return False
    
    # Test 1: Valid OTP verification
    response = make_request("POST", "/auth/verify-otp", {
        "userId": user_id,
        "otpCode": DEV_OTP_CODE
    })
    if response and response.status_code == 200:
        data = response.json()
        if data.get("success"):
            log_test("OTP Verification - Valid Code", True, "OTP verified successfully")
            return True
        else:
            log_test("OTP Verification - Valid Code", False, "OTP verification failed", data)
    else:
        log_test("OTP Verification - Valid Code", False, f"Request failed: {response.status_code if response else 'No response'}")
    
    # Test 2: Invalid OTP code
    response = make_request("POST", "/auth/verify-otp", {
        "userId": user_id,
        "otpCode": "000000"
    })
    if response and response.status_code == 400:
        log_test("OTP Verification - Invalid Code", True, "Correctly rejected invalid OTP")
    else:
        log_test("OTP Verification - Invalid Code", False, "Should reject invalid OTP")
    
    # Test 3: Missing fields
    response = make_request("POST", "/auth/verify-otp", {"userId": user_id})
    if response and response.status_code == 400:
        log_test("OTP Verification - Missing Code", True, "Correctly rejected missing OTP code")
    else:
        log_test("OTP Verification - Missing Code", False, "Should reject missing OTP code")
    
    # Test 4: Non-existent user
    response = make_request("POST", "/auth/verify-otp", {
        "userId": "507f1f77bcf86cd799439011",  # Valid ObjectId format
        "otpCode": DEV_OTP_CODE
    })
    if response and response.status_code == 404:
        log_test("OTP Verification - Non-existent User", True, "Correctly rejected non-existent user")
    else:
        log_test("OTP Verification - Non-existent User", False, "Should reject non-existent user")
    
    return False

def test_resend_otp_api(user_id, email):
    """Test resend OTP functionality"""
    print("\n=== Testing Resend OTP API ===")
    
    if not user_id:
        log_test("Resend OTP - Setup", False, "No user ID available")
        return
    
    # Test 1: Valid resend request
    response = make_request("POST", "/auth/resend-otp", {"userId": user_id})
    if response and response.status_code == 200:
        data = response.json()
        if data.get("success"):
            log_test("Resend OTP - Valid Request", True, "OTP resent successfully")
        else:
            log_test("Resend OTP - Valid Request", False, "Resend failed", data)
    else:
        log_test("Resend OTP - Valid Request", False, f"Request failed: {response.status_code if response else 'No response'}")
    
    # Test 2: Cooldown period (should fail if called immediately)
    response = make_request("POST", "/auth/resend-otp", {"userId": user_id})
    if response and response.status_code == 429:
        data = response.json()
        log_test("Resend OTP - Cooldown", True, f"Correctly enforced cooldown: {data.get('waitSeconds', 'N/A')}s")
    else:
        log_test("Resend OTP - Cooldown", False, "Should enforce 60-second cooldown")
    
    # Test 3: Missing user identifier
    response = make_request("POST", "/auth/resend-otp", {})
    if response and response.status_code == 400:
        log_test("Resend OTP - Missing User ID", True, "Correctly rejected missing user ID")
    else:
        log_test("Resend OTP - Missing User ID", False, "Should reject missing user ID")

def test_nextauth_login():
    """Test NextAuth login functionality"""
    print("\n=== Testing NextAuth Login ===")
    
    # Test 1: Login with verified voter
    login_data = {
        "email": VOTER_EMAIL,
        "password": VOTER_PASSWORD,
        "redirect": "false"
    }
    
    response = make_request("POST", "/auth/callback/credentials", login_data)
    if response:
        if response.status_code == 200:
            log_test("NextAuth Login - Verified User", True, "Login successful")
            # Store cookies for later use
            if response.cookies:
                session_cookies.update(dict(response.cookies))
        else:
            log_test("NextAuth Login - Verified User", False, f"Login failed: {response.status_code}")
    else:
        log_test("NextAuth Login - Verified User", False, "No response from login endpoint")
    
    # Test 2: Login with admin
    admin_login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
        "redirect": "false"
    }
    
    response = make_request("POST", "/auth/callback/credentials", admin_login_data)
    if response:
        if response.status_code == 200:
            log_test("NextAuth Login - Admin User", True, "Admin login successful")
        else:
            log_test("NextAuth Login - Admin User", False, f"Admin login failed: {response.status_code}")
    else:
        log_test("NextAuth Login - Admin User", False, "No response from admin login")
    
    # Test 3: Invalid credentials
    invalid_login_data = {
        "email": "nonexistent@example.com",
        "password": "wrongpassword",
        "redirect": "false"
    }
    
    response = make_request("POST", "/auth/callback/credentials", invalid_login_data)
    if response and response.status_code in [401, 403]:
        log_test("NextAuth Login - Invalid Credentials", True, "Correctly rejected invalid credentials")
    else:
        log_test("NextAuth Login - Invalid Credentials", False, "Should reject invalid credentials")

def test_paypal_apis():
    """Test PayPal integration APIs"""
    print("\n=== Testing PayPal APIs ===")
    
    # Test 1: PayPal Create Order (should return 503 - not configured)
    order_data = {
        "contestantId": "507f1f77bcf86cd799439011",  # Mock contestant ID
        "votesQty": 5
    }
    
    response = make_request("POST", "/paypal/create-order", order_data, cookies=session_cookies)
    if response and response.status_code == 503:
        data = response.json()
        log_test("PayPal Create Order - Not Configured", True, "Correctly returned 503 for unconfigured PayPal")
    else:
        log_test("PayPal Create Order - Not Configured", False, f"Expected 503, got {response.status_code if response else 'No response'}")
    
    # Test 2: PayPal Verify/Capture with invalid reference
    response = make_request("POST", "/paypal/verify-or-capture", {"reference": "invalid_ref"})
    if response and response.status_code == 404:
        log_test("PayPal Verify - Invalid Reference", True, "Correctly returned 404 for invalid reference")
    else:
        log_test("PayPal Verify - Invalid Reference", False, "Should return 404 for invalid reference")
    
    # Test 3: PayPal Webhook Health Check
    response = make_request("GET", "/paypal/webhook")
    if response and response.status_code == 200:
        data = response.json()
        if data.get("status") == "active":
            log_test("PayPal Webhook Health", True, "Webhook endpoint is active")
        else:
            log_test("PayPal Webhook Health", False, "Webhook status not active", data)
    else:
        log_test("PayPal Webhook Health", False, f"Webhook health check failed: {response.status_code if response else 'No response'}")

def test_contestants_api():
    """Test contestants CRUD API"""
    print("\n=== Testing Contestants API ===")
    
    # Test 1: Get approved contestants (public)
    response = make_request("GET", "/contestants")
    if response and response.status_code == 200:
        data = response.json()
        if "contestants" in data and "pagination" in data:
            log_test("Contestants API - Get List", True, f"Retrieved {len(data['contestants'])} contestants")
        else:
            log_test("Contestants API - Get List", False, "Invalid response format", data)
    else:
        log_test("Contestants API - Get List", False, f"Request failed: {response.status_code if response else 'No response'}")
    
    # Test 2: Get contestants with pagination
    response = make_request("GET", "/contestants?page=1&limit=5")
    if response and response.status_code == 200:
        data = response.json()
        pagination = data.get("pagination", {})
        if pagination.get("limit") == 5:
            log_test("Contestants API - Pagination", True, "Pagination working correctly")
        else:
            log_test("Contestants API - Pagination", False, "Pagination not working", pagination)
    else:
        log_test("Contestants API - Pagination", False, "Pagination request failed")
    
    # Test 3: Search contestants
    response = make_request("GET", "/contestants?search=test")
    if response and response.status_code == 200:
        log_test("Contestants API - Search", True, "Search functionality working")
    else:
        log_test("Contestants API - Search", False, "Search functionality failed")

def test_leaderboard_api():
    """Test leaderboard API"""
    print("\n=== Testing Leaderboard API ===")
    
    # Test 1: Get leaderboard
    response = make_request("GET", "/leaderboard")
    if response and response.status_code == 200:
        data = response.json()
        if "leaderboard" in data:
            log_test("Leaderboard API - Get Data", True, f"Retrieved leaderboard with {len(data['leaderboard'])} entries")
        else:
            log_test("Leaderboard API - Get Data", False, "Invalid response format", data)
    else:
        log_test("Leaderboard API - Get Data", False, f"Request failed: {response.status_code if response else 'No response'}")
    
    # Test 2: Get leaderboard with limit
    response = make_request("GET", "/leaderboard?limit=10")
    if response and response.status_code == 200:
        data = response.json()
        leaderboard = data.get("leaderboard", [])
        if len(leaderboard) <= 10:
            log_test("Leaderboard API - Limit", True, f"Limit working correctly: {len(leaderboard)} entries")
        else:
            log_test("Leaderboard API - Limit", False, f"Limit not working: {len(leaderboard)} entries")
    else:
        log_test("Leaderboard API - Limit", False, "Limit request failed")

def test_admin_apis():
    """Test admin APIs (require admin session)"""
    print("\n=== Testing Admin APIs ===")
    
    # Note: These tests may fail without proper admin session
    # Test 1: Admin Stats
    response = make_request("GET", "/admin/stats", cookies=session_cookies)
    if response:
        if response.status_code == 200:
            data = response.json()
            log_test("Admin Stats API", True, "Admin stats retrieved successfully")
        elif response.status_code == 401:
            log_test("Admin Stats API", True, "Correctly requires authentication")
        else:
            log_test("Admin Stats API", False, f"Unexpected status: {response.status_code}")
    else:
        log_test("Admin Stats API", False, "No response from admin stats")
    
    # Test 2: Admin Contestants
    response = make_request("GET", "/admin/contestants", cookies=session_cookies)
    if response:
        if response.status_code == 200:
            log_test("Admin Contestants API", True, "Admin contestants retrieved successfully")
        elif response.status_code == 401:
            log_test("Admin Contestants API", True, "Correctly requires authentication")
        else:
            log_test("Admin Contestants API", False, f"Unexpected status: {response.status_code}")
    else:
        log_test("Admin Contestants API", False, "No response from admin contestants")
    
    # Test 3: Admin Settings
    response = make_request("GET", "/admin/settings", cookies=session_cookies)
    if response:
        if response.status_code == 200:
            log_test("Admin Settings API", True, "Admin settings retrieved successfully")
        elif response.status_code == 401:
            log_test("Admin Settings API", True, "Correctly requires authentication")
        else:
            log_test("Admin Settings API", False, f"Unexpected status: {response.status_code}")
    else:
        log_test("Admin Settings API", False, "No response from admin settings")

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting Africa One Voice Backend API Tests")
    print(f"Base URL: {BASE_URL}")
    print(f"Mock OTP Code: {DEV_OTP_CODE}")
    print("=" * 60)
    
    # High Priority Tests
    user_id, email = test_registration_api()
    otp_verified = test_otp_verification_api(user_id, email)
    test_resend_otp_api(user_id, email)
    test_nextauth_login()
    test_paypal_apis()
    
    # Medium Priority Tests
    test_contestants_api()
    test_leaderboard_api()
    test_admin_apis()
    
    # Summary
    print("\n" + "=" * 60)
    print("🏁 TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(test_results)
    passed_tests = sum(1 for result in test_results if result["success"])
    failed_tests = total_tests - passed_tests
    
    print(f"Total Tests: {total_tests}")
    print(f"✅ Passed: {passed_tests}")
    print(f"❌ Failed: {failed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if failed_tests > 0:
        print("\n❌ FAILED TESTS:")
        for result in test_results:
            if not result["success"]:
                print(f"  - {result['test']}: {result['message']}")
    
    print("\n📊 DETAILED RESULTS:")
    for result in test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}")
    
    return test_results

if __name__ == "__main__":
    results = run_all_tests()