import { useState, useRef } from 'react';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface FileUploadProps {
  title?: string;
  description?: string;
  className?: string;
}

interface MockFile {
  name: string;
  size: string;
  type: string;
  status: 'uploading' | 'success' | 'error' | 'ready';
  progress?: number;
  message?: string;
}

export default function FileUpload({
  title = "Upload Documents",
  description = "Drag and drop files or paste from clipboard",
  className
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [mockFiles, setMockFiles] = useState<MockFile[]>([
    { 
      name: 'patient-insurance-card.jpg', 
      size: '1.2 MB', 
      type: 'image/jpeg', 
      status: 'success'
    },
    { 
      name: 'referral-form.pdf', 
      size: '825 KB', 
      type: 'application/pdf', 
      status: 'uploading', 
      progress: 60 
    }
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle drag events - just for UI feedback in this mockup
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // In mockup, just add a fake file when something is dropped
    setMockFiles(prev => [
      ...prev, 
      { 
        name: 'dropped-file-' + Math.floor(Math.random() * 1000) + '.pdf', 
        size: Math.floor(Math.random() * 5) + '.' + Math.floor(Math.random() * 9) + ' MB', 
        type: 'application/pdf', 
        status: 'uploading',
        progress: 0
      }
    ]);
    
    // Simulate progress and completion for mockup purposes
    simulateUpload();
  };
  
  // Simulate file upload progress
  const simulateUpload = () => {
    const index = mockFiles.length;
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        setMockFiles(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = { ...updated[index], progress, status: 'uploading' };
          }
          return updated;
        });
      } else {
        clearInterval(interval);
        setMockFiles(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = { ...updated[index], status: 'success' };
          }
          return updated;
        });
      }
    }, 300);
  };
  
  // Handle file input change
  const handleFileInputChange = () => {
    // In mockup, just add a fake file when the button is clicked
    setMockFiles(prev => [
      ...prev, 
      { 
        name: 'selected-file-' + Math.floor(Math.random() * 1000) + '.jpg', 
        size: Math.floor(Math.random() * 2) + '.' + Math.floor(Math.random() * 9) + ' MB', 
        type: 'image/jpeg', 
        status: 'uploading',
        progress: 0
      }
    ]);
    
    // Simulate progress and completion for mockup purposes
    simulateUpload();
  };
  
  // Trigger file input click
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Remove a file from the list
  const removeFile = (index: number) => {
    setMockFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // File type icon mapping
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <File className="h-5 w-5 text-blue-500" />;
    } else if (type === 'application/pdf') {
      return <File className="h-5 w-5 text-red-500" />;
    } else {
      return <Paperclip className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {mockFiles.length} file{mockFiles.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="w-10 h-10 text-gray-400" />
          
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">
              Click to upload
            </span>{' '}
            or drag and drop
          </div>
          
          <p className="text-xs text-gray-500">
            JPG, PNG, or PDF up to 10MB
          </p>
          
          <p className="text-xs text-gray-500 mt-1">
            You can also paste files with Ctrl+V or ⌘+V
          </p>
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
        accept="image/jpeg,image/png,application/pdf"
      />
      
      {/* File list */}
      {mockFiles.length > 0 && (
        <div className="space-y-2">
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {mockFiles.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center p-3 border rounded-md bg-white"
              >
                <div className="mr-3">
                  {getFileIcon(file.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="truncate pr-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.size}
                      </p>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={file.progress} className="h-1" />
                      <p className="text-xs text-gray-500 mt-1">
                        Uploading... {file.progress}%
                      </p>
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <div className="mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                      <p className="text-xs text-red-500">
                        {file.message || 'Upload failed. Please try again.'}
                      </p>
                    </div>
                  )}
                  
                  {file.status === 'success' && (
                    <div className="mt-1 flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <p className="text-xs text-green-500">
                        Upload complete
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}