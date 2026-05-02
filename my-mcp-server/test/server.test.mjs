import test from 'node:test';
import assert from 'node:assert/strict';

import { handleHttpRequest } from '../src/app.mjs';

const token = 'secret-token';
const authHeaders = { authorization: `Bearer ${token}` };

test('initialize returns MCP server metadata', async () => {
  const response = await handleHttpRequest({
    method: 'POST',
    url: '/mcp',
    headers: authHeaders,
    body: { jsonrpc: '2.0', id: 1, method: 'initialize' },
    token
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.protocolVersion, '2025-03-26');
  assert.equal(response.body.result.serverInfo.name, 'my-mcp-server');
});

test('tools/list exposes the sample tool', async () => {
  const response = await handleHttpRequest({
    method: 'POST',
    url: '/mcp',
    headers: authHeaders,
    body: { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    token
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.tools[0].name, 'latest_events');
  assert.equal(response.body.result.tools[0].inputSchema.properties.region.default, 'global');
});

test('tools/call returns text content that WorldMonitor can render', async () => {
  const response = await handleHttpRequest({
    method: 'POST',
    url: '/mcp',
    headers: authHeaders,
    body: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'latest_events',
        arguments: { limit: 2, region: 'mena' }
      }
    },
    token
  });
  const parsed = JSON.parse(response.body.result.content[0].text);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.isError, false);
  assert.equal(parsed.args.region, 'mena');
  assert.equal(parsed.items.length, 2);
});

test('rejects unauthorized requests', async () => {
  const response = await handleHttpRequest({
    method: 'POST',
    url: '/mcp',
    headers: { authorization: 'Bearer wrong-token' },
    body: { jsonrpc: '2.0', id: 4, method: 'tools/list' },
    token
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error.code, -32001);
});

test('notifications/initialized returns 202 with no body', async () => {
  const response = await handleHttpRequest({
    method: 'POST',
    url: '/mcp',
    headers: authHeaders,
    body: { jsonrpc: '2.0', method: 'notifications/initialized' },
    token
  });

  assert.equal(response.statusCode, 202);
  assert.equal(response.body, null);
});
