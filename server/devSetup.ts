import { storage } from "./storage";

export async function setupDevUser() {
  const devUserId = "dev-user-1";
  
  try {
    // Check if dev user already exists
    const existingUser = await storage.getUser(devUserId);
    
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
  } catch (error) {
    console.error("Error setting up development user:", error);
  }
}