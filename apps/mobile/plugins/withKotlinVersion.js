const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withKotlinVersion(config, version) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const root = config.modRequest.platformProjectRoot;

      // 1. Force android.kotlinVersion in gradle.properties
      const propsPath = path.join(root, 'gradle.properties');
      let props = fs.readFileSync(propsPath, 'utf-8');
      if (props.includes('android.kotlinVersion=')) {
        props = props.replace(/android\.kotlinVersion=.*/, `android.kotlinVersion=${version}`);
      } else {
        props += `\nandroid.kotlinVersion=${version}\n`;
      }
      fs.writeFileSync(propsPath, props);

      // 2. Force fallback in build.gradle too
      const gradlePath = path.join(root, 'build.gradle');
      let gradle = fs.readFileSync(gradlePath, 'utf-8');
      gradle = gradle.replace(
        /kotlinVersion\s*=\s*findProperty\('android\.kotlinVersion'\)\s*\?:\s*'[\d.]+'/,
        `kotlinVersion = findProperty('android.kotlinVersion') ?: '${version}'`
      );
      fs.writeFileSync(gradlePath, gradle);

      console.log(`[withKotlinVersion] Set Kotlin to ${version}`);
      return config;
    },
  ]);
};
