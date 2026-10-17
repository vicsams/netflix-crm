import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { EMAIL_FROM, getResend } from "@/shared/lib/resend";
// If your Prisma file is located elsewhere, you can change the path
import prisma from "@/shared/lib/db";
import TwitchResetPasswordEmail from "@/features/auth/emails/ResetPassword";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }) => {
      const host =
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000");

      const resetUrl = url ?? `${host}/reset-password?token=${token}`;

      console.log("sendResetPassword called", {
        email: user.email,
        url,
        token,
        resetUrl,
      });

      const resend = getResend();
      if (!resend) {
        console.warn("RESEND_API_KEY not set; skipping reset password email");
        return;
      }

      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email!,
        subject: "Restablece tu contraseña",
        react: TwitchResetPasswordEmail({
          resetUrl,
          username: user.name!,
          updatedDate: new Date(),
        }),
      });

      if (error) {
        console.error("Failed to send reset password email:", error);
      }
    },

    onPasswordReset: async ({ user }) => {
      // your logic here
      console.log(`Password for user ${user.email} has been reset.`);
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const resend = getResend();
      if (!resend) {
        console.warn("RESEND_API_KEY not set; skipping verification email");
        return;
      }

      // Resend does not throw on failure, it returns { error }
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email!,
        subject: "Verifica tu correo",
        html: `<p>Hola,</p><p>Para activar tu cuenta, verifica tu correo haciendo clic <a href="${url}">aquí</a>.</p><p>Si no creaste esta cuenta, puedes ignorar este correo.</p>`,
      });

      if (error) {
        console.error("Failed to send verification email:", error);
      }
    },
  },

  plugins: [nextCookies()],
});
