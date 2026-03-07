# Secrets Management

## Why Use Secrets

If keys are stored directly in config, common leak paths are:

- screenshots
- shared config files
- accidental commits

Secrets keep references in config while real values stay in external secure sources.

## Where Real Values Can Live

- `env`: operating system environment variables
- `file`: external JSON file
- `exec`: command output (commonly used with secret systems)

`config.json` keeps only:

- `secrets.providers`
- `secrets.defaults`
- `secrets.refs`

## Beginner Path (UI First)

1. Open `/secrets` in the Web UI.
2. Enable `enabled`.
3. Configure one default provider (usually `env` first).
4. Convert sensitive paths like `providers.<name>.apiKey` to `refs`.
5. Save and run a connection test to confirm behavior.

## Typical Benefits

- Safe team templates without exposing real keys.
- Easier multi-environment switching.
- Simpler key rotation by updating secret sources only.

## Is the Old Style Still Valid?

Yes. Direct `providers.<name>.apiKey` still works.

Recommended usage:

- quick local experiments: direct key is acceptable
- team/shared/long-running environments: use secrets refs

## Advanced Entry (Optional)

For automated/batch secret operations, use `nextclaw secrets` subcommands.
See full options in [Commands](/en/guide/commands).
