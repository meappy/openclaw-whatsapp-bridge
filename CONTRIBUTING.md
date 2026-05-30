# Contributing

Thanks for your interest in `@meappy/openclaw-whatsapp-bridge`. This guide covers how to get a change in.

## Getting started

```bash
git clone https://github.com/meappy/openclaw-whatsapp-bridge.git
cd openclaw-whatsapp-bridge
```

There are no build or install steps — the plugin is a single `index.ts` loaded by the host OpenClaw bot at runtime against its bundled TypeScript runtime. Editing `index.ts` directly is the workflow.

## Branch + commit conventions

Work on a feature branch:

```bash
git checkout -b feat/my-change
```

Branch prefixes:

- `feat/<slug>` — new feature
- `fix/<slug>` — bug fix
- `docs/<slug>` — docs-only
- `refactor/<slug>` — restructuring without behaviour change
- `chore/<slug>` — tooling, deps, CI

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: support arbitrary accountId per request
fix: reject body parse errors with 400 not 500
docs: clarify trust model in README
chore(ci): bump actions/checkout to v5
```

- `fix:` → patch version bump
- `feat:` → minor bump
- `BREAKING CHANGE:` in the body → major bump

The release workflow keys off these.

## Testing your change

There's no unit test suite (yet) — the plugin is small and exercised end-to-end by the host bot. To verify behaviour:

1. Install your branch into a dev OpenClaw bot from a local path:
   ```bash
   # in the bot's npm dir (PVC for k8s, or ~/.openclaw/npm for local)
   npm install /absolute/path/to/openclaw-whatsapp-bridge
   ```
2. Add the plugin config to `openclaw.json`:
   ```jsonc
   { "plugins": { "entries": { "whatsapp-bridge": { "token": "test-token" } } } }
   ```
3. Restart the bot. Look for `whatsapp-bridge: registered /api/whatsapp-bridge/send (bearer auth)` in the logs.
4. Send a test:
   ```bash
   curl -X POST http://<gateway>:18789/api/whatsapp-bridge/send \
     -H "Authorization: Bearer test-token" \
     -H "Content-Type: application/json" \
     -d '{"to":"+<your-number>","text":"hello"}'
   ```

## Submitting a pull request

1. Push your branch:
   ```bash
   git push origin feat/my-change
   ```
2. Open a PR against `main`.
3. Describe what changed and why. Reference related issues.
4. Make sure CI is green.

## Releasing (maintainers)

Releases publish to npm automatically when a tag matching `v*` is pushed.

```bash
# bump version in package.json
npm version patch    # or minor / major
git push origin main --follow-tags
```

The `release.yml` workflow builds and publishes to npm under `@meappy`.

## Reporting bugs

Open an [issue](https://github.com/meappy/openclaw-whatsapp-bridge/issues). For security-sensitive issues, see [SECURITY.md](./SECURITY.md).
