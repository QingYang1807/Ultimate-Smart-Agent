import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { db, providerConfigs } from "@workspace/db";
import { upsertProviderConfigSchema } from "@workspace/db";

const router: IRouter = Router();

router.get("/providers", async (req, res) => {
  try {
    const rows = await db.select().from(providerConfigs);
    res.json(
      rows.map((r) => ({
        ...r,
        apiKey: r.apiKey ? "••••••••" : null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list provider configs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/providers/:providerId", async (req, res) => {
  try {
    const { providerId } = req.params;
    const body = upsertProviderConfigSchema.parse(req.body);

    const now = new Date();
    const [existing] = await db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.providerId, providerId));

    if (existing) {
      const updateValues: Partial<typeof providerConfigs.$inferInsert> = {
        updatedAt: now,
      };

      if (body.enabled !== undefined) updateValues.enabled = body.enabled;
      if (body.selectedModel !== undefined) updateValues.selectedModel = body.selectedModel;
      if (body.baseUrl !== undefined) updateValues.baseUrl = body.baseUrl;
      if (body.apiKey !== undefined) {
        if (body.apiKey !== null && body.apiKey !== "••••••••") {
          updateValues.apiKey = body.apiKey;
        } else if (body.apiKey === null) {
          updateValues.apiKey = null;
        }
      }

      const [updated] = await db
        .update(providerConfigs)
        .set(updateValues)
        .where(eq(providerConfigs.providerId, providerId))
        .returning();

      res.json({
        ...updated,
        apiKey: updated.apiKey ? "••••••••" : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
    } else {
      const [inserted] = await db
        .insert(providerConfigs)
        .values({
          providerId,
          apiKey: body.apiKey ?? null,
          baseUrl: body.baseUrl ?? null,
          enabled: body.enabled ?? false,
          selectedModel: body.selectedModel ?? null,
        })
        .returning();

      res.status(201).json({
        ...inserted,
        apiKey: inserted.apiKey ? "••••••••" : null,
        createdAt: inserted.createdAt.toISOString(),
        updatedAt: inserted.updatedAt.toISOString(),
      });
    }
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: "Invalid request body", details: err.issues });
      return;
    }
    req.log.error({ err }, "Failed to upsert provider config");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/providers/:providerId", async (req, res) => {
  try {
    const { providerId } = req.params;
    await db
      .delete(providerConfigs)
      .where(eq(providerConfigs.providerId, providerId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete provider config");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
