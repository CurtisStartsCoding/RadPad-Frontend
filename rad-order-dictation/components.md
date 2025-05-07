# Dictation Components Implementation Guide

This guide explains how to implement the dictation components in your project. The dictation functionality consists of several React components that work together to provide a complete dictation workflow.

## Component Structure

The dictation functionality is built with the following components:

1. **PhysicianInterface** - The main component that orchestrates the dictation workflow
2. **DictationForm** - For entering dictation text with voice input support
3. **ValidationView** - For validating the dictation and displaying results
4. **SignatureForm** - For signing the order with a digital signature
5. **PatientIdentificationDictation** - For identifying patients through dictation
6. **PatientInfoCard** - For displaying patient information
7. **OverrideDialog** - For overriding validation issues with justification

## Implementation Steps

### 1. Copy the Components

Copy the following components from the original project to your project:

```
client/src/components/physician/PhysicianInterface.tsx
client/src/components/physician/DictationForm.tsx
client/src/components/physician/ValidationView.tsx
client/src/components/physician/SignatureForm.tsx
client/src/components/physician/PatientIdentificationDictation.tsx
client/src/components/physician/PatientInfoCard.tsx
client/src/components/physician/OverrideDialog.tsx
```

### 2. Update Import Paths

Update the import paths in each component to match your project structure. For example:

```typescript
// Original import
import { Button } from "@/components/ui/button";

// Updated import for your project
import { Button } from "your-ui-library";
```

### 3. Implement UI Components

The dictation components use several UI components from the original project. You'll need to implement or replace these components in your project:

- Button
- Card, CardContent, CardHeader, CardTitle
- Textarea
- Input
- Label
- Badge
- Separator
- Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle

### 4. Configure API Integration

Update the API integration in the components to work with your backend:

1. Configure the API URL in `config.ts`
2. Update the API request functions in `queryClient.ts`
3. Update the authentication functions in `auth.ts` and `useAuth.tsx`

### 5. Add the Components to Your App

Add the PhysicianInterface component to your app:

```tsx
import { PhysicianInterface } from './components/physician/PhysicianInterface';

const DictationPage = () => {
  return <PhysicianInterface />;
};
```

## Component Props

### PhysicianInterface

```typescript
interface PhysicianInterfaceProps {
  patientId?: number | null; // Optional patient ID
}
```

### DictationForm

```typescript
interface DictationFormProps {
  dictationText: string;
  setDictationText: (text: string) => void;
  patient: Patient;
  onProcessed: (result: ProcessedDictation) => void;
  validationFeedback?: string;
  onClearFeedback?: () => void;
  attemptCount?: number;
  onOverride?: () => void;
}
```

### ValidationView

```typescript
interface ValidationViewProps {
  dictationText: string;
  validationResult: ProcessedDictation;
  onBack: () => void;
  onSign: () => void;
}
```

### SignatureForm

```typescript
interface SignatureFormProps {
  patient: Patient;
  dictationText: string;
  validationResult: ProcessedDictation;
  onBack: () => void;
  onSubmitted: (orderId: number) => void;
}
```

### PatientIdentificationDictation

```typescript
interface PatientIdentificationDictationProps {
  onIdentify: (patientInfo: { name: string; dob: string }) => void;
  onCancel: () => void;
  open: boolean;
}
```

### PatientInfoCard

```typescript
interface PatientInfoCardProps {
  patient: Patient;
  onEditPatient?: () => void;
}
```

### OverrideDialog

```typescript
interface OverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
}
```

## API Integration

The dictation functionality requires the following API endpoints:

1. `/api/auth/login` - For user authentication
2. `/api/auth/logout` - For user logout
3. `/api/auth/session` - For checking the current session
4. `/api/orders/validate` - For validating the dictation
5. `/api/orders/{orderId}` - For updating the order

Make sure your backend provides these endpoints or update the components to use your existing endpoints.