module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Reanimated 4 folosește pluginul din react-native-worklets (trebuie ultimul)
    plugins: ["react-native-worklets/plugin"],
  };
};
