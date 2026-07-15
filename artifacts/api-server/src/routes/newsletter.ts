import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, newsletterSubscriptionsTable } from "@workspace/db";
import {
  SubscribeNewsletterBody,
  SubscribeNewsletterResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/newsletter/subscribe", async (req, res): Promise<void> => {
  const parsed = SubscribeNewsletterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();

  const [existing] = await db
    .select()
    .from(newsletterSubscriptionsTable)
    .where(eq(newsletterSubscriptionsTable.email, email));

  if (existing) {
    res.status(201).json(SubscribeNewsletterResponse.parse(existing));
    return;
  }

  const [result] = await db
    .insert(newsletterSubscriptionsTable)
    .values({ email });

  const [subscription] = await db
    .select()
    .from(newsletterSubscriptionsTable)
    .where(eq(newsletterSubscriptionsTable.id, result.insertId));

  res.status(201).json(SubscribeNewsletterResponse.parse(subscription));
});

export default router;
