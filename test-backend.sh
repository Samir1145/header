#!/bin/bash
# Test script for SQLite backend API
# Usage: bash test-backend.sh

BASE_URL="http://localhost:4000"
PASS=0
FAIL=0

echo "=== Rezolution Bazar Backend Test Suite ==="
echo "Testing: $BASE_URL"
echo ""

# Helper function
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  local description=$5

  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN")
  fi

  status=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')

  if [ "$status" = "$expected_status" ]; then
    echo "  PASS  $description ($method $endpoint) -> $status"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $description ($method $endpoint) -> $status (expected $expected_status)"
    echo "        Body: $(echo "$body" | head -1)"
    FAIL=$((FAIL + 1))
  fi

  echo "$body"  # Return body for capture
}

# 1. Health Check
echo "--- Health Check ---"
test_endpoint GET /health "" 200 "Health endpoint"
echo ""

# 2. Register a test user
echo "--- Auth: Register ---"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}')
REG_STATUS=$(echo "$REGISTER_RESPONSE" | tail -1)
REG_BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$REG_STATUS" = "201" ] || [ "$REG_STATUS" = "400" ]; then
  echo "  PASS  Register user -> $REG_STATUS"
  PASS=$((PASS + 1))
else
  echo "  FAIL  Register user -> $REG_STATUS"
  FAIL=$((FAIL + 1))
fi
echo ""

# 3. Login
echo "--- Auth: Login ---"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
  echo "  PASS  Login -> Got JWT token"
  PASS=$((PASS + 1))
else
  echo "  FAIL  Login -> No token received"
  echo "        Response: $LOGIN_RESPONSE"
  FAIL=$((FAIL + 1))
fi
echo ""

# 4. Auth Status
echo "--- Auth: Status ---"
test_endpoint GET /api/auth/status "" 200 "Auth status (authenticated)"
echo ""

# 5. Get Current User
echo "--- User: Get Profile ---"
test_endpoint GET /api/users/me "" 200 "Get current user profile"
echo ""

# 6. Navigation Tabs
echo "--- Admin: Navigation Tabs ---"
test_endpoint GET /api/admin/tabs "" 200 "Get navigation tabs"
echo ""

# 7. Site Settings
echo "--- Settings: Site ---"
test_endpoint GET /api/settings/site "" 200 "Get site settings"
echo ""

# 8. Form Schemas
echo "--- Forms: Schemas ---"
test_endpoint GET /api/forms/schemas "" 200 "List form schemas"
echo ""

# 9. Form Categories
echo "--- Forms: Categories ---"
test_endpoint GET /api/forms/categories "" 200 "List form categories"
echo ""

# 10. Form Submissions
echo "--- Forms: Submissions ---"
test_endpoint GET /api/forms/submissions "" 200 "List form submissions"
echo ""

# 11. Q&A Logs
echo "--- Q&A: Logs ---"
test_endpoint GET /api/qna "" 200 "Get Q&A logs"
echo ""

# 12. Post a Q&A entry
echo "--- Q&A: Create ---"
test_endpoint POST /api/qna '{"question":"Test question","answer":"Test answer","email":"test@example.com"}' 201 "Create Q&A entry"
echo ""

# Summary
echo ""
echo "=== Test Summary ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo "  Total:  $((PASS + FAIL))"

if [ $FAIL -eq 0 ]; then
  echo ""
  echo "  All tests passed! Backend is fully operational."
else
  echo ""
  echo "  Some tests failed. Check the output above."
fi
