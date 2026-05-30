## Summary

<!-- One or two sentences. What does this change do, and why? -->

## Changes

<!-- Bullet list of substantive edits. Skip cosmetic / auto-gen churn. -->

-

## Test plan

<!-- How was this validated? Tick what applies. -->

- [ ] Installed locally into a dev OpenClaw bot via `npm install <path>`
- [ ] `openclaw.json` updated with `plugins.entries["whatsapp-bridge"]` config
- [ ] Verified `registered /api/whatsapp-bridge/send` log line on bot start
- [ ] `curl` test send succeeded end-to-end (E.164 to + text)
- [ ] No bearer tokens, phone numbers, or operational hostnames in the diff

## Related

<!-- Issue / PR refs -->

Closes #
