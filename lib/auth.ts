import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";

export const auth = betterAuth({
    plugins: [expo()],
    emailAndPassword: {
        enabled: true, // Enable authentication using email and password.
    },
    advanced: { disableCSRFCheck: true },
    user: {
        deleteUser: {
            enabled: true // Enable user deletion
        }
    },
    trustedOrigins: [
        // Basic scheme
        "heyzack://",
        "http://localhost:3000",
        "https://api.dev.heyzack.ai",

        "null",
        "exp://*",

        //  // Production & staging schemes
        "heyzack-prod://",
        "heyzack-staging://",

        //  // Wildcard support for all paths following the scheme
        "heyzack://*"
    ],
    //     csrf: {
    //   enabled: false, // also REQUIRED for mobile
    // }
});