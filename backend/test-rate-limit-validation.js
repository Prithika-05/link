// test-rate-limit-validation.js

const BASE_URL = "http://localhost:3000/api/auth/login";

// Adjust these to match your API.
const REQUEST_OPTIONS = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "test@example.com",
    password: "incorrect-password"
  })
};

async function sendRequest(name, extraHeaders = {}) {
  const response = await fetch(BASE_URL, {
    ...REQUEST_OPTIONS,
    headers: {
      ...REQUEST_OPTIONS.headers,
      ...extraHeaders,
    },
  });

  console.log(
    `${name.padEnd(20)} -> ${response.status} ${response.statusText}`
  );

  return response.status;
}

async function sameClientTest() {
  console.log("\n=== Same Client Test ===");

  for (let i = 1; i <= 20; i++) {
    await sendRequest(`Request ${i}`);
  }
}

async function differentIpTest() {
  console.log("\n=== Different Simulated Clients ===");

  for (let i = 1; i <= 10; i++) {
    await sendRequest(`Client ${i}`, {
      "X-Forwarded-For": `203.0.113.${i}`
    });
  }
}

async function sameTokenTest() {
  console.log("\n=== Same Authorization Token ===");

  for (let i = 1; i <= 20; i++) {
    await sendRequest(`Token ${i}`, {
      Authorization: "Bearer test-token"
    });
  }
}

(async () => {
  await sameClientTest();

  console.log("\nWaiting 65 seconds for the window to reset...");
  await new Promise(resolve => setTimeout(resolve, 65000));

  await differentIpTest();

  console.log("\nWaiting 65 seconds...");
  await new Promise(resolve => setTimeout(resolve, 65000));

  await sameTokenTest();
})();