module.exports = {
  expo: {
    name: 'frontend-app',
    slug: 'frontend-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'oseh',
    platforms: ['ios', 'android'],
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.oseh.frontendapp',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#000000',
      },
    },
    extra: {
      rootBackendUrl: process.env.ROOT_BACKEND_URL,
      rootWebsocketUrl: process.env.ROOT_WEBSOCKET_URL,
      rootFrontendUrl: process.env.ROOT_FRONTEND_URL,
      environment: process.env.ENVIRONMENT,
      eas: {
        projectId: 'ca696af6-0efc-46f2-857c-a0eb920dc1df',
      },
    },
    plugins: ['./plugins/fix-rn-32931.js'],
  },
};
