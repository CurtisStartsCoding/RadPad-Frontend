import { apiRequest } from "./queryClient";
import { Organization } from "./types";

// Types for SuperAdmin API

// Organization status types
export type OrganizationStatus = 'active' | 'on_hold' | 'purgatory' | 'terminated';

// User types
export interface SuperAdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  last_login?: string;
  created_at: string;
  npi?: string;
  specialty?: string;
  phone_number?: string;
  organization_id?: number;
  organization_name?: string;
  organization_type?: string;
}

// User details with locations
export interface UserDetails extends SuperAdminUser {
  locations: {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    phone_number?: string;
    is_active: boolean;
  }[];
}

// User status update request
export interface UserStatusUpdateRequest {
  isActive: boolean;
}

// User status update response
export interface UserStatusUpdateResponse {
  success: boolean;
  message: string;
  data: SuperAdminUser;
}

// Organization type
export interface SuperAdminOrganization {
  id: number;
  name: string;
  type: 'referring' | 'radiology_group' | 'health_system';
  npi: string;
  status: OrganizationStatus;
  creditBalance: number;
  subscriptionTier: string;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

// Organization details
export interface OrganizationDetails {
  organization: {
    id: number;
    name: string;
    type: string;
    npi: string;
    tax_id: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    zip_code: string;
    phone_number: string;
    fax_number?: string;
    contact_email: string;
    website?: string;
    logo_url?: string;
    billing_id?: string;
    credit_balance: number;
    subscription_tier: string;
    status: OrganizationStatus;
    assigned_account_manager_id?: number;
    created_at: string;
    updated_at: string;
  };
  users: {
    id: number;
    name: string;
    email: string;
    role: string;
    active: boolean;
  }[];
  connections: {
    id: number;
    name: string;
    type: string;
    status: string;
    connected_at: string;
  }[];
  billingHistory: {
    id: number;
    type: string;
    amount: number;
    credits: number;
    date: string;
    status: string;
    invoice_id?: string;
    reason?: string;
  }[];
}

// Credit adjustment request
export interface CreditAdjustmentRequest {
  amount: number;
  reason: string;
}

// Credit adjustment response
export interface CreditAdjustmentResponse {
  success: boolean;
  message: string;
  newBalance: number;
}

// Status update request
export interface StatusUpdateRequest {
  status: OrganizationStatus;
  reason?: string;
}

// Status update response
export interface StatusUpdateResponse {
  success: boolean;
  message: string;
  newStatus: OrganizationStatus;
}

/**
 * List all organizations with optional filtering
 * 
 * @param params Optional filter parameters
 * @returns Promise with list of organizations
 */
export async function listOrganizations(params?: {
  name?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  organizations: SuperAdminOrganization[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params?.name) {
      queryParams.append('name', params.name);
    }
    
    if (params?.type) {
      queryParams.append('type', params.type);
    }
    
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    const queryString = queryParams.toString();
    const url = `/api/superadmin/organizations${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest('GET', url);
    const data = await response.json();
    
    // Transform the API response to match our expected structure
    if (data.success && Array.isArray(data.data)) {
      // Calculate total pages based on count and limit
      const limit = params?.limit || 20;
      const totalPages = Math.ceil(data.count / limit);
      const page = params?.page || 1;
      
      return {
        organizations: data.data.map((org: any) => ({
          id: org.id,
          name: org.name,
          type: org.type,
          npi: org.npi || '',
          status: org.status,
          creditBalance: org.credit_balance,
          subscriptionTier: org.subscription_tier || 'none',
          userCount: 0, // This might need to be fetched separately
          createdAt: org.created_at,
          updatedAt: org.updated_at
        })),
        pagination: {
          total: data.count,
          page: page,
          limit: limit,
          totalPages: totalPages
        }
      };
    }
    
    // If the response doesn't match the expected structure, return empty data
    return {
      organizations: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      }
    };
  } catch (error) {
    console.error('Error listing organizations:', error);
    throw error;
  }
}

/**
 * Get organization details by ID
 * 
 * @param orgId Organization ID
 * @returns Promise with organization details
 */
export async function getOrganizationDetails(orgId: number): Promise<OrganizationDetails> {
  try {
    const response = await apiRequest('GET', `/api/superadmin/organizations/${orgId}`);
    const data = await response.json();
    
    // Check if the data has the expected structure
    if (data && data.data) {
      // Transform the API response to match our expected structure
      return {
        organization: {
          id: data.data.id || 0,
          name: data.data.name || '',
          type: data.data.type || '',
          npi: data.data.npi || '',
          tax_id: data.data.tax_id || '',
          address_line1: data.data.address_line1 || '',
          address_line2: data.data.address_line2,
          city: data.data.city || '',
          state: data.data.state || '',
          zip_code: data.data.zip_code || '',
          phone_number: data.data.phone_number || '',
          fax_number: data.data.fax_number,
          contact_email: data.data.contact_email || '',
          website: data.data.website,
          logo_url: data.data.logo_url,
          billing_id: data.data.billing_id,
          credit_balance: data.data.credit_balance || 0,
          subscription_tier: data.data.subscription_tier || 'none',
          status: data.data.status || 'active',
          assigned_account_manager_id: data.data.assigned_account_manager_id,
          created_at: data.data.created_at || new Date().toISOString(),
          updated_at: data.data.updated_at || new Date().toISOString(),
        },
        users: Array.isArray(data.users) ? data.users.map((user: any) => ({
          id: user.id || 0,
          name: user.name || '',
          email: user.email || '',
          role: user.role || '',
          active: user.active !== undefined ? user.active : true,
        })) : [],
        connections: Array.isArray(data.connections) ? data.connections.map((connection: any) => ({
          id: connection.id || 0,
          name: connection.name || '',
          type: connection.type || '',
          status: connection.status || '',
          connected_at: connection.connected_at || new Date().toISOString(),
        })) : [],
        billingHistory: Array.isArray(data.billingHistory) ? data.billingHistory.map((event: any) => ({
          id: event.id || 0,
          type: event.type || '',
          amount: event.amount || 0,
          credits: event.credits || 0,
          date: event.date || new Date().toISOString(),
          status: event.status || '',
          invoice_id: event.invoice_id,
          reason: event.reason,
        })) : [],
      };
    }
    
    // If the response doesn't match the expected structure, return a default object
    console.error('API response does not match expected structure:', data);
    return {
      organization: {
        id: orgId,
        name: 'Unknown Organization',
        type: '',
        npi: '',
        tax_id: '',
        address_line1: '',
        city: '',
        state: '',
        zip_code: '',
        phone_number: '',
        contact_email: '',
        credit_balance: 0,
        subscription_tier: 'none',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      users: [],
      connections: [],
      billingHistory: [],
    };
  } catch (error) {
    console.error(`Error getting organization details for ID ${orgId}:`, error);
    throw error;
  }
}

/**
 * Update organization status
 * 
 * @param orgId Organization ID
 * @param statusUpdate Status update request
 * @returns Promise with status update response
 */
export async function updateOrganizationStatus(
  orgId: number,
  statusUpdate: StatusUpdateRequest
): Promise<StatusUpdateResponse> {
  try {
    const response = await apiRequest(
      'PUT',
      `/api/superadmin/organizations/${orgId}/status`,
      statusUpdate
    );
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error(`Error updating organization status for ID ${orgId}:`, error);
    throw error;
  }
}

/**
 * Adjust organization credits
 * 
 * @param orgId Organization ID
 * @param adjustment Credit adjustment request
 * @returns Promise with credit adjustment response
 */
export async function adjustOrganizationCredits(
  orgId: number,
  adjustment: CreditAdjustmentRequest
): Promise<CreditAdjustmentResponse> {
  try {
    const response = await apiRequest(
      'POST',
      `/api/superadmin/organizations/${orgId}/credits/adjust`,
      adjustment
    );
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error(`Error adjusting credits for organization ID ${orgId}:`, error);
    throw error;
  }
}

/**
 * List all users with optional filtering
 *
 * @param params Optional filter parameters
 * @returns Promise with list of users
 */
export async function listUsers(params?: {
  orgId?: number;
  email?: string;
  role?: string;
  status?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  users: SuperAdminUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params?.orgId) {
      queryParams.append('orgId', params.orgId.toString());
    }
    
    if (params?.email) {
      queryParams.append('email', params.email);
    }
    
    if (params?.role) {
      queryParams.append('role', params.role);
    }
    
    if (params?.status !== undefined) {
      queryParams.append('status', params.status.toString());
    }
    
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    const queryString = queryParams.toString();
    const url = `/api/superadmin/users${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest('GET', url);
    const data = await response.json();
    
    // Transform the API response to match our expected structure
    if (data.success && Array.isArray(data.data)) {
      // Calculate pagination info
      const limit = params?.limit || 20;
      const totalPages = Math.ceil(data.count / limit);
      const page = params?.page || 1;
      
      return {
        users: data.data.map((user: any) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_active: user.is_active,
          email_verified: user.email_verified || false,
          last_login: user.last_login,
          created_at: user.created_at,
          npi: user.npi,
          specialty: user.specialty,
          phone_number: user.phone_number,
          organization_id: user.organization_id,
          organization_name: user.organization_name,
          organization_type: user.organization_type
        })),
        pagination: {
          total: data.count,
          page: page,
          limit: limit,
          totalPages: totalPages
        }
      };
    }
    
    // If the response doesn't match the expected structure, return empty data
    return {
      users: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      }
    };
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
}

/**
 * Get user details by ID
 *
 * @param userId User ID
 * @returns Promise with user details
 */
export async function getUserDetails(userId: number): Promise<UserDetails> {
  try {
    const response = await apiRequest('GET', `/api/superadmin/users/${userId}`);
    const data = await response.json();
    
    // Check if the data has the expected structure
    if (data && data.success && data.data) {
      const user = data.data;
      
      // Transform the API response to match our expected structure
      return {
        id: user.id || 0,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role || '',
        is_active: user.is_active !== undefined ? user.is_active : true,
        email_verified: user.email_verified || false,
        last_login: user.last_login,
        created_at: user.created_at || new Date().toISOString(),
        npi: user.npi,
        specialty: user.specialty,
        phone_number: user.phone_number,
        organization_id: user.organization_id,
        organization_name: user.organization_name,
        organization_type: user.organization_type,
        locations: Array.isArray(user.locations) ? user.locations.map((location: any) => ({
          id: location.id || 0,
          name: location.name || '',
          address: location.address || '',
          city: location.city || '',
          state: location.state || '',
          zip_code: location.zip_code || '',
          phone_number: location.phone_number,
          is_active: location.is_active !== undefined ? location.is_active : true,
        })) : [],
      };
    }
    
    // If the response doesn't match the expected structure, throw an error
    throw new Error('Invalid API response structure');
  } catch (error) {
    console.error(`Error getting user details for ID ${userId}:`, error);
    throw error;
  }
}

/**
 * Update user status
 *
 * @param userId User ID
 * @param statusUpdate Status update request
 * @returns Promise with status update response
 */
export async function updateUserStatus(
  userId: number,
  statusUpdate: UserStatusUpdateRequest
): Promise<UserStatusUpdateResponse> {
  try {
    const response = await apiRequest(
      'PUT',
      `/api/superadmin/users/${userId}/status`,
      statusUpdate
    );
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error(`Error updating user status for ID ${userId}:`, error);
    throw error;
  }
}

// System Logs Types and Functions

// Validation log types
export interface ValidationLog {
  id: number;
  order_id: number;
  validation_attempt_id: number;
  user_id: number;
  organization_id: number;
  llm_provider: string;
  model_name: string;
  prompt_template_id: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  status: string;
  error_message?: string;
  created_at: string;
  user_name: string;
  organization_name: string;
}

// Credit usage log types
export interface CreditUsageLog {
  id: number;
  organization_id: number;
  user_id?: number;
  order_id?: number;
  validation_attempt_id?: number;
  tokens_burned: number;
  action_type: string;
  created_at: string;
  user_name?: string;
  organization_name: string;
}

// Purgatory event types
export interface PurgatoryEvent {
  id: number;
  organization_id: number;
  reason: string;
  triggered_by: string;
  triggered_by_id?: number;
  status: string;
  created_at: string;
  resolved_at?: string;
  organization_name: string;
  triggered_by_name: string;
}

// Pagination type
export interface LogsPagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Get validation logs with basic filtering
 *
 * @param params Optional filter parameters
 * @returns Promise with validation logs and pagination
 */
export async function getValidationLogs(params?: {
  organization_id?: number;
  user_id?: number;
  date_range_start?: string;
  date_range_end?: string;
  status?: string;
  llm_provider?: string;
  model_name?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: ValidationLog[];
  pagination: LogsPagination;
}> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params?.organization_id) {
      queryParams.append('organization_id', params.organization_id.toString());
    }
    
    if (params?.user_id) {
      queryParams.append('user_id', params.user_id.toString());
    }
    
    if (params?.date_range_start) {
      queryParams.append('date_range_start', params.date_range_start);
    }
    
    if (params?.date_range_end) {
      queryParams.append('date_range_end', params.date_range_end);
    }
    
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    
    if (params?.llm_provider) {
      queryParams.append('llm_provider', params.llm_provider);
    }
    
    if (params?.model_name) {
      queryParams.append('model_name', params.model_name);
    }
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }
    
    const queryString = queryParams.toString();
    const url = `/api/superadmin/logs/validation${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest('GET', url);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      return {
        logs: data.data,
        pagination: data.pagination
      };
    }
    
    return {
      logs: [],
      pagination: {
        total: 0,
        limit: 50,
        offset: 0,
        has_more: false
      }
    };
  } catch (error) {
    console.error('Error getting validation logs:', error);
    throw error;
  }
}

/**
 * Get enhanced validation logs with advanced filtering
 *
 * @param params Optional filter parameters
 * @returns Promise with validation logs and pagination
 */
export async function getEnhancedValidationLogs(params?: {
  organization_id?: number;
  user_id?: number;
  date_range_start?: string;
  date_range_end?: string;
  status?: string;
  statuses?: string;
  llm_provider?: string;
  llm_providers?: string;
  model_name?: string;
  model_names?: string;
  search_text?: string;
  date_preset?: string;
  sort_by?: string;
  sort_direction?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: ValidationLog[];
  pagination: LogsPagination;
}> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params?.organization_id) {
      queryParams.append('organization_id', params.organization_id.toString());
    }
    
    if (params?.user_id) {
      queryParams.append('user_id', params.user_id.toString());
    }
    
    if (params?.date_range_start) {
      queryParams.append('date_range_start', params.date_range_start);
    }
    
    if (params?.date_range_end) {
      queryParams.append('date_range_end', params.date_range_end);
    }
    
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    
    if (params?.statuses) {
      queryParams.append('statuses', params.statuses);
    }
    
    if (params?.llm_provider) {
      queryParams.append('llm_provider', params.llm_provider);
    }
    
    if (params?.llm_providers) {
      queryParams.append('llm_providers', params.llm_providers);
    }
    
    if (params?.model_name) {
      queryParams.append('model_name', params.model_name);
    }
    
    if (params?.model_names) {
      queryParams.append('model_names', params.model_names);
    }
    
    if (params?.search_text) {
      queryParams.append('search_text', params.search_text);
    }
    
    if (params?.date_preset) {
      queryParams.append('date_preset', params.date_preset);
    }
    
    if (params?.sort_by) {
      queryParams.append('sort_by', params.sort_by);
    }
    
    if (params?.sort_direction) {
      queryParams.append('sort_direction', params.sort_direction);
    }
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }
    
    const queryString = queryParams.toString();
    const url = `/api/superadmin/logs/validation/enhanced${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest('GET', url);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      return {
        logs: data.data,
        pagination: data.pagination
      };
    }
    
    return {
      logs: [],
      pagination: {
        total: 0,
        limit: 50,
        offset: 0,
        has_more: false
      }
    };
  } catch (error) {
    console.error('Error getting enhanced validation logs:', error);
    throw error;
  }
}

/**
 * Get credit usage logs
 *
 * @param params Optional filter parameters
 * @returns Promise with credit usage logs and pagination
 */
export async function getCreditUsageLogs(params?: {
  organization_id?: number;
  user_id?: number;
  date_range_start?: string;
  date_range_end?: string;
  action_type?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: CreditUsageLog[];
  pagination: LogsPagination;
}> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params?.organization_id) {
      queryParams.append('organization_id', params.organization_id.toString());
    }
    
    if (params?.user_id) {
      queryParams.append('user_id', params.user_id.toString());
    }
    
    if (params?.date_range_start) {
      queryParams.append('date_range_start', params.date_range_start);
    }
    
    if (params?.date_range_end) {
      queryParams.append('date_range_end', params.date_range_end);
    }
    
    if (params?.action_type) {
      queryParams.append('action_type', params.action_type);
    }
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }
    
    const queryString = queryParams.toString();
    const url = `/api/superadmin/logs/credits${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest('GET', url);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      return {
        logs: data.data,
        pagination: data.pagination
      };
    }
    
    return {
      logs: [],
      pagination: {
        total: 0,
        limit: 50,
        offset: 0,
        has_more: false
      }
    };
  } catch (error) {
    console.error('Error getting credit usage logs:', error);
    throw error;
  }
}

/**
 * Get purgatory events
 *
 * @param params Optional filter parameters
 * @returns Promise with purgatory events and pagination
 */
export async function getPurgatoryEvents(params?: {
  organization_id?: number;
  date_range_start?: string;
  date_range_end?: string;
  status?: string;
  reason?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  events: PurgatoryEvent[];
  pagination: LogsPagination;
}> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params?.organization_id) {
      queryParams.append('organization_id', params.organization_id.toString());
    }
    
    if (params?.date_range_start) {
      queryParams.append('date_range_start', params.date_range_start);
    }
    
    if (params?.date_range_end) {
      queryParams.append('date_range_end', params.date_range_end);
    }
    
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    
    if (params?.reason) {
      queryParams.append('reason', params.reason);
    }
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }
    
    const queryString = queryParams.toString();
    const url = `/api/superadmin/logs/purgatory${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest('GET', url);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      return {
        events: data.data,
        pagination: data.pagination
      };
    }
    
    return {
      events: [],
      pagination: {
        total: 0,
        limit: 50,
        offset: 0,
        has_more: false
      }
    };
  } catch (error) {
    console.error('Error getting purgatory events:', error);
    throw error;
  }
}