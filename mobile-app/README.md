# Mobile-App

## Overview

`Mobile-App` is a React Native (Expo) application serving as the **Photographer Portal** for project. It provides a secure authentication flow using JWT tokens, QR code scanning, student information display, and attendance marking.

## ⚠️ Important: Configuration Required

**Before running the app, you must configure your API endpoints.** See [CONFIG.md](./CONFIG.md) for detailed setup instructions.

### Quick Setup

1. Create a `.env` file in the root directory
2. Add your API URLs:
   ```bash
   EXPO_PUBLIC_API_URL=http://localhost:3000/api
   EXPO_PUBLIC_PHOTOGRAPHER_API_URL=http://localhost:3000/api/photographer
   ```
3. For development on physical devices, use your computer's IP address instead of `localhost`

## Features

- **Photographer Authentication**

  - Email & Password login via `/photographer/login`
  - JWT-based access and refresh tokens
  - Secure token storage (AsyncStorage / localStorage)
  - Automatic token refresh on expiry
  - Logout functionality

- **QR Code Scanning**

  - Scan student-event QR codes
  - Navigate to student details and attendance screens

- **Student Info & Attendance**

  - Display student name, class, event details
  - Mark attendance for scanned students
  - Navigate between screens seamlessly

## Folder Structure

Reference [folder.md](folder.md) for complete directory layout.

```
Mobile-App/
├── .expo/
├── api/                   # (Legacy backend folder)
├── assets/
├── node_modules/
├── src/
│   ├── api/
│   ├── config/           # Environment configuration
│   ├── contexts/
│   ├── navigation/
│   ├── screens/
│   └── utils/
├── App.js
├── app.json
├── index.js
├── package.json
├── package-lock.json
├── CONFIG.md             # Configuration guide
├── folder.md
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** >= 14.x
- **Expo CLI** (install globally with `npm install -g expo-cli`)
- A running backend API with `/photographer/*` endpoints

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/org/Mobile-App.git
   cd Mobile-App
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. **Configure environment** (REQUIRED):

   - See [CONFIG.md](./CONFIG.md) for detailed instructions
   - Create `.env` file or update `src/config/environment.js`

### Running the App

- **Development** (using Expo Go):

  ```bash
  expo start
  ```

  Scan the QR code with the Expo Go app on your device.

- **Android Emulator / iOS Simulator**:

  ```bash
  expo run:android
  expo run:ios
  ```

## Configuration

The app now includes a robust configuration system:

- **Environment-based config**: Automatically adapts to development/production
- **Fallback URLs**: Provides sensible defaults if environment variables aren't set
- **Configuration testing**: Utilities to verify your setup

### Testing Your Configuration

```javascript
import { testApiConnection, logConfiguration } from "./src/utils/configTest";

// Log current configuration
logConfiguration();

// Test API connectivity
testApiConnection();
```

## Authentication Flow

1. **Login**: `POST /photographer/login` → receives `accessToken` & `refreshToken`
2. **Secure Storage**: Tokens stored via `src/utils/storage.js`
3. **Protected Requests**: Axios attaches `Authorization: Bearer <accessToken>`
4. **Auto-Refresh**: On 401, axios interceptor calls `POST /photographer/refresh`
5. **Logout**: `POST /photographer/logout` clears tokens and returns to login

## Dependencies

- **React Native** & **Expo**
- **@react-navigation/native** & **@react-navigation/native-stack**
- **axios**
- **@react-native-async-storage/async-storage**
- **expo-camera**
- **react-native-toast-message**

## Troubleshooting

### Common Issues

1. **"Network Error" or "Connection Refused"**

   - Check if your backend server is running
   - Verify the IP address and port in your configuration
   - Ensure firewall allows connections

2. **"Cannot read property 'EXPO_PUBLIC_IPCONFIG' of undefined"**

   - This issue has been fixed in the latest version
   - Make sure you're using the updated configuration system

3. **Authentication Issues**
   - Check console logs for detailed error messages
   - Verify your API endpoints are correct
   - Ensure your backend is properly configured

### Getting Help

- Check the console logs for detailed error messages
- Use the configuration testing utilities
- Refer to [CONFIG.md](./CONFIG.md) for setup guidance
