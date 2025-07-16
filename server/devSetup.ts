import { storage } from "./storage";

export async function setupDevUser() {
  const devUserId = "dev-user-1";
  
  console.log("🔧 Starting setupDevUser function...");
  
  try {
    console.log("🔧 Attempting to get existing dev user...");
    // Check if dev user already exists
    const existingUser = await storage.getUser(devUserId);
    console.log("🔧 Dev user query result:", existingUser ? "found" : "not found");
    
    if (!existingUser) {
      console.log("Creating development user...");
      
      // Create the development user
      await storage.upsertUser({
        id: devUserId,
        username: "devuser",
        email: "dev@localhost.com", 
        name: "Development User"
      });
      
      console.log("Development user created successfully");
    } else {
      console.log("Development user already exists");
    }
    console.log("✅ setupDevUser completed successfully");
  } catch (error) {
    console.error("❌ Error setting up development user:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    throw error; // Re-throw to see the full error chain
  }
}