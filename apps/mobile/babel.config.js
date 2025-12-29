module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': '.',
            '@safemeals/shared': '../../packages/shared/src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
