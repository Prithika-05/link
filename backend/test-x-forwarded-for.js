const BASE_URL = "http://localhost:3000/debug/ip"; // Use your Nginx URL

const tests = [
  {
    name: "Single IP",
    header: "1.1.1.1",
  },
  {
    name: "Two IPs",
    header: "1.1.1.1, 2.2.2.2",
  },
  {
    name: "Three IPs",
    header: "1.1.1.1, 2.2.2.2, 3.3.3.3",
  },
  {
    name: "Cloudflare Style",
    header: "203.0.113.10, 172.70.90.5",
  },
];

async function test(entry) {
  console.log("\n===============================");
  console.log(entry.name);
  console.log("===============================");

  const response = await fetch(BASE_URL, {
    headers: {
      "X-Forwarded-For": entry.header,
    },
  });

  const json = await response.json();

  console.log("Header Sent:");
  console.log(entry.header);

  console.log("\nBackend Response:");
  console.dir(json, {
    depth: null,
  });
}

(async () => {
  for (const t of tests) {
    await test(t);
  }
})();