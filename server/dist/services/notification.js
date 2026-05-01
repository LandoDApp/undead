import nodemailer from 'nodemailer';
import { Expo } from 'expo-server-sdk';
import { env } from '../config/env.js';
import { db } from '../config/database.js';
import { pushTokens } from '../db/schema/social.js';
import { eq } from 'drizzle-orm';
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
});
const expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN || undefined });
export async function sendMagicLinkEmail(email, url) {
    await transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: 'Dein Login-Link für Undead',
        html: `
      <h2>Login bei Undead</h2>
      <p>Klicke auf den Link, um dich einzuloggen:</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#22c55e;color:white;text-decoration:none;border-radius:8px;">
        Einloggen
      </a>
      <p>Der Link ist 15 Minuten gültig.</p>
      <p>Falls du diesen Login nicht angefordert hast, ignoriere diese Email.</p>
    `,
    });
}
export async function sendPushNotification(userId, title, body) {
    const tokens = await db
        .select()
        .from(pushTokens)
        .where(eq(pushTokens.userId, userId));
    if (tokens.length === 0)
        return;
    const messages = tokens
        .filter((t) => Expo.isExpoPushToken(t.token))
        .map((t) => ({
        to: t.token,
        sound: 'default',
        title,
        body,
    }));
    if (messages.length === 0)
        return;
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
    }
}
//# sourceMappingURL=notification.js.map