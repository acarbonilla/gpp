import requests
import json

# Test the new pending approvals endpoint
def test_pending_approvals():
    print("=== Testing Pending Approvals Endpoint ===")
    
    # Test without authentication (should fail)
    try:
        response = requests.get('http://localhost:8000/api/visit-requests/pending-approvals/')
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n=== End Test ===")

if __name__ == "__main__":
    test_pending_approvals() 