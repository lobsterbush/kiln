import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.usekiln.app',
  appName: 'Kiln',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    scheme: 'Kiln',
    allowsLinkPreview: false,
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile',
  },
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  server: {
    // In production the app loads from the bundled dist/ files.
    // Uncomment the line below during development to live-reload from Vite:
    // url: 'http://localhost:5173',
  },
};

export default config;
