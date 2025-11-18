import { nextCookies } from 'better-auth/next-js';
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@my-better-t-app/db";
import * as schema from "@my-better-t-app/db/schema/auth";

export const auth = betterAuth<BetterAuthOptions>({
	database: drizzleAdapter(db, {
		provider: "pg",

		schema: schema,
	}),
	trustedOrigins: [
		process.env.CORS_ORIGIN || "http://localhost:3000",
		"http://localhost:3000",
		"http://localhost:3001",
	],
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: false,
			},
		},
	},
  plugins: [nextCookies()]
});
