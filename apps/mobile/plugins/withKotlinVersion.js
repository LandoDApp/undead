const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withKotlinVersion(config, version) {
  return withGradleProperties(config, (config) => {
    const key = 'android.kotlinVersion';
    const existing = config.modResults.find((p) => p.key === key);
    if (existing) {
      existing.value = version;
    } else {
      config.modResults.push({
        type: 'property',
        key,
        value: version,
      });
    }
    return config;
  });
};
