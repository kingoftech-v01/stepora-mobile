module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@react-native|' +
      'react-native|' +
      '@react-navigation|' +
      'react-native-vector-icons|' +
      'react-native-safe-area-context|' +
      'react-native-screens|' +
      'react-native-gesture-handler|' +
      'react-native-reanimated|' +
      '@react-native-async-storage/async-storage|' +
      'react-native-toast-message|' +
      'react-native-localize|' +
      '@react-native-firebase|' +
      '@notifee/react-native|' +
      'react-native-biometrics|' +
      'react-native-agora|' +
      'react-native-splash-screen|' +
      'react-native-calendars|' +
      '@react-native-community/blur|' +
      'react-native-linear-gradient|' +
      'react-native-svg|' +
      '@tanstack/react-query' +
    ')/)',
  ],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!**/node_modules/**',
  ],
};
