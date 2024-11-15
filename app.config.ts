module.exports = {
  expo: {
    name: 'Oseh',
    slug: 'frontend-app',
    version: '1.9.7',
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
      bundleIdentifier: 'io.oseh.FrontendApp',
      isTabletOnly: false,
      requireFullScreen: false,
      associatedDomains: ['applinks:oseh.io', 'webcredentials:oseh.io'],
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        UIBackgroundModes: ['audio'],
      },
    },
    android: {
      package: 'com.oseh.frontendapp',
      googleServicesFile: './google-services.json',
      versionCode: 97 /* 1.9.7 */,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'oseh.io',
              pathPrefix: '/a/',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
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
    plugins: [
      './plugins/fix-rn-32931.js',
      [
        'expo-notifications',
        {
          icon: './assets/android-notification-icon.png',
          color: '#000000',
        },
      ],
      'expo-localization',
      [
        'expo-tracking-transparency',
        {
          userTrackingPermission:
            'It will help us to provide you with a more personalized experience, relevant content, and promotions.',
        },
      ],
      [
        'expo-av',
        {
          microphonePermission:
            'Allow Oseh to access your microphone to record a voice note',
        },
      ],
    ],
  },
};
