/** @type {import('.')} */
let binding;
try {
  binding = require('./server-native.node');
} catch {
  try {
    binding =
      process.arch === 'arm64'
        ? require('./server-native.arm64.node')
        : process.arch === 'arm'
          ? require('./server-native.armv7.node')
          : require('./server-native.x64.node');
  } catch {
    console.warn('Native module not found, using mock implementation');
    console.warn('This is not secure for production!');
    binding = require('./server-native-mock.js');
  }
}

module.exports = binding;
