#!/usr/bin/env node

/**
 * Unified Meta-Prompt CLI
 * Node.js v24.7.0 compatible CLI for generating domain-specific prompts
 * Integrates with MCP servers and follows user preferences
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

// MCP integration placeholder - would connect to actual MCP servers
const mcpTools = {
  available: [
    'firecrawl_search',
    'brave_web_search',
    'logo_search',
    'byterover-store-knowledge',
    'sequentialthinking',
  ],
  getTools: () => mcpTools.available,
  invoke: (tool, params) => {
    console.log(`[MCP] Would invoke ${tool} with:`, params);
    return Promise.resolve({ status: 'simulated', tool, params });
  },
};

// Default configuration following user rules
const defaultConfig = {
  model: 'claude-sonnet-4',
  runtime: 'Node.js v24.7.0',
  credentials: {
    gcloud: 'local-json',
    secrets: 'gopass',
  },
};

class MetaPromptGenerator {
  constructor(config = defaultConfig) {
    this.config = config;
    this.schema = null;
  }

  async loadSchema() {
    try {
      const schemaPath = resolve('./meta-prompt-schema.json');
      const schemaContent = await readFile(schemaPath, 'utf8');
      this.schema = JSON.parse(schemaContent);
      return this.schema;
    } catch {
      console.warn('⚠️  Schema file not found, using built-in validation');
      return null;
    }
  }

  validateInput(input) {
    const required = ['domain', 'objective', 'user_profile'];
    const missing = required.filter(field => !input[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (input.user_profile && !input.user_profile.expertise) {
      throw new Error('user_profile.expertise is required');
    }

    return true;
  }

  async generatePrompt(input) {
    this.validateInput(input);

    const prompt = await this.buildPrompt(input);
    const validated = this.validateOutput(prompt);

    if (!validated.isValid) {
      console.log('🔄 Refining prompt based on validation...');
      return this.refinePrompt(prompt, validated.issues);
    }

    return prompt;
  }

  async buildPrompt(input) {
    const {
      domain,
      objective,
      constraints = {},
      user_profile,
      preferences = {},
      environment = {},
      domain_specific = {},
    } = input;

    // Detect available MCP tools
    const availableTools = mcpTools.getTools();

    const prompt = {
      title: `Generated Prompt for ${domain.replace('_', ' ').toUpperCase()}`,
      context: this.buildContext(domain, user_profile, environment),
      objective: objective,
      instructions: this.buildInstructions(domain, user_profile, preferences),
      constraints: this.buildConstraints(constraints, domain_specific),
      output_format: this.buildOutputFormat(
        preferences.verbosity,
        constraints.format
      ),
      examples: preferences.examples ? this.buildExamples(domain) : null,
      quality_criteria: this.buildQualityCriteria(),
      tools_integration:
        availableTools.length > 0
          ? {
              available_mcp_tools: availableTools,
              usage_hints: this.getMCPUsageHints(domain, availableTools),
            }
          : null,
      safety_guidelines: this.buildSafetyGuidelines(constraints.safety),
      metadata: {
        generated_at: new Date().toISOString(),
        model: this.config.model,
        runtime: this.config.runtime,
        domain: domain,
        user_expertise: user_profile.expertise,
      },
    };

    return prompt;
  }

  buildContext(domain, userProfile, environment) {
    const contexts = {
      creative_writing: `You are assisting with creative writing tasks. The user has ${userProfile.expertise} level expertise.`,
      technical_documentation: `You are helping create technical documentation. Target audience expertise: ${userProfile.expertise}.`,
      customer_service: `You are designing customer service interactions. User context: ${userProfile.context || 'individual'}.`,
      ai_agent_instructions: `You are creating AI agent instructions. Available tools: ${environment.tools?.length || 0} MCP servers.`,
      software_development: `You are assisting with software development using ${environment.runtime || 'Node.js v24.7.0'}.`,
    };

    return contexts[domain] || `You are assisting with ${domain} tasks.`;
  }

  buildInstructions(domain, userProfile, preferences) {
    const baseInstructions = [
      '1. Analyze the provided context and requirements carefully',
      '2. Structure your response according to the specified format',
      '3. Include all required elements while respecting constraints',
    ];

    const domainSpecific = {
      creative_writing: [
        '4. Consider genre, voice, and pacing requirements',
        '5. Ensure character and plot development guidelines are clear',
        '6. Include content safety considerations for creative expression',
      ],
      technical_documentation: [
        '4. Match technical depth to audience expertise level',
        '5. Include code examples and API references where appropriate',
        '6. Ensure accuracy and provide citation guidelines',
      ],
      customer_service: [
        '4. Maintain brand voice and empathy balance',
        '5. Include escalation protocols and compliance requirements',
        '6. Address PII handling and privacy concerns',
      ],
      ai_agent_instructions: [
        '4. Define clear tool schemas and function signatures',
        '5. Include comprehensive error handling and safety rails',
        '6. Specify MCP server integration patterns',
      ],
      software_development: [
        '4. Specify language, framework, and coding standards',
        '5. Include testing and security requirements',
        '6. Ensure reproducible and well-documented outputs',
      ],
    };

    return [
      ...baseInstructions,
      ...(domainSpecific[domain] || []),
      preferences.tone
        ? `7. Maintain ${preferences.tone} tone throughout`
        : null,
    ].filter(Boolean);
  }

  buildConstraints(constraints, domainSpecific) {
    const result = {
      ...constraints,
    };

    if (domainSpecific) {
      result.domain_specific = domainSpecific;
    }

    result.safety = [
      'Respect privacy and PII handling requirements',
      'Comply with platform and organizational policies',
      ...(constraints.safety || []),
    ];

    return result;
  }

  buildOutputFormat(verbosity = 'detailed', format = 'markdown') {
    const formats = {
      json: 'Provide response as valid JSON with specified structure',
      markdown: 'Use clean Markdown formatting with headers and sections',
      plain_text: 'Provide plain text response with clear organization',
      structured_template: 'Follow the specified template structure exactly',
    };

    const verbosityGuidance = {
      concise: 'Be brief and direct, include only essential information',
      detailed: 'Provide comprehensive information with explanations',
      comprehensive: 'Include extensive detail, examples, and context',
    };

    return {
      format: formats[format] || formats.markdown,
      verbosity: verbosityGuidance[verbosity],
      structure: {
        required_sections: [
          'context',
          'instructions',
          'constraints',
          'quality_criteria',
        ],
        optional_sections: ['examples', 'tools_integration'],
      },
    };
  }

  buildExamples(domain) {
    // Would generate domain-specific examples
    return `Include 1-2 relevant examples for ${domain} context`;
  }

  buildQualityCriteria() {
    return {
      clarity: 'Instructions are unambiguous and easy to follow',
      completeness: 'All necessary elements are included',
      actionability: 'Response can be immediately implemented',
      safety: 'Complies with all safety and policy requirements',
      domain_appropriateness: 'Content is suitable for the specified domain',
    };
  }

  getMCPUsageHints(domain, tools) {
    const hints = {
      creative_writing: tools.includes('sequentialthinking')
        ? ['Use sequentialthinking for complex plot development']
        : [],
      technical_documentation: tools.includes('firecrawl_search')
        ? ['Use firecrawl_search to gather current documentation']
        : [],
      software_development: tools.includes('byterover-store-knowledge')
        ? ['Store implementation patterns with byterover-store-knowledge']
        : [],
    };

    return hints[domain] || [];
  }

  buildSafetyGuidelines(customSafety = []) {
    return [
      'Respect user privacy and data protection',
      'Ensure inclusive language',
      ...customSafety,
    ];
  }

  validateOutput(prompt) {
    const issues = [];

    if (!prompt.context || prompt.context.length < 10) {
      issues.push('Context section needs more detail');
    }

    if (!prompt.instructions || prompt.instructions.length < 3) {
      issues.push('Instructions section needs at least 3 items');
    }

    if (!prompt.constraints || !prompt.constraints.safety) {
      issues.push('Safety constraints must be included');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  async refinePrompt(prompt, issues) {
    // Simple refinement logic - in practice would use AI
    console.log(`🔧 Addressing issues: ${issues.join(', ')}`);

    if (issues.includes('Context section needs more detail')) {
      prompt.context +=
        ' This prompt is designed to provide comprehensive guidance while maintaining safety and quality standards.';
    }

    return prompt;
  }
}

// CLI Interface
async function main() {
  console.log('🚀 Unified Meta-Prompt Generator');
  console.log('📋 Node.js v24.7.0 | Model: claude-sonnet-4\n');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = prompt =>
    new Promise(resolve => rl.question(prompt, resolve));

  try {
    const generator = new MetaPromptGenerator();
    await generator.loadSchema();

    console.log('🎯 Available domains:');
    console.log('   1. creative_writing');
    console.log('   2. technical_documentation');
    console.log('   3. customer_service');
    console.log('   4. ai_agent_instructions');
    console.log('   5. software_development');
    console.log('   6. custom\n');

    const domain = await question('Select domain (1-6): ');
    const domainMap = {
      1: 'creative_writing',
      2: 'technical_documentation',
      3: 'customer_service',
      4: 'ai_agent_instructions',
      5: 'software_development',
      6: 'custom',
    };

    const selectedDomain = domainMap[domain];
    if (!selectedDomain) {
      throw new Error('Invalid domain selection');
    }

    const objective = await question('What is your primary objective? ');
    const expertise = await question(
      'Your expertise level (beginner/intermediate/expert): '
    );
    const tone =
      (await question(
        'Preferred tone (professional/friendly/empathetic) [professional]: '
      )) || 'professional';
    const verbosity =
      (await question(
        'Detail level (concise/detailed/comprehensive) [detailed]: '
      )) || 'detailed';

    const input = {
      domain: selectedDomain,
      objective,
      user_profile: {
        expertise: expertise || 'intermediate',
      },
      preferences: {
        tone,
        verbosity,
        examples: true,
      },
      environment: {
        runtime: defaultConfig.runtime,
        model: defaultConfig.model,
        tools: mcpTools.getTools(),
      },
    };

    console.log('\n🔄 Generating prompt...');
    const generatedPrompt = await generator.generatePrompt(input);

    const outputPath = `./generated-prompt-${Date.now()}.json`;
    await writeFile(outputPath, JSON.stringify(generatedPrompt, null, 2));

    console.log('\n✅ Prompt generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log('\n📋 Preview:');
    console.log('='.repeat(50));
    console.log(`Title: ${generatedPrompt.title}`);
    console.log(`Context: ${generatedPrompt.context.substring(0, 100)}...`);
    console.log(`Instructions: ${generatedPrompt.instructions.length} steps`);
    console.log(
      `Tools: ${generatedPrompt.tools_integration?.available_mcp_tools.length || 0} MCP servers available`
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { defaultConfig, mcpTools, MetaPromptGenerator };
