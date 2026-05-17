import { Router, type Request, type Response } from "express";
import { broadcast } from "../lib/gameState.js";

const router = Router();

router.post("/event", (req: Request, res: Response) => {
  const secret = req.headers["x-webhook-secret"];
  const expected = process.env["WEBHOOK_SECRET"];

  if (!expected) {
    res.status(500).json({ error: "WEBHOOK_SECRET is not configured on the server" });
    return;
  }

  if (!secret || secret !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const data = JSON.stringify(req.body);
  broadcast(data);
  res.json({ ok: true });
});

export default router;
