# Radiology Order Dictation Integration Package

This package provides the necessary components to implement the radiology order dictation functionality in another project. It includes the components, hooks, and utilities needed for the dictation workflow.

## Features

- Voice-enabled dictation input with Web Speech API
- Clinical validation of dictation text
- Patient identification through dictation
- Order validation with CPT and ICD-10 code suggestions
- Digital signature for order submission

## Components

The package includes the following components:

1. **DictationForm** - For entering dictation text with voice input support
2. **ValidationView** - For validating the dictation and displaying results
3. **SignatureForm** - For signing the order with a digital signature
4. **PatientIdentificationDictation** - For identifying patients through dictation
5. **PatientInfoCard** - For displaying patient information
6. **OverrideDialog** - For overriding validation issues with justification
7. **PhysicianInterface** - The main component that orchestrates the dictation workflow

## Installation

1. Copy this package into your project
2. Install the required dependencies
3. Import the components and hooks as needed

## Usage

See the sample files for examples of how to use the components:

- `app.sample.tsx` - Example of how to set up the app with the dictation functionality
- `login.sample.tsx` - Example of how to implement the login page
- `vite.config.sample.ts` - Example of how to configure Vite for the project

## API Integration

The package includes utilities for integrating with the API:

- `auth.ts` - Authentication utilities
- `queryClient.ts` - API request utilities
- `types.ts` - TypeScript types for the API
- `config.ts` - Configuration utilities
- `useAuth.tsx` - Authentication hook

## Getting Started

1. Copy the package into your project
2. Install the required dependencies (see `package.sample.json`)
3. Configure your API endpoints in `config.ts`
4. Set up the authentication in your app using `useAuth.tsx`
5. Import the `PhysicianInterface` component to use the dictation functionality