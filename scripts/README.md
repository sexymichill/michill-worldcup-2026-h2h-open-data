# Export Script

The canonical export script lives in the source project as:

`scripts/export-open-h2h-package.ts`

It reads the SQLite database and writes this public package. It intentionally excludes market data, model output, paid-provider event data, wallet data, creator/video intelligence, secrets, raw payload archives, and operations documents.
