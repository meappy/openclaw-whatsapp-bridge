# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in `@meappy/openclaw-whatsapp-bridge`, please report it responsibly.

**Do not open a public issue.** Instead, use [GitHub's private vulnerability reporting](https://github.com/meappy/openclaw-whatsapp-bridge/security/advisories/new).

We aim to acknowledge receipt within 48 hours and provide a fix or mitigation within 7 days for critical issues.

## Supported versions

Only the latest published version on npm is actively supported with security updates.

## Trust model recap

The plugin's bearer token is a **full operator credential** for the host bot's WhatsApp account. Anyone with it can send arbitrary messages from that number. Specifically:

- Anyone who can hit the route URL with a valid token can send to any phone number.
- The plugin does not enforce a recipient allow-list — that's deliberate (caller is trusted) but means a leaked token is high-impact.
- The route does not appear under Gateway auth — it sits behind `auth: "plugin"` and validates the bearer itself.

If you suspect a token has been compromised:

1. Rotate the token in your `openclaw.json` and restart the host bot.
2. Audit the bot's WhatsApp outbox for unexpected sends.
3. Consider WhatsApp's per-number rate-limit / spam flagging — high-volume abuse can get the host number deactivated by Meta.
