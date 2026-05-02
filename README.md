# mcptestingwm

Minimal MCP server for connecting custom tools to the WorldMonitor Connect MCP panel.

## Repo layout

- `my-mcp-server/`: the actual Node-based MCP server

## What this server exposes

- `POST /mcp`
- `GET /health`
- MCP methods:
  - `initialize`
  - `notifications/initialized`
  - `tools/list`
  - `tools/call`

## Available tools

- `latest_events`
- `active_alerts`
- `country_risk`
- `top_incidents`

These tools return JSON inside MCP text content blocks so WorldMonitor can render the results in panels.

## Run locally

```bash
cd my-mcp-server
export MCP_TOKEN=change-me
npm start
```

## Deploy on Railway

1. Push this repo to GitHub.
2. Create a Railway project from the GitHub repo.
3. Set the service root to `my-mcp-server` if needed.
4. Add the `MCP_TOKEN` environment variable in Railway.
5. Deploy the service.
6. Copy the public Railway domain.

Your MCP URL in WorldMonitor will be:

```text
https://your-railway-domain/mcp
```

## Connect in WorldMonitor

1. Open the WorldMonitor Pro panel.
2. Choose **Connect MCP**.
3. Paste your public `/mcp` URL.
4. Paste your bearer token.
5. Click **Connect & List Tools**.
6. Add a panel for any of the listed tools.

## More details

See [my-mcp-server/README.md](/Users/fayezbast/Documents/New%20project%202/my-mcp-server/README.md) for request examples and tool payloads.
