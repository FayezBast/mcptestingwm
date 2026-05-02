import { createServer } from 'node:http';

const TOOL_DEFS = [
  {
    name: 'latest_events',
    description: 'Return the latest events from my backend',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 10 },
        region: { type: 'string', default: 'global' }
      },
      additionalProperties: false
    }
  }
];

function rpc(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function normalizeArgs(input) {
  const limit = Number.isFinite(input?.limit) ? input.limit : 10;
  const region = typeof input?.region === 'string' && input.region.trim() ? input.region : 'global';
  return { limit, region };
}

function buildLatestEventsPayload(rawArgs) {
  const args = normalizeArgs(rawArgs);
  const seedItems = [
    { id: 1, title: 'Event A', severity: 'high' },
    { id: 2, title: 'Event B', severity: 'medium' },
    { id: 3, title: 'Event C', severity: 'low' }
  ];

  return {
    source: 'my-backend',
    fetchedAt: new Date().toISOString(),
    args,
    items: seedItems.slice(0, Math.max(0, args.limit))
  };
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return null;
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleRpcRequest(body) {
  const { id = null, method, params } = body ?? {};

  if (method === 'initialize') {
    return {
      statusCode: 200,
      body: rpc(id, {
        protocolVersion: '2025-03-26',
        capabilities: { tools: {} },
        serverInfo: { name: 'my-mcp-server', version: '1.0.0' }
      })
    };
  }

  if (method === 'notifications/initialized') {
    return { statusCode: 202, body: null };
  }

  if (method === 'tools/list') {
    return {
      statusCode: 200,
      body: rpc(id, { tools: TOOL_DEFS })
    };
  }

  if (method === 'tools/call') {
    const name = params?.name;
    const args = params?.arguments ?? {};

    if (name === 'latest_events') {
      const data = buildLatestEventsPayload(args);
      return {
        statusCode: 200,
        body: rpc(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data)
            }
          ],
          isError: false
        })
      };
    }

    return {
      statusCode: 200,
      body: rpcError(id, -32601, `Unknown tool: ${name}`)
    };
  }

  return {
    statusCode: 200,
    body: rpcError(id, -32601, `Unknown method: ${method}`)
  };
}

function isAuthorizedRequest(headers, token) {
  return Boolean(token) && headers?.authorization === `Bearer ${token}`;
}

async function handleHttpRequest({ method, url, headers, body, token }) {
  if (method === 'GET' && url === '/health') {
    return {
      statusCode: 200,
      body: { ok: true, service: 'my-mcp-server', tools: TOOL_DEFS.length }
    };
  }

  if (method !== 'POST' || url !== '/mcp') {
    return {
      statusCode: 404,
      body: { error: 'Not found' }
    };
  }

  if (!isAuthorizedRequest(headers, token)) {
    return {
      statusCode: 401,
      body: rpcError(null, -32001, 'Unauthorized')
    };
  }

  return handleRpcRequest(body);
}

function createMcpServer({ token } = {}) {
  return createServer(async (req, res) => {
    const routeResponse = await handleHttpRequest({
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: null,
      token
    });

    if (routeResponse.statusCode === 200 && routeResponse.body?.ok === true) {
      return json(res, routeResponse.statusCode, routeResponse.body);
    }

    if (routeResponse.statusCode === 404 || routeResponse.statusCode === 401) {
      return json(res, routeResponse.statusCode, routeResponse.body);
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      return json(res, 400, rpcError(null, -32700, 'Invalid JSON'));
    }

    const response = await handleHttpRequest({
      method: req.method,
      url: req.url,
      headers: req.headers,
      body,
      token
    });
    if (response.body === null) {
      res.writeHead(response.statusCode);
      res.end();
      return;
    }

    json(res, response.statusCode, response.body);
  });
}

export { TOOL_DEFS, buildLatestEventsPayload, createMcpServer, handleHttpRequest, handleRpcRequest, isAuthorizedRequest };
