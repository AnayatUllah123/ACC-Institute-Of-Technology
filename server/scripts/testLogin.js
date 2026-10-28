import "dotenv/config";

async function testLogin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error("Admin credentials missing in .env");
    }

    const response = await fetch("http://localhost:5173/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const result = await response.json();

    console.log("\n=== ACC LOGIN TEST ===");
    console.log("HTTP Status:", response.status);
    console.log("Authenticated:", response.ok);
    console.log("Error:", result.error ?? "None");
    console.log("======================\n");
  } catch (error) {
    console.error("Login test failed:", error.message);
  }
}

testLogin();
