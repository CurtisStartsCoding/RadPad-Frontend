import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Eye, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import FileUpload from './FileUpload';

interface DocumentCategory {
  id: string;
  name: string;
  count: number;
}

interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  category: string;
  uploadDate: string;
  thumbnail?: string;
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

  // Mock categories for the demo
  const categories: DocumentCategory[] = [
    { id: 'all', name: 'All Documents', count: 12 },
    { id: 'insurance', name: 'Insurance', count: 4 },
    { id: 'referrals', name: 'Referrals', count: 2 },
    { id: 'reports', name: 'Radiology Reports', count: 3 },
    { id: 'clinical', name: 'Clinical Notes', count: 3 }
  ];

  // Mock documents for the demo
  const documents: Document[] = [
    {
      id: 1,
      name: 'Insurance Card Front.jpg',
      type: 'image/jpeg',
      size: '1.2 MB',
      category: 'insurance',
      uploadDate: 'May 1, 2025'
    },
    {
      id: 2,
      name: 'Insurance Card Back.jpg',
      type: 'image/jpeg',
      size: '0.9 MB',
      category: 'insurance',
      uploadDate: 'May 1, 2025'
    },
    {
      id: 3,
      name: 'Prior Authorization.pdf',
      type: 'application/pdf',
      size: '2.4 MB',
      category: 'insurance',
      uploadDate: 'Apr 28, 2025'
    },
    {
      id: 4,
      name: 'Physician Referral.pdf',
      type: 'application/pdf',
      size: '1.8 MB',
      category: 'referrals',
      uploadDate: 'Apr 25, 2025'
    },
    {
      id: 5,
      name: 'Previous MRI Report.pdf',
      type: 'application/pdf',
      size: '3.2 MB',
      category: 'reports',
      uploadDate: 'Mar 15, 2025'
    }
  ];

  // Filter documents based on active tab and search query
  const filteredDocuments = documents.filter(doc => 
    (activeTab === 'all' || doc.category === activeTab) &&
    (searchQuery === '' || doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // File type icon mapping
  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    return '📎';
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
                                  <span className="mr-2">{getFileTypeIcon(doc.type)}</span>
                                  {doc.name}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {doc.type.replace('application/', '').replace('image/', '')}
                              </td>
                              <td className="px-4 py-3">{doc.size}</td>
                              <td className="px-4 py-3">{doc.uploadDate}</td>
                              <td className="px-4 py-3">
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-red-500">
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
          <Button variant="outline" className="flex gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button>Download All</Button>
        </CardFooter>
      </Card>

      {/* Upload Section */}
      <FileUpload />
    </div>
  );
}