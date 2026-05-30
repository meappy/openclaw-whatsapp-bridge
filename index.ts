// @meappy/openclaw-whatsapp-bridge
//
// OpenClaw plugin that mounts a single HTTP route on the host bot:
//
//   POST /api/whatsapp-bridge/send
//   Authorization: Bearer <token from plugin config>
//   Content-Type: application/json
//   { "to": "+1234567890", "text": "hello", "accountId"?: "default" }
//
// The route dispatches via the host bot's already-paired Baileys session
// (whatever number the bot is logged into), so the recipient sees a regular
// WhatsApp DM from that account — no Twilio, no Meta Business Cloud, no
// per-recipient opt-in. The plugin only proxies; it never registers a tool
// or alters channel behaviour.
//
// Trust model: anyone with the bearer token can send a WhatsApp message from
// the host bot. Treat the token as a full operator credential for that bot's
// WhatsApp number; rotate it like a gateway token.

import type { IncomingMessage, ServerResponse } from "node:http";
import { definePluginEntry, type OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { sendMessageWhatsApp } from "openclaw/plugin-sdk/whatsapp";

const DEFAULT_PATH = "/api/whatsapp-bridge/send";
const DEFAULT_MAX_BODY = 64 * 1024;
const E164 = /^\+[1-9]\d{6,14}$/;

type BridgeConfig = {
  token?: string;
  path?: string;
  accountId?: string;
  maxBodyBytes?: number;
  verbose?: boolean;
};

function jsonReply(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage, max: number): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > max) throw new Error("body too large");
    chunks.push(chunk as Buffer);
  }
  if (!chunks.length) return null;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export default definePluginEntry({
  id: "whatsapp-bridge",
  name: "WhatsApp Bridge",
  description: "HTTP-in → WhatsApp-out bridge via the host bot's paired Baileys session.",

  register(api: OpenClawPluginApi) {
    const cfg = (api.pluginConfig ?? {}) as BridgeConfig;
    const path = cfg.path?.trim() || DEFAULT_PATH;
    const token = cfg.token?.trim() || "";
    const maxBody = Math.max(1024, Math.min(1024 * 1024, Number(cfg.maxBodyBytes) || DEFAULT_MAX_BODY));

    if (!token) {
      api.logger.warn?.(
        "whatsapp-bridge: no `token` configured — route NOT registered. " +
        "Set `plugins['whatsapp-bridge'].token` to a random secret to enable.",
      );
      return;
    }

    api.registerHttpRoute({
      path,
      auth: "plugin",
      handler: async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== "POST") {
          return jsonReply(res, 405, { ok: false, error: "method not allowed" });
        }

        // Bearer-auth. We do this ourselves because `auth: "plugin"` means the
        // gateway hands us the request unauthenticated and trusts us to check.
        const header = (req.headers["authorization"] || "") as string;
        const presented = header.replace(/^Bearer\s+/i, "").trim();
        if (!presented || presented !== token) {
          return jsonReply(res, 401, { ok: false, error: "unauthorized" });
        }

        let body: any;
        try {
          body = await readJsonBody(req, maxBody);
        } catch (e) {
          const msg = (e as Error).message === "body too large" ? "payload too large" : "invalid json";
          return jsonReply(res, msg === "payload too large" ? 413 : 400, { ok: false, error: msg });
        }

        const to = String(body?.to || "").trim();
        const text = String(body?.text || "");
        const accountId = (body?.accountId ? String(body.accountId) : cfg.accountId)?.trim() || undefined;

        if (!E164.test(to)) {
          return jsonReply(res, 400, { ok: false, error: "`to` must be E.164 (e.g. +1234567890)" });
        }
        if (!text) {
          return jsonReply(res, 400, { ok: false, error: "`text` is required" });
        }

        try {
          const result = await sendMessageWhatsApp(to, text, {
            verbose: !!cfg.verbose,
            accountId,
          });
          return jsonReply(res, 200, { ok: true, messageId: result.messageId, toJid: result.toJid });
        } catch (e) {
          const msg = (e as Error).message || String(e);
          api.logger.warn?.(`whatsapp-bridge: send failed — ${msg}`);
          return jsonReply(res, 502, { ok: false, error: msg });
        }
      },
    });

    api.logger.info?.(`whatsapp-bridge: registered ${path} (bearer auth)`);
  },
});
