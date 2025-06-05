import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";

export const auth = betterAuth({
    plugins: [expo()],
    emailAndPassword: {
        enabled: true, // Enable authentication using email and password.
    },
    trustedOrigins: [
         // Basic scheme
         "myapp://", 
        
         // Production & staging schemes
         "myapp-prod://",
         "myapp-staging://",
         
         // Wildcard support for all paths following the scheme
         "myapp://*"
    ],
});