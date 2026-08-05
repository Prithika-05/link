// test-rate-limit.js
const url = "http://localhost:3000/api/auth/login"; 

// Helper function to generate a random IP address
function getRandomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

async function test() {
  // Let's send 150 requests total from different IPs
  const totalRequests = 150; 
  let blockedCount = 0;

  console.log("Starting IP Rotation Test...\n");

  for (let i = 1; i <= totalRequests; i++) {
    // Generate a fresh unique IP for this specific request
    const fakeIP = getRandomIP(); 

    try {
      const response = await fetch(url, {
  method: "POST", 
  headers: {
    "User-Agent": "RateLimit-Test",
    "Content-Type": "application/json",
    "X-Forwarded-For": fakeIP 
  },
  // Update this block to include realistic placeholder credentials
  body: JSON.stringify({
    email: "testuser@example.com",     // Change 'email' to 'username' if that's what your backend uses
    password: "password123"
  })
});


      console.log(`Request ${i} [From IP: ${fakeIP}]: ${response.status} ${response.statusText}`);

      if (response.status === 429) {
        blockedCount++;
      }
    } catch (err) {
      console.error(`Request ${i} failed:`, err.message);
      break;
    }
  }

  console.log(`\n--- Test Completed ---`);
  console.log(`Total Requests Sent: ${totalRequests}`);
  console.log(`Blocked Requests: ${blockedCount}`);
}

test();
