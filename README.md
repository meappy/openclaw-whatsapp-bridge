# @meappy/openclaw-whatsapp-bridge

> ### ⚠️ Status: parked
>
> This plugin is **not currently functional** against OpenClaw v5.x.
>
> The plugin loads its HTTP route correctly via `api.registerHttpRoute`, but the WhatsApp send function it relies on (`sendMessageWhatsApp`) is no longer exported from the public Plugin SDK — OpenClaw v5.x extracted WhatsApp into the separate `@openclaw/whatsapp` plugin, which doesn't expose its outbound API to other plugins.
>
> The `OpenClawPluginApi` surface in v5.x has no public "send to channel" method either. So a plugin can listen for HTTP requests, but it can't dispatch them through another channel without that channel exposing internal hooks.
>
> **If you need WhatsApp-from-HTTP today**, run your own Baileys session in your service. Pair it as a companion device on whichever number you want to send from.
>
> This package will be reactivated when OpenClaw exposes a public outbound-dispatch API. Track [openclaw#TBD](https://github.com/openclaw/openclaw/issues) (no issue filed yet — open one and link it here if you'd like this revived).

---

An [OpenClaw](https://github.com/openclaw/openclaw) plugin that exposes a single HTTP route on the host bot so external services can dispatch WhatsApp messages through the bot's already-paired Baileys session.

The recipient sees a regular WhatsApp DM from the bot's number — no Twilio, no Meta Business Cloud, no per-recipient opt-in.

## Install

```bash
openclaw plugins install @meappy/openclaw-whatsapp-bridge
```

## Configure

In your `openclaw.json`:

```jsonc
{
  "plugins": {
    "whatsapp-bridge": {
      "token": "<random-32-byte-hex>",          // required — bearer auth
      "path": "/api/whatsapp-bridge/send",       // optional, this is the default
      "accountId": "default",                    // optional WhatsApp accountId
      "maxBodyBytes": 65536                      // optional, default 64 KB
    }
  }
}
```

Without a `token`, the route is **not** registered (the plugin fails closed).

## Use

```bash
curl -X POST http://<gateway-host>:<gateway-port>/api/whatsapp-bridge/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"to":"+1234567890","text":"Hello from openclaw!"}'
```

Successful reply:

```json
{ "ok": true, "messageId": "3EB0...", "toJid": "1234567890@s.whatsapp.net" }
```

## Status codes

- `200` — sent
- `400` — bad request (missing `to` / `text`, or `to` not E.164)
- `401` — missing or invalid bearer
- `405` — method not allowed (must be POST)
- `413` — payload exceeds `maxBodyBytes`
- `502` — Baileys send failed (e.g. session disconnected, target not on WhatsApp)

## Trust model

Anyone with the bearer token can send a WhatsApp message from the host bot's account. Treat the token as a full operator credential for that number — store it in a secret manager, rotate it, and never share it with untrusted callers. Don't expose the gateway port publicly without an additional auth layer in front.

## License

MIT
