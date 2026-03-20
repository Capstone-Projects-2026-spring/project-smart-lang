module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest",
  },
  collectCoverageFrom: [
    "src/js/**/*.js",
    "src/vue-components/**/*.js",
    "!src/js/**/*.test.js",
    "!src/vue-components/**/*.test.js",
    "!src/js/externals/**",
  ],
};
