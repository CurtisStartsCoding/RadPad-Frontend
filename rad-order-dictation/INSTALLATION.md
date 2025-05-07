# Radiology Order Dictation Integration Package - Installation Guide

This guide explains how to install and set up the Radiology Order Dictation Integration Package in your project.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- React (v16.8 or higher)
- TypeScript (v4.0 or higher)

## Installation Steps

### 1. Extract the Package

Extract the `rad-order-dictation.zip` file to a directory in your project. For example:

```bash
mkdir -p src/rad-order-dictation
unzip rad-order-dictation.zip -d src/rad-order-dictation
```

### 2. Install Dependencies

Navigate to your project root and install the required dependencies:

```bash
npm install @tanstack/react-query lucide-react wouter
```

Or if you're using yarn:

```bash
yarn add @tanstack/react-query lucide-react wouter
```

### 3. Configure the Package

1. Update the API URL in `src/rad-order-dictation/config.ts` to point to your backend server.

2. If you're using Vite, copy the `vite.config.ts` file to your project root or merge it with your existing configuration.

3. If you're using a different bundler (webpack, rollup, etc.), you'll need to configure it to handle the package's files.

### 4. Set Up Authentication

The package includes authentication utilities that you can use with your backend:

1. Update the authentication endpoints in `src/rad-order-dictation/auth.ts` to match your backend API.

2. Wrap your application with the `AuthProvider` component:

```tsx
import { AuthProvider } from './rad-order-dictation';

const App = () => {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
};
```

### 5. Import and Use the Components

Import the components you need from the package:

```tsx
import { PhysicianInterface } from './rad-order-dictation';

const DictationPage = () => {
  return <PhysicianInterface />;
};
```

### 6. Customize the UI

The package includes UI components that you can customize to match your application's design:

1. Update the UI components in `src/rad-order-dictation/components/ui/` to match your design system.

2. If you're using a different UI library (Material-UI, Chakra UI, etc.), you'll need to update the imports in the components.

### 7. Configure API Integration

The package includes API integration utilities that you can use with your backend:

1. Update the API endpoints in `src/rad-order-dictation/queryClient.ts` to match your backend API.

2. If you're using a different API client (axios, fetch, etc.), you'll need to update the API request functions.

## Troubleshooting

### Import Errors

If you encounter import errors, make sure the paths in the components match your project structure. You may need to update the import paths in the components.

### API Errors

If you encounter API errors, make sure the API endpoints in the package match your backend API. You may need to update the API request functions in `src/rad-order-dictation/queryClient.ts`.

### Authentication Errors

If you encounter authentication errors, make sure the authentication endpoints in the package match your backend API. You may need to update the authentication functions in `src/rad-order-dictation/auth.ts`.

## Support

If you need help with the package, please contact the package maintainer or refer to the documentation in the `README.md` file.