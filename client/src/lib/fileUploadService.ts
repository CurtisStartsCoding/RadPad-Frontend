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

  // LocalStorage helpers
  static saveDocumentToLocalStorage(orderId: number, document: UploadedDocument): void {
    const key = `order_${orderId}_documents`;
    const existingDocs = this.getDocumentsFromLocalStorage(orderId);
    const updatedDocs = [...existingDocs, document];
    localStorage.setItem(key, JSON.stringify(updatedDocs));
  }

  static getDocumentsFromLocalStorage(orderId: number): UploadedDocument[] {
    const key = `order_${orderId}_documents`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  static removeDocumentFromLocalStorage(orderId: number, documentId: number): void {
    const key = `order_${orderId}_documents`;
    const existingDocs = this.getDocumentsFromLocalStorage(orderId);
    const updatedDocs = existingDocs.filter(doc => doc.id !== documentId);
    localStorage.setItem(key, JSON.stringify(updatedDocs));
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
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}