// Export types
export * from './types';

// Export configuration utilities
export * from './config';

// Export API utilities
export * from './queryClient';

// Export authentication utilities
// Use named exports to avoid conflicts with types
export {
  loginUser,
  logoutUser,
  getCurrentSession
} from './auth';
export { useAuth, AuthProvider, AuthContext } from './useAuth';

// Export sample components
// Note: In a real implementation, you would export the actual components
// Example:
// export { default as PhysicianInterface } from './components/physician/PhysicianInterface';
// export { default as DictationForm } from './components/physician/DictationForm';
// export { default as ValidationView } from './components/physician/ValidationView';
// export { default as SignatureForm } from './components/physician/SignatureForm';
// export { default as PatientIdentificationDictation } from './components/physician/PatientIdentificationDictation';
// export { default as PatientInfoCard } from './components/physician/PatientInfoCard';
// export { default as OverrideDialog } from './components/physician/OverrideDialog';

// Export sample app
export { default as SampleApp } from './app.sample';
export { default as SampleLoginPage } from './login.sample';
// Export components
export { default as PhysicianInterface } from './components/physician/PhysicianInterface';
export { default as DictationForm } from './components/physician/DictationForm';
export { default as ValidationView } from './components/physician/ValidationView';
export { default as SignatureForm } from './components/physician/SignatureForm';
export { default as PatientIdentificationDictation } from './components/physician/PatientIdentificationDictation';
export { default as PatientInfoCard } from './components/physician/PatientInfoCard';
export { default as OverrideDialog } from './components/physician/OverrideDialog';

// Export common components
export { default as OrderProgressIndicator } from './components/common/OrderProgressIndicator';

// Export hooks
export { default as useToast } from './hooks/use-toast';

// Export utils
export * from './lib/utils';
