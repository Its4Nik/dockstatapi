export const swaggerReadme: string = `
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=flat&logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

Docker infrastructure management API with real-time monitoring and orchestration capabilities.

## Key Features

- **Stack Orchestration**
  Deploy/update Docker stacks (compose v3+) with custom configurations
- **Container Monitoring**
  Real-time metrics (CPU/RAM/status) across multiple Docker hosts
- **Centralized Logging**
  Structured log management with retention policies and filtering
- **Host Management**
  Multi-host configuration with connection health checks
- **Plugin System**
  Extensible architecture for custom monitoring integrations

## Installation & Setup

**Prerequisites**:
- Node.js 18+
- Docker Engine 23+
- Bun runtime

\`\`\`bash
# Clone repo
git clone https://github.com/Its4Nik/DockStatAPI.git
cd DockStatAPI
# Install dependencies
bun install

# Start development server
bun run dev
\`\`\`

## Configuration

**Environment Variables**:
\`\`\`ini
PAD_NEW_LINES=true
NODE_ENV=production
LOG_LEVEL=info
\`\`\`

## Security

1. Always use HTTPS in production
2. Rotate API keys regularly
3. Restrict host connections to trusted networks
4. Enable Docker Engine TLS authentication

## Contributing

1. Fork repository
2. Create feature branch (\`feat/my-feature\`)
3. Submit PR with detailed description

**Code Style**:
- TypeScript strict mode
- Elysia framework conventions
- Prettier formatting
`;
