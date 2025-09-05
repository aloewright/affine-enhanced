# Unified Meta-Prompt System

A sophisticated meta-prompt generator that creates domain-specific prompts with MCP integration, designed for Node.js v24.7.0 and optimized for claude-sonnet-4.

## 🚀 Overview

This system generates tailored prompts for various domains while respecting user preferences, environmental constraints, and safety requirements. It automatically integrates with available MCP (Model Context Protocol) servers and follows best practices for AI agent development.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                Meta-Prompt Core                 │
├─────────────────┬───────────────┬───────────────┤
│   Context       │   Objective   │   Structural  │
│   Synthesis     │   & Success   │  Requirements │
├─────────────────┼───────────────┼───────────────┤
│  Contextual     │   Adaptive    │   Safety &    │
│ Intelligence    │   Features    │  Compliance   │
├─────────────────┼───────────────┼───────────────┤
│   Generation    │  Validation   │   Iterative   │
│    Process      │ & Self-Eval   │  Refinement   │
└─────────────────┴───────────────┴───────────────┘
```

## 📋 Features

- **Multi-Domain Support**: Creative Writing, Technical Documentation, Customer Service, AI Agent Instructions, Software Development
- **MCP Integration**: Automatic detection and utilization of available MCP servers
- **User Preference Tracking**: Maintains preferences across sessions
- **Safety & Compliance**: Built-in content safety and policy adherence
- **Self-Validation**: Quality scoring and iterative refinement
- **Schema-Driven**: Structured input/output with JSON schema validation

## 🛠️ Installation & Setup

### Prerequisites
- Node.js v24.7.0 or higher
- Access to claude-sonnet-4 (preferred model)
- Optional: MCP servers, gopass for credential management

### Quick Start

1. **Make CLI executable:**
```bash
chmod +x meta-prompt-cli.js
```

2. **Run interactive CLI:**
```bash
node meta-prompt-cli.js
```

3. **Or use npm scripts:**
```bash
npm run generate  # Interactive mode
npm run start     # Same as above
npm run dev       # Watch mode for development
```

## 📖 Usage

### CLI Interface

The interactive CLI will guide you through:
1. Domain selection (6 available domains)
2. Objective specification
3. User profile (expertise level, role, context)
4. Preferences (tone, verbosity, examples)
5. Automatic environment detection

### Example Session

```bash
🚀 Unified Meta-Prompt Generator
📋 Node.js v24.7.0 | Model: claude-sonnet-4

🎯 Available domains:
   1. creative_writing
   2. technical_documentation
   3. customer_service
   4. ai_agent_instructions
   5. software_development
   6. custom

Select domain (1-6): 4
What is your primary objective? Create instructions for an AI agent that helps developers debug Node.js applications
Your expertise level (beginner/intermediate/expert): expert
Preferred tone (professional/friendly/empathetic) [professional]: friendly
Detail level (concise/detailed/comprehensive) [detailed]: comprehensive

🔄 Generating prompt...
✅ Prompt generated successfully!
📁 Saved to: ./generated-prompt-1703123456789.json
```

### Programmatic Usage

```javascript
import { MetaPromptGenerator } from './meta-prompt-cli.js';

const generator = new MetaPromptGenerator();

const input = {
  domain: 'ai_agent_instructions',
  objective: 'Create debugging assistance agent',
  user_profile: { expertise: 'expert' },
  preferences: { tone: 'friendly', verbosity: 'comprehensive' }
};

const prompt = await generator.generatePrompt(input);
console.log('Generated prompt:', prompt);
```

## 📚 Domain Specifications

### 1. Creative Writing
- Genre controls and voice guidelines
- Character development frameworks
- Plot structure and pacing rules
- Content safety for creative expression

### 2. Technical Documentation
- Audience-appropriate technical depth
- Code sample integration
- API reference formatting
- Accuracy and citation standards

### 3. Customer Service
- Brand voice alignment
- Empathy balance and escalation protocols
- PII handling and compliance
- Response template structures

### 4. AI Agent Instructions
- Tool schema integration
- Function signatures and error handling
- MCP server utilization hints
- Safety rails and constraint patterns

### 5. Software Development
- Language/framework specifications
- Coding standards and best practices
- Testing and security requirements
- Reproducible output formats

## 🔧 Configuration

### Environment Variables
```bash
export META_PROMPT_MODEL="claude-sonnet-4"
export META_PROMPT_RUNTIME="Node.js v24.7.0"
export MCP_SERVERS_ENABLED=true
```

### Configuration File
```json
{
  "default_model": "claude-sonnet-4",
  "runtime": "Node.js v24.7.0",
  "mcp_enabled": true,
  "credentials": {
    "gcloud": "local-json",
    "secrets": "gopass"
  }
}
```

## 📊 Input Schema

The system uses a comprehensive JSON schema to validate inputs:

```json
{
  "domain": "ai_agent_instructions",
  "objective": "Create debugging assistant",
  "constraints": {
    "length": { "words": 500 },
    "safety": ["No system access"],
    "format": "markdown"
  },
  "user_profile": {
    "expertise": "expert",
    "role": "developer",
    "context": "team"
  },
  "preferences": {
    "tone": "professional",
    "verbosity": "detailed",
    "examples": true
  }
}
```

## 🔍 Quality Validation

Every generated prompt is validated against:

- **Clarity**: Instructions are unambiguous (1-5 score)
- **Completeness**: All necessary elements included (1-5 score)  
- **Feasibility**: Realistic and achievable (1-5 score)
- **Safety**: Policy compliance (Pass/Fail)
- **Domain Appropriateness**: Suitable for specified domain

## 🛡️ Safety & Compliance

- **Content Safety**: Automatic filtering for harmful content
- **Privacy Protection**: PII handling and redaction protocols
- **Policy Adherence**: Platform and organizational guidelines
- **Credential Security**: Gopass integration for secret management

## 🔗 MCP Integration

Automatically detects and utilizes available MCP servers:
- `firecrawl_search` - Web content retrieval
- `brave_web_search` - Search functionality
- `byterover-store-knowledge` - Knowledge storage
- `sequentialthinking` - Complex reasoning
- Custom MCP servers as available

Usage hints are provided per domain:
```json
{
  "tools_integration": {
    "available_mcp_tools": ["firecrawl_search", "sequentialthinking"],
    "usage_hints": [
      "Use firecrawl_search for documentation gathering",
      "Apply sequentialthinking for complex problem decomposition"
    ]
  }
}
```

## 🧪 Testing & Validation

```bash
npm test                    # Run test suite
npm run validate-schema     # Validate JSON schema
npm run lint               # Code linting
```

## 📁 File Structure

```
├── unified-meta-prompt.md     # Core meta-prompt specification
├── meta-prompt-schema.json    # Input validation schema  
├── meta-prompt-cli.js         # Node.js CLI implementation
├── meta-prompt-package.json   # Package configuration
├── README-meta-prompt.md      # This documentation
└── examples/                  # Example configurations
```

## 🔄 Workflow Integration

### Pre-deployment Checks
As per user rules, always run before deploying:
```bash
codeflash ---all  # Comprehensive code analysis
```

### Credential Management
- Google Cloud: Use local JSON credentials
- Secrets: Prefer gopass over environment variables
- MCP Servers: Auto-discover and integrate available tools

## 🎯 Success Metrics

Target performance indicators:
- ≥90% rubric satisfaction across all domains
- ≤2 refinement cycles average to reach acceptance
- 100% schema validation pass rate
- Zero safety compliance violations

## 📈 Roadmap

- **v1.1**: Multilingual support expansion
- **v1.2**: Additional domain templates
- **v1.3**: Enhanced MCP server integrations
- **v1.4**: Human-in-the-loop review interfaces
- **v2.0**: Cloud deployment and team collaboration

## 🤝 Contributing

1. Follow existing code patterns and Node.js v24.7.0 compatibility
2. Maintain claude-sonnet-4 as the default model preference
3. Ensure all safety and validation frameworks are preserved
4. Add domain-specific examples and test cases

## 📄 License

MIT License - see LICENSE file for details

---

**Built for the AI-powered development workflow with MCP protocol integration and claude-sonnet-4 optimization.**
