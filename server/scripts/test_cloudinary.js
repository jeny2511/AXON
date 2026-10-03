import cloudinary from "../config/cloudinary.js";

async function checkCloudinary() {
  console.log("🔍 Checking Cloudinary status and credentials...");
  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME ? `${process.env.CLOUDINARY_CLOUD_NAME.slice(0, 3)}***` : "MISSING");
  console.log("API Key:", process.env.CLOUDINARY_API_KEY ? `${process.env.CLOUDINARY_API_KEY.slice(0, 4)}***` : "MISSING");

  try {
    const pingResult = await cloudinary.api.ping();
    console.log("✅ Cloudinary Ping Response:", pingResult);

    const usageResult = await cloudinary.api.usage();
    console.log("📊 Cloudinary Account Status: ACTIVE");
    console.log(`   - Plan: ${usageResult.plan}`);
    console.log(`   - Storage used: ${(usageResult.storage.usage / (1024 * 1024)).toFixed(2)} MB / ${(usageResult.storage.limit / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    console.log(`   - Transformations: ${usageResult.transformations.usage} / ${usageResult.transformations.limit}`);
    console.log(`   - Credits used: ${usageResult.credits?.usage || 0}`);
  } catch (error) {
    console.error("❌ Cloudinary Error / Invalid Credentials:", error.message || error);
    if (error.http_code === 401) {
      console.error("👉 Reason: Invalid API Key or API Secret.");
    } else if (error.http_code === 404) {
      console.error("👉 Reason: Invalid Cloud Name.");
    }
  }
}

checkCloudinary();
