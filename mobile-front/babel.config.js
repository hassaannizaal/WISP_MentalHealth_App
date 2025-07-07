module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for react-native-reanimated plugin. NOTE: MUST BE LAST!
      'react-native-reanimated/plugin',
    ],
  };
}; 