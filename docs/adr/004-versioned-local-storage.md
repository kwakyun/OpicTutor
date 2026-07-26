# ADR 004: Versioned LocalStorage

All device-local records live under one namespace and carry a schema version. Reads are validated, migrations are idempotent, imports are validated before replacement, and reset touches only the app namespace.

