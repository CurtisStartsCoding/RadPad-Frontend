import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Bug } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface OrderDebugInfoProps {
  currentUser: any;
  orderId: string | null;
  orderData: any;
  connectionsData: any;
  connectionsLoading: boolean;
  connectionsError: any;
  userFromCache: any;
  userFromStorage: string | null;
  sessionData: any;
  enableDebugLogging?: boolean;
}

export default function OrderDebugInfo({
  currentUser,
  orderId,
  orderData,
  connectionsData,
  connectionsLoading,
  connectionsError,
  userFromCache,
  userFromStorage,
  sessionData,
  enableDebugLogging = true
}: OrderDebugInfoProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Debug logging
  useEffect(() => {
    if (!enableDebugLogging || !isDevelopment) return;

    console.log('\n========== ADMIN ORDER FINALIZATION DEBUG ==========');
    console.log('📍 CURRENT USER:', {
      id: currentUser?.id,
      name: `${currentUser?.firstName || currentUser?.first_name} ${currentUser?.lastName || currentUser?.last_name}`,
      role: currentUser?.role,
      organizationId: currentUser?.organizationId || currentUser?.organization_id,
      organizationName: currentUser?.organizationName || 'Not available'
    });
    
    if (connectionsData?.connections) {
      console.log('\n🔗 CONNECTIONS SUMMARY:');
      console.log(`Total connections: ${connectionsData.connections.length}`);
      console.log(`Active connections: ${connectionsData.connections.filter((c: any) => c.status === 'active').length}`);
      console.log(`Pending connections: ${connectionsData.connections.filter((c: any) => c.status === 'pending').length}`);
      
      console.log('\n🔗 CONNECTION DETAILS:');
      connectionsData.connections.forEach((conn: any, index: number) => {
        console.log(`\nConnection ${index + 1}:`);
        console.log(`  - Partner: ${conn.partnerOrgName} (ID: ${conn.partnerOrgId})`);
        console.log(`  - Status: ${conn.status}`);
        console.log(`  - Direction: ${conn.isInitiator ? 'Outgoing' : 'Incoming'}`);
        console.log(`  - Created: ${formatDate(conn.createdAt)}`);
      });
    } else if (connectionsLoading) {
      console.log('\n⏳ CONNECTIONS: Loading...');
    } else if (connectionsError) {
      console.log('\n❌ CONNECTIONS ERROR:', connectionsError);
    } else {
      console.log('\n❓ CONNECTIONS: No data yet');
    }
    
    console.log('\n🎯 CURRENT ORDER:', {
      orderId: orderId,
      orderNumber: orderData?.order_number,
      status: orderData?.status
    });
    
    console.log('========== END DEBUG ==========\n');
  }, [currentUser, connectionsData, connectionsLoading, connectionsError, orderId, orderData, enableDebugLogging, isDevelopment]);

  // Log user data sources
  useEffect(() => {
    if (!enableDebugLogging || !isDevelopment) return;

    console.log('🔵 USER DATA SOURCES:');
    console.log('  - From cache:', userFromCache);
    console.log('  - From localStorage:', userFromStorage);
    console.log('  - From session:', sessionData);
    console.log('  - Final currentUser:', currentUser);
    
    console.log('🔵 CURRENT USER DEBUG:', {
      userId: currentUser?.id,
      userName: `${currentUser?.firstName || currentUser?.first_name} ${currentUser?.lastName || currentUser?.last_name}`,
      role: currentUser?.role,
      organizationId: currentUser?.organizationId || currentUser?.organization_id,
      email: currentUser?.email
    });
  }, [userFromCache, userFromStorage, sessionData, currentUser, enableDebugLogging, isDevelopment]);

  // Log order data
  useEffect(() => {
    if (!enableDebugLogging || !isDevelopment || !orderData) return;

    console.log('🔴 FULL ORDER DATA:', orderData);
    console.log('🔴 ALL FIELDS:', Object.keys(orderData).sort());
    
    // Look for any field containing 'physician', 'doctor', 'user', 'created'
    const physicianFields = Object.keys(orderData).filter(key => 
      key.toLowerCase().includes('physician') || 
      key.toLowerCase().includes('doctor') || 
      key.toLowerCase().includes('user') || 
      key.toLowerCase().includes('created') ||
      key.toLowerCase().includes('referring')
    );
    console.log('🔴 PHYSICIAN-RELATED FIELDS:', physicianFields);
    physicianFields.forEach(field => {
      console.log(`  ${field}:`, orderData[field]);
    });
    
    // Look for study/procedure fields
    const studyFields = Object.keys(orderData).filter(key => 
      key.toLowerCase().includes('study') || 
      key.toLowerCase().includes('modality') || 
      key.toLowerCase().includes('procedure') ||
      key.toLowerCase().includes('cpt')
    );
    console.log('🔴 STUDY-RELATED FIELDS:', studyFields);
    studyFields.forEach(field => {
      console.log(`  ${field}:`, orderData[field]);
    });
  }, [orderData, enableDebugLogging, isDevelopment]);

  // Don't render in production unless explicitly enabled
  if (!isDevelopment && !enableDebugLogging) {
    return null;
  }

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm font-medium text-amber-800">Debug Information</CardTitle>
            <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
              Development Only
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2 text-amber-700 hover:text-amber-800"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 space-y-3 text-xs">
          <div className="space-y-2">
            <h4 className="font-medium text-amber-800">Current User</h4>
            <div className="bg-white/60 rounded p-2 space-y-1">
              <div>ID: {currentUser?.id || 'Not available'}</div>
              <div>Name: {currentUser?.firstName || currentUser?.first_name} {currentUser?.lastName || currentUser?.last_name}</div>
              <div>Role: {currentUser?.role || 'Not available'}</div>
              <div>Org ID: {currentUser?.organizationId || currentUser?.organization_id || 'Not available'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-amber-800">Order Info</h4>
            <div className="bg-white/60 rounded p-2 space-y-1">
              <div>Order ID: {orderId || 'Not available'}</div>
              <div>Order Number: {orderData?.order_number || 'Not available'}</div>
              <div>Status: {orderData?.status || 'Not available'}</div>
              <div>Modality: {orderData?.modality || 'Not available'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-amber-800">Connections</h4>
            <div className="bg-white/60 rounded p-2 space-y-1">
              {connectionsLoading ? (
                <div>Loading connections...</div>
              ) : connectionsError ? (
                <div className="text-red-600">Error loading connections</div>
              ) : connectionsData?.connections ? (
                <>
                  <div>Total: {connectionsData.connections.length}</div>
                  <div>Active: {connectionsData.connections.filter((c: any) => c.status === 'active').length}</div>
                  <div>Pending: {connectionsData.connections.filter((c: any) => c.status === 'pending').length}</div>
                </>
              ) : (
                <div>No connections data</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-amber-800">Data Sources</h4>
            <div className="bg-white/60 rounded p-2 space-y-1">
              <div>Cache: {userFromCache ? '✓' : '✗'}</div>
              <div>LocalStorage: {userFromStorage ? '✓' : '✗'}</div>
              <div>Session: {sessionData ? '✓' : '✗'}</div>
              <div>LocalStorage Keys: {Object.keys(localStorage).filter(k => k.includes('rad_order_pad')).length}</div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}