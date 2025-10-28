#!/bin/bash

# ActInLove Feature - Manual Testing Script
# This script helps you manually test the ActInLove API endpoints

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "================================"
echo "ActInLove API Testing Script"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Get all profiles (should be empty initially)
echo "Test 1: Getting all profiles..."
curl -s -X GET "$BASE_URL/api/admin/profiles" | jq '.'
echo ""
echo "---"
echo ""

# Test 2: Create first profile
echo "Test 2: Creating profile for 'ilya'..."
curl -s -X POST "$BASE_URL/api/admin/profiles" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ilya",
    "context": "Loves cinema and going to movies. Creative, thoughtful person who enjoys deep conversations. Has a great sense of humor and appreciates art."
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test 3: Create second profile
echo "Test 3: Creating profile for 'mideia'..."
curl -s -X POST "$BASE_URL/api/admin/profiles" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "mideia",
    "context": "Enjoys cinema and thoughtful experiences. Appreciates genuine connections and meaningful moments. Has a warm personality."
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test 4: Get all profiles again (should now have 2)
echo "Test 4: Getting all profiles (should have 2)..."
curl -s -X GET "$BASE_URL/api/admin/profiles" | jq '.'
echo ""
echo "---"
echo ""

# Test 5: Update a profile
echo "Test 5: Updating 'ilya' profile..."
curl -s -X POST "$BASE_URL/api/admin/profiles" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ilya",
    "context": "Loves cinema and going to movies. Creative, thoughtful person who enjoys deep conversations. Has a great sense of humor and appreciates art. Also enjoys photography."
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test 6: Generate a page
echo "Test 6: Generating a page from ilya to mideia..."
curl -s -X POST "$BASE_URL/api/generate-page" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "ilya",
    "to": "mideia",
    "say": "imissgoingtothecinemawithyou"
  }' | jq '. | {success, cached, html_length: (.html | length)}'
echo ""
echo "---"
echo ""

# Test 7: Generate the same page again (should be cached)
echo "Test 7: Generating the same page again (should be cached)..."
curl -s -X POST "$BASE_URL/api/generate-page" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "ilya",
    "to": "mideia",
    "say": "imissgoingtothecinemawithyou"
  }' | jq '. | {success, cached, html_length: (.html | length)}'
echo ""
echo "---"
echo ""

# Test 8: Generate a different page
echo "Test 8: Generating a different page (no custom message)..."
curl -s -X POST "$BASE_URL/api/generate-page" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "ilya",
    "to": "mideia"
  }' | jq '. | {success, cached, html_length: (.html | length)}'
echo ""
echo "---"
echo ""

# Test 9: Test error handling - non-existent profile
echo "Test 9: Testing error handling with non-existent profile..."
curl -s -X POST "$BASE_URL/api/generate-page" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "nonexistent",
    "to": "mideia"
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test 10: Delete a profile
echo "Test 10: Deleting 'ilya' profile..."
curl -s -X DELETE "$BASE_URL/api/admin/profiles?username=ilya" | jq '.'
echo ""
echo "---"
echo ""

# Test 11: Get all profiles (should have 1 now)
echo "Test 11: Getting all profiles (should have 1)..."
curl -s -X GET "$BASE_URL/api/admin/profiles" | jq '.'
echo ""

echo "================================"
echo "Testing complete!"
echo "================================"
