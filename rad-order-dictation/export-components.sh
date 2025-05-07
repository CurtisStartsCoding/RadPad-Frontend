#!/bin/bash

# Script to export the dictation components from the original project to the integration package

# Create the components directory structure
mkdir -p api-integration-package/components/physician
mkdir -p api-integration-package/components/common
mkdir -p api-integration-package/components/ui

# Copy the physician components
echo "Copying physician components..."
cp client/src/components/physician/PhysicianInterface.tsx api-integration-package/components/physician/
cp client/src/components/physician/DictationForm.tsx api-integration-package/components/physician/
cp client/src/components/physician/ValidationView.tsx api-integration-package/components/physician/
cp client/src/components/physician/SignatureForm.tsx api-integration-package/components/physician/
cp client/src/components/physician/PatientIdentificationDictation.tsx api-integration-package/components/physician/
cp client/src/components/physician/PatientInfoCard.tsx api-integration-package/components/physician/
cp client/src/components/physician/OverrideDialog.tsx api-integration-package/components/physician/

# Copy the common components
echo "Copying common components..."
cp client/src/components/common/OrderProgressIndicator.tsx api-integration-package/components/common/
cp client/src/components/common/PatientInfoCard.tsx api-integration-package/components/common/

# Copy the UI components
echo "Copying UI components..."
cp client/src/components/ui/button.tsx api-integration-package/components/ui/
cp client/src/components/ui/card.tsx api-integration-package/components/ui/
cp client/src/components/ui/textarea.tsx api-integration-package/components/ui/
cp client/src/components/ui/input.tsx api-integration-package/components/ui/
cp client/src/components/ui/label.tsx api-integration-package/components/ui/
cp client/src/components/ui/badge.tsx api-integration-package/components/ui/
cp client/src/components/ui/separator.tsx api-integration-package/components/ui/
cp client/src/components/ui/dialog.tsx api-integration-package/components/ui/

# Copy the hooks
echo "Copying hooks..."
mkdir -p api-integration-package/hooks
cp client/src/hooks/use-toast.ts api-integration-package/hooks/

# Copy the lib files
echo "Copying lib files..."
mkdir -p api-integration-package/lib
cp client/src/lib/utils.ts api-integration-package/lib/

# Update the index.ts file to export the components
echo "Updating index.ts file..."
cat >> api-integration-package/index.ts << EOF

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
EOF

echo "Export complete!"
echo "You may need to update import paths in the exported components to match your project structure."