import { apiRequest } from './queryClient';

interface PresignedUrlResponse {
  success: boolean;
  uploadUrl: string;
  fileKey: string;
}

interface ConfirmUploadResponse {
  success: boolean;
  documentId: number;
  message: string;
}

export interface UploadedDocument {
  id: number;
  fileName: string;
  fileKey: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  documentType?: string;
  timestamp?: number; // Added for cleanup
}

export class FileUploadService {
  // Step 1: Get presigned URL from backend
  static async getPresignedUrl(
    file: File,
    orderId: number,
    patientId?: number,
    documentType?: string
  ): Promise<PresignedUrlResponse> {
    const response = await apiRequest('POST', '/api/uploads/presigned-url', {
      fileType: file.type,
      fileName: file.name,
      contentType: file.type,
      orderId,
      patientId,
      documentType: documentType || 'general',
      fileSize: file.size
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get presigned URL');
    }

    return response.json();
  }

  // Step 2: Upload file to S3 - EXACTLY as documented
  static async uploadToS3(
    file: File,
    uploadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (onProgress) onProgress(10);

    // Log the URL to help debug
    console.log('Uploading to presigned URL:', uploadUrl);
    console.log('Content-Type being sent:', file.type);
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type  // ONLY include Content-Type - must match what was sent to presigned-url endpoint
      },
      body: file
    });

    if (onProgress) onProgress(90);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('S3 upload failed:', errorText);
      
      // Try to parse XML error response
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(errorText, 'text/xml');
        const code = xmlDoc.querySelector('Code')?.textContent;
        const message = xmlDoc.querySelector('Message')?.textContent;
        console.error('S3 Error Code:', code);
        console.error('S3 Error Message:', message);
      } catch (e) {
        // Ignore XML parsing errors
      }
      
      throw new Error('S3 upload failed');
    }

    if (onProgress) onProgress(100);
  }

  // Step 3: Confirm upload with backend
  static async confirmUpload(
    fileKey: string,
    orderId: number,
    patientId: number,
    documentType: string,
    fileName: string,
    fileSize: number,
    contentType: string
  ): Promise<ConfirmUploadResponse> {
    const response = await apiRequest('POST', '/api/uploads/confirm', {
      fileKey,
      orderId,
      patientId,
      documentType,
      fileName,
      fileSize,
      contentType,
      processingStatus: 'uploaded'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to confirm upload');
    }

    return response.json();
  }

  // Get download URL for a document
  static async getDownloadUrl(documentId: number): Promise<string> {
    const response = await apiRequest('GET', `/api/uploads/${documentId}/download-url`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get download URL');
    }

    const data = await response.json();
    return data.downloadUrl;
  }

  // Complete upload process
  static async uploadFile(
    file: File,
    orderId: number,
    patientId: number,
    documentType?: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadedDocument> {
    // Step 1: Get presigned URL
    const { uploadUrl, fileKey } = await this.getPresignedUrl(
      file,
      orderId,
      patientId,
      documentType
    );

    // Step 2: Upload to S3
    await this.uploadToS3(file, uploadUrl, onProgress);

    // Step 3: Confirm upload
    const { documentId } = await this.confirmUpload(
      fileKey,
      orderId,
      patientId,
      documentType || 'general',
      file.name,
      file.size,
      file.type
    );

    // Return document metadata
    return {
      id: documentId,
      fileName: file.name,
      fileKey,
      fileSize: file.size,
      contentType: file.type,
      uploadedAt: new Date().toISOString(),
      documentType
    };
  }

  // LocalStorage helpers with user isolation
  static getUserId(): string | null {
    const userDataStr = localStorage.getItem('rad_order_pad_user_data');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        const userId = userData.id?.toString() || null;
        console.log('FileUploadService getUserId:', userId, 'from userData:', userData);
        return userId;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    console.warn('FileUploadService: No user data found in localStorage');
    return null;
  }

  static saveDocumentToLocalStorage(orderId: number, document: UploadedDocument): void {
    const userId = this.getUserId();
    if (!userId) {
      console.error('No user ID found, cannot save document');
      return;
    }
    
    const key = `user_${userId}_order_${orderId}_documents`;
    console.log('Saving document to localStorage with key:', key);
    const existingDocs = this.getDocumentsFromLocalStorage(orderId);
    // Add timestamp for cleanup
    const docWithTimestamp = { ...document, timestamp: Date.now() };
    const updatedDocs = [...existingDocs, docWithTimestamp];
    localStorage.setItem(key, JSON.stringify(updatedDocs));
    console.log('Saved documents:', updatedDocs);
  }

  static getDocumentsFromLocalStorage(orderId: number): UploadedDocument[] {
    const userId = this.getUserId();
    if (!userId) {
      console.warn('getDocumentsFromLocalStorage: No user ID found');
      return [];
    }
    
    const key = `user_${userId}_order_${orderId}_documents`;
    console.log('Getting documents from localStorage with key:', key);
    const stored = localStorage.getItem(key);
    if (!stored) {
      console.log('No documents found for key:', key);
      return [];
    }
    
    try {
      const docs = JSON.parse(stored);
      console.log('Found documents:', docs);
      // Filter out documents older than 24 hours
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const filteredDocs = docs.filter((doc: UploadedDocument) => 
        !doc.timestamp || doc.timestamp > oneDayAgo
      );
      console.log('Filtered documents (after 24hr check):', filteredDocs);
      return filteredDocs;
    } catch (e) {
      console.error('Error parsing documents:', e);
      return [];
    }
  }

  static removeDocumentFromLocalStorage(orderId: number, documentId: number): void {
    const userId = this.getUserId();
    if (!userId) return;
    
    const key = `user_${userId}_order_${orderId}_documents`;
    const existingDocs = this.getDocumentsFromLocalStorage(orderId);
    const updatedDocs = existingDocs.filter(doc => doc.id !== documentId);
    localStorage.setItem(key, JSON.stringify(updatedDocs));
  }

  // Cleanup functions
  static clearAllUserDocuments(): void {
    const userId = this.getUserId();
    if (!userId) return;
    
    // Find all keys for this user
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`user_${userId}_order_`) && key.endsWith('_documents')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all user's document keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} document storage keys for user ${userId}`);
  }

  static clearAllDocuments(): void {
    // Clear ALL document keys (for cleanup on login)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('_order_') && key.endsWith('_documents')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} total document storage keys`);
  }

  static cleanupOldDocuments(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('_order_') && key.endsWith('_documents')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const docs = JSON.parse(stored);
            const filteredDocs = docs.filter((doc: UploadedDocument) => 
              !doc.timestamp || doc.timestamp > oneDayAgo
            );
            
            if (filteredDocs.length < docs.length) {
              localStorage.setItem(key, JSON.stringify(filteredDocs));
              cleanedCount += docs.length - filteredDocs.length;
            }
            
            // If no documents remain, remove the key entirely
            if (filteredDocs.length === 0) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          console.error('Error cleaning up documents for key:', key, e);
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old documents`);
    }
  }

  // Validation helpers
  static isValidFileType(file: File): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return allowedTypes.includes(file.type);
  }

  static isValidFileSize(file: File): boolean {
    const maxSizePdf = 20 * 1024 * 1024; // 20MB
    const maxSizeOther = 5 * 1024 * 1024; // 5MB
    
    if (file.type === 'application/pdf') {
      return file.size <= maxSizePdf;
    }
    return file.size <= maxSizeOther;
  }

  static getFileSizeString(bytes: number): string {
    if (bytes === 0 || !bytes) return 'Size not available';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}