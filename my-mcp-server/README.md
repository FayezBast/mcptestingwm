# my-mcp-server

Minimal public HTTP MCP server scaffold for the WorldMonitor Connect MCP panel.

## What it implements

- `POST /mcp`
- `initialize`
- `notifications/initialized`
- `tools/list`
- `tools/call`
- `GET /health`

The sample tool is `latest_events`. It returns JSON inside a text content block so WorldMonitor can pretty-render it and optionally auto-visualize it.

## Requirements

- Node.js 18+

## Run locally

1. Copy `.env.example` to `.env`.
2. Set `MCP_TOKEN`.
3. Start the server:

```bash
MCP_TOKEN=change-me node server.mjs
```

Or:

```bash
export MCP_TOKEN=change-me
npm start
```

## Verify with curl

Initialize:

```bash
curl -X POST http://localhost:3000/mcp \
  -H 'Authorization: Bearer change-me' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
```

List tools:

```bash
curl -X POST http://localhost:3000/mcp \
  -H 'Authorization: Bearer change-me' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

Call the sample tool:

```bash
curl -X POST http://localhost:3000/mcp \
  -H 'Authorization: Bearer change-me' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"latest_events","arguments":{"limit":2,"region":"global"}}}'
```

## Connect from WorldMonitor

1. Deploy this service to a public HTTPS URL.
2. Use the public endpoint URL ending in `/mcp`.
3. In the WorldMonitor Pro panel, open **Connect MCP**.
4. Paste `https://your-server.example.com/mcp`.
5. In simple mode, paste the same token you set in `MCP_TOKEN`.
6. Click **Connect & List Tools**.
7. Choose `latest_events`, adjust the JSON arguments, and add the panel.

## Notes

- WorldMonitor connects through its own proxy, so browser CORS is not required for this integration.
- `localhost` and private IPs are blocked by the proxy, so local development is only for testing the server before deployment.
- `notifications/initialized` correctly returns `202` with no body.
- The sample payload lives in [`src/app.mjs`](./src/app.mjs). Replace `buildLatestEventsPayload()` with your real backend fetch logic.
