# OTel Collector Config

This folder holds OpenTelemetry Collector configuration for local or deployed use. The app sends traces, metrics, and logs to the collector (e.g. `http://localhost:4318`); the collector then forwards them to backends (debug console, Axiom, etc.).

## Secrets

Do **not** commit API keys or tokens. For exporters that require auth (e.g. Axiom):

- Prefer environment variable substitution if your collector supports it (e.g. `authorization: "Bearer ${AXIOM_TOKEN}"`).
- Or keep a local override file (e.g. `otel-config.local.yaml`) that is gitignored and only used on your machine.

See [LOGGING_AND_OTEL.md](../docs/LOGGING_AND_OTEL.md) for app-side env vars and endpoints.
