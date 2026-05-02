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
  },
  {
    name: 'active_alerts',
    description: 'Return active alerts filtered by severity, status, and region',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 10 },
        region: { type: 'string', default: 'global' },
        severity: { type: 'string', default: 'all' },
        status: { type: 'string', default: 'open' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'country_risk',
    description: 'Return country risk scores, trends, and drivers',
    inputSchema: {
      type: 'object',
      properties: {
        countries: {
          type: 'array',
          items: { type: 'string' },
          default: ['Lebanon', 'Israel', 'Jordan']
        },
        includeDrivers: { type: 'boolean', default: true }
      },
      additionalProperties: false
    }
  },
  {
    name: 'top_incidents',
    description: 'Return top incident clusters for a recent time window',
    inputSchema: {
      type: 'object',
      properties: {
        windowHours: { type: 'number', default: 24 },
        groupBy: { type: 'string', default: 'country' },
        limit: { type: 'number', default: 5 }
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

function normalizeActiveAlertsArgs(input) {
  const limit = Number.isFinite(input?.limit) ? input.limit : 10;
  const region = typeof input?.region === 'string' && input.region.trim() ? input.region : 'global';
  const severity = typeof input?.severity === 'string' && input.severity.trim() ? input.severity : 'all';
  const status = typeof input?.status === 'string' && input.status.trim() ? input.status : 'open';
  return { limit, region, severity, status };
}

function normalizeCountryRiskArgs(input) {
  const countries = Array.isArray(input?.countries) && input.countries.length > 0
    ? input.countries.filter((country) => typeof country === 'string' && country.trim())
    : ['Lebanon', 'Israel', 'Jordan'];
  const includeDrivers = typeof input?.includeDrivers === 'boolean' ? input.includeDrivers : true;
  return { countries, includeDrivers };
}

function normalizeTopIncidentsArgs(input) {
  const windowHours = Number.isFinite(input?.windowHours) ? input.windowHours : 24;
  const groupBy = typeof input?.groupBy === 'string' && input.groupBy.trim() ? input.groupBy : 'country';
  const limit = Number.isFinite(input?.limit) ? input.limit : 5;
  return { windowHours, groupBy, limit };
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

function buildActiveAlertsPayload(rawArgs) {
  const args = normalizeActiveAlertsArgs(rawArgs);
  const seedItems = [
    {
      id: 'alert-201',
      title: 'Cross-border strike activity',
      severity: 'critical',
      status: 'open',
      region: 'mena',
      updatedAt: '2026-05-02T00:05:00.000Z'
    },
    {
      id: 'alert-202',
      title: 'Port disruption warning',
      severity: 'high',
      status: 'open',
      region: 'mena',
      updatedAt: '2026-05-01T23:40:00.000Z'
    },
    {
      id: 'alert-203',
      title: 'Grid outage watch',
      severity: 'medium',
      status: 'monitoring',
      region: 'europe',
      updatedAt: '2026-05-01T22:10:00.000Z'
    }
  ];

  const filteredItems = seedItems.filter((item) => {
    const matchesRegion = args.region === 'global' || item.region === args.region;
    const matchesSeverity = args.severity === 'all' || item.severity === args.severity;
    const matchesStatus = args.status === 'all' || item.status === args.status;
    return matchesRegion && matchesSeverity && matchesStatus;
  });

  return {
    source: 'my-backend',
    fetchedAt: new Date().toISOString(),
    args,
    summary: {
      totalActive: filteredItems.length,
      critical: filteredItems.filter((item) => item.severity === 'critical').length,
      high: filteredItems.filter((item) => item.severity === 'high').length
    },
    items: filteredItems.slice(0, Math.max(0, args.limit))
  };
}

function buildCountryRiskPayload(rawArgs) {
  const args = normalizeCountryRiskArgs(rawArgs);
  const scorecard = {
    Lebanon: {
      riskScore: 82,
      trend: 'up',
      level: 'high',
      drivers: ['border activity', 'political deadlock', 'currency pressure']
    },
    Israel: {
      riskScore: 74,
      trend: 'up',
      level: 'high',
      drivers: ['regional escalation', 'civil defense alerts']
    },
    Jordan: {
      riskScore: 41,
      trend: 'stable',
      level: 'medium',
      drivers: ['border spillover risk', 'trade route sensitivity']
    },
    Egypt: {
      riskScore: 38,
      trend: 'stable',
      level: 'medium',
      drivers: ['shipping pressure', 'inflation exposure']
    }
  };

  return {
    source: 'my-backend',
    fetchedAt: new Date().toISOString(),
    args,
    countries: args.countries.map((country) => {
      const entry = scorecard[country] ?? {
        riskScore: 50,
        trend: 'stable',
        level: 'medium',
        drivers: ['no sample drivers configured']
      };

      return {
        country,
        riskScore: entry.riskScore,
        trend: entry.trend,
        level: entry.level,
        drivers: args.includeDrivers ? entry.drivers : undefined
      };
    })
  };
}

function buildTopIncidentsPayload(rawArgs) {
  const args = normalizeTopIncidentsArgs(rawArgs);
  const seedItems = [
    {
      key: 'Lebanon',
      incidentCount: 19,
      severityMix: { critical: 3, high: 8, medium: 8 },
      leadTopic: 'cross-border activity'
    },
    {
      key: 'Israel',
      incidentCount: 16,
      severityMix: { critical: 2, high: 7, medium: 7 },
      leadTopic: 'air defense alerts'
    },
    {
      key: 'Jordan',
      incidentCount: 6,
      severityMix: { critical: 0, high: 2, medium: 4 },
      leadTopic: 'border security'
    },
    {
      key: 'Egypt',
      incidentCount: 4,
      severityMix: { critical: 0, high: 1, medium: 3 },
      leadTopic: 'shipping disruption'
    }
  ];

  return {
    source: 'my-backend',
    fetchedAt: new Date().toISOString(),
    args,
    ranking: seedItems.slice(0, Math.max(0, args.limit)).map((item, index) => ({
      rank: index + 1,
      groupBy: args.groupBy,
      ...item
    }))
  };
}

function buildToolResult(payload) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload)
      }
    ],
    isError: false
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
      return {
        statusCode: 200,
        body: rpc(id, buildToolResult(buildLatestEventsPayload(args)))
      };
    }

    if (name === 'active_alerts') {
      return {
        statusCode: 200,
        body: rpc(id, buildToolResult(buildActiveAlertsPayload(args)))
      };
    }

    if (name === 'country_risk') {
      return {
        statusCode: 200,
        body: rpc(id, buildToolResult(buildCountryRiskPayload(args)))
      };
    }

    if (name === 'top_incidents') {
      return {
        statusCode: 200,
        body: rpc(id, buildToolResult(buildTopIncidentsPayload(args)))
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

export {
  TOOL_DEFS,
  buildActiveAlertsPayload,
  buildCountryRiskPayload,
  buildLatestEventsPayload,
  buildTopIncidentsPayload,
  createMcpServer,
  handleHttpRequest,
  handleRpcRequest,
  isAuthorizedRequest
};
