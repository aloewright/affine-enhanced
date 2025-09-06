// Mock implementation for @affine/server-native
// This is a temporary workaround to run the server without the native Rust module

const crypto = require('crypto');

module.exports = {
  mergeUpdatesInApplyWay: function (...updates) {
    // Mock implementation - just return the first update for now
    return updates[0] || Buffer.alloc(0);
  },

  verifyChallengeResponse: async function (response, bits, resource) {
    // Mock implementation - always return true for development
    console.warn(
      'Using mock verifyChallengeResponse - not secure for production'
    );
    return true;
  },

  mintChallengeResponse: async function (resource, bits) {
    // Mock implementation - return a dummy challenge
    console.warn(
      'Using mock mintChallengeResponse - not secure for production'
    );
    return crypto.randomBytes(32).toString('hex');
  },

  fromModelName: function (model) {
    // Mock tokenizer
    return {
      encode: function (text) {
        // Simple approximation: ~4 characters per token
        return new Array(Math.ceil(text.length / 4)).fill(0);
      },
      decode: function (tokens) {
        return 'mocked text';
      },
    };
  },

  getMime: function (buffer) {
    // Mock MIME type detection
    return 'application/octet-stream';
  },

  parseDoc: function (buffer) {
    // Mock document parser
    return {
      content: 'mocked content',
      metadata: {},
    };
  },

  htmlSanitize: function (html) {
    // Very basic HTML sanitization (not secure for production)
    return html.replace(/<script[^>]*>.*?<\/script>/gi, '');
  },

  AFFINE_PRO_PUBLIC_KEY: 'mock-public-key',
  AFFINE_PRO_LICENSE_AES_KEY: 'mock-aes-key',
};
