#!/usr/bin/env node

/**
 * Simple Node.js script to test ActInLove API endpoints
 * Usage: node scripts/test-actinlove-api.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

async function testProfileAPI() {
  console.log('\n🧪 Testing Profile API...\n');

  // Test 1: Get all profiles (initially empty)
  console.log('1️⃣  Getting all profiles...');
  const allProfiles1 = await makeRequest('/api/admin/profiles');
  console.log('   Status:', allProfiles1.status);
  console.log('   Profiles:', allProfiles1.data.profiles?.length || 0);

  // Test 2: Create first profile
  console.log('\n2️⃣  Creating profile for "ilya"...');
  const createIlya = await makeRequest('/api/admin/profiles', {
    method: 'POST',
    body: JSON.stringify({
      username: 'ilya',
      context: 'Loves cinema and going to movies. Creative, thoughtful person.'
    })
  });
  console.log('   Status:', createIlya.status);
  console.log('   Result:', createIlya.data.message);

  // Test 3: Create second profile
  console.log('\n3️⃣  Creating profile for "mideia"...');
  const createMideia = await makeRequest('/api/admin/profiles', {
    method: 'POST',
    body: JSON.stringify({
      username: 'mideia',
      context: 'Enjoys cinema and thoughtful experiences. Has a warm personality.'
    })
  });
  console.log('   Status:', createMideia.status);
  console.log('   Result:', createMideia.data.message);

  // Test 4: Get all profiles again
  console.log('\n4️⃣  Getting all profiles again...');
  const allProfiles2 = await makeRequest('/api/admin/profiles');
  console.log('   Status:', allProfiles2.status);
  console.log('   Profiles:', allProfiles2.data.profiles?.length || 0);
  
  if (allProfiles2.data.profiles) {
    allProfiles2.data.profiles.forEach(p => {
      console.log(`   - ${p.username}: ${p.context?.substring(0, 50)}...`);
    });
  }

  // Test 5: Update a profile
  console.log('\n5️⃣  Updating "ilya" profile...');
  const updateIlya = await makeRequest('/api/admin/profiles', {
    method: 'POST',
    body: JSON.stringify({
      username: 'ilya',
      context: 'Loves cinema and going to movies. Creative, thoughtful person. Also enjoys photography.'
    })
  });
  console.log('   Status:', updateIlya.status);
  console.log('   Result:', updateIlya.data.message);

  return true;
}

async function testGeneratePageAPI() {
  console.log('\n🎨 Testing Generate Page API...\n');

  // Test 1: Generate with custom message
  console.log('1️⃣  Generating page from ilya to mideia with custom message...');
  const generate1 = await makeRequest('/api/generate-page', {
    method: 'POST',
    body: JSON.stringify({
      from: 'ilya',
      to: 'mideia',
      say: 'imissgoingtothecinemawithyou'
    })
  });
  console.log('   Status:', generate1.status);
  if (generate1.data.success) {
    console.log('   ✅ Success!');
    console.log('   Cached:', generate1.data.cached);
    console.log('   HTML length:', generate1.data.html?.length || 0, 'characters');
  } else {
    console.log('   ❌ Error:', generate1.data.error);
  }

  // Test 2: Generate same page (should be cached)
  console.log('\n2️⃣  Generating same page again (should be cached)...');
  const generate2 = await makeRequest('/api/generate-page', {
    method: 'POST',
    body: JSON.stringify({
      from: 'ilya',
      to: 'mideia',
      say: 'imissgoingtothecinemawithyou'
    })
  });
  console.log('   Status:', generate2.status);
  if (generate2.data.success) {
    console.log('   ✅ Success!');
    console.log('   Cached:', generate2.data.cached ? '✅ YES' : '❌ NO');
  }

  // Test 3: Generate without custom message
  console.log('\n3️⃣  Generating page without custom message...');
  const generate3 = await makeRequest('/api/generate-page', {
    method: 'POST',
    body: JSON.stringify({
      from: 'ilya',
      to: 'mideia'
    })
  });
  console.log('   Status:', generate3.status);
  if (generate3.data.success) {
    console.log('   ✅ Success!');
    console.log('   Cached:', generate3.data.cached);
    console.log('   HTML length:', generate3.data.html?.length || 0, 'characters');
  } else {
    console.log('   ❌ Error:', generate3.data.error);
  }

  // Test 4: Error case - non-existent profile
  console.log('\n4️⃣  Testing error handling with non-existent profile...');
  const generate4 = await makeRequest('/api/generate-page', {
    method: 'POST',
    body: JSON.stringify({
      from: 'nonexistent',
      to: 'mideia'
    })
  });
  console.log('   Status:', generate4.status);
  console.log('   Error:', generate4.data.error);

  return true;
}

async function cleanup() {
  console.log('\n🧹 Cleanup: Deleting test profiles...\n');

  const deleteIlya = await makeRequest('/api/admin/profiles?username=ilya', {
    method: 'DELETE'
  });
  console.log('   Deleted ilya:', deleteIlya.data.message);

  const deleteMideia = await makeRequest('/api/admin/profiles?username=mideia', {
    method: 'DELETE'
  });
  console.log('   Deleted mideia:', deleteMideia.data.message);
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('🚀 ActInLove API Test Suite');
  console.log('═══════════════════════════════════════════');
  console.log('Base URL:', BASE_URL);
  console.log('═══════════════════════════════════════════');

  try {
    await testProfileAPI();
    await testGeneratePageAPI();
    
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ All tests completed!');
    console.log('═══════════════════════════════════════════\n');

    // Uncomment to cleanup
    // await cleanup();
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
main();
