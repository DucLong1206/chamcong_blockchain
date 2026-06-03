module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            'crypto': 'crypto-browserify',
            'stream': 'stream-browserify',
            'events': 'events',
            'node:crypto': 'crypto-browserify',
            'node:stream': 'stream-browserify',
            'node:events': 'events',
          },
        },
      ],
    ],
  };
};
