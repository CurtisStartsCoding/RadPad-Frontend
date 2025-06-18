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
import { FileUploadService } from '@/lib/fileUploadService';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  title?: string;
  description?: string;
  className?: string;
  orderId: number;
  patientId: number;
  onUploadComplete?: () => void;
}

interface UploadFile {
  id: string;
  file: File;
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
  className,
  orderId,
  patientId,
  onUploadComplete
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const { toast } = useToast();
  
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
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };
  
  // Handle files from drop or input
  const handleFiles = async (fileList: FileList) => {
    const files = Array.from(fileList);
    
    for (const file of files) {
      // Validate file type
      if (!FileUploadService.isValidFileType(file)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive"
        });
        continue;
      }
      
      // Validate file size
      if (!FileUploadService.isValidFileSize(file)) {
        const maxSize = file.type === 'application/pdf' ? '20MB' : '5MB';
        toast({
          title: "File too large",
          description: `${file.name} exceeds the ${maxSize} limit`,
          variant: "destructive"
        });
        continue;
      }
      
      // Add to upload list
      const uploadFile: UploadFile = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: FileUploadService.getFileSizeString(file.size),
        type: file.type,
        status: 'uploading',
        progress: 0
      };
      
      setUploadFiles(prev => [...prev, uploadFile]);
      
      // Start upload
      uploadFileToS3(uploadFile);
    }
  };
  
  // Upload file to S3
  const uploadFileToS3 = async (uploadFile: UploadFile) => {
    try {
      const document = await FileUploadService.uploadFile(
        uploadFile.file,
        orderId,
        patientId,
        'general',
        (progress) => {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, progress } : f
          ));
        }
      );
      
      // Save to localStorage
      FileUploadService.saveDocumentToLocalStorage(orderId, document);
      
      // Mark as success
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'success' } : f
      ));
      
      // Notify parent
      if (onUploadComplete) {
        onUploadComplete();
      }
      
      // Remove after 3 seconds
      setTimeout(() => {
        setUploadFiles(prev => prev.filter(f => f.id !== uploadFile.id));
      }, 3000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Upload failed' 
        } : f
      ));
    }
  };
  
  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };
  
  // Trigger file input click
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Remove a file from the list
  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
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
        {uploadFiles.length > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''}
          </Badge>
        )}
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
            JPG, PNG, GIF, PDF, DOC, DOCX (PDF: 20MB max, Others: 5MB max)
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
        accept="image/jpeg,image/png,image/gif,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
      />
      
      {/* File list */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {uploadFiles.map((file) => (
              <div 
                key={file.id} 
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
                    
                    {file.status !== 'success' && (
                      <button 
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
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