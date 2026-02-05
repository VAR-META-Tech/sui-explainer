# Sui Transaction Explainer

<div align="center">

![Sui Transaction Explainer](https://img.shields.io/badge/Sui-Transaction-Explainer-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?style=flat-square&logo=docker)

A comprehensive Sui blockchain transaction explorer that transforms complex on-chain transactions into clear, human-readable explanations using AI-powered natural language processing.

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [API](#api) • [Docker](#docker) • [Contributing](#contributing)

</div>

---

## 📋 Project Overview

Sui Transaction Explainer is a web application designed to bridge the gap between complex blockchain transactions and everyday users. Whether you're a beginner exploring the Sui ecosystem or a developer needing quick transaction insights, this tool translates raw blockchain data into plain English using both rule-based analysis and Gemini AI.

### What This Solves

- **Complexity Barrier**: Blockchain transactions contain technical data that is difficult for non-technical users to understand
- **Information Overload**: Raw transaction data includes many fields that aren't immediately relevant
- **Context Gap**: Users need explanations of what happened, not just raw numbers

### Key Capabilities

- 🔍 **Real-time Fetching**: Query any Sui transaction by digest or explorer URL
- 📝 **AI-Powered Translation**: Convert technical data into easy-to-understand explanations using Gemini
- 📊 **3-Tier Explanations**: Choose from Beginner, Intermediate, or Technical explanation levels
- 💰 **Financial Analysis**: Identify transaction types (swap, transfer, buy, sell, mint, burn, DeFi)
- 📈 **Enhanced Data**: Blockberry API integration for detailed events, balance changes, and USDC values
- 🔧 **Move Call Breakdown**: Understand smart contract interactions without learning Move syntax
- 🎨 **Visual Flow Diagrams**: Interactive React Flow visualizations showing 7-stage transaction flow
- 🚀 **Docker Ready**: Production-ready Docker multi-stage build for containerized deployment

---

## ✨ Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Transaction Input** | Paste transaction digests (hex or Base58) or full Sui explorer URLs |
| **Automatic Validation** | Input validation ensures correct formats before processing |
| **Real-time RPC Queries** | Fetches transaction data directly from Sui RPC endpoints |
| **AI-Powered Summary** | Gemini-generated natural language explanations |
| **3-Tier Explanation Levels** | Beginner (simple), Intermediate (detailed), Technical (full) |
| **Gas Analysis** | Detailed breakdown of computation, storage, and gas fees |
| **Balance Changes** | Track all token and SUI balance changes |
| **Object Activity** | Monitor NFTs, coins, and custom objects (create, transfer, modify, delete) |
| **Error Handling** | User-friendly error messages with suggested solutions |

### Advanced Features

- **Transaction Type Detection**: Automatically identifies buy, sell, swap, transfer, mint, burn, DeFi, and programmable transactions
- **USD Value Estimation**: Shows approximate USD values for SUI and common tokens (including USDC via Blockberry)
- **Visual Flow Diagrams**: Animated 7-stage React Flow visualization (Sender → Initiation → Verification → Processing → Confirmation → Completion → Recipients)
- **Move Call Explorer**: Step-by-step breakdown of smart contract calls with plain-English explanations
- **Blockberry Integration**: Enhanced indexing for detailed events, balance changes, and USDC values
- **Dark Mode**: Full dark mode support for comfortable viewing
- **Responsive Design**: Optimized for desktop and mobile devices

---

## 🛠 Prerequisites

Before you begin, ensure you have:

- **Node.js**: Version 18.17.0 or higher
  ```bash
  node --version
  ```
- **npm** or **yarn**: Package manager (npm comes with Node.js)
  ```bash
  npm --version
  ```
- **Docker** (optional): For containerized deployment
  ```bash
  docker --version
  ```
- **API Keys** (optional):
  - Gemini API key for AI-powered explanations
  - Blockberry API key for enhanced transaction data

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sui-transaction-explainer.git
cd sui-transaction-explainer
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Sui RPC Endpoints
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
NEXT_PUBLIC_SUI_TESTNET_RPC_URL=https://fullnode.testnet.sui.io:443

# Gemini API (optional - for AI explanations)
GEMINI_API_KEY=your_gemini_api_key_here

# Blockberry API (optional - for enhanced data)
BLOCKBERRY_API_KEY=your_blockberry_api_key_here
```

> **Note**: The application works without optional API keys using rule-based explanations and basic RPC data.

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 5. Build for Production

```bash
npm run build
npm run start
```

---

## 🐳 Docker Deployment

### Quick Start

```bash
# Build the Docker image
docker build -t sui-transaction-explainer .

# Run with environment file
docker run -p 3000:3000 --env-file .env.production sui-transaction-explainer
```

### Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - BLOCKBERRY_API_KEY=${BLOCKBERRY_API_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

```bash
docker-compose up -d
```

### Environment Variables for Production

See [`.env.production.example`](.env.production.example) for production environment configuration.

---

## 📁 Project Structure

```
sui-transaction-explainer/
├── .env.local                    # Development environment variables
├── .env.production.example       # Production environment template
├── .dockerignore                 # Docker ignore file
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Docker Compose configuration
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Project dependencies
└── src/
    ├── app/                      # Next.js App Router
    │   ├── api/
    │   │   ├── transactions/
    │   │   │   └── [digest]/
    │   │   │       ├── route.ts         # Transaction API endpoint
    │   │   │       └── explain/         # AI explanation endpoint
    │   │   │           └── route.ts
    │   │   └── blockberry/
    │   │       └── [hash]/
    │   │           └── route.ts         # Blockberry API proxy
    │   ├── globals.css           # Global styles
    │   ├── layout.tsx            # Root layout component
    │   └── page.tsx              # Home page
    ├── components/               # React components
    │   ├── transaction/
    │   │   ├── TransactionFlow.tsx       # 7-stage flow visualization
    │   │   ├── TransactionInput.tsx      # Digest input form
    │   │   ├── TransactionSteps.tsx       # Step-by-step breakdown
    │   │   ├── TransactionSummary.tsx     # Main summary display
    │   │   ├── EnhancedDataDisplay.tsx    # Enhanced data display
    │   │   ├── MoveCallBreakdown.tsx      # Move call breakdown
    │   │   └── FinancialSummary.tsx       # Financial analysis
    │   └── ui/                   # Reusable UI components
    │       ├── Badge.tsx
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── Input.tsx
    │       └── Skeleton.tsx
    ├── lib/                      # Utility libraries and services
    │   ├── backend/              # Backend services
    │   │   ├── errors.ts         # Error handling
    │   │   ├── index.ts          # Backend exports
    │   │   └── validators/       # Input validators
    │   │       ├── digestValidator.ts
    │   │       └── index.ts
    │   ├── gemini/              # Gemini AI integration
    │   │   ├── client.ts         # Gemini API client
    │   │   └── prompt.ts         # Prompt templates
    │   ├── sui/                  # Sui blockchain utilities
    │   │   ├── client.ts         # Sui RPC client
    │   │   └── types.ts          # Sui type definitions
    │   ├── blockberry/           # Blockberry API integration
    │   │   ├── client.ts         # Blockberry API client
    │   │   └── types.ts          # Blockberry types
    │   ├── services/             # Business logic services
    │   │   ├── enhancedTransactionService.ts
    │   │   └── transactionService.ts
    │   ├── utils/                # Utility functions
    │   │   ├── formatting.ts
    │   │   └── validation.ts
    │   └── hooks/                 # Custom React hooks
    │       └── useTransaction.ts
    └── types/                    # TypeScript type definitions
        ├── index.ts
        ├── transaction.ts
        └── visualization.ts
```

---

## 🚀 Usage

### Input Methods

The application accepts three input formats:

1. **Hex Digest** (64 characters):
   ```
   0x8f0f2c7b3e4d1f9a8c7b6e5d4c3b2a1901234567890abcdef1234567890abcd
   ```

2. **Base58 Digest**:
   ```
   4TtJvM51NrG1Z8yCFVp8h1D7R4TnTbP8W3mN5Kp7Rz9
   ```

3. **Sui Explorer URL**:
   ```
   https://explorer.sui.io/transaction/0x8f0f2c7b3e4d1f9a8c7b6e5d4c3b2a1901234567890abcdef1234567890abcd
   ```

### Explanation Levels

Choose the explanation level that fits your needs:

| Level | Description | Best For |
|-------|-------------|----------|
| **Beginner** | Simple, non-technical summary | New users, general overview |
| **Intermediate** | Detailed with context | Regular users, some technical details |
| **Technical** | Full technical breakdown | Developers, complete information |

### What Information is Displayed

#### AI-Powered Summary
- Natural language explanation of the transaction
- Sender and recipient addresses (truncated for readability)
- Transaction type (swap, transfer, buy, sell, mint, burn, DeFi, programmable)
- Gas fees in SUI with USD approximation
- Asset movement summary

#### Financial Details
- Assets sent/received
- Token amounts
- USD value estimates (SUI, USDC, stablecoins)
- Total transaction value
- Gas breakdown (computation, storage)

#### Transaction Flow Visualization
7-stage interactive flow diagram showing:
1. **Sender** - Origin of the transaction
2. **Initiation** - Transaction creation and signing
3. **Verification** - Protocol validation
4. **Processing** - Smart contract execution
5. **Confirmation** - Transaction finalization
6. **Completion** - State updates
7. **Recipients** - Final asset destinations

#### Smart Contract Activity
- Programmable Transaction Blocks (PTBs)
- Package, module, and function names
- Arguments breakdown
- Plain English explanations of common Move functions

---

## 🔌 API Documentation

### GET /api/transactions/[digest]

Fetches and processes a Sui transaction.

#### Request Format

```bash
GET /api/transactions/0x...
```

#### Response Format (Success)

```json
{
  "digest": "0x...",
  "dataSource": "sui-rpc|blockberry",
  "transaction": {
    "data": { ... },
    "effects": { ... },
    "events": [ ... ],
    "objectChanges": [ ... ],
    "balanceChanges": [ ... ]
  },
  "analysis": {
    "type": "transfer|swap|buy|sell|mint|burn|defi|programmable",
    "summary": "Natural language summary",
    "financial": { ... },
    "flowNodes": [ ... ],
    "flowEdges": [ ... ]
  }
}
```

### POST /api/transactions/[digest]/explain

Generates AI-powered explanation using Gemini.

#### Request Format

```bash
POST /api/transactions/0x...
Content-Type: application/json

{
  "level": "beginner|intermediate|technical"
}
```

#### Response Format (Success)

```json
{
  "digest": "0x...",
  "level": "beginner",
  "explanation": {
    "title": "Transaction Explanation",
    "summary": "Plain English summary...",
    "details": {
      "sender": "...",
      "recipients": [ ... ],
      "assets": [ ... ],
      "gas": { ... }
    },
    "steps": [ ... ],
    "technicalInfo": { ... }
  },
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

### GET /api/blockberry/[hash]

Blockberry API proxy for enhanced transaction data.

#### Request Format

```bash
GET /api/blockberry/0x...
```

#### Response Format (Success)

```json
{
  "digest": "...",
  "dataSource": "blockberry",
  "rawTransaction": { ... },
  "metadata": {
    "firstExecutedSeqNr": 12345,
    "validation": { ... },
    "sender": "0x...",
    "gasConfig": { ... }
  },
  "effects": { ... },
  "events": [ ... ],
  "balanceChanges": [ ... ],
  "objectChanges": [ ... ]
}
```

#### Features

- **Enhanced State Changes**: Detailed object state changes (created, modified, deleted, wrapped, unwrapped)
- **Parsed Events**: Events with structured data for easier analysis
- **Detailed Balance Changes**: Token transfers with formatted amounts including USDC values
- **Fallback**: Returns partial data if Blockberry API is unavailable

### Error Responses

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_PARAMS | Invalid parameters provided |
| 400 | INVALID_DIGEST | Invalid transaction digest format |
| 404 | NOT_FOUND | Transaction does not exist |
| 500 | RPC_ERROR | Failed to connect to Sui RPC |
| 500 | AI_ERROR | Failed to generate AI explanation |
| 503 | SERVICE_UNAVAILABLE | External service temporarily unavailable |

---

## 🧪 Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | React framework | 14.2.0 |
| [TypeScript](https://www.typescriptlang.org/) | Type safety | 5.4.0 |
| [Tailwind CSS](https://tailwindcss.com/) | Styling | 3.4.0 |
| [@mysten/sui.js](https://docs.sui.io/sui-api-ref) | Sui blockchain SDK | 1.12.0 |
| [React Flow](https://reactflow.dev/) | Interactive flow diagrams | 11.11.0 |
| [Zustand](https://zustand-demo.pmnd.rs/) | State management | 4.5.0 |
| [TanStack Query](https://tanstack.com/query/latest) | Data fetching | 5.28.0 |
| [Lucide React](https://lucide.dev/) | Icons | 0.372.0 |
| [Framer Motion](https://www.framer.com/motion/) | Animations | 11.1.0 |
| [Gemini API](https://ai.google.dev/gemini-api) | AI-powered explanations | Latest |
| [Blockberry](https://blockberry.xyz/) | Enhanced indexing | Latest |
| [Docker](https://www.docker.com/) | Containerization | Latest |
| [Jest](https://jestjs.io/) | Testing | 29.7.0 |

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUI_RPC_URL` | Mainnet RPC endpoint | `https://fullnode.mainnet.sui.io:443` |
| `NEXT_PUBLIC_SUI_TESTNET_RPC_URL` | Testnet RPC endpoint | `https://fullnode.testnet.sui.io:443` |
| `GEMINI_API_KEY` | Gemini API key for AI explanations | (optional) |
| `BLOCKBERRY_API_KEY` | Blockberry API key for enhanced data | (optional) |

### Docker Configuration

The Dockerfile uses a multi-stage build for minimal production images:

- **Stage 1 (deps)**: Install dependencies with proper caching
- **Stage 2 (builder)**: Build the Next.js application with standalone output
- **Stage 3 (runner)**: Minimal production image with non-root user

```dockerfile
# Build arguments
ARG NODE_VERSION=20-alpine

# Production settings
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
```

### Customization

#### Adding New Move Function Explanations

Edit [`src/lib/services/translationService.ts`](src/lib/services/translationService.ts) to add explanations for new Move functions:

```typescript
const MOVE_FUNCTION_EXPLANATIONS: Record<string, string> = {
  'new': 'Creates a new object instance',
  'transfer': 'Transfers ownership of an object',
  'swap': 'Exchanges one asset for another',
  // Add more functions here
};
```

#### Styling

The application uses a custom Sui-themed color palette. Modify [`tailwind.config.ts`](tailwind.config.ts) to customize:

```typescript
theme: {
  extend: {
    colors: {
      sui: {
        primary: '#4D6AFF',
        secondary: '#6D28D9',
        // Customize other colors
      },
    },
  },
}
```

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Reporting Issues

1. Search existing issues before creating a new one
2. Use the issue template when available
3. Include steps to reproduce, expected behavior, and actual behavior
4. Add screenshots if relevant

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Run linting: `npm run lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Coding Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **Formatting**: Prettier (included via ESLint)
- **Testing**: Jest for unit tests, aim for 80% coverage
- **Commits**: Conventional commits format preferred
- **Documentation**: Update README and code comments

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Sui Foundation](https://sui.io/) for the Sui blockchain
- [Mysten Labs](https://mystenlabs.com/) for the @mysten/sui.js SDK
- [Google AI](https://ai.google.dev/) for the Gemini API
- [Blockberry](https://blockberry.xyz/) for enhanced indexing
- [Next.js](https://nextjs.org/) team for the excellent React framework
- [React Flow](https://reactflow.dev/) for the visualization components
- All contributors who help improve this project

---

<div align="center">
Built with ❤️ for the Sui ecosystem
</div>
