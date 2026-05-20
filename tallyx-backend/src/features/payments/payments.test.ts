const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("🚀 Starting integration tests for secure payments endpoint...");

  // Generate unique emails
  const emailA = `ownerA_${Date.now()}@test.com`;
  const emailB = `ownerB_${Date.now()}@test.com`;
  const password = "Password123!";

  // 1. Register User A
  console.log(`\n--- Registering User A (${emailA})...`);
  const regResA = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ownerName: "Owner A",
      email: emailA,
      password: password,
    }),
  });

  if (!regResA.ok) {
    const errorText = await regResA.text();
    throw new Error(`Failed to register User A: ${errorText}`);
  }

  const { token: tokenA, user: userA } = await regResA.json();
  console.log("User A registered. Token acquired.");

  // 2. Register User B
  console.log(`--- Registering User B (${emailB})...`);
  const regResB = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ownerName: "Owner B",
      email: emailB,
      password: password,
    }),
  });

  if (!regResB.ok) {
    const errorText = await regResB.text();
    throw new Error(`Failed to register User B: ${errorText}`);
  }

  const { token: tokenB, user: userB } = await regResB.json();
  console.log("User B registered. Token acquired.");

  // 3. Create Store A
  console.log("\n--- Creating Store A...");
  const storeResA = await fetch(`${BASE_URL}/stores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      storeName: "Store A",
      phoneNumber: "1234567890",
    }),
  });

  if (!storeResA.ok) {
    const errorText = await storeResA.text();
    throw new Error(`Failed to create Store A: ${errorText}`);
  }

  const storeA = await storeResA.json();
  console.log("Store A created.");

  // 4. Create Store B
  console.log("--- Creating Store B...");
  const storeResB = await fetch(`${BASE_URL}/stores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      storeName: "Store B",
      phoneNumber: "0987654321",
    }),
  });

  if (!storeResB.ok) {
    const errorText = await storeResB.text();
    throw new Error(`Failed to create Store B: ${errorText}`);
  }

  console.log("Store B created.");

  // 5. Create Customer A for Store A
  console.log("\n--- Creating Customer A on Store A...");
  const custResA = await fetch(`${BASE_URL}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      name: "Customer A",
      phone: "555-0001",
      email: "custA@test.com",
    }),
  });

  if (!custResA.ok) {
    const errorText = await custResA.text();
    throw new Error(`Failed to create Customer A: ${errorText}`);
  }

  const customerA = await custResA.json();
  console.log(`Customer A created with ID: ${customerA.id}`);

  // 6. Create Credit A on Store A for Customer A
  console.log("\n--- Creating Credit A on Store A...");
  const creditResA = await fetch(`${BASE_URL}/credits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      customerId: customerA.id,
      amount: 1000,
      note: "First loan",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });

  if (!creditResA.ok) {
    const errorText = await creditResA.text();
    throw new Error(`Failed to create Credit A: ${errorText}`);
  }

  const creditA = await creditResA.json();
  console.log(`Credit A created with ID: ${creditA.id}, balance: ${creditA.balance}`);

  // 7. Record a partial payment on Credit A
  console.log("\n--- Recording partial payment on Credit A...");
  const payResA = await fetch(`${BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      creditId: creditA.id,
      amount: 400,
      paymentMethod: "cash",
    }),
  });

  if (!payResA.ok) {
    const errorText = await payResA.text();
    throw new Error(`Failed to record payment: ${errorText}`);
  }

  const paymentRecord = await payResA.json();
  console.log(`Recorded payment ID: ${paymentRecord.id}, amount: ${paymentRecord.amount}`);

  // --- TEST CASES ---
  console.log("\n🧪 Running Test Cases...");

  // Test Case 1: Fetch without JWT token
  console.log("\nCase 1: Fetching Credit A payments WITHOUT any Authorization token...");
  const test1Res = await fetch(`${BASE_URL}/payments/credit/${creditA.id}`);
  console.log(`Response Status: ${test1Res.status}`);
  if (test1Res.status !== 401) {
    throw new Error(`Expected status 401, but got ${test1Res.status}`);
  }
  const test1Body = await test1Res.json();
  console.log(`Response Body:`, test1Body);
  if (test1Body.error !== "Missing authorization token") {
    throw new Error(`Unexpected error message: ${test1Body.error}`);
  }
  console.log("✅ Case 1 Passed!");

  // Test Case 2: Fetch with User A's token (Valid Store Owner)
  console.log("\nCase 2: Fetching Credit A payments WITH User A's token (Store Owner)...");
  const test2Res = await fetch(`${BASE_URL}/payments/credit/${creditA.id}`, {
    headers: {
      Authorization: `Bearer ${tokenA}`,
    },
  });
  console.log(`Response Status: ${test2Res.status}`);
  if (test2Res.status !== 200) {
    throw new Error(`Expected status 200, but got ${test2Res.status}`);
  }
  const test2Body = await test2Res.json();
  console.log(`Response Body (Payments):`, test2Body);
  if (!Array.isArray(test2Body) || test2Body.length !== 1 || test2Body[0].id !== paymentRecord.id) {
    throw new Error("Expected payment record array containing the recorded payment");
  }
  console.log("✅ Case 2 Passed!");

  // Test Case 3: Fetch with User B's token (Different Store Owner - unauthorized)
  console.log("\nCase 3: Fetching Credit A payments WITH User B's token (Different Store)...");
  const test3Res = await fetch(`${BASE_URL}/payments/credit/${creditA.id}`, {
    headers: {
      Authorization: `Bearer ${tokenB}`,
    },
  });
  console.log(`Response Status: ${test3Res.status}`);
  if (test3Res.status !== 404) {
    throw new Error(`Expected status 404, but got ${test3Res.status}`);
  }
  const test3Body = await test3Res.json();
  console.log(`Response Body:`, test3Body);
  if (test3Body.error !== "Credit not found or unauthorized") {
    throw new Error(`Unexpected error message: ${test3Body.error}`);
  }
  console.log("✅ Case 3 Passed!");

  console.log("\n🎉 All integration tests passed successfully!");
}

runTests().catch((err) => {
  console.error("\n❌ Test Suite Failed:");
  console.error(err);
  process.exit(1);
});
