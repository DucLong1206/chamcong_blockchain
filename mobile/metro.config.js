const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  events: require.resolve('events'),
  'node:crypto': require.resolve('crypto-browserify'),
  'node:stream': require.resolve('stream-browserify'),
  'node:events': require.resolve('events'),
};

module.exports = config;
