import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Eye, Trash2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import FileUpload from './FileUpload';
import { FileUploadService } from '@/lib/fileUploadService';
import { useToast } from '@/hooks/use-toast';

interface DocumentCategory {
  id: string;
  name: string;
  count: number;
}

interface Document {
  id: number;
  fileName: string;
  fileKey: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  documentType?: string;
}

interface DocumentManagerProps {
  orderId?: number;
  patientId?: number;
  className?: string;
}

export default function DocumentManager({ 
  orderId, 
  patientId,
  className 
}: DocumentManagerProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  const { toast } = useToast();

  // Load documents on mount and when orderId changes
  useEffect(() => {
    if (orderId) {
      loadDocuments();
    }
  }, [orderId]);

  const loadDocuments = () => {
    if (orderId) {
      const docs = FileUploadService.getDocumentsFromLocalStorage(orderId);
      setDocuments(docs);
    }
  };

  // Categories based on actual documents
  const categories: DocumentCategory[] = [
    { id: 'all', name: 'All Documents', count: documents.length },
    { id: 'insurance', name: 'Insurance', count: documents.filter(d => d.documentType === 'insurance').length },
    { id: 'referrals', name: 'Referrals', count: documents.filter(d => d.documentType === 'referral').length },
    { id: 'reports', name: 'Reports', count: documents.filter(d => d.documentType === 'report').length },
    { id: 'general', name: 'Other', count: documents.filter(d => !d.documentType || d.documentType === 'general').length }
  ];

  // Filter documents based on active tab and search query
  const filteredDocuments = documents.filter(doc => {
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'insurance' && doc.documentType === 'insurance') ||
      (activeTab === 'referrals' && doc.documentType === 'referral') ||
      (activeTab === 'reports' && doc.documentType === 'report') ||
      (activeTab === 'general' && (!doc.documentType || doc.documentType === 'general'));
    
    const matchesSearch = searchQuery === '' || 
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  // File type icon mapping
  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    return '📎';
  };

  // Handle download
  const handleDownload = async (document: Document) => {
    try {
      setIsDownloading(document.id);
      const downloadUrl = await FileUploadService.getDownloadUrl(document.id);
      window.open(downloadUrl, '_blank');
      toast({
        title: "Download started",
        description: `Downloading ${document.fileName}`
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(null);
    }
  };

  // Remove document from view (localStorage only)
  const handleRemove = (documentId: number) => {
    if (orderId) {
      FileUploadService.removeDocumentFromLocalStorage(orderId, documentId);
      loadDocuments();
      toast({
        title: "Document removed",
        description: "Document removed from view"
      });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>
            Upload, view, and manage documents related to this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                {categories.map(category => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {categories.map(category => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                {/* Document list */}
                <div className="rounded-md border">
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3">Name</th>
                          <th scope="col" className="px-4 py-3">Type</th>
                          <th scope="col" className="px-4 py-3">Size</th>
                          <th scope="col" className="px-4 py-3">Upload Date</th>
                          <th scope="col" className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.length > 0 ? (
                          filteredDocuments.map(doc => (
                            <tr key={doc.id} className="bg-white border-b">
                              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="mr-2">{getFileTypeIcon(doc.contentType)}</span>
                                  {doc.fileName}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {doc.contentType.replace('application/', '').replace('image/', '')}
                              </td>
                              <td className="px-4 py-3">{FileUploadService.getFileSizeString(doc.fileSize)}</td>
                              <td className="px-4 py-3">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDownload(doc)}
                                    disabled={isDownloading === doc.id}
                                  >
                                    {isDownloading === doc.id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500"
                                    onClick={() => handleRemove(doc.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="bg-white border-b">
                            <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                              No documents found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadDocuments}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardFooter>
      </Card>

      {/* Upload Section */}
      <FileUpload 
        orderId={orderId || 0} 
        patientId={patientId || 0}
        onUploadComplete={loadDocuments}
      />
    </div>
  );
}