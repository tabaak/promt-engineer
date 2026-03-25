import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { ensureUser } from "./lib/credits";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      console.log("User logged in:", user.name, user.email);
      if (user.email) {
        await ensureUser(user.email);
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
