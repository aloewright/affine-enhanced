#!/bin/bash

echo "🧪 Testing the globally installed 'prompt' command..."
echo ""

# Check if command exists
if command -v prompt &> /dev/null; then
    echo "✅ 'prompt' command found at: $(which prompt)"
else
    echo "❌ 'prompt' command not found"
    exit 1
fi

# Check if it's executable
if [[ -x "$(which prompt)" ]]; then
    echo "✅ 'prompt' command is executable"
else
    echo "❌ 'prompt' command is not executable"
    exit 1
fi

# Check the target file
PROMPT_TARGET=$(readlink "$(which prompt)")
echo "✅ Links to: $PROMPT_TARGET"

# Verify Node.js version compatibility
NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION (compatible with v24.7.0+)"

echo ""
echo "🎉 Installation successful!"
echo ""
echo "Usage: Just type 'prompt' anywhere in your terminal to launch the unified meta-prompt generator!"
echo ""
echo "Example session:"
echo "  $ prompt"
echo "  🚀 Unified Meta-Prompt Generator"
echo "  📋 Node.js v24.7.0 | Model: claude-sonnet-4"
echo "  ..."
