module.exports = function override(config, env) {
  console.log("React app rewired works!");
  config.resolve.fallback = {
    fs: false,
    path: false,
    http: false,
    https: false,
    vm: false,
    os: false,
    crypto: false,
  };
  return config;
};
