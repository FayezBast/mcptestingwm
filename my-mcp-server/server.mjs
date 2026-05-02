import { createMcpServer } from './src/app.mjs';

const port = Number(process.env.PORT || 3000);
const server = createMcpServer({ token: process.env.MCP_TOKEN });

server.listen(port, () => {
  console.log(`MCP server listening on port ${port}`);
});
