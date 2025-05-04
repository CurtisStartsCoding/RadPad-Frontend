

================================================================================
FILE: frontend-explanation\api-docs\architecture\dual-database.md
================================================================================

# Dual Database Architecture

## Overview

RadOrderPad employs a dual database architecture to ensure proper separation of Protected Health Information (PHI) from non-PHI data. This architecture is a critical component of the system's HIPAA compliance strategy and provides several security and operational benefits.

## Database Structure

The system uses two separate databases:

### 1. PHI Database (`radorder_phi`)

The PHI database contains all Protected Health Information, including:

- Patient demographic information
- Clinical indications and dictations
- Order details
- Validation attempts and results
- Document uploads containing PHI
- Insurance information
- Order history and status changes

### 2. Main Database (`radorder_main`)

The Main database contains all non-PHI data, including:

- Organizations and their profiles
- Users and their roles
- Organization relationships (connections)
- Credit balances and billing information
- System configuration
- LLM validation logs (without PHI)
- Prompt templates and assignments

## Database Connections

The API server maintains separate connection pools for each database:

```javascript
// Example connection setup
const phiPool = new Pool({
  connectionString: process.env.PHI_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const mainPool = new Pool({
  connectionString: process.env.MAIN_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper functions for database queries
const queryPhiDb = async (text, params) => {
  const client = await phiPool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};

const queryMainDb = async (text, params) => {
  const client = await mainPool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};
```

## Cross-Database Operations

Many operations in RadOrderPad require interaction with both databases. For example, when sending an order to radiology:

1. The order details are updated in the PHI database
2. The organization's credit balance is decremented in the Main database
3. Credit usage is logged in the Main database

These operations must be carefully managed to ensure data consistency across both databases.

### Transaction Management

For operations that affect both databases, the system uses a two-phase approach:

1. Begin a transaction in each database
2. Perform the necessary operations
3. If all operations succeed, commit both transactions
4. If any operation fails, roll back both transactions

```javascript
// Example of cross-database transaction
const sendToRadiology = async (orderId, userId, organizationId) => {
  // Get clients for both databases
  const phiClient = await phiPool.connect();
  const mainClient = await mainPool.connect();
  
  try {
    // Begin transactions
    await phiClient.query('BEGIN');
    await mainClient.query('BEGIN');
    
    // Update order in PHI database
    await phiClient.query(
      'UPDATE orders SET status = $1, sent_to_radiology_at = NOW(), sent_by_user_id = $2 WHERE id = $3',
      ['sent_to_radiology', userId, orderId]
    );
    
    // Log order history in PHI database
    await phiClient.query(
      'INSERT INTO order_history (order_id, action, performed_by_user_id) VALUES ($1, $2, $3)',
      [orderId, 'sent_to_radiology', userId]
    );
    
    // Check credit balance in Main database
    const creditResult = await mainClient.query(
      'SELECT credit_balance FROM organizations WHERE id = $1 FOR UPDATE',
      [organizationId]
    );
    
    const creditBalance = creditResult.rows[0].credit_balance;
    if (creditBalance < 1) {
      throw new Error('Insufficient credits');
    }
    
    // Decrement credit balance in Main database
    await mainClient.query(
      'UPDATE organizations SET credit_balance = credit_balance - 1 WHERE id = $1',
      [organizationId]
    );
    
    // Log credit usage in Main database
    await mainClient.query(
      'INSERT INTO credit_usage_logs (organization_id, user_id, action_type, credits_used) VALUES ($1, $2, $3, $4)',
      [organizationId, userId, 'send_to_radiology', 1]
    );
    
    // Commit transactions
    await phiClient.query('COMMIT');
    await mainClient.query('COMMIT');
    
    return { success: true };
  } catch (error) {
    // Roll back transactions on error
    await phiClient.query('ROLLBACK');
    await mainClient.query('ROLLBACK');
    throw error;
  } finally {
    // Release clients
    phiClient.release();
    mainClient.release();
  }
};
```

## Foreign Key Relationships

Since the databases are separate, traditional foreign key constraints cannot be used for cross-database relationships. Instead, the system maintains logical relationships through application code and ensures data integrity through careful transaction management.

For example, an order in the PHI database is associated with an organization in the Main database through the `organization_id` field, but this is not enforced at the database level.

## Data Access Patterns

The dual database architecture influences how data is accessed and processed:

1. **User Authentication**: Uses only the Main database to verify credentials and roles
2. **Order Creation**: Creates records in the PHI database and references the user and organization from the Main database
3. **Order Validation**: Reads from and writes to the PHI database for order data, while logging validation attempts in the Main database
4. **Admin Finalization**: Updates PHI data in the PHI database and consumes credits in the Main database
5. **Reporting**: Joins data from both databases at the application level when necessary

## Security Benefits

The dual database architecture provides several security benefits:

1. **Data Segregation**: PHI is physically separated from non-PHI data
2. **Access Control**: Different access controls can be applied to each database
3. **Breach Containment**: A breach of one database does not automatically compromise all data
4. **Audit Trail**: Actions affecting PHI can be logged separately from other system activities

## Implementation Considerations

When implementing features that interact with both databases, consider the following:

1. **Connection Management**: Ensure proper connection handling and resource cleanup
2. **Transaction Coordination**: Carefully manage transactions across both databases
3. **Error Handling**: Implement robust error handling and rollback procedures
4. **Performance**: Be aware of the performance implications of cross-database operations
5. **Testing**: Test cross-database operations thoroughly to ensure data consistency

## Conclusion

The dual database architecture is a fundamental aspect of RadOrderPad's design that enhances security, compliance, and data management. Understanding this architecture is essential for implementing features that interact with both PHI and non-PHI data.

================================================================================
FILE: frontend-explanation\api-docs\architecture\overview.md
================================================================================

# RadOrderPad System Architecture Overview

## Introduction

RadOrderPad is a comprehensive platform designed to streamline the radiology ordering process between referring physicians and radiology organizations. The system facilitates clinical dictation validation, order management, administrative finalization, and radiology workflow processing.

## System Components

The RadOrderPad system consists of several key components:

### 1. API Server

The core of the system is a Node.js API server that handles all requests and business logic. The API server:

- Processes authentication and authorization
- Manages user and organization data
- Handles order creation, validation, and processing
- Facilitates connections between organizations
- Manages file uploads and downloads
- Processes billing and credit management

### 2. Dual Database Architecture

RadOrderPad employs a dual database architecture to separate Protected Health Information (PHI) from non-PHI data:

- **PHI Database (`radorder_phi`)**: Contains all patient data, orders, clinical indications, and other PHI
- **Main Database (`radorder_main`)**: Contains non-PHI data such as organizations, users, credit balances, and system configuration

For more details on the dual database architecture, see [Dual Database Architecture](./dual-database.md).

### 3. Validation Engine

The validation engine is a critical component that processes clinical dictations and assigns appropriate CPT and ICD-10 codes. It features:

- **LLM Orchestration**: Uses multiple LLM providers (Claude 3.7, Grok 3, GPT-4.0) with fallback mechanisms
- **Prompt Management**: Specialized prompts for different validation scenarios
- **Clarification Loop**: Interactive process for handling unclear dictations
- **Override Flow**: Mechanism for handling cases where automatic validation fails

### 4. File Storage

The system uses AWS S3 for secure file storage:

- Presigned URL pattern for direct uploads and downloads
- Secure access control to ensure only authorized users can access files
- Database records to track uploaded files and their associations

### 5. Notification System

The notification system keeps users informed about important events:

- Email notifications for connection requests, approvals, and rejections
- System notifications for order status changes
- Administrative alerts for credit balance updates

## High-Level Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Web Frontend   │◄───►│   API Server    │◄───►│  LLM Services   │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │  AWS Services   │
                        │  (S3, SES)      │
                        │                 │
                        └─────────────────┘
                                 │
                                 ▼
          ┌───────────────────────────────────────┐
          │                                       │
┌─────────┴─────────┐               ┌─────────────┴─────────┐
│                   │               │                       │
│   PHI Database    │               │    Main Database      │
│  (Patient Data)   │               │ (Organizations, Users) │
│                   │               │                       │
└───────────────────┘               └───────────────────────┘
```

## Authentication and Authorization

The system implements a robust authentication and authorization mechanism:

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC) with multiple roles:
  - `admin_staff`: Administrative staff at referring organizations
  - `physician`: Physicians at referring organizations
  - `admin_referring`: Administrators at referring organizations
  - `super_admin`: System administrators
  - `admin_radiology`: Administrators at radiology organizations
  - `scheduler`: Schedulers at radiology organizations
  - `radiologist`: Radiologists at radiology organizations
  - `trial_physician`: Trial users with limited access

For more details on the security model, see [Security Model](./security-model.md).

## Key Workflows

The system supports several key workflows:

1. **Validation Workflow**: Physician submits dictation → Validation processing → Clarification (if needed) → Override (if needed) → Finalization
2. **Admin Finalization**: Admin accesses queue → Updates patient/insurance info → Adds supplemental documentation → Sends to radiology
3. **Radiology Processing**: Radiology staff receives order → Updates status → Requests additional info (if needed) → Completes order
4. **Connection Management**: Organization requests connection → Target organization approves/rejects → Active connection established
5. **User Management**: Admin invites users → Users accept invitations → Admin assigns locations → Admin manages user profiles

## System Scalability and Performance

The RadOrderPad system is designed for scalability and performance:

- Stateless API design allows for horizontal scaling
- Database connection pooling for efficient resource utilization
- Redis caching for frequently accessed data
- Asynchronous processing for long-running tasks
- AWS S3 for scalable file storage

## Monitoring and Logging

The system includes comprehensive monitoring and logging:

- LLM validation logs for tracking validation performance
- Credit usage logs for billing transparency
- Purgatory event logs for security monitoring
- System logs for troubleshooting and performance monitoring

## Conclusion

The RadOrderPad system architecture is designed to provide a secure, scalable, and efficient platform for radiology order management. The dual database architecture ensures PHI security, while the validation engine provides accurate CPT and ICD-10 code assignment. The modular design allows for easy maintenance and future enhancements.

================================================================================
FILE: frontend-explanation\api-docs\architecture\security-model.md
================================================================================

# Security Model

## Overview

RadOrderPad implements a comprehensive security model to protect sensitive data, ensure proper access control, and maintain compliance with healthcare regulations including HIPAA. This document outlines the key components of the security model.

## Authentication

### JWT-Based Authentication

RadOrderPad uses JSON Web Tokens (JWT) for authentication:

1. **Token Generation**: When a user logs in successfully, the system generates two tokens:
   - Access token: Short-lived token (1 hour) for API access
   - Refresh token: Longer-lived token (7 days) for obtaining new access tokens

2. **Token Structure**: Each JWT contains:
   - User ID
   - Organization ID
   - User role
   - Token expiration time
   - Token type (access or refresh)

3. **Token Verification**: All protected API endpoints verify the JWT:
   - Validates the token signature
   - Checks that the token has not expired
   - Extracts user information for authorization

```javascript
// Example JWT verification middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token type and expiration
    if (decoded.type !== 'access' || Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    // Attach user info to request
    req.user = {
      id: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};
```

### Refresh Token Mechanism

To maintain user sessions without requiring frequent logins:

1. When the access token expires, the client can request a new one using the refresh token
2. The system validates the refresh token and issues a new access token
3. For security, refresh tokens are stored in the database and can be revoked

### Trial User Authentication

Trial users have a separate authentication flow:

1. Trial users register with minimal information (email, password, name, specialty)
2. They receive a special JWT that identifies them as trial users
3. This token grants access only to trial-specific endpoints

## Authorization

### Role-Based Access Control (RBAC)

RadOrderPad implements RBAC with the following roles:

1. **admin_staff**: Administrative staff at referring organizations
   - Can access the admin order queue
   - Can update patient and insurance information
   - Can send orders to radiology

2. **physician**: Physicians at referring organizations
   - Can submit dictations for validation
   - Can sign and finalize orders
   - Can view their own orders

3. **admin_referring**: Administrators at referring organizations
   - Can manage organization profile and locations
   - Can manage users within their organization
   - Can manage connections with radiology organizations
   - Can view billing information and purchase credits

4. **super_admin**: System administrators
   - Can access all system functionality
   - Can manage all organizations and users
   - Can view system logs and metrics
   - Can manage prompt templates and assignments

5. **admin_radiology**: Administrators at radiology organizations
   - Can manage organization profile and locations
   - Can manage users within their organization
   - Can manage connections with referring organizations

6. **scheduler**: Schedulers at radiology organizations
   - Can view incoming orders
   - Can update order status
   - Can request additional information

7. **radiologist**: Radiologists at radiology organizations
   - Can view order details
   - Can provide results (future functionality)

8. **trial_physician**: Trial users with limited access
   - Can submit dictations for validation in trial mode
   - Cannot access PHI or create real orders

### Role Enforcement

Each API endpoint specifies which roles are authorized to access it:

```javascript
// Example role authorization middleware
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

// Example usage in routes
router.get('/admin/orders/queue', 
  authenticateJWT, 
  authorizeRole(['admin_staff', 'admin_referring']), 
  adminOrderController.getQueue
);
```

### Organization Boundaries

In addition to role-based access, the system enforces organization boundaries:

1. Users can only access data within their own organization
2. Connections between organizations create explicit permissions for specific data sharing
3. Database queries include organization ID filters to enforce these boundaries

```javascript
// Example of organization boundary enforcement
const getUsersInOrganization = async (req, res) => {
  try {
    const { organizationId } = req.user;
    
    const result = await queryMainDb(
      'SELECT id, first_name, last_name, email, role, is_active FROM users WHERE organization_id = $1',
      [organizationId]
    );
    
    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};
```

## Data Protection

### Encryption

RadOrderPad employs encryption at multiple levels:

1. **Data in Transit**: All API communications use HTTPS with TLS 1.2+
2. **Data at Rest**: Database encryption for sensitive fields
3. **Password Storage**: Passwords are hashed using bcrypt with appropriate salt rounds
4. **File Storage**: Files in S3 are encrypted using server-side encryption

### PHI Handling

The system implements strict controls for Protected Health Information (PHI):

1. **Dual Database Architecture**: PHI is stored in a separate database from non-PHI data
2. **Minimal PHI Access**: Only endpoints that require PHI have access to the PHI database
3. **PHI Logging**: All access to PHI is logged for audit purposes
4. **PHI Sanitization**: When logging validation attempts, PHI is sanitized before storage

## Audit and Monitoring

### Comprehensive Logging

The system maintains detailed logs for security monitoring and compliance:

1. **Validation Logs**: Track all validation attempts with sanitized inputs and outputs
2. **Credit Usage Logs**: Track all credit consumption for billing transparency
3. **Purgatory Events**: Track security-related events such as account suspensions
4. **System Logs**: Track general system activity for troubleshooting

### Superadmin Monitoring

Superadmins have access to specialized monitoring endpoints:

1. **Enhanced Validation Logs**: Detailed logs with advanced filtering
2. **Organization Management**: Monitor organization status and activity
3. **User Management**: Monitor user activity and status
4. **System Metrics**: Monitor system performance and usage

## Security Best Practices

When implementing new features or modifying existing ones, follow these security best practices:

1. **Input Validation**: Validate all user inputs to prevent injection attacks
2. **Parameterized Queries**: Use parameterized queries to prevent SQL injection
3. **Error Handling**: Implement proper error handling without exposing sensitive information
4. **Rate Limiting**: Implement rate limiting for sensitive endpoints
5. **Principle of Least Privilege**: Grant only the minimum necessary permissions
6. **Defense in Depth**: Implement multiple layers of security controls
7. **Regular Security Reviews**: Conduct regular security reviews of the codebase

## Conclusion

The RadOrderPad security model provides a robust framework for protecting sensitive data, enforcing proper access control, and maintaining regulatory compliance. By understanding and following this model, developers can ensure that new features and modifications maintain the system's security posture.

================================================================================
FILE: frontend-explanation\api-docs\index.md
================================================================================

# RadOrderPad API Documentation

Welcome to the RadOrderPad API documentation. This comprehensive guide provides detailed information about the API endpoints, workflows, and implementation details for the RadOrderPad application.

## Documentation Structure

This documentation is organized into three main sections:

1. **[Architecture Overview](#architecture-overview)** - High-level system architecture and design
2. **[OpenAPI Specification](#openapi-specification)** - Detailed API reference in OpenAPI/Swagger format
3. **[Tutorial Guides](#tutorial-guides)** - Workflow-oriented guides for common tasks

## Architecture Overview

The architecture section provides a high-level overview of the RadOrderPad system:

- [System Overview](./architecture/overview.md) - General architecture and components
- [Dual Database Architecture](./architecture/dual-database.md) - PHI and Main database design
- [Security Model](./architecture/security-model.md) - Authentication and authorization

## OpenAPI Specification

The OpenAPI specification provides a detailed reference for all API endpoints:

- [OpenAPI Definition](./openapi/openapi.yaml) - Complete OpenAPI specification

The specification is organized by functional areas:

### Authentication and User Management
- [Authentication Endpoints](./openapi/paths/auth.yaml)
- [User Management Endpoints](./openapi/paths/users.yaml)
- [User Invitation Endpoints](./openapi/paths/user-invites.yaml)
- [User Location Assignment Endpoints](./openapi/paths/user-locations.yaml)

### Organization Management
- [Organization Endpoints](./openapi/paths/organizations.yaml)
- [Location Management Endpoints](./openapi/paths/locations.yaml)

### Connection Management
- [Connection Endpoints](./openapi/paths/connections.yaml)

### Order Management
- [Order Endpoints](./openapi/paths/orders.yaml)
- [Validation Endpoints](./openapi/paths/orders-validation.yaml)
- [Admin Order Endpoints](./openapi/paths/admin-orders.yaml)
- [Radiology Workflow Endpoints](./openapi/paths/radiology.yaml)

### File Uploads
- [File Upload Endpoints](./openapi/paths/uploads.yaml)

### Billing Management
- [Billing Endpoints](./openapi/paths/billing.yaml)

### Superadmin Functionality
- [Superadmin Organization Endpoints](./openapi/paths/superadmin-organizations.yaml)
- [Superadmin User Endpoints](./openapi/paths/superadmin-users.yaml)
- [Superadmin Prompt Management Endpoints](./openapi/paths/superadmin-prompts.yaml)
- [Superadmin Logs Endpoints](./openapi/paths/superadmin-logs.yaml)

## Tutorial Guides

The tutorial guides provide step-by-step instructions for common workflows:

- [Getting Started](./tutorials/getting-started.md) - Initial setup and authentication

### Authentication
- [Standard Authentication](./tutorials/authentication/regular-auth.md)
- [Trial User Authentication](./tutorials/authentication/trial-auth.md)

### User Management
- [Managing User Profiles](./tutorials/user-management/user-profiles.md)
- [Inviting and Onboarding Users](./tutorials/user-management/user-invitation.md)
- [Assigning Users to Locations](./tutorials/user-management/location-assignment.md)

### Organization Management
- [Managing Organization Profiles](./tutorials/organization-management/organization-profile.md)
- [Managing Organization Locations](./tutorials/organization-management/location-management.md)

### Connection Management
- [Initiating Connections](./tutorials/connections/requesting-connections.md)
- [Approving and Rejecting Requests](./tutorials/connections/managing-requests.md)
- [Terminating Connections](./tutorials/connections/terminating-connections.md)

### Order Workflows
- [Validation Workflow](./tutorials/order-workflows/validation-workflow.md) - Detailed validation process
- [Physician Workflow](./tutorials/order-workflows/physician-workflow.md) - Order creation and signing
- [Admin Workflow](./tutorials/order-workflows/admin-workflow.md) - Admin finalization process
- [Radiology Workflow](./tutorials/order-workflows/radiology-workflow.md) - Radiology processing

### Trial Features
- [Physician Sandbox](./tutorials/trial-features/physician-sandbox.md) - Trial validation workflow

### File Uploads
- [Direct-to-S3 Uploads](./tutorials/file-uploads/direct-to-s3.md) - Using presigned URLs
- [Document Management](./tutorials/file-uploads/document-management.md) - Managing uploaded files

### Billing
- [Credit Management](./tutorials/billing/credit-management.md)
- [Subscription Management](./tutorials/billing/subscription-management.md)

### Superadmin
- [Organization Management](./tutorials/superadmin/organization-management.md)
- [User Management](./tutorials/superadmin/user-management.md)
- [Prompt Management](./tutorials/superadmin/prompt-management.md)
- [System Monitoring](./tutorials/superadmin/system-monitoring.md)

## Additional Resources

- [API Endpoints Overview](../../DOCS/api_endpoints.md) - Comprehensive list of all API endpoints
- [API Schema Map](../../DOCS/api_schema_map.md) - Mapping of API endpoints to database tables

================================================================================
FILE: frontend-explanation\api-docs\openapi\components\parameters.yaml
================================================================================

# Common Parameters

# Pagination parameters
PageParam:
  name: page
  in: query
  description: Page number (1-based)
  required: false
  schema:
    type: integer
    minimum: 1
    default: 1

LimitParam:
  name: limit
  in: query
  description: Number of items per page
  required: false
  schema:
    type: integer
    minimum: 1
    maximum: 100
    default: 20

SortByParam:
  name: sortBy
  in: query
  description: Field to sort by
  required: false
  schema:
    type: string

SortOrderParam:
  name: sortOrder
  in: query
  description: Sort direction
  required: false
  schema:
    type: string
    enum: [asc, desc]
    default: desc

# Common path parameters
OrderIdParam:
  name: orderId
  in: path
  description: ID of the order
  required: true
  schema:
    type: string

UserIdParam:
  name: userId
  in: path
  description: ID of the user
  required: true
  schema:
    type: string

OrganizationIdParam:
  name: organizationId
  in: path
  description: ID of the organization
  required: true
  schema:
    type: string

# Common header parameters
AuthorizationHeader:
  name: Authorization
  in: header
  description: JWT Bearer token
  required: true
  schema:
    type: string
    pattern: '^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$'
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

# Validation-specific parameters
ModalityTypeParam:
  name: modalityType
  in: query
  description: Type of imaging modality
  required: false
  schema:
    type: string
    enum: [CT, MRI, XRAY, ULTRASOUND, PET, NUCLEAR]

ValidationStatusParam:
  name: validationStatus
  in: query
  description: Validation status filter
  required: false
  schema:
    type: string
    enum: [appropriate, inappropriate, needs_clarification, override]

# Order-specific parameters
OrderStatusParam:
  name: status
  in: query
  description: Order status filter
  required: false
  schema:
    type: string
    enum: [draft, pending_validation, pending_admin, sent_to_radiology, scheduled, completed, cancelled]

DateRangeStartParam:
  name: dateRangeStart
  in: query
  description: Start date for filtering (inclusive)
  required: false
  schema:
    type: string
    format: date

DateRangeEndParam:
  name: dateRangeEnd
  in: query
  description: End date for filtering (inclusive)
  required: false
  schema:
    type: string
    format: date

# Search parameters
SearchQueryParam:
  name: q
  in: query
  description: Search query string
  required: false
  schema:
    type: string
    minLength: 2

# Trial-specific parameters
TrialValidationsRemainingParam:
  name: validationsRemaining
  in: query
  description: Number of validations remaining for trial user
  required: false
  schema:
    type: integer
    minimum: 0

================================================================================
FILE: frontend-explanation\api-docs\openapi\components\responses.yaml
================================================================================

# Common Responses

# 400 Bad Request
BadRequest:
  description: Bad Request - The request was invalid or cannot be served
  content:
    application/json:
      schema:
        type: object
        properties:
          success:
            type: boolean
            example: false
          message:
            type: string
            example: "Invalid request parameters"
          error:
            type: object
            properties:
              code:
                type: string
                example: "INVALID_PARAMETERS"
              details:
                type: object
                example:
                  dictation: "Dictation text is required"

# 401 Unauthorized
Unauthorized:
  description: Unauthorized - Authentication is required or has failed
  content:
    application/json:
      schema:
        type: object
        properties:
          success:
            type: boolean
            example: false
          message:
            type: string
            example: "Authentication required"
          error:
            type: object
            properties:
              code:
                type: string
                example: "AUTHENTICATION_REQUIRED"

# 403 Forbidden
Forbidden:
  description: Forbidden - The authenticated user does not have access to the requested resource
  content:
    application/json:
      schema:
        type: object
        properties:
          success:
            type: boolean
            example: false
          message:
            type: string
            example: "Insufficient permissions"
          error:
            type: object
            properties:
              code:
                type: string
                example: "INSUFFICIENT_PERMISSIONS"
              requiredRole:
                type: string
                example: "physician"

# 404 Not Found
NotFound:
  description: Not Found - The requested resource was not found
  content:
    application/json:
      schema:
        type: object
        properties:
          success:
            type: boolean
            example: false
          message:
            type: string
            example: "Resource not found"
          error:
            type: object
            properties:
              code:
                type: string
                example: "RESOURCE_NOT_FOUND"
              resourceType:
                type: string
                example: "order"

# 409 Conflict
Conflict:
  description: Conflict - The request could not be completed due to a conflict with the current state of the resource
  content:
    application/json:
      schema:
        type: object
        properties:
          success:
            type: boolean
            example: false
          message:
            type: string
            example: "Resource already exists"
          error:
            type: object
            properties:
              code:
                type: string
                example: "RESOURCE_CONFLICT"

# 422 Unprocessable Entity
UnprocessableEntity:
  description: Unprocessable Entity - The request was well-formed but was unable to be followed due to semantic errors
  content:
    application/json:
      schema:
        type: object
        properties:
          success:
            type: boolean
            example: false
          message:
            type: string
            example: "Validation failed"
          error:
            type: object
            properties:
              code:
                type: string
                example: "VALIDATION_FAILED"
              validationErrors:
                type: array
                items:
                  type: object
                  properties:
                    field:
                      type: string
                    message:
                      type: string

# 429 Too Many Requests
TooManyRequests:
  description: Too Many Requests - The user has sent too many requests in a given amount of time
  content:
    application/json:
      schema:
        type: object
        properties:
          success:
            type: boolean
            example: false
          message:
            type: string
            example: "Rate limit exceeded"
          error:
            type: object
            properties:
              code:
                type: string
                example: "RATE_LIMIT_EXCEEDED"
              retryAfter:
                type: integer
                example: 60

# 500 Internal Server Error
InternalServerError:
  description: Internal Server Error - An unexpected condition was encountered
  content:
    application/json:
      schema:
        type: object
        properties:
          success:
            type: boolean
            example: false
          message:
            type: string
            example: "An unexpected error occurred"
          error:
            type: object
            properties:
              code:
                type: string
                example: "INTERNAL_SERVER_ERROR"
              requestId:
                type: string
                example: "req-123456"

# 503 Service Unavailable
ServiceUnavailable:
  description: Service Unavailable - The server is currently unable to handle the request
  content:
    application/json:
      schema:
        type: object
        properties:
          success:
            type: boolean
            example: false
          message:
            type: string
            example: "Service temporarily unavailable"
          error:
            type: object
            properties:
              code:
                type: string
                example: "SERVICE_UNAVAILABLE"
              retryAfter:
                type: integer
                example: 300

================================================================================
FILE: frontend-explanation\api-docs\openapi\components\schemas.yaml
================================================================================

# Common Schemas

# Patient Information
PatientInfo:
  type: object
  required:
    - firstName
    - lastName
    - dateOfBirth
    - gender
  properties:
    id:
      type: string
      description: Patient ID
    firstName:
      type: string
      description: Patient's first name
    lastName:
      type: string
      description: Patient's last name
    dateOfBirth:
      type: string
      format: date
      description: Patient's date of birth (YYYY-MM-DD)
    gender:
      type: string
      enum: [male, female, other]
      description: Patient's gender
    mrn:
      type: string
      description: Medical Record Number
    pidn:
      type: string
      description: Patient Identifier Number (e.g., P12345, P-98765, P00123)
    age:
      type: integer
      description: Patient's age (can be derived from DOB)

# Validation Result
ValidationResult:
  type: object
  properties:
    cptCode:
      type: string
      description: The assigned CPT code
    cptDescription:
      type: string
      description: Description of the CPT code
    icd10Codes:
      type: array
      items:
        type: string
      description: The assigned ICD-10 codes
    icd10Descriptions:
      type: array
      items:
        type: string
      description: Descriptions of the ICD-10 codes
    confidence:
      type: number
      format: float
      minimum: 0
      maximum: 1
      description: Confidence score of the validation (0-1)
    validationStatus:
      type: string
      enum: [appropriate, inappropriate, needs_clarification, override]
      description: Status of the validation
    feedback:
      type: string
      description: Textual explanation and educational content
    internalReasoning:
      type: string
      description: Internal reasoning for the validation result (may not be present in all responses)

# Order
Order:
  type: object
  properties:
    id:
      type: string
      description: Order ID
    patientFirstName:
      type: string
      description: Patient's first name
    patientLastName:
      type: string
      description: Patient's last name
    patientDateOfBirth:
      type: string
      format: date
      description: Patient's date of birth
    patientGender:
      type: string
      description: Patient's gender
    modalityType:
      type: string
      enum: [CT, MRI, XRAY, ULTRASOUND, PET, NUCLEAR]
      description: The type of imaging modality
    cptCode:
      type: string
      description: The assigned CPT code
    cptDescription:
      type: string
      description: Description of the CPT code
    icd10Codes:
      type: array
      items:
        type: string
      description: The assigned ICD-10 codes
    icd10Descriptions:
      type: array
      items:
        type: string
      description: Descriptions of the ICD-10 codes
    clinicalIndication:
      type: string
      description: The clinical indication text
    status:
      type: string
      enum: [draft, pending_validation, pending_admin, sent_to_radiology, scheduled, completed, cancelled]
      description: Current status of the order
    createdAt:
      type: string
      format: date-time
      description: When the order was created
    signedAt:
      type: string
      format: date-time
      description: When the order was signed
    signedByUser:
      type: object
      properties:
        id:
          type: string
          description: User ID
        firstName:
          type: string
          description: User's first name
        lastName:
          type: string
          description: User's last name
        role:
          type: string
          description: User's role

# Order Finalization Request
OrderFinalizationRequest:
  type: object
  required:
    - finalValidationStatus
    - finalCPTCode
    - finalCPTCodeDescription
    - finalICD10Codes
    - finalICD10CodeDescriptions
    - clinicalIndication
    - signature
    - status
  properties:
    finalValidationStatus:
      type: string
      enum: [appropriate, inappropriate, needs_clarification, override]
      description: The final validation status
    finalCPTCode:
      type: string
      description: The primary CPT code
    finalCPTCodeDescription:
      type: string
      description: Description of the CPT code
    finalICD10Codes:
      type: array
      items:
        type: string
      description: Array of ICD-10 codes
    finalICD10CodeDescriptions:
      type: array
      items:
        type: string
      description: Array of ICD-10 code descriptions
    clinicalIndication:
      type: string
      description: The clinical indication text
    signature:
      type: string
      description: Base64-encoded signature image
    status:
      type: string
      enum: [pending_admin]
      description: Should be 'pending_admin'
    overridden:
      type: boolean
      description: Whether validation was overridden
    overrideJustification:
      type: string
      description: Justification for override
    referring_organization_name:
      type: string
      description: Name of the referring organization

# Error Response
ErrorResponse:
  type: object
  properties:
    success:
      type: boolean
      example: false
    message:
      type: string
      description: Error message
    code:
      type: string
      description: Error code
    status:
      type: integer
      description: HTTP status code

# Pagination
Pagination:
  type: object
  properties:
    total:
      type: integer
      description: Total number of items
    page:
      type: integer
      description: Current page number
    limit:
      type: integer
      description: Number of items per page
    pages:
      type: integer
      description: Total number of pages

# User
User:
  type: object
  properties:
    id:
      type: string
      description: User ID
    firstName:
      type: string
      description: User's first name
    lastName:
      type: string
      description: User's last name
    email:
      type: string
      format: email
      description: User's email address
    role:
      type: string
      enum: [admin_staff, physician, admin_referring, super_admin, admin_radiology, scheduler, radiologist, trial_physician]
      description: User's role
    organizationId:
      type: string
      description: User's organization ID
    isActive:
      type: boolean
      description: Whether the user is active

================================================================================
FILE: frontend-explanation\api-docs\openapi\components\security-schemes.yaml
================================================================================

# Security Schemes

# JWT Bearer Authentication
bearerAuth:
  type: http
  scheme: bearer
  bearerFormat: JWT
  description: |
    JWT token authentication. The token is obtained from the login endpoint and must be included in the
    Authorization header of all authenticated requests.
    
    Example: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    
    The JWT contains the following claims:
    - userId: The ID of the authenticated user
    - organizationId: The ID of the user's organization
    - role: The user's role (physician, admin_staff, etc.)
    - exp: The expiration time of the token
    
    Access tokens expire after 1 hour. When an access token expires, use the refresh token endpoint
    to obtain a new access token.

================================================================================
FILE: frontend-explanation\api-docs\openapi\openapi.yaml
================================================================================

openapi: 3.1.0
info:
  title: RadOrderPad API
  description: |
    API for the RadOrderPad application that enables physicians to create and validate radiology orders,
    administrative staff to finalize orders, and radiology organizations to process orders.
    
    The API is organized into several functional areas:
    - Authentication and user management
    - Organization and location management
    - Connection management between organizations
    - Order validation and processing
    - Administrative finalization
    - Radiology workflow
    - File uploads
    - Billing and credit management
    - Superadmin functionality

    ## Frontend Implementation Guidance

    ### State Management

    #### Order Validation Flow
    - **orderId Handling**: The first call to `POST /api/orders/validate` returns an `orderId` which the frontend must store and send back on subsequent `/validate` calls (for clarifications/override) and for the final `PUT /api/orders/{orderId}`.
    - **attemptCount Tracking**: The frontend should track the validation attempt count locally to know when to enable the "Override" button (typically after 3 failed attempts).
    - **Cumulative Dictation**: For clarification attempts, the frontend should send the entire cumulative dictation text (original + all clarifications), not just the new clarification text.

    ### Error Handling
    - **401 Unauthorized**: Attempt token refresh; if that fails, redirect to login.
    - **403 Forbidden**: Display an "Access Denied" message.
    - **402 Payment Required** (on Send to Radiology): Display an "Insufficient Credits" message/modal with a link to billing.
    - **503 Service Unavailable** (on Validate): Display "Validation service temporarily unavailable, please try again" message.

    ### Trial Feature Limitations
    Trial users cannot:
    - Finalize orders
    - Access admin features
    - Manage connections
    - Upload non-signature files
    - Store PHI data
    - Exceed their validation limit (default: 10)

    ### Enum Values
    All string enums are explicitly defined in the schemas. Key enums include:
    - **Order Status**: pending_validation, pending_admin, pending_radiology, scheduled, completed, cancelled
    - **Validation Status**: appropriate, inappropriate, needs_clarification
    - **User Roles**: physician, admin_referring, admin_staff, admin_radiology, radiologist, scheduler, super_admin, trial_physician
    - **Organization Types**: referring, radiology_group, both
    - **Connection Status**: pending_approval, approved, rejected, terminated
    - **Modality Types**: CT, MRI, XRAY, ULTRASOUND, PET, NUCLEAR
  version: 1.9.0
servers:
  - url: https://api.radorderpad.com
    description: Production server

# Tags for API categorization
tags:
  - name: Authentication
    description: Endpoints for user authentication and registration
  - name: Users
    description: User management endpoints
  - name: Organizations
    description: Organization management endpoints
  - name: Connections
    description: Connection management between organizations
  - name: Orders
    description: Order management endpoints
  - name: Validation
    description: Clinical validation endpoints
  - name: Admin
    description: Administrative endpoints
  - name: Radiology
    description: Radiology workflow endpoints
  - name: Uploads
    description: File upload endpoints
  - name: Billing
    description: Billing and credit management endpoints
  - name: SuperAdmin
    description: Superadmin functionality endpoints
  - name: Trial
    description: Trial user endpoints

# Note: In a real implementation, these would be separate files referenced using $ref
# For this example, we're including a simplified version directly in this file

paths:
  # Billing endpoint with specific error handling guidance
  /api/billing/send-to-radiology:
    post:
      tags:
        - Billing
        - Orders
      summary: Send order to radiology (consumes credits)
      description: |
        Finalizes an order and sends it to the connected radiology organization.
        This operation consumes one credit from the organization's balance.
        
        **Frontend Error Handling:**
        - **402 Payment Required**: This indicates insufficient credits. The frontend should:
          1. Display an "Insufficient Credits" modal
          2. Show the current credit balance (included in the error response)
          3. Provide a direct link to the billing page for purchasing more credits
          4. Optionally show quick-purchase options for common credit bundles
      operationId: sendToRadiology
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - orderId
                - radiologyOrganizationId
              properties:
                orderId:
                  type: string
                  description: ID of the order to send
                radiologyOrganizationId:
                  type: string
                  description: ID of the radiology organization to send the order to
      responses:
        '200':
          description: Order sent successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: "Order sent to radiology successfully"
                  data:
                    type: object
                    properties:
                      orderId:
                        type: string
                        description: ID of the sent order
                      newCreditBalance:
                        type: integer
                        description: Updated credit balance after deduction
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Invalid order ID or radiology organization ID"
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Authentication required"
        '402':
          description: Payment Required - Insufficient Credits
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Insufficient credits to send order to radiology"
                  error:
                    type: object
                    properties:
                      code:
                        type: string
                        example: "INSUFFICIENT_CREDITS"
                      currentBalance:
                        type: integer
                        example: 0
                      requiredCredits:
                        type: integer
                        example: 1
                      billingUrl:
                        type: string
                        format: uri
                        example: "/billing"
        '403':
          description: Forbidden
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Insufficient permissions"
  
  # Authentication endpoints
  /api/auth/login:
    post:
      tags:
        - Authentication
      summary: User login
      description: Authenticates a user and returns access and refresh tokens
      operationId: login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                  description: User's email address
                password:
                  type: string
                  format: password
                  description: User's password
      responses:
        '200':
          description: Successful login
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      accessToken:
                        type: string
                        description: JWT access token
                      refreshToken:
                        type: string
                        description: JWT refresh token
                      user:
                        type: object
                        properties:
                          id:
                            type: string
                            description: User ID
                          firstName:
                            type: string
                            description: User's first name
                          lastName:
                            type: string
                            description: User's last name
                          email:
                            type: string
                            description: User's email
                          role:
                            type: string
                            description: User's role
                          organizationId:
                            type: string
                            description: User's organization ID
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Invalid email or password format"
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Invalid email or password"

  # Validation endpoint example
  /api/orders/validate:
    post:
      tags:
        - Orders
        - Validation
      summary: Submit dictation for validation
      description: |
        Submits clinical dictation for validation by the LLM engine.
        
        **Important Frontend Implementation Notes:**
        
        - **First Call**: Creates a draft order record and returns `orderId`. The frontend MUST store this ID.
        - **Subsequent Calls**: Must include the `orderId` from the first call.
        - **Clarification Flow**: When `requiresClarification` is true in the response, the frontend should:
          1. Display the `clarificationPrompt` to the user
          2. Collect additional information
          3. Send another validation request with the ENTIRE cumulative dictation (original + all clarifications)
          4. Include the same `orderId` from the first call
        - **Override Flow**: After 3 failed attempts (tracked via `attemptNumber` in responses):
          1. Enable an "Override" option in the UI
          2. Collect override justification from the user
          3. Send a final validation request with `isOverrideValidation: true`
          4. Include the same `orderId` from the first call
      operationId: validateOrder
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                dictation:
                  type: string
                  description: The clinical dictation text to validate
                orderId:
                  type: string
                  description: For subsequent validation attempts, the ID of the existing order
                isOverrideValidation:
                  type: boolean
                  description: Whether this is an override validation after multiple failed attempts
                patientInfo:
                  type: object
                  description: Optional patient information
                  properties:
                    firstName:
                      type: string
                    lastName:
                      type: string
                    dateOfBirth:
                      type: string
                      format: date
                    gender:
                      type: string
                      enum: [male, female, other]
                modalityType:
                  type: string
                  enum: [CT, MRI, XRAY, ULTRASOUND, PET, NUCLEAR]
                  description: The type of imaging modality
              required:
                - dictation
                - modalityType
      responses:
        '200':
          description: Successful validation
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      orderId:
                        type: string
                        description: The ID of the created or updated order
                      validationResult:
                        type: object
                        properties:
                          cptCode:
                            type: string
                            description: The assigned CPT code
                          cptDescription:
                            type: string
                            description: Description of the CPT code
                          icd10Codes:
                            type: array
                            items:
                              type: string
                            description: The assigned ICD-10 codes
                          icd10Descriptions:
                            type: array
                            items:
                              type: string
                            description: Descriptions of the ICD-10 codes
                          confidence:
                            type: number
                            format: float
                            description: Confidence score of the validation
                      requiresClarification:
                        type: boolean
                        description: Whether additional clarification is needed
                      clarificationPrompt:
                        type: string
                        description: The prompt for clarification if needed
                      attemptNumber:
                        type: integer
                        description: The current validation attempt number
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Missing required fields"
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Authentication required"
        '403':
          description: Forbidden
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Insufficient permissions"
        '503':
          description: LLM Service Unavailable
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Validation service temporarily unavailable. Please try again later."

  # Trial validation endpoint
  /api/orders/validate/trial:
    post:
      tags:
        - Orders
        - Validation
        - Trial
      summary: Validate an order in trial mode
      description: |
        Validates a radiology order in trial mode without creating PHI records.
        
        **Trial Feature Limitations:**
        - Limited to a fixed number of validations per trial user (default: 10)
        - No PHI data is stored
        - No order finalization
        - No admin features access
        - No connection management
        - No file uploads (except signatures)
        - Returns 403 Forbidden when validation limit is reached
        
        **Frontend Implementation Notes:**
        - Track remaining validations from the `validationsRemaining` field in the response
        - Display appropriate messaging when approaching the validation limit
        - Provide clear upgrade path when limit is reached
      operationId: validateOrderTrial
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - dictation
                - modalityType
              properties:
                dictation:
                  type: string
                  description: The clinical dictation text to validate
                modalityType:
                  type: string
                  enum: [CT, MRI, XRAY, ULTRASOUND, PET, NUCLEAR]
                  description: The type of imaging modality
      responses:
        '200':
          description: Successful validation
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      validationResult:
                        type: object
                        properties:
                          cptCode:
                            type: string
                            description: The assigned CPT code
                          cptDescription:
                            type: string
                            description: Description of the CPT code
                          icd10Codes:
                            type: array
                            items:
                              type: string
                            description: The assigned ICD-10 codes
                          icd10Descriptions:
                            type: array
                            items:
                              type: string
                            description: Descriptions of the ICD-10 codes
                          confidence:
                            type: number
                            format: float
                            description: Confidence score of the validation
                      validationsRemaining:
                        type: integer
                        description: Number of validations remaining for the trial user
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Missing required fields"
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Authentication required"
        '403':
          description: Forbidden - Validation limit reached
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Validation limit reached. Please register for a full account to continue using the service."
                  error:
                    type: object
                    properties:
                      code:
                        type: string
                        example: "VALIDATION_LIMIT_REACHED"
                      validationsUsed:
                        type: integer
                        example: 10
                      validationsLimit:
                        type: integer
                        example: 10
        '503':
          description: LLM Service Unavailable
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: "Validation service temporarily unavailable. Please try again later."

# Components section for reusable schemas and security definitions
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token authentication
  
  schemas:
    # Common enum definitions for frontend reference
    OrderStatus:
      type: string
      enum: [pending_validation, pending_admin, pending_radiology, scheduled, completed, cancelled]
      description: Possible order status values
    
    ValidationStatus:
      type: string
      enum: [appropriate, inappropriate, needs_clarification]
      description: Possible validation status values
    
    UserRole:
      type: string
      enum: [physician, admin_referring, admin_staff, admin_radiology, radiologist, scheduler, super_admin, trial_physician]
      description: Possible user role values
    
    OrganizationType:
      type: string
      enum: [referring, radiology_group, both]
      description: Possible organization type values
    
    ConnectionStatus:
      type: string
      enum: [pending_approval, approved, rejected, terminated]
      description: Possible connection status values
    
    ModalityType:
      type: string
      enum: [CT, MRI, XRAY, ULTRASOUND, PET, NUCLEAR]
      description: Possible imaging modality types

================================================================================
FILE: frontend-explanation\api-docs\openapi\paths\admin-orders.yaml
================================================================================

# Admin Order Management Endpoints

'/admin/orders':
  get:
    tags:
      - Admin
      - Orders
    summary: List orders for admin
    description: |
      Retrieves a list of orders for administrative staff.
      
      This endpoint returns a paginated list of orders that require administrative processing,
      with optional filtering by status, date range, and other criteria.
      Requires admin or staff role.
    operationId: listAdminOrders
    security:
      - bearerAuth: []
    parameters:
      - name: status
        in: query
        description: Filter by order status
        schema:
          type: string
          enum: [pending_admin, in_progress, completed, canceled, all]
          default: pending_admin
      - name: startDate
        in: query
        description: Filter by start date (ISO format)
        schema:
          type: string
          format: date
      - name: endDate
        in: query
        description: Filter by end date (ISO format)
        schema:
          type: string
          format: date
      - name: physicianId
        in: query
        description: Filter by referring physician ID
        schema:
          type: string
      - name: patientId
        in: query
        description: Filter by patient ID
        schema:
          type: string
      - name: modalityType
        in: query
        description: Filter by modality type
        schema:
          type: string
          enum: [CT, MRI, XRAY, ULTRASOUND, PET, NUCLEAR]
      - name: locationId
        in: query
        description: Filter by location ID
        schema:
          type: string
      - name: search
        in: query
        description: Search term for patient name or order ID
        schema:
          type: string
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
      - name: sortBy
        in: query
        description: Field to sort by
        schema:
          type: string
          enum: [createdAt, updatedAt, patientName]
          default: createdAt
      - name: sortOrder
        in: query
        description: Sort order
        schema:
          type: string
          enum: [asc, desc]
          default: desc
    responses:
      '200':
        description: List of orders
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    orders:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/AdminOrderSummary'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/admin/orders/{orderId}':
  get:
    tags:
      - Admin
      - Orders
    summary: Get order details for admin
    description: |
      Retrieves detailed information about a specific order for administrative staff.
      
      This endpoint returns comprehensive information about an order,
      including validation results, patient information, and physician details.
      Requires admin or staff role.
    operationId: getAdminOrderDetails
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to retrieve
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Order details
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/AdminOrderDetails'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
  
  patch:
    tags:
      - Admin
      - Orders
    summary: Update order as admin
    description: |
      Updates an order as an administrative staff member.
      
      This endpoint allows administrative staff to update order information,
      including status, patient information, and administrative notes.
      Requires admin or staff role.
    operationId: updateAdminOrder
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to update
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              status:
                type: string
                enum: [in_progress, completed, canceled]
                description: New order status
              patientInfo:
                $ref: '../components/schemas.yaml#/PatientInfo'
              insuranceInfo:
                $ref: '../components/schemas.yaml#/InsuranceInfo'
              scheduledDate:
                type: string
                format: date-time
                description: Scheduled date for the procedure
              adminNotes:
                type: string
                description: Administrative notes
              radiologyFacility:
                type: string
                description: Radiology facility where the procedure will be performed
              priority:
                type: string
                enum: [routine, urgent, stat]
                description: Order priority
    responses:
      '200':
        description: Order updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/AdminOrderDetails'
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '422':
        description: Invalid status transition
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Invalid status transition"

'/admin/orders/{orderId}/claim':
  post:
    tags:
      - Admin
      - Orders
    summary: Claim order for processing
    description: |
      Claims an order for administrative processing.
      
      This endpoint allows an administrative staff member to claim an order
      for processing, changing its status to 'in_progress' and assigning it to themselves.
      Requires admin or staff role.
    operationId: claimOrder
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to claim
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Order claimed successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    orderId:
                      type: string
                      description: Order ID
                    status:
                      type: string
                      enum: [in_progress]
                      description: Updated order status
                    assignedTo:
                      type: string
                      description: ID of the user the order is assigned to
                    assignedAt:
                      type: string
                      format: date-time
                      description: Date and time of assignment
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '409':
        description: Order already claimed
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Order is already claimed by another user"

'/admin/orders/{orderId}/release':
  post:
    tags:
      - Admin
      - Orders
    summary: Release claimed order
    description: |
      Releases a claimed order back to the queue.
      
      This endpoint allows an administrative staff member to release an order
      they previously claimed, changing its status back to 'pending_admin'.
      Requires admin or staff role.
    operationId: releaseOrder
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to release
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Order released successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    orderId:
                      type: string
                      description: Order ID
                    status:
                      type: string
                      enum: [pending_admin]
                      description: Updated order status
                    releasedAt:
                      type: string
                      format: date-time
                      description: Date and time of release
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        description: Not authorized to release this order
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "You are not authorized to release this order"
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '409':
        description: Order not claimed
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Order is not currently claimed"

'/admin/orders/{orderId}/complete':
  post:
    tags:
      - Admin
      - Orders
    summary: Complete order processing
    description: |
      Marks an order as completed after administrative processing.
      
      This endpoint allows an administrative staff member to mark an order as completed,
      indicating that all administrative tasks have been performed.
      Requires admin or staff role.
    operationId: completeOrder
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to complete
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              completionNotes:
                type: string
                description: Notes about the completion
              radiologyFacility:
                type: string
                description: Radiology facility where the procedure will be performed
              scheduledDate:
                type: string
                format: date-time
                description: Scheduled date for the procedure
              insuranceVerified:
                type: boolean
                description: Whether insurance has been verified
                default: true
            required:
              - radiologyFacility
              - scheduledDate
    responses:
      '200':
        description: Order completed successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    orderId:
                      type: string
                      description: Order ID
                    status:
                      type: string
                      enum: [completed]
                      description: Updated order status
                    completedAt:
                      type: string
                      format: date-time
                      description: Date and time of completion
                    completedBy:
                      type: string
                      description: ID of the user who completed the order
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        description: Not authorized to complete this order
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "You are not authorized to complete this order"
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '409':
        description: Order not in progress
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Order must be in 'in_progress' status to be completed"

'/admin/orders/{orderId}/cancel':
  post:
    tags:
      - Admin
      - Orders
    summary: Cancel order
    description: |
      Cancels an order.
      
      This endpoint allows an administrative staff member to cancel an order,
      providing a reason for the cancellation.
      Requires admin or staff role.
    operationId: cancelOrder
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to cancel
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              reason:
                type: string
                description: Reason for cancellation
              notifyPhysician:
                type: boolean
                description: Whether to notify the referring physician
                default: true
            required:
              - reason
    responses:
      '200':
        description: Order canceled successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    orderId:
                      type: string
                      description: Order ID
                    status:
                      type: string
                      enum: [canceled]
                      description: Updated order status
                    canceledAt:
                      type: string
                      format: date-time
                      description: Date and time of cancellation
                    canceledBy:
                      type: string
                      description: ID of the user who canceled the order
                    reason:
                      type: string
                      description: Reason for cancellation
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '409':
        description: Order already completed or canceled
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Order is already completed or canceled"

'/admin/orders/queue/stats':
  get:
    tags:
      - Admin
      - Orders
    summary: Get order queue statistics
    description: |
      Retrieves statistics about the administrative order queue.
      
      This endpoint returns statistics about the order queue,
      including counts by status, average processing time, and backlog information.
      Requires admin or staff role.
    operationId: getOrderQueueStats
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Order queue statistics
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    totalOrders:
                      type: integer
                      description: Total number of orders in the queue
                    statusCounts:
                      type: object
                      properties:
                        pending_admin:
                          type: integer
                          description: Number of orders pending admin processing
                        in_progress:
                          type: integer
                          description: Number of orders in progress
                        completed:
                          type: integer
                          description: Number of completed orders
                        canceled:
                          type: integer
                          description: Number of canceled orders
                    averageProcessingTime:
                      type: integer
                      description: Average processing time in minutes
                    oldestPendingOrder:
                      type: string
                      format: date-time
                      description: Timestamp of the oldest pending order
                    assignedToMe:
                      type: integer
                      description: Number of orders assigned to the current user
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/admin/orders/my-assigned':
  get:
    tags:
      - Admin
      - Orders
    summary: List orders assigned to current user
    description: |
      Retrieves a list of orders assigned to the current administrative staff member.
      
      This endpoint returns a paginated list of orders that are currently assigned
      to the authenticated administrative staff member.
      Requires admin or staff role.
    operationId: listMyAssignedOrders
    security:
      - bearerAuth: []
    parameters:
      - name: status
        in: query
        description: Filter by order status
        schema:
          type: string
          enum: [in_progress, completed, canceled, all]
          default: in_progress
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
      - name: sortBy
        in: query
        description: Field to sort by
        schema:
          type: string
          enum: [createdAt, updatedAt, patientName]
          default: createdAt
      - name: sortOrder
        in: query
        description: Sort order
        schema:
          type: string
          enum: [asc, desc]
          default: desc
    responses:
      '200':
        description: List of assigned orders
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    orders:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/AdminOrderSummary'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

================================================================================
FILE: frontend-explanation\api-docs\openapi\paths\auth.yaml
================================================================================

# Authentication Endpoints

'/auth/login':
  post:
    tags:
      - Authentication
    summary: Authenticate user
    description: |
      Authenticates a user with email and password credentials and returns a JWT token.
      
      This endpoint validates the user's credentials, checks their account status,
      and returns authentication tokens along with basic user information.
    operationId: login
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                format: email
                description: User's email address
              password:
                type: string
                format: password
                description: User's password
            required:
              - email
              - password
    responses:
      '200':
        description: Successful authentication
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    token:
                      type: string
                      description: JWT token for authentication
                    refreshToken:
                      type: string
                      description: Refresh token for obtaining a new JWT token
                    expiresIn:
                      type: integer
                      description: Token expiration time in seconds
                      example: 3600
                    user:
                      $ref: '../components/schemas.yaml#/User'
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        description: Invalid credentials
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Invalid email or password"
      '403':
        description: Account disabled or organization inactive
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Your account has been disabled. Please contact your administrator."
      '429':
        $ref: '../components/responses.yaml#/TooManyRequests'

'/auth/refresh':
  post:
    tags:
      - Authentication
    summary: Refresh authentication token
    description: |
      Refreshes an expired JWT token using a valid refresh token.
      
      This endpoint validates the refresh token and issues a new JWT token
      without requiring the user to re-enter their credentials.
    operationId: refreshToken
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              refreshToken:
                type: string
                description: Refresh token obtained during login
            required:
              - refreshToken
    responses:
      '200':
        description: Token refreshed successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    token:
                      type: string
                      description: New JWT token
                    refreshToken:
                      type: string
                      description: New refresh token
                    expiresIn:
                      type: integer
                      description: Token expiration time in seconds
                      example: 3600
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        description: Invalid or expired refresh token
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Invalid or expired refresh token"

'/auth/logout':
  post:
    tags:
      - Authentication
    summary: Logout user
    description: |
      Logs out a user by invalidating their current tokens.
      
      This endpoint invalidates the user's current JWT and refresh tokens,
      effectively logging them out of the system.
    operationId: logout
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Logout successful
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Logout successful"
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'

'/auth/forgot-password':
  post:
    tags:
      - Authentication
    summary: Request password reset
    description: |
      Initiates the password reset process by sending a reset link to the user's email.
      
      This endpoint validates the email address and sends a password reset link
      if the email is associated with an active user account.
    operationId: forgotPassword
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                format: email
                description: User's email address
            required:
              - email
    responses:
      '200':
        description: Password reset email sent
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Password reset instructions have been sent to your email"
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '404':
        description: Email not found
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "No account found with that email address"
      '429':
        $ref: '../components/responses.yaml#/TooManyRequests'

'/auth/reset-password':
  post:
    tags:
      - Authentication
    summary: Reset password
    description: |
      Resets a user's password using a valid reset token.
      
      This endpoint validates the reset token and updates the user's password
      if the token is valid and not expired.
    operationId: resetPassword
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              token:
                type: string
                description: Password reset token from email
              password:
                type: string
                format: password
                description: New password
            required:
              - token
              - password
    responses:
      '200':
        description: Password reset successful
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Password has been reset successfully"
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        description: Invalid or expired token
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Invalid or expired reset token"

'/auth/change-password':
  post:
    tags:
      - Authentication
    summary: Change password
    description: |
      Changes a user's password while authenticated.
      
      This endpoint allows an authenticated user to change their password
      by providing their current password and a new password.
    operationId: changePassword
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              currentPassword:
                type: string
                format: password
                description: Current password
              newPassword:
                type: string
                format: password
                description: New password
            required:
              - currentPassword
              - newPassword
    responses:
      '200':
        description: Password changed successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Password changed successfully"
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        description: Invalid current password
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Current password is incorrect"

'/auth/trial/register':
  post:
    tags:
      - Authentication
      - Trial
    summary: Register trial user
    description: |
      Registers a new trial user with an invitation token.
      
      This endpoint validates the invitation token and creates a new trial user
      account with the provided information.
    operationId: registerTrialUser
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              invitationToken:
                type: string
                description: Trial invitation token
              email:
                type: string
                format: email
                description: User's email address
              password:
                type: string
                format: password
                description: User's password
              firstName:
                type: string
                description: User's first name
              lastName:
                type: string
                description: User's last name
              specialty:
                type: string
                description: User's medical specialty
            required:
              - invitationToken
              - email
              - password
              - firstName
              - lastName
              - specialty
    responses:
      '201':
        description: Trial user registered successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    token:
                      type: string
                      description: JWT token for authentication
                    refreshToken:
                      type: string
                      description: Refresh token for obtaining a new JWT token
                    expiresIn:
                      type: integer
                      description: Token expiration time in seconds
                      example: 3600
                    user:
                      $ref: '../components/schemas.yaml#/User'
                    trialInfo:
                      $ref: '../components/schemas.yaml#/TrialInfo'
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '404':
        description: Invalid invitation token
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Invalid or expired invitation token"
      '409':
        description: Email already in use
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Email address is already registered"

'/auth/trial/login':
  post:
    tags:
      - Authentication
      - Trial
    summary: Login trial user
    description: |
      Authenticates a trial user with email and password credentials.
      
      This endpoint validates the trial user's credentials, checks their trial status,
      and returns authentication tokens along with trial-specific information.
    operationId: loginTrialUser
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                format: email
                description: User's email address
              password:
                type: string
                format: password
                description: User's password
            required:
              - email
              - password
    responses:
      '200':
        description: Successful authentication
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    token:
                      type: string
                      description: JWT token for authentication
                    refreshToken:
                      type: string
                      description: Refresh token for obtaining a new JWT token
                    expiresIn:
                      type: integer
                      description: Token expiration time in seconds
                      example: 3600
                    user:
                      $ref: '../components/schemas.yaml#/User'
                    trialInfo:
                      $ref: '../components/schemas.yaml#/TrialInfo'
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        description: Invalid credentials
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Invalid email or password"
      '403':
        description: Trial expired or usage limit reached
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Your trial period has expired"
                trialStatus:
                  type: object
                  properties:
                    active:
                      type: boolean
                      example: false
                    remainingDays:
                      type: integer
                      example: 0
                    usageCount:
                      type: integer
                      example: 20
                    usageLimit:
                      type: integer
                      example: 20
                    message:
                      type: string
                      example: "You have reached your trial usage limit"

'/auth/complete-registration':
  post:
    tags:
      - Authentication
    summary: Complete user registration
    description: |
      Completes the registration process for a user who received an invitation.
      
      This endpoint validates the invitation token and completes the user registration
      by setting a password and accepting terms and conditions.
    operationId: completeRegistration
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              token:
                type: string
                description: Invitation token from email
              password:
                type: string
                format: password
                description: User's chosen password
              acceptTerms:
                type: boolean
                description: Whether the user accepts the terms and conditions
              setupTwoFactor:
                type: boolean
                description: Whether to set up two-factor authentication
            required:
              - token
              - password
              - acceptTerms
    responses:
      '200':
        description: Registration completed successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    token:
                      type: string
                      description: JWT token for authentication
                    refreshToken:
                      type: string
                      description: Refresh token for obtaining a new JWT token
                    expiresIn:
                      type: integer
                      description: Token expiration time in seconds
                      example: 3600
                    user:
                      $ref: '../components/schemas.yaml#/User'
                    twoFactorSetupRequired:
                      type: boolean
                      description: Whether two-factor authentication setup is required
                      example: false
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '404':
        description: Invalid invitation token
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Invalid or expired invitation token"

================================================================================
FILE: frontend-explanation\api-docs\openapi\paths\billing.yaml
================================================================================

# Billing Management Endpoints

'/billing':
  get:
    tags:
      - Billing
    summary: Get billing overview
    description: |
      Retrieves billing information for the current organization, including subscription status and credit balance.
      
      This endpoint returns comprehensive billing information including the organization's status,
      subscription tier, credit balance, and Stripe subscription details.
    operationId: getBillingOverview
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Billing overview
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    organizationStatus:
                      type: string
                      description: Status of the organization
                      example: active
                    subscriptionTier:
                      type: string
                      description: Current subscription tier
                      example: tier_1
                    currentCreditBalance:
                      type: integer
                      description: Current credit balance
                      example: 500
                    stripeSubscriptionStatus:
                      type: string
                      description: Status of the Stripe subscription
                      example: active
                    currentPeriodEnd:
                      type: string
                      format: date-time
                      description: End date of the current billing period
                    billingInterval:
                      type: string
                      description: Billing interval (month, year)
                      example: month
                    cancelAtPeriodEnd:
                      type: boolean
                      description: Whether the subscription will cancel at the end of the period
                    stripeCustomerPortalUrl:
                      type: string
                      format: uri
                      description: URL to the Stripe customer portal
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/billing/create-checkout-session':
  post:
    tags:
      - Billing
    summary: Create checkout session
    description: |
      Creates a Stripe checkout session for purchasing credit bundles.
      
      This endpoint generates a Stripe checkout session that can be used to redirect
      the user to the Stripe checkout page for purchasing credit bundles.
    operationId: createCheckoutSession
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              priceId:
                type: string
                description: Stripe price ID for the credit bundle
              successUrl:
                type: string
                format: uri
                description: URL to redirect to after successful payment
              cancelUrl:
                type: string
                format: uri
                description: URL to redirect to if payment is cancelled
            required:
              - priceId
              - successUrl
              - cancelUrl
    responses:
      '200':
        description: Checkout session created successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                sessionId:
                  type: string
                  description: Stripe checkout session ID
                checkoutUrl:
                  type: string
                  format: uri
                  description: URL to redirect the user to for checkout
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/billing/subscriptions':
  post:
    tags:
      - Billing
    summary: Create subscription
    description: |
      Creates a Stripe subscription for a specific pricing tier.
      
      This endpoint creates a subscription for the organization using the specified
      Stripe price ID and optional payment method.
    operationId: createSubscription
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              priceId:
                type: string
                description: Stripe price ID for the subscription
              paymentMethodId:
                type: string
                description: Optional Stripe payment method ID
            required:
              - priceId
    responses:
      '200':
        description: Subscription created successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                subscription:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Stripe subscription ID
                    status:
                      type: string
                      description: Subscription status
                    currentPeriodEnd:
                      type: string
                      format: date-time
                      description: End date of the current billing period
                clientSecret:
                  type: string
                  description: Client secret for confirming the subscription (if required)
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/billing/credit-balance':
  get:
    tags:
      - Billing
    summary: Get credit balance
    description: |
      Retrieves the current credit balance for the organization.
      
      This endpoint returns the current credit balance for the authenticated user's organization.
    operationId: getCreditBalance
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Credit balance retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                creditBalance:
                  type: integer
                  description: Current credit balance
                  example: 500
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/billing/credit-usage':
  get:
    tags:
      - Billing
    summary: Get credit usage history
    description: |
      Retrieves credit usage history for the organization.
      
      This endpoint returns a paginated list of credit usage events for the
      authenticated user's organization, with optional filtering by date range.
    operationId: getCreditUsage
    security:
      - bearerAuth: []
    parameters:
      - name: startDate
        in: query
        description: Start date for filtering (YYYY-MM-DD)
        schema:
          type: string
          format: date
      - name: endDate
        in: query
        description: End date for filtering (YYYY-MM-DD)
        schema:
          type: string
          format: date
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        description: Credit usage history retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    events:
                      type: array
                      items:
                        type: object
                        properties:
                          id:
                            type: integer
                            description: Event ID
                          event_type:
                            type: string
                            description: Type of event (credit_usage, credit_purchase)
                          amount:
                            type: integer
                            description: Amount of credits added or used
                          order_id:
                            type: integer
                            description: Associated order ID (for credit_usage events)
                          description:
                            type: string
                            description: Human-readable description of the event
                          created_at:
                            type: string
                            format: date-time
                            description: Date and time of the event
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

================================================================================
FILE: frontend-explanation\api-docs\openapi\paths\connections.yaml
================================================================================

# Connection Management Endpoints

'/connections/request':
  post:
    tags:
      - Connections
    summary: Request a connection
    description: |
      Sends a connection request to another organization.
      
      This endpoint allows an organization to request a connection with another organization,
      which enables them to exchange orders and other information.
    operationId: requestConnection
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              targetOrganizationId:
                type: string
                description: ID of the organization to connect with
              message:
                type: string
                description: Message to include with the connection request
            required:
              - targetOrganizationId
    responses:
      '201':
        description: Connection request sent successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    connectionId:
                      type: string
                      description: ID of the connection request
                    status:
                      type: string
                      enum: [pending_approval]
                      description: Status of the connection request
                    requestDate:
                      type: string
                      format: date-time
                      description: Date the request was sent
                    targetOrganization:
                      $ref: '../components/schemas.yaml#/OrganizationBasic'
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        description: Target organization not found
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Target organization not found"
      '409':
        description: Connection already exists
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Connection already exists or is pending"

'/connections/outgoing':
  get:
    tags:
      - Connections
    summary: List outgoing connection requests
    description: |
      Retrieves a list of outgoing connection requests.
      
      This endpoint returns a paginated list of connection requests sent by the current organization,
      with optional filtering by status.
    operationId: listOutgoingConnections
    security:
      - bearerAuth: []
    parameters:
      - name: status
        in: query
        description: Filter by connection status
        schema:
          type: string
          enum: [pending_approval, approved, rejected, canceled, all]
          default: all
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        description: List of outgoing connection requests
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    connections:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/OutgoingConnection'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/connections/incoming':
  get:
    tags:
      - Connections
    summary: List incoming connection requests
    description: |
      Retrieves a list of incoming connection requests.
      
      This endpoint returns a paginated list of connection requests received by the current organization,
      with optional filtering by status.
    operationId: listIncomingConnections
    security:
      - bearerAuth: []
    parameters:
      - name: status
        in: query
        description: Filter by connection status
        schema:
          type: string
          enum: [pending_approval, approved, rejected, all]
          default: pending_approval
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        description: List of incoming connection requests
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    connections:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/IncomingConnection'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/connections/established':
  get:
    tags:
      - Connections
    summary: List established connections
    description: |
      Retrieves a list of established connections.
      
      This endpoint returns a paginated list of active connections between the current organization
      and other organizations.
    operationId: listEstablishedConnections
    security:
      - bearerAuth: []
    parameters:
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        description: List of established connections
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    connections:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/EstablishedConnection'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/connections/terminated':
  get:
    tags:
      - Connections
    summary: List terminated connections
    description: |
      Retrieves a list of terminated connections.
      
      This endpoint returns a paginated list of connections that have been terminated
      by either the current organization or the connected organization.
    operationId: listTerminatedConnections
    security:
      - bearerAuth: []
    parameters:
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        description: List of terminated connections
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    connections:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/TerminatedConnection'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/connections/{connectionId}':
  get:
    tags:
      - Connections
    summary: Get connection details
    description: |
      Retrieves detailed information about a specific connection.
      
      This endpoint returns comprehensive information about a connection,
      including its status, history, and associated organizations.
    operationId: getConnectionDetails
    security:
      - bearerAuth: []
    parameters:
      - name: connectionId
        in: path
        description: ID of the connection to retrieve
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Connection details
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/ConnectionDetails'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'

'/connections/{connectionId}/approve':
  post:
    tags:
      - Connections
    summary: Approve connection request
    description: |
      Approves an incoming connection request.
      
      This endpoint allows an organization to approve a connection request received from another organization,
      establishing a connection between the two organizations.
    operationId: approveConnection
    security:
      - bearerAuth: []
    parameters:
      - name: connectionId
        in: path
        description: ID of the connection request to approve
        required: true
        schema:
          type: string
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              responseMessage:
                type: string
                description: Optional message to include with the approval
    responses:
      '200':
        description: Connection request approved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Connection ID
                    status:
                      type: string
                      enum: [approved]
                      description: Updated connection status
                    responseDate:
                      type: string
                      format: date-time
                      description: Date of the approval
                    responseMessage:
                      type: string
                      description: Response message
                    sourceOrganization:
                      $ref: '../components/schemas.yaml#/OrganizationBasic'
                    targetOrganization:
                      $ref: '../components/schemas.yaml#/OrganizationBasic'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '409':
        description: Connection already approved or rejected
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Connection request has already been approved or rejected"

'/connections/{connectionId}/reject':
  post:
    tags:
      - Connections
    summary: Reject connection request
    description: |
      Rejects an incoming connection request.
      
      This endpoint allows an organization to reject a connection request received from another organization.
    operationId: rejectConnection
    security:
      - bearerAuth: []
    parameters:
      - name: connectionId
        in: path
        description: ID of the connection request to reject
        required: true
        schema:
          type: string
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              responseMessage:
                type: string
                description: Optional message explaining the rejection
    responses:
      '200':
        description: Connection request rejected successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Connection ID
                    status:
                      type: string
                      enum: [rejected]
                      description: Updated connection status
                    responseDate:
                      type: string
                      format: date-time
                      description: Date of the rejection
                    responseMessage:
                      type: string
                      description: Response message
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '409':
        description: Connection already approved or rejected
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Connection request has already been approved or rejected"

'/connections/{connectionId}/cancel':
  post:
    tags:
      - Connections
    summary: Cancel connection request
    description: |
      Cancels an outgoing connection request.
      
      This endpoint allows an organization to cancel a connection request they sent to another organization.
    operationId: cancelConnection
    security:
      - bearerAuth: []
    parameters:
      - name: connectionId
        in: path
        description: ID of the connection request to cancel
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Connection request canceled successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Connection ID
                    status:
                      type: string
                      enum: [canceled]
                      description: Updated connection status
                    cancelDate:
                      type: string
                      format: date-time
                      description: Date the request was canceled
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '409':
        description: Connection already approved or rejected
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Connection request has already been approved or rejected"

'/connections/{connectionId}/resend':
  post:
    tags:
      - Connections
    summary: Resend connection request
    description: |
      Resends a rejected connection request.
      
      This endpoint allows an organization to resend a connection request that was previously rejected.
    operationId: resendConnection
    security:
      - bearerAuth: []
    parameters:
      - name: connectionId
        in: path
        description: ID of the connection request to resend
        required: true
        schema:
          type: string
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
                description: New message for the connection request
    responses:
      '200':
        description: Connection request resent successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Connection ID
                    status:
                      type: string
                      enum: [pending_approval]
                      description: Updated connection status
                    requestDate:
                      type: string
                      format: date-time
                      description: New request date
                    message:
                      type: string
                      description: New request message
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '409':
        description: Connection not in rejected status
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Only rejected connection requests can be resent"

'/connections/{connectionId}/terminate':
  post:
    tags:
      - Connections
    summary: Terminate connection
    description: |
      Terminates an established connection.
      
      This endpoint allows an organization to terminate an active connection with another organization,
      with options for handling pending orders.
    operationId: terminateConnection
    security:
      - bearerAuth: []
    parameters:
      - name: connectionId
        in: path
        description: ID of the connection to terminate
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              reason:
                type: string
                description: Reason for termination
              handlePendingOrders:
                type: string
                enum: [complete, cancel, transfer]
                description: How to handle pending orders
                default: complete
              targetConnectionId:
                type: string
                description: Target connection ID for transferring orders (required if handlePendingOrders is 'transfer')
            required:
              - reason
    responses:
      '200':
        description: Connection terminated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Connection ID
                    status:
                      type: string
                      enum: [terminated]
                      description: Updated connection status
                    terminationDate:
                      type: string
                      format: date-time
                      description: Date of the termination
                    terminationReason:
                      type: string
                      description: Reason for termination
                    pendingOrdersHandling:
                      type: string
                      enum: [complete, cancel, transfer]
                      description: How pending orders were handled
                    affectedOrderCount:
                      type: integer
                      description: Number of orders affected by the termination
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '409':
        description: Connection already terminated
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Connection has already been terminated"
      '422':
        description: Cannot terminate with pending orders
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Cannot terminate connection with pending orders without specifying how to handle them"

'/connections/{connectionId}/reestablish':
  post:
    tags:
      - Connections
    summary: Reestablish terminated connection
    description: |
      Reestablishes a previously terminated connection.
      
      This endpoint allows an organization to request reestablishment of a connection
      that was previously terminated.
    operationId: reestablishConnection
    security:
      - bearerAuth: []
    parameters:
      - name: connectionId
        in: path
        description: ID of the connection to reestablish
        required: true
        schema:
          type: string
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
                description: Message for the reestablishment request
    responses:
      '200':
        description: Connection reestablishment request sent successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Connection ID
                    status:
                      type: string
                      enum: [pending_approval]
                      description: Updated connection status
                    requestDate:
                      type: string
                      format: date-time
                      description: New request date
                    message:
                      type: string
                      description: Request message
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '409':
        description: Connection not in terminated status
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Only terminated connections can be reestablished"

================================================================================
FILE: frontend-explanation\api-docs\openapi\paths\orders-validation.yaml
================================================================================

# Order Validation Endpoints

/orders/validate:
  post:
    tags:
      - Validation Engine
    summary: Validate an order
    description: |
      Validates a radiology order based on dictation text. This is the core endpoint for the validation engine,
      which processes clinical indications from physician dictation to assign appropriate CPT and ICD-10 codes.
      
      The validation process includes:
      1. Extracting medical context from the dictation
      2. Analyzing the clinical indications
      3. Determining appropriate CPT and ICD-10 codes
      4. Assessing compliance with clinical guidelines
      5. Providing educational feedback
      
      Processing takes approximately 2-3 seconds per request.
    operationId: validateOrder
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - dictation
              - modalityType
            properties:
              dictation:
                type: string
                description: The clinical dictation text from the physician
              modalityType:
                type: string
                enum: [CT, MRI, XRAY, ULTRASOUND, PET, NUCLEAR]
                description: The type of imaging modality
              patientInfo:
                type: object
                properties:
                  firstName:
                    type: string
                  lastName:
                    type: string
                  dateOfBirth:
                    type: string
                    format: date
                  gender:
                    type: string
                    enum: [male, female, other]
                  mrn:
                    type: string
                  pidn:
                    type: string
                    description: Patient Identifier Number
              orderId:
                type: string
                description: For subsequent validation attempts, the ID of the existing order
              isOverrideValidation:
                type: boolean
                description: Set to true for override validation after multiple failed attempts
          examples:
            initialValidation:
              summary: Initial validation request
              value:
                dictation: "72-year-old male with persistent lower back pain radiating to the left leg for 3 weeks. History of degenerative disc disease. Clinical concern for lumbar radiculopathy."
                modalityType: "MRI"
                patientInfo:
                  firstName: "Robert"
                  lastName: "Johnson"
                  dateOfBirth: "1950-05-15"
                  gender: "male"
                  pidn: "P12345"
            subsequentAttempt:
              summary: Subsequent validation attempt
              value:
                dictation: "72-year-old male with persistent lower back pain radiating to the left leg for 3 weeks. History of degenerative disc disease. Clinical concern for lumbar radiculopathy.\n\n--- CLARIFICATION 1 ---\nPain is worse with standing and walking. Physical exam shows positive straight leg raise on left side. No bowel or bladder symptoms."
                modalityType: "MRI"
                patientInfo:
                  firstName: "Robert"
                  lastName: "Johnson"
                  dateOfBirth: "1950-05-15"
                  gender: "male"
                  pidn: "P12345"
                orderId: "123"
            overrideValidation:
              summary: Override validation request
              value:
                dictation: "72-year-old male with persistent lower back pain radiating to the left leg for 3 weeks. History of degenerative disc disease. Clinical concern for lumbar radiculopathy.\n\n--- CLARIFICATION 1 ---\nPain is worse with standing and walking. Physical exam shows positive straight leg raise on left side. No bowel or bladder symptoms.\n\n--- OVERRIDE JUSTIFICATION ---\nPatient has failed conservative therapy including physical therapy and NSAIDs. MRI is needed to evaluate for possible surgical intervention."
                modalityType: "MRI"
                patientInfo:
                  firstName: "Robert"
                  lastName: "Johnson"
                  dateOfBirth: "1950-05-15"
                  gender: "male"
                  pidn: "P12345"
                orderId: "123"
                isOverrideValidation: true
    responses:
      '200':
        description: Validation successful
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    orderId:
                      type: string
                      description: The ID of the created or updated order
                    validationResult:
                      type: object
                      properties:
                        cptCode:
                          type: string
                          description: The assigned CPT code
                        cptDescription:
                          type: string
                          description: Description of the CPT code
                        icd10Codes:
                          type: array
                          items:
                            type: string
                          description: The assigned ICD-10 codes
                        icd10Descriptions:
                          type: array
                          items:
                            type: string
                          description: Descriptions of the ICD-10 codes
                        confidence:
                          type: number
                          format: float
                          description: Confidence score of the validation
                    requiresClarification:
                      type: boolean
                      description: Whether additional clarification is needed
                    clarificationPrompt:
                      type: string
                      description: The prompt for clarification if needed
                    attemptNumber:
                      type: integer
                      description: The current validation attempt number
            examples:
              appropriateResponse:
                summary: Appropriate validation response
                value:
                  success: true
                  data:
                    orderId: "123"
                    validationResult:
                      cptCode: "72148"
                      cptDescription: "Magnetic resonance (eg, proton) imaging, spinal canal and contents, lumbar; without contrast material"
                      icd10Codes: ["M54.17", "M51.36"]
                      icd10Descriptions: ["Radiculopathy, lumbosacral region", "Other intervertebral disc degeneration, lumbar region"]
                      confidence: 0.95
                    requiresClarification: false
                    attemptNumber: 1
              needsClarificationResponse:
                summary: Needs clarification response
                value:
                  success: true
                  data:
                    orderId: "123"
                    validationResult:
                      cptCode: "72148"
                      cptDescription: "Magnetic resonance (eg, proton) imaging, spinal canal and contents, lumbar; without contrast material"
                      icd10Codes: ["M54.5"]
                      icd10Descriptions: ["Low back pain"]
                      confidence: 0.6
                    requiresClarification: true
                    clarificationPrompt: "Additional information is needed to determine appropriateness. Please provide: 1) Duration of symptoms, 2) Any prior treatments attempted, 3) Any neurological symptoms such as weakness or numbness, 4) Results of physical examination."
                    attemptNumber: 1
      '400':
        description: Bad Request
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Missing required fields"
      '401':
        description: Unauthorized
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Authentication required"
      '403':
        description: Forbidden
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Insufficient permissions"
      '503':
        description: LLM Service Unavailable
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Validation service temporarily unavailable. Please try again later."

/orders/validate/trial:
  post:
    tags:
      - Validation Engine
      - Trial
    summary: Validate an order in trial mode
    description: |
      Validates a radiology order in trial mode. This endpoint is similar to the regular validation endpoint,
      but does not create any PHI records and is limited to a certain number of validations per trial user.
      
      The validation process is the same as the regular validation endpoint, but without the clarification loop
      or override functionality.
    operationId: validateOrderTrial
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - dictation
              - modalityType
            properties:
              dictation:
                type: string
                description: The clinical dictation text from the physician
              modalityType:
                type: string
                enum: [CT, MRI, XRAY, ULTRASOUND, PET, NUCLEAR]
                description: The type of imaging modality
          example:
            dictation: "72-year-old male with persistent lower back pain radiating to the left leg for 3 weeks. History of degenerative disc disease. Clinical concern for lumbar radiculopathy."
            modalityType: "MRI"
    responses:
      '200':
        description: Validation successful
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    validationResult:
                      type: object
                      properties:
                        cptCode:
                          type: string
                          description: The assigned CPT code
                        cptDescription:
                          type: string
                          description: Description of the CPT code
                        icd10Codes:
                          type: array
                          items:
                            type: string
                          description: The assigned ICD-10 codes
                        icd10Descriptions:
                          type: array
                          items:
                            type: string
                          description: Descriptions of the ICD-10 codes
                        confidence:
                          type: number
                          format: float
                          description: Confidence score of the validation
                    validationsRemaining:
                      type: integer
                      description: Number of validations remaining for the trial user
            example:
              success: true
              data:
                validationResult:
                  cptCode: "72148"
                  cptDescription: "Magnetic resonance (eg, proton) imaging, spinal canal and contents, lumbar; without contrast material"
                  icd10Codes: ["M54.17", "M51.36"]
                  icd10Descriptions: ["Radiculopathy, lumbosacral region", "Other intervertebral disc degeneration, lumbar region"]
                  confidence: 0.95
                validationsRemaining: 9
      '400':
        description: Bad Request
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Missing required fields"
      '401':
        description: Unauthorized
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Authentication required"
      '403':
        description: Forbidden
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Validation limit reached. Please register for a full account to continue using the service."
                error:
                  type: object
                  properties:
                    code:
                      type: string
                      example: "VALIDATION_LIMIT_REACHED"
                    validationsUsed:
                      type: integer
                      example: 10
                    validationsLimit:
                      type: integer
                      example: 10
      '503':
        description: LLM Service Unavailable
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Validation service temporarily unavailable. Please try again later."
                error:
                  type: object
                  properties:
                    code:
                      type: string
                      example: "SERVICE_UNAVAILABLE"

================================================================================
FILE: frontend-explanation\api-docs\openapi\paths\orders.yaml
================================================================================

# Order Management Endpoints

'/orders':
  get:
    tags:
      - Orders
    summary: List orders
    description: |
      Retrieves a list of orders for the current user's organization with optional filtering.
      
      This endpoint returns a paginated list of orders with filtering options for status,
      date range, and other criteria. It's used to display orders in the dashboard.
    operationId: listOrders
    security:
      - bearerAuth: []
    parameters:
      - name: status
        in: query
        description: Filter by order status
        schema:
          type: string
          enum: [pending_admin, pending_validation, all]
          default: all
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
      - name: sortBy
        in: query
        description: Field to sort by
        schema:
          type: string
          enum: [created_at, updated_at, patient_name]
          default: created_at
      - name: sortOrder
        in: query
        description: Sort direction
        schema:
          type: string
          enum: [asc, desc]
          default: desc
    responses:
      '200':
        description: List of orders
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    orders:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/OrderSummary'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/orders/{orderId}':
  get:
    tags:
      - Orders
    summary: Get order details
    description: |
      Retrieves detailed information about a specific order.
      
      This endpoint returns comprehensive information about an order,
      including patient details, validation results, and status information.
    operationId: getOrderDetails
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to retrieve
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Order details
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/OrderDetails'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'
  
  put:
    tags:
      - Orders
    summary: Finalize order
    description: |
      Updates an order with finalized validation information and signature.
      
      This endpoint is used by physicians to finalize and sign an order after validation.
      It changes the order status to "pending_admin" and makes it ready for admin processing.
    operationId: finalizeOrder
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to update
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              final_validation_status:
                type: string
                enum: [appropriate, inappropriate, needs_clarification]
                description: Final validation status
              final_compliance_score:
                type: number
                format: float
                description: Final compliance score
              final_cpt_code:
                type: string
                description: Final CPT code
              clinical_indication:
                type: string
                description: Clinical indication
              overridden:
                type: boolean
                description: Whether the validation was overridden
              override_justification:
                type: string
                description: Justification for override (required if overridden is true)
              signed_by_user_id:
                type: string
                description: ID of the user who signed the order
              signature_date:
                type: string
                format: date-time
                description: Date and time of signature
              signer_name:
                type: string
                description: Name of the signer
            required:
              - final_validation_status
              - final_compliance_score
              - final_cpt_code
              - signed_by_user_id
              - signature_date
    responses:
      '200':
        description: Order finalized successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                orderId:
                  type: string
                  description: ID of the finalized order
                message:
                  type: string
                  example: "Order submitted successfully."
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/orders/{orderId}/admin-update':
  post:
    tags:
      - Orders
    summary: Add administrative updates to an order
    description: |
      Adds administrative updates to an order.
      
      This endpoint allows administrative staff to add notes or updates to an order
      without changing its status or other critical fields.
    operationId: addAdminUpdate
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to update
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              adminNotes:
                type: string
                description: Administrative notes to add to the order
              updateType:
                type: string
                enum: [general, insurance, scheduling]
                description: Type of administrative update
            required:
              - adminNotes
              - updateType
    responses:
      '200':
        description: Administrative update added successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                orderId:
                  type: string
                  description: ID of the updated order
                message:
                  type: string
                  example: "Administrative update added successfully."
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

================================================================================
FILE: frontend-explanation\api-docs\openapi\paths\organizations.yaml
================================================================================

# Organization Management Endpoints

'/organizations/mine':
  get:
    tags:
      - Organizations
    summary: Get current organization
    description: |
      Retrieves detailed information about the current user's organization.
      
      This endpoint returns comprehensive information about the organization
      the authenticated user belongs to, including profile, settings, and locations.
    operationId: getCurrentOrganization
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Current organization details
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/Organization'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'

'/organizations/mine/basic-info':
  patch:
    tags:
      - Organizations
    summary: Update organization basic information
    description: |
      Updates the basic information of the current organization.
      
      This endpoint allows administrators to update basic organization information
      such as name, type, contact email, contact phone, and website.
    operationId: updateOrganizationBasicInfo
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
                description: Organization name
              type:
                type: string
                enum: [referring, radiology, both]
                description: Organization type
              contactEmail:
                type: string
                format: email
                description: Primary contact email
              contactPhone:
                type: string
                description: Primary contact phone
              website:
                type: string
                format: uri
                description: Organization website
    responses:
      '200':
        description: Organization basic information updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Organization ID
                    name:
                      type: string
                      description: Organization name
                    type:
                      type: string
                      enum: [referring, radiology, both]
                      description: Organization type
                    contactEmail:
                      type: string
                      format: email
                      description: Primary contact email
                    contactPhone:
                      type: string
                      description: Primary contact phone
                    website:
                      type: string
                      format: uri
                      description: Organization website
                    updatedAt:
                      type: string
                      format: date-time
                      description: Date and time of the update
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/organizations/mine/address':
  patch:
    tags:
      - Organizations
    summary: Update organization address
    description: |
      Updates the address information of the current organization.
      
      This endpoint allows administrators to update the physical and mailing
      addresses of the organization.
    operationId: updateOrganizationAddress
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              address:
                $ref: '../components/schemas.yaml#/Address'
              mailingAddress:
                $ref: '../components/schemas.yaml#/Address'
              usePhysicalForMailing:
                type: boolean
                description: Whether to use physical address for mailing
    responses:
      '200':
        description: Organization address updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Organization ID
                    address:
                      $ref: '../components/schemas.yaml#/Address'
                    mailingAddress:
                      $ref: '../components/schemas.yaml#/Address'
                    updatedAt:
                      type: string
                      format: date-time
                      description: Date and time of the update
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/organizations/mine/billing-info':
  patch:
    tags:
      - Organizations
    summary: Update organization billing information
    description: |
      Updates the billing information of the current organization.
      
      This endpoint allows administrators to update billing information
      such as billing email, phone, address, and tax ID.
    operationId: updateOrganizationBillingInfo
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              billingEmail:
                type: string
                format: email
                description: Billing email
              billingPhone:
                type: string
                description: Billing phone
              billingAddress:
                $ref: '../components/schemas.yaml#/Address'
              taxId:
                type: string
                description: Tax ID/EIN
              usePhysicalForBilling:
                type: boolean
                description: Whether to use physical address for billing
    responses:
      '200':
        description: Organization billing information updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Organization ID
                    billingInfo:
                      type: object
                      properties:
                        billingEmail:
                          type: string
                          format: email
                          description: Billing email
                        billingPhone:
                          type: string
                          description: Billing phone
                        billingAddress:
                          $ref: '../components/schemas.yaml#/Address'
                        taxId:
                          type: string
                          description: Tax ID/EIN
                    updatedAt:
                      type: string
                      format: date-time
                      description: Date and time of the update
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/organizations/mine/specialties':
  put:
    tags:
      - Organizations
    summary: Update organization specialties
    description: |
      Updates the medical specialties of the current organization.
      
      This endpoint allows administrators to update the list of medical
      specialties offered or required by the organization.
    operationId: updateOrganizationSpecialties
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              specialties:
                type: array
                description: Array of specialty codes
                items:
                  type: string
            required:
              - specialties
    responses:
      '200':
        description: Organization specialties updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Organization ID
                    specialties:
                      type: array
                      description: Array of specialty codes
                      items:
                        type: string
                    updatedAt:
                      type: string
                      format: date-time
                      description: Date and time of the update
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/organizations/mine/settings':
  patch:
    tags:
      - Organizations
    summary: Update organization settings
    description: |
      Updates the settings of the current organization.
      
      This endpoint allows administrators to update organization settings
      such as default language, time zone, date format, and notification preferences.
    operationId: updateOrganizationSettings
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              settings:
                $ref: '../components/schemas.yaml#/OrganizationSettings'
    responses:
      '200':
        description: Organization settings updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Organization ID
                    settings:
                      $ref: '../components/schemas.yaml#/OrganizationSettings'
                    updatedAt:
                      type: string
                      format: date-time
                      description: Date and time of the update
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/organizations/mine/logo-upload-url':
  get:
    tags:
      - Organizations
    summary: Get logo upload URL
    description: |
      Generates a presigned URL for uploading an organization logo.
      
      This endpoint returns a presigned URL that can be used to upload
      an organization logo directly to the storage service.
    operationId: getLogoUploadUrl
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Logo upload URL generated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    presignedUrl:
                      type: string
                      format: uri
                      description: Presigned URL for uploading the logo
                    fileKey:
                      type: string
                      description: The key to use when confirming the upload
                    expiresIn:
                      type: integer
                      description: Expiration time for the URL in seconds
                      example: 3600
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/organizations/mine/logo':
  post:
    tags:
      - Organizations
    summary: Set organization logo
    description: |
      Sets the logo for the current organization.
      
      This endpoint confirms the upload of an organization logo after it has been
      uploaded to the storage service using a presigned URL.
    operationId: setOrganizationLogo
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              fileKey:
                type: string
                description: The key of the uploaded file in the storage service
            required:
              - fileKey
    responses:
      '200':
        description: Organization logo set successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    logoUrl:
                      type: string
                      format: uri
                      description: URL for the uploaded logo
                    thumbnailUrl:
                      type: string
                      format: uri
                      description: URL for a thumbnail version of the logo
                    uploadDate:
                      type: string
                      format: date-time
                      description: Date the logo was uploaded
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
  
  delete:
    tags:
      - Organizations
    summary: Remove organization logo
    description: |
      Removes the logo for the current organization.
      
      This endpoint removes the organization's logo and reverts to the default logo.
    operationId: removeOrganizationLogo
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Organization logo removed successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Organization logo removed successfully"
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/organizations/mine/request-verification':
  post:
    tags:
      - Organizations
    summary: Request organization verification
    description: |
      Requests verification for the current organization.
      
      This endpoint allows administrators to submit verification documents
      and request official verification of the organization.
    operationId: requestOrganizationVerification
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              documents:
                type: array
                description: Array of document IDs that have been previously uploaded
                items:
                  type: string
            required:
              - documents
    responses:
      '200':
        description: Verification request submitted successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    status:
                      type: string
                      enum: [pending]
                      description: Verification status
                    requestDate:
                      type: string
                      format: date-time
                      description: Date the verification was requested
                    documents:
                      type: array
                      description: Array of submitted documents
                      items:
                        type: string
                    nextReviewDate:
                      type: string
                      format: date-time
                      description: Expected date for the next review
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '409':
        description: Verification already in progress
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Verification request already in progress"

'/organizations/mine/verification-status':
  get:
    tags:
      - Organizations
    summary: Get verification status
    description: |
      Retrieves the verification status of the current organization.
      
      This endpoint returns the current status of the organization's
      verification process, including submitted documents and review dates.
    operationId: getVerificationStatus
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Verification status
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    status:
                      type: string
                      enum: [pending, verified, rejected]
                      description: Verification status
                    requestDate:
                      type: string
                      format: date-time
                      description: Date the verification was requested
                    verificationDate:
                      type: string
                      format: date-time
                      description: Date the verification was completed (if verified)
                    rejectionReason:
                      type: string
                      description: Reason for rejection (if rejected)
                    documents:
                      type: array
                      description: Array of submitted documents
                      items:
                        type: string
                    nextReviewDate:
                      type: string
                      format: date-time
                      description: Expected date for the next review
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        description: No verification request found
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "No verification request found for this organization"

'/organizations/mine/deactivate':
  post:
    tags:
      - Organizations
    summary: Deactivate organization
    description: |
      Deactivates the current organization.
      
      This endpoint allows administrators to deactivate their organization,
      which will prevent all users from accessing the system.
    operationId: deactivateOrganization
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              reason:
                type: string
                description: Reason for deactivation
            required:
              - reason
    responses:
      '200':
        description: Organization deactivated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Organization ID
                    status:
                      type: string
                      enum: [inactive]
                      description: Updated organization status
                    deactivatedAt:
                      type: string
                      format: date-time
                      description: Date and time of deactivation
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/organizations/mine/reactivate':
  post:
    tags:
      - Organizations
    summary: Reactivate organization
    description: |
      Reactivates the current organization.
      
      This endpoint allows administrators to reactivate their organization
      after it has been deactivated.
    operationId: reactivateOrganization
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Organization reactivated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Organization ID
                    status:
                      type: string
                      enum: [active]
                      description: Updated organization status
                    reactivatedAt:
                      type: string
                      format: date-time
                      description: Date and time of reactivation
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '409':
        description: Organization is already active
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Organization is already active"

'/organizations/{organizationId}':
  get:
    tags:
      - Organizations
    summary: Get organization by ID
    description: |
      Retrieves an organization by its ID.
      
      This endpoint returns public information about a specific organization,
      which is useful for viewing potential connection partners.
    operationId: getOrganizationById
    security:
      - bearerAuth: []
    parameters:
      - name: organizationId
        in: path
        description: ID of the organization to retrieve
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Organization details
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/OrganizationPublic'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '404':
        $ref: '../components/responses.yaml#/NotFound'

'/organizations/search':
  get:
    tags:
      - Organizations
    summary: Search organizations
    description: |
      Searches for organizations based on various criteria.
      
      This endpoint returns a paginated list of organizations matching the search criteria,
      which is useful for finding potential connection partners.
    operationId: searchOrganizations
    security:
      - bearerAuth: []
    parameters:
      - name: q
        in: query
        description: Search term for organization name
        schema:
          type: string
      - name: type
        in: query
        description: Filter by organization type
        schema:
          type: string
          enum: [referring, radiology, both]
      - name: state
        in: query
        description: Filter by state/province
        schema:
          type: string
      - name: specialty
        in: query
        description: Filter by specialty
        schema:
          type: string
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        description: Search results
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    organizations:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/OrganizationPublic'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'

================================================================================
FILE: frontend-explanation\api-docs\openapi\paths\radiology-orders.yaml
================================================================================

# Radiology Order Management Endpoints

'/radiology/orders':
  get:
    tags:
      - Radiology
      - Orders
    summary: List radiology orders
    description: |
      Retrieves a list of orders for a radiology organization with optional filtering.
      
      This endpoint returns a paginated list of orders that have been sent to the radiology
      organization, with filtering options for status, priority, modality, and referring organization.
    operationId: listRadiologyOrders
    security:
      - bearerAuth: []
    parameters:
      - name: status
        in: query
        description: Filter by order status
        schema:
          type: string
          enum: [pending_radiology, scheduled, completed, all]
          default: pending_radiology
      - name: priority
        in: query
        description: Filter by priority
        schema:
          type: string
          enum: [routine, stat]
      - name: modality
        in: query
        description: Filter by modality
        schema:
          type: string
          enum: [MRI, CT, XRAY, ULTRASOUND, PET, NUCLEAR]
      - name: referringOrgId
        in: query
        description: Filter by referring organization ID
        schema:
          type: string
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
      - name: sortBy
        in: query
        description: Field to sort by
        schema:
          type: string
          enum: [created_at, updated_at, patient_name]
          default: created_at
      - name: sortOrder
        in: query
        description: Sort direction
        schema:
          type: string
          enum: [asc, desc]
          default: desc
    responses:
      '200':
        description: List of radiology orders
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    orders:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/RadiologyOrderSummary'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/radiology/orders/{orderId}':
  get:
    tags:
      - Radiology
      - Orders
    summary: Get radiology order details
    description: |
      Retrieves detailed information about a specific radiology order.
      
      This endpoint returns comprehensive information about a radiology order,
      including patient details, insurance information, clinical records, and documents.
    operationId: getRadiologyOrderDetails
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to retrieve
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Radiology order details
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/RadiologyOrderDetails'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/radiology/orders/{orderId}/export/{format}':
  get:
    tags:
      - Radiology
      - Orders
    summary: Export radiology order
    description: |
      Exports a radiology order in the specified format.
      
      This endpoint allows exporting order data for integration with external systems
      or for reporting purposes. Supported formats are JSON and CSV.
    operationId: exportRadiologyOrder
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to export
        required: true
        schema:
          type: string
      - name: format
        in: path
        description: Export format
        required: true
        schema:
          type: string
          enum: [json, csv]
    responses:
      '200':
        description: Exported order data
        content:
          application/json:
            schema:
              type: object
          text/csv:
            schema:
              type: string
      '400':
        description: Invalid format
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Invalid export format. Supported formats: json, csv"
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/radiology/orders/{orderId}/update-status':
  post:
    tags:
      - Radiology
      - Orders
    summary: Update radiology order status
    description: |
      Updates the status of a radiology order.
      
      This endpoint allows radiology staff to update the status of an order
      as it progresses through the workflow (e.g., from pending to scheduled to completed).
    operationId: updateRadiologyOrderStatus
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to update
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              newStatus:
                type: string
                enum: [pending_radiology, scheduled, completed, cancelled]
                description: New status for the order
              scheduledDate:
                type: string
                format: date-time
                description: Scheduled date (required when status is 'scheduled')
              completedDate:
                type: string
                format: date-time
                description: Completed date (required when status is 'completed')
              notes:
                type: string
                description: Additional notes about the status change
            required:
              - newStatus
    responses:
      '200':
        description: Order status updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                orderId:
                  type: string
                  description: ID of the updated order
                previousStatus:
                  type: string
                  description: Previous status of the order
                newStatus:
                  type: string
                  description: New status of the order
                message:
                  type: string
                  example: "Order status updated to scheduled"
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/radiology/orders/{orderId}/request-info':
  post:
    tags:
      - Radiology
      - Orders
    summary: Request additional information
    description: |
      Allows radiology staff to request additional information for an order from the referring organization.
      
      This endpoint creates an information request that will be visible to the referring organization,
      and optionally sends a notification to the referring physician or admin staff.
    operationId: requestAdditionalInfo
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order for which additional information is being requested
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              requestedInfoType:
                type: string
                enum: [labs, prior_imaging, clarification, patient_info, insurance_info, other]
                description: Type of information being requested
              requestedInfoDetails:
                type: string
                description: Detailed description of the information being requested
              urgency:
                type: string
                enum: [low, medium, high]
                default: medium
                description: Urgency of the request
              notifyPhysician:
                type: boolean
                default: true
                description: Whether to notify the referring physician
            required:
              - requestedInfoType
              - requestedInfoDetails
    responses:
      '200':
        description: Information request created successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                orderId:
                  type: string
                  description: ID of the order
                requestId:
                  type: string
                  description: ID of the created information request
                message:
                  type: string
                  example: "Information request created successfully"
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/radiology/orders/{orderId}/results':
  post:
    tags:
      - Radiology
      - Orders
    summary: Submit results
    description: |
      Submits results for a completed radiology order.
      
      This endpoint allows radiologists to submit findings and results for a completed order,
      which can then be accessed by the referring physician.
      
      Note: This endpoint is planned for future implementation.
    operationId: submitResults
    security:
      - bearerAuth: []
    parameters:
      - name: orderId
        in: path
        description: ID of the order to submit results for
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              findings:
                type: string
                description: Detailed findings from the radiologist
              impression:
                type: string
                description: Impression or conclusion
              recommendedFollowUp:
                type: string
                description: Recommended follow-up actions
              documentIds:
                type: array
                items:
                  type: string
                description: IDs of uploaded documents (e.g., images, reports)
            required:
              - findings
              - impression
    responses:
      '200':
        description: Results submitted successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                orderId:
                  type: string
                  description: ID of the order
                message:
                  type: string
                  example: "Results submitted successfully"
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

================================================================================
FILE: frontend-explanation\api-docs\openapi\paths\superadmin.yaml
================================================================================

# Super Admin Management Endpoints

# Organizations endpoints
'/superadmin/organizations':
  get:
    tags:
      - SuperAdmin
      - Organizations
    summary: List organizations
    description: |
      Retrieves a list of all organizations in the system.
      
      This endpoint returns a list of all organizations with basic information,
      allowing superadmins to view and manage organizations across the platform.
    operationId: listOrganizations
    security:
      - bearerAuth: []
    parameters:
      - name: name
        in: query
        description: Filter by organization name
        schema:
          type: string
      - name: type
        in: query
        description: Filter by organization type
        schema:
          type: string
          enum: [referring, radiology_group, both]
      - name: status
        in: query
        description: Filter by organization status
        schema:
          type: string
          enum: [active, on_hold, purgatory, terminated]
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        description: List of organizations
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                count:
                  type: integer
                  description: Total number of organizations
                data:
                  type: array
                  items:
                    $ref: '../components/schemas.yaml#/OrganizationSummary'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/superadmin/organizations/{orgId}':
  get:
    tags:
      - SuperAdmin
      - Organizations
    summary: Get organization details
    description: |
      Retrieves detailed information about a specific organization.
      
      This endpoint returns comprehensive information about an organization,
      including users, connections, and billing history.
    operationId: getOrganizationDetails
    security:
      - bearerAuth: []
    parameters:
      - name: orgId
        in: path
        description: ID of the organization to retrieve
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Organization details
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    organization:
                      $ref: '../components/schemas.yaml#/Organization'
                    users:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/UserSummary'
                    connections:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/ConnectionSummary'
                    billingHistory:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/BillingEvent'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/superadmin/organizations/{orgId}/status':
  put:
    tags:
      - SuperAdmin
      - Organizations
    summary: Update organization status
    description: |
      Updates an organization's status.
      
      This endpoint allows superadmins to change an organization's status,
      which affects its ability to use the platform.
    operationId: updateOrganizationStatus
    security:
      - bearerAuth: []
    parameters:
      - name: orgId
        in: path
        description: ID of the organization to update
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              status:
                type: string
                enum: [active, on_hold, purgatory, terminated]
                description: New status for the organization
              reason:
                type: string
                description: Reason for the status change
            required:
              - status
    responses:
      '200':
        description: Organization status updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Organization ID
                    previousStatus:
                      type: string
                      description: Previous status
                    newStatus:
                      type: string
                      description: New status
                    updatedAt:
                      type: string
                      format: date-time
                      description: Date and time of the update
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/superadmin/organizations/{orgId}/credits/adjust':
  post:
    tags:
      - SuperAdmin
      - Organizations
    summary: Adjust organization credits
    description: |
      Adjusts an organization's credit balance.
      
      This endpoint allows superadmins to add or remove credits from an organization's balance,
      with a reason for the adjustment.
    operationId: adjustOrganizationCredits
    security:
      - bearerAuth: []
    parameters:
      - name: orgId
        in: path
        description: ID of the organization to adjust credits for
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              amount:
                type: integer
                description: Amount of credits to add (positive) or remove (negative)
              reason:
                type: string
                description: Reason for the credit adjustment
            required:
              - amount
              - reason
    responses:
      '200':
        description: Credits adjusted successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Organization ID
                    previousBalance:
                      type: integer
                      description: Previous credit balance
                    newBalance:
                      type: integer
                      description: New credit balance
                    adjustment:
                      type: integer
                      description: Amount of credits adjusted
                    reason:
                      type: string
                      description: Reason for the adjustment
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

# Users endpoints
'/superadmin/users':
  get:
    tags:
      - SuperAdmin
      - Users
    summary: List users
    description: |
      Retrieves a list of all users in the system.
      
      This endpoint returns a list of all users with basic information,
      allowing superadmins to view and manage users across the platform.
    operationId: listUsers
    security:
      - bearerAuth: []
    parameters:
      - name: email
        in: query
        description: Filter by user email
        schema:
          type: string
      - name: organizationId
        in: query
        description: Filter by organization ID
        schema:
          type: string
      - name: role
        in: query
        description: Filter by user role
        schema:
          type: string
          enum: [admin_referring, admin_radiology, physician, admin_staff, radiologist, scheduler, super_admin]
      - name: isActive
        in: query
        description: Filter by active status
        schema:
          type: boolean
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        description: List of users
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                count:
                  type: integer
                  description: Total number of users
                data:
                  type: array
                  items:
                    $ref: '../components/schemas.yaml#/UserSummary'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/superadmin/users/{userId}':
  get:
    tags:
      - SuperAdmin
      - Users
    summary: Get user details
    description: |
      Retrieves detailed information about a specific user.
      
      This endpoint returns comprehensive information about a user,
      including their organization, assigned locations, and activity history.
    operationId: getUserDetails
    security:
      - bearerAuth: []
    parameters:
      - name: userId
        in: path
        description: ID of the user to retrieve
        required: true
        schema:
          type: string
    responses:
      '200':
        description: User details
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/UserDetails'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/superadmin/users/{userId}/status':
  put:
    tags:
      - SuperAdmin
      - Users
    summary: Update user status
    description: |
      Updates a user's active status.
      
      This endpoint allows superadmins to activate or deactivate a user,
      which affects their ability to log in and use the platform.
    operationId: updateUserStatus
    security:
      - bearerAuth: []
    parameters:
      - name: userId
        in: path
        description: ID of the user to update
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              isActive:
                type: boolean
                description: New active status for the user
              reason:
                type: string
                description: Reason for the status change
            required:
              - isActive
    responses:
      '200':
        description: User status updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      description: User ID
                    previousStatus:
                      type: boolean
                      description: Previous active status
                    newStatus:
                      type: boolean
                      description: New active status
                    updatedAt:
                      type: string
                      format: date-time
                      description: Date and time of the update
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

# System Logs endpoints
'/superadmin/logs/validation':
  get:
    tags:
      - SuperAdmin
      - Logs
    summary: Get validation logs
    description: |
      Retrieves LLM validation logs with basic filtering capabilities.
      
      This endpoint returns a list of validation logs with information about
      validation attempts, including status, tokens used, and latency.
    operationId: getValidationLogs
    security:
      - bearerAuth: []
    parameters:
      - name: organization_id
        in: query
        description: Filter by organization ID
        schema:
          type: string
      - name: user_id
        in: query
        description: Filter by user ID
        schema:
          type: string
      - name: date_range_start
        in: query
        description: Filter by start date (YYYY-MM-DD)
        schema:
          type: string
          format: date
      - name: date_range_end
        in: query
        description: Filter by end date (YYYY-MM-DD)
        schema:
          type: string
          format: date
      - name: status
        in: query
        description: Filter by validation status
        schema:
          type: string
      - name: llm_provider
        in: query
        description: Filter by LLM provider
        schema:
          type: string
      - name: model_name
        in: query
        description: Filter by model name
        schema:
          type: string
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 50
      - name: offset
        in: query
        description: Offset for pagination
        schema:
          type: integer
          minimum: 0
          default: 0
    responses:
      '200':
        description: Validation logs
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: array
                  items:
                    $ref: '../components/schemas.yaml#/ValidationLog'
                pagination:
                  type: object
                  properties:
                    total:
                      type: integer
                      description: Total number of logs
                    limit:
                      type: integer
                      description: Number of items per page
                    offset:
                      type: integer
                      description: Current offset
                    has_more:
                      type: boolean
                      description: Whether there are more logs to fetch
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/superadmin/logs/validation/enhanced':
  get:
    tags:
      - SuperAdmin
      - Logs
    summary: Get enhanced validation logs
    description: |
      Retrieves LLM validation logs with advanced filtering capabilities.
      
      This endpoint extends the basic validation logs endpoint with additional
      filtering options, including multiple status selection, text search,
      date presets, and sorting options.
    operationId: getEnhancedValidationLogs
    security:
      - bearerAuth: []
    parameters:
      - name: organization_id
        in: query
        description: Filter by organization ID
        schema:
          type: string
      - name: user_id
        in: query
        description: Filter by user ID
        schema:
          type: string
      - name: statuses
        in: query
        description: Filter by multiple validation statuses (comma-separated)
        schema:
          type: string
      - name: llm_providers
        in: query
        description: Filter by multiple LLM providers (comma-separated)
        schema:
          type: string
      - name: model_names
        in: query
        description: Filter by multiple model names (comma-separated)
        schema:
          type: string
      - name: search_text
        in: query
        description: Text search across relevant fields
        schema:
          type: string
      - name: date_preset
        in: query
        description: Predefined date range
        schema:
          type: string
          enum: [today, yesterday, last_7_days, last_30_days, this_month, last_month, custom]
      - name: date_range_start
        in: query
        description: Filter by start date (YYYY-MM-DD) when date_preset is 'custom'
        schema:
          type: string
          format: date
      - name: date_range_end
        in: query
        description: Filter by end date (YYYY-MM-DD) when date_preset is 'custom'
        schema:
          type: string
          format: date
      - name: sort_by
        in: query
        description: Field to sort by
        schema:
          type: string
          enum: [created_at, latency_ms, total_tokens, status]
          default: created_at
      - name: sort_direction
        in: query
        description: Sort direction
        schema:
          type: string
          enum: [asc, desc]
          default: desc
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 50
      - name: offset
        in: query
        description: Offset for pagination
        schema:
          type: integer
          minimum: 0
          default: 0
    responses:
      '200':
        description: Enhanced validation logs
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: array
                  items:
                    $ref: '../components/schemas.yaml#/EnhancedValidationLog'
                pagination:
                  type: object
                  properties:
                    total:
                      type: integer
                      description: Total number of logs
                    limit:
                      type: integer
                      description: Number of items per page
                    offset:
                      type: integer
                      description: Current offset
                    has_more:
                      type: boolean
                      description: Whether there are more logs to fetch
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/superadmin/logs/credits':
  get:
    tags:
      - SuperAdmin
      - Logs
    summary: Get credit usage logs
    description: |
      Retrieves credit usage logs with filtering capabilities.
      
      This endpoint returns a list of credit usage logs, showing when and how
      credits were consumed or added across the platform.
    operationId: getCreditUsageLogs
    security:
      - bearerAuth: []
    parameters:
      - name: organization_id
        in: query
        description: Filter by organization ID
        schema:
          type: string
      - name: user_id
        in: query
        description: Filter by user ID
        schema:
          type: string
      - name: date_range_start
        in: query
        description: Filter by start date (YYYY-MM-DD)
        schema:
          type: string
          format: date
      - name: date_range_end
        in: query
        description: Filter by end date (YYYY-MM-DD)
        schema:
          type: string
          format: date
      - name: action_type
        in: query
        description: Filter by action type
        schema:
          type: string
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 50
      - name: offset
        in: query
        description: Offset for pagination
        schema:
          type: integer
          minimum: 0
          default: 0
    responses:
      '200':
        description: Credit usage logs
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: array
                  items:
                    $ref: '../components/schemas.yaml#/CreditUsageLog'
                pagination:
                  type: object
                  properties:
                    total:
                      type: integer
                      description: Total number of logs
                    limit:
                      type: integer
                      description: Number of items per page
                    offset:
                      type: integer
                      description: Current offset
                    has_more:
                      type: boolean
                      description: Whether there are more logs to fetch
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

'/superadmin/logs/purgatory':
  get:
    tags:
      - SuperAdmin
      - Logs
    summary: Get purgatory events
    description: |
      Retrieves purgatory events with filtering capabilities.
      
      This endpoint returns a list of purgatory events, showing when organizations
      were placed in or removed from purgatory status.
    operationId: getPurgatoryEvents
    security:
      - bearerAuth: []
    parameters:
      - name: organization_id
        in: query
        description: Filter by organization ID
        schema:
          type: string
      - name: date_range_start
        in: query
        description: Filter by start date (YYYY-MM-DD)
        schema:
          type: string
          format: date
      - name: date_range_end
        in: query
        description: Filter by end date (YYYY-MM-DD)
        schema:
          type: string
          format: date
      - name: status
        in: query
        description: Filter by status
        schema:
          type: string
          enum: [to_purgatory, from_purgatory]
      - name: reason
        in: query
        description: Filter by reason
        schema:
          type: string
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 50
      - name: offset
        in: query
        description: Offset for pagination
        schema:
          type: integer
          minimum: 0
          default: 0
    responses:
      '200':
        description: Purgatory events
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: array
                  items:
                    $ref: '../components/schemas.yaml#/PurgatoryEvent'
                pagination:
                  type: object
                  properties:
                    total:
                      type: integer
                      description: Total number of events
                    limit:
                      type: integer
                      description: Number of items per page
                    offset:
                      type: integer
                      description: Current offset
                    has_more:
                      type: boolean
                      description: Whether there are more events to fetch
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '500':
        $ref: '../components/responses.yaml#/InternalServerError'

================================================================================
FILE: frontend-explanation\api-docs\openapi\paths\uploads.yaml
================================================================================

# File Upload Endpoints

'/uploads/presigned-url':
  post:
    tags:
      - Uploads
    summary: Get presigned URL for file upload
    description: |
      Generates a presigned URL for direct file upload to storage.
      
      This endpoint returns a presigned URL that can be used to upload a file directly
      to the storage service, along with an upload ID for tracking the upload.
    operationId: getPresignedUrl
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              fileName:
                type: string
                description: Original file name
              fileType:
                type: string
                description: MIME type of the file
              fileSize:
                type: integer
                description: Size of the file in bytes
              purpose:
                type: string
                enum: [order_attachment, patient_record, organization_document]
                description: Purpose of the upload
              associatedId:
                type: string
                description: ID of the associated entity (optional)
            required:
              - fileName
              - fileType
              - fileSize
              - purpose
    responses:
      '200':
        description: Presigned URL generated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    uploadId:
                      type: string
                      description: Unique identifier for this upload
                    presignedUrl:
                      type: string
                      format: uri
                      description: The S3 presigned URL for uploading
                    fileKey:
                      type: string
                      description: The S3 object key for the file
                    expiresIn:
                      type: integer
                      description: Expiration time for the presigned URL in seconds
                    fields:
                      type: object
                      description: Additional fields to include in the upload form (for POST uploads)
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '413':
        description: File size exceeds limit
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "File size exceeds the maximum limit of 50MB"
      '415':
        description: Unsupported file type
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "File type not allowed"

'/uploads/{uploadId}/complete':
  post:
    tags:
      - Uploads
    summary: Complete file upload
    description: |
      Notifies the API that a file upload is complete.
      
      This endpoint should be called after successfully uploading a file to the storage service
      using the presigned URL. It updates the upload status and makes the file available for use.
    operationId: completeUpload
    security:
      - bearerAuth: []
    parameters:
      - name: uploadId
        in: path
        description: ID of the upload to complete
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Upload completed successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    uploadId:
                      type: string
                      description: The upload ID
                    status:
                      type: string
                      enum: [completed]
                      description: Upload status
                    fileUrl:
                      type: string
                      format: uri
                      description: URL for accessing the file
                    fileName:
                      type: string
                      description: Original file name
                    fileType:
                      type: string
                      description: MIME type of the file
                    fileSize:
                      type: integer
                      description: Size of the file in bytes
                    uploadDate:
                      type: string
                      format: date-time
                      description: Date and time of the upload
                    expiryDate:
                      type: string
                      format: date-time
                      description: Date and time when the file will expire (if applicable)
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '404':
        description: Upload not found
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Upload not found"
      '409':
        description: Upload already completed
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Upload already completed"

'/uploads/{uploadId}/associate':
  post:
    tags:
      - Uploads
    summary: Associate file with entity
    description: |
      Associates an uploaded file with an entity.
      
      This endpoint allows associating a file with an entity after upload,
      such as an order, patient, or organization.
    operationId: associateFile
    security:
      - bearerAuth: []
    parameters:
      - name: uploadId
        in: path
        description: ID of the upload to associate
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              entityType:
                type: string
                enum: [order, patient, organization, user]
                description: Type of entity to associate with
              entityId:
                type: string
                description: ID of the entity to associate with
            required:
              - entityType
              - entityId
    responses:
      '200':
        description: File associated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    uploadId:
                      type: string
                      description: The upload ID
                    entityType:
                      type: string
                      description: Type of associated entity
                    entityId:
                      type: string
                      description: ID of associated entity
                    associationDate:
                      type: string
                      format: date-time
                      description: Date and time of the association
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        description: Upload or entity not found
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Upload or entity not found"
      '409':
        description: File already associated
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "File is already associated with this entity"

'/uploads/{uploadId}/disassociate':
  post:
    tags:
      - Uploads
    summary: Disassociate file from entity
    description: |
      Removes the association between a file and an entity.
      
      This endpoint allows removing the association between a file and an entity,
      such as an order, patient, or organization.
    operationId: disassociateFile
    security:
      - bearerAuth: []
    parameters:
      - name: uploadId
        in: path
        description: ID of the upload to disassociate
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              entityType:
                type: string
                enum: [order, patient, organization, user]
                description: Type of entity to disassociate from
              entityId:
                type: string
                description: ID of the entity to disassociate from
            required:
              - entityType
              - entityId
    responses:
      '200':
        description: File disassociated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    uploadId:
                      type: string
                      description: The upload ID
                    entityType:
                      type: string
                      description: Type of disassociated entity
                    entityId:
                      type: string
                      description: ID of disassociated entity
                    disassociationDate:
                      type: string
                      format: date-time
                      description: Date and time of the disassociation
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        description: Upload or association not found
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Upload or association not found"

'/uploads/by-entity/{entityType}/{entityId}':
  get:
    tags:
      - Uploads
    summary: List files by entity
    description: |
      Retrieves files associated with a specific entity.
      
      This endpoint returns a paginated list of files associated with a specific entity,
      such as an order, patient, or organization.
    operationId: getFilesByEntity
    security:
      - bearerAuth: []
    parameters:
      - name: entityType
        in: path
        description: Type of entity
        required: true
        schema:
          type: string
          enum: [order, patient, organization, user]
      - name: entityId
        in: path
        description: ID of the entity
        required: true
        schema:
          type: string
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        description: List of files
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    files:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/FileRecord'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        description: Entity not found
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Entity not found"

'/uploads/by-purpose/{purpose}':
  get:
    tags:
      - Uploads
    summary: List files by purpose
    description: |
      Retrieves files filtered by purpose.
      
      This endpoint returns a paginated list of files filtered by their purpose,
      such as order attachments, patient records, or organization documents.
    operationId: getFilesByPurpose
    security:
      - bearerAuth: []
    parameters:
      - name: purpose
        in: path
        description: Purpose of the files
        required: true
        schema:
          type: string
          enum: [order_attachment, patient_record, organization_document, user_profile, system_report]
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        description: List of files
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    files:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/FileRecord'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/uploads/recent':
  get:
    tags:
      - Uploads
    summary: List recent uploads
    description: |
      Retrieves recently uploaded files.
      
      This endpoint returns a paginated list of files that were recently uploaded,
      optionally filtered by the number of days.
    operationId: getRecentUploads
    security:
      - bearerAuth: []
    parameters:
      - name: days
        in: query
        description: Number of days to look back
        schema:
          type: integer
          minimum: 1
          maximum: 90
          default: 7
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        description: List of recent uploads
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    files:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/FileRecord'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'

'/uploads/{uploadId}/metadata':
  get:
    tags:
      - Uploads
    summary: Get file metadata
    description: |
      Retrieves metadata for a specific file.
      
      This endpoint returns detailed metadata about a file,
      including its associations, upload information, and content details.
    operationId: getFileMetadata
    security:
      - bearerAuth: []
    parameters:
      - name: uploadId
        in: path
        description: ID of the upload to retrieve metadata for
        required: true
        schema:
          type: string
    responses:
      '200':
        description: File metadata
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/FileMetadata'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        description: File not found
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "File not found"
  
  patch:
    tags:
      - Uploads
    summary: Update file metadata
    description: |
      Updates metadata for a specific file.
      
      This endpoint allows updating file metadata such as file name,
      purpose, tags, and custom metadata.
    operationId: updateFileMetadata
    security:
      - bearerAuth: []
    parameters:
      - name: uploadId
        in: path
        description: ID of the upload to update metadata for
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              fileName:
                type: string
                description: Updated file name
              purpose:
                type: string
                enum: [order_attachment, patient_record, organization_document, user_profile, system_report]
                description: Updated purpose
              tags:
                type: array
                description: Array of tags
                items:
                  type: string
              description:
                type: string
                description: File description
              customMetadata:
                type: object
                description: Object with custom metadata fields
    responses:
      '200':
        description: File metadata updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/FileMetadata'
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        description: File not found
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "File not found"

'/uploads/{uploadId}/download-url':
  get:
    tags:
      - Uploads
    summary: Generate download URL
    description: |
      Generates a temporary URL for downloading a file.
      
      This endpoint returns a presigned URL that can be used to download a file,
      with an optional expiration time.
    operationId: getDownloadUrl
    security:
      - bearerAuth: []
    parameters:
      - name: uploadId
        in: path
        description: ID of the upload to generate a download URL for
        required: true
        schema:
          type: string
      - name: expiresIn
        in: query
        description: Expiration time for the URL in seconds
        schema:
          type: integer
          minimum: 60
          maximum: 86400
          default: 3600
    responses:
      '200':
        description: Download URL generated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    downloadUrl:
                      type: string
                      format: uri
                      description: Temporary URL for downloading the file
                    expiresAt:
                      type: string
                      format: date-time
                      description: Expiration time for the download URL
                    fileName:
                      type: string
                      description: Original file name
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        description: File not found
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "File not found"

================================================================================
FILE: frontend-explanation\api-docs\openapi\paths\users.yaml
================================================================================

# User Management Endpoints

'/users':
  get:
    tags:
      - Users
    summary: List users in organization
    description: |
      Retrieves a list of users in the current organization.
      
      This endpoint returns a paginated list of users in the organization,
      with optional filtering by status, role, location, and search term.
      Requires administrator role.
    operationId: listUsers
    security:
      - bearerAuth: []
    parameters:
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
      - name: status
        in: query
        description: Filter by user status
        schema:
          type: string
          enum: [active, inactive, pending]
      - name: role
        in: query
        description: Filter by user role
        schema:
          type: string
          enum: [admin, physician, staff, radiologist]
      - name: locationId
        in: query
        description: Filter by assigned location
        schema:
          type: string
      - name: search
        in: query
        description: Search term for user name or email
        schema:
          type: string
    responses:
      '200':
        description: List of users
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    users:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/UserSummary'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
  
  post:
    tags:
      - Users
    summary: Create a new user
    description: |
      Creates a new user in the organization.
      
      This endpoint creates a new user with the specified information
      and optionally sends an invitation email. Requires administrator role.
    operationId: createUser
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                format: email
                description: User's email address
              firstName:
                type: string
                description: User's first name
              lastName:
                type: string
                description: User's last name
              role:
                type: string
                enum: [admin, physician, staff, radiologist]
                description: User's role
              specialty:
                type: string
                description: User's medical specialty (required for physicians)
              phoneNumber:
                type: string
                description: User's phone number
              sendInvite:
                type: boolean
                description: Whether to send an invitation email
                default: true
              locationAssignments:
                type: array
                description: Locations to assign to the user
                items:
                  type: object
                  properties:
                    locationId:
                      type: string
                      description: Location ID
                    isPrimary:
                      type: boolean
                      description: Whether this is the primary location
            required:
              - email
              - firstName
              - lastName
              - role
    responses:
      '201':
        description: User created successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/User'
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '409':
        description: Email already in use
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: "Email address is already in use"

'/users/me':
  get:
    tags:
      - Users
    summary: Get current user profile
    description: |
      Retrieves the profile of the currently authenticated user.
      
      This endpoint returns detailed information about the current user,
      including their profile, settings, and organization information.
    operationId: getCurrentUser
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Current user profile
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/User'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
  
  patch:
    tags:
      - Users
    summary: Update current user profile
    description: |
      Updates the profile of the currently authenticated user.
      
      This endpoint allows users to update their own profile information,
      such as name, phone number, specialty, and settings.
    operationId: updateCurrentUser
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              firstName:
                type: string
                description: User's first name
              lastName:
                type: string
                description: User's last name
              phoneNumber:
                type: string
                description: User's phone number
              specialty:
                type: string
                description: User's medical specialty (for physicians)
              settings:
                $ref: '../components/schemas.yaml#/UserSettings'
    responses:
      '200':
        description: Profile updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/User'
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'

'/users/me/notification-preferences':
  patch:
    tags:
      - Users
    summary: Update notification preferences
    description: |
      Updates the notification preferences of the currently authenticated user.
      
      This endpoint allows users to update their notification preferences
      for email, in-app, and SMS notifications.
    operationId: updateNotificationPreferences
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              preferences:
                $ref: '../components/schemas.yaml#/NotificationPreferences'
    responses:
      '200':
        description: Notification preferences updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/NotificationPreferences'
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'

'/users/me/ui-preferences':
  patch:
    tags:
      - Users
    summary: Update UI preferences
    description: |
      Updates the UI preferences of the currently authenticated user.
      
      This endpoint allows users to update their UI preferences,
      such as theme, font size, and layout options.
    operationId: updateUiPreferences
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              preferences:
                $ref: '../components/schemas.yaml#/UiPreferences'
    responses:
      '200':
        description: UI preferences updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/UiPreferences'
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'

'/users/me/profile-image':
  post:
    tags:
      - Users
    summary: Set profile image
    description: |
      Sets the profile image for the currently authenticated user.
      
      This endpoint confirms the upload of a profile image after it has been
      uploaded to the storage service using a presigned URL.
    operationId: setProfileImage
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              fileKey:
                type: string
                description: The key of the uploaded file in the storage service
            required:
              - fileKey
    responses:
      '200':
        description: Profile image set successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    profileImageUrl:
                      type: string
                      format: uri
                      description: URL for the uploaded profile image
                    thumbnailUrl:
                      type: string
                      format: uri
                      description: URL for a thumbnail version of the profile image
                    uploadDate:
                      type: string
                      format: date-time
                      description: Date the image was uploaded
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
  
  delete:
    tags:
      - Users
    summary: Remove profile image
    description: |
      Removes the profile image for the currently authenticated user.
      
      This endpoint removes the user's profile image and reverts to the default avatar.
    operationId: removeProfileImage
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Profile image removed successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Profile image removed successfully"
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'

'/users/me/profile-image-upload-url':
  get:
    tags:
      - Users
    summary: Get profile image upload URL
    description: |
      Generates a presigned URL for uploading a profile image.
      
      This endpoint returns a presigned URL that can be used to upload
      a profile image directly to the storage service.
    operationId: getProfileImageUploadUrl
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Profile image upload URL generated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    presignedUrl:
                      type: string
                      format: uri
                      description: Presigned URL for uploading the image
                    fileKey:
                      type: string
                      description: The key to use when confirming the upload
                    expiresIn:
                      type: integer
                      description: Expiration time for the URL in seconds
                      example: 3600
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'

'/users/me/login-history':
  get:
    tags:
      - Users
    summary: Get login history
    description: |
      Retrieves the login history for the currently authenticated user.
      
      This endpoint returns a paginated list of login events for the current user,
      including timestamps, IP addresses, and device information.
    operationId: getLoginHistory
    security:
      - bearerAuth: []
    parameters:
      - name: page
        in: query
        description: Page number for pagination
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Number of items per page
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
    responses:
      '200':
        description: Login history
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    logins:
                      type: array
                      items:
                        $ref: '../components/schemas.yaml#/LoginRecord'
                    pagination:
                      $ref: '../components/schemas.yaml#/Pagination'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'

'/users/{userId}':
  get:
    tags:
      - Users
    summary: Get user by ID
    description: |
      Retrieves a user by their ID.
      
      This endpoint returns detailed information about a specific user.
      Requires administrator role.
    operationId: getUserById
    security:
      - bearerAuth: []
    parameters:
      - name: userId
        in: path
        description: ID of the user to retrieve
        required: true
        schema:
          type: string
    responses:
      '200':
        description: User details
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/User'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'
  
  patch:
    tags:
      - Users
    summary: Update user
    description: |
      Updates a user's information.
      
      This endpoint allows administrators to update a user's information,
      including their role, status, and profile details.
    operationId: updateUser
    security:
      - bearerAuth: []
    parameters:
      - name: userId
        in: path
        description: ID of the user to update
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              firstName:
                type: string
                description: User's first name
              lastName:
                type: string
                description: User's last name
              role:
                type: string
                enum: [admin, physician, staff, radiologist]
                description: User's role
              status:
                type: string
                enum: [active, inactive]
                description: User's status
              specialty:
                type: string
                description: User's medical specialty (for physicians)
              phoneNumber:
                type: string
                description: User's phone number
    responses:
      '200':
        description: User updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas.yaml#/User'
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'

'/users/{userId}/status':
  patch:
    tags:
      - Users
    summary: Update user status
    description: |
      Updates a user's status.
      
      This endpoint allows administrators to activate or deactivate a user.
    operationId: updateUserStatus
    security:
      - bearerAuth: []
    parameters:
      - name: userId
        in: path
        description: ID of the user to update
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              status:
                type: string
                enum: [active, inactive]
                description: New user status
              reason:
                type: string
                description: Reason for the status change (required for deactivation)
            required:
              - status
    responses:
      '200':
        description: User status updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    userId:
                      type: string
                      description: User ID
                    status:
                      type: string
                      enum: [active, inactive]
                      description: Updated user status
                    updatedAt:
                      type: string
                      format: date-time
                      description: Date and time of the update
      '400':
        $ref: '../components/responses.yaml#/BadRequest'
      '401':
        $ref: '../components/responses.yaml#/Unauthorized'
      '403':
        $ref: '../components/responses.yaml#/Forbidden'
      '404':
        $ref: '../components/responses.yaml#/NotFound'

================================================================================
FILE: frontend-explanation\api-docs\openapi\tags.yaml
================================================================================

# API Tags

- name: Authentication
  description: Endpoints for user authentication and registration

- name: Users
  description: User management endpoints

- name: Organizations
  description: Organization management endpoints

- name: Locations
  description: Location management endpoints

- name: Connections
  description: Connection management between organizations

- name: Orders
  description: Order management endpoints

- name: Validation Engine
  description: Clinical validation endpoints for processing dictations and assigning CPT and ICD-10 codes

- name: Admin
  description: Administrative endpoints for order finalization

- name: Radiology
  description: Radiology workflow endpoints

- name: Uploads
  description: File upload endpoints

- name: Billing
  description: Billing and credit management endpoints

- name: SuperAdmin
  description: Superadmin functionality endpoints

- name: Trial
  description: Trial user endpoints for testing the validation engine

================================================================================
FILE: frontend-explanation\api-docs\tutorials\authentication\regular-auth.md
================================================================================

# Regular Authentication

This guide covers the standard authentication process for RadOrderPad API.

## Prerequisites

- You must have a registered user account
- Your organization must be active
- You must know your username and password

## Authentication Flow

The authentication flow consists of these steps:

1. Submit login credentials
2. Receive JWT token
3. Use token for authenticated requests
4. Refresh token when needed

## Step 1: Submit Login Credentials

Submit your username and password to the authentication endpoint:

```javascript
const login = async (username, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to authenticate:', error);
    throw error;
  }
};
```

The response will include:
- `token`: The JWT token for authentication
- `refreshToken`: The refresh token for obtaining a new JWT token
- `expiresIn`: The token expiration time in seconds
- `user`: User information including roles and permissions

## Step 2: Store Authentication Tokens

Store the tokens securely for future use:

```javascript
const storeAuthTokens = (authData) => {
  // Store in secure HTTP-only cookies (preferred)
  // Or use localStorage with caution
  localStorage.setItem('token', authData.token);
  localStorage.setItem('refreshToken', authData.refreshToken);
  localStorage.setItem('tokenExpiry', Date.now() + (authData.expiresIn * 1000));
  
  // Store user info
  localStorage.setItem('user', JSON.stringify(authData.user));
};
```

## Step 3: Use Token for Authenticated Requests

Include the token in the Authorization header for all authenticated requests:

```javascript
const makeAuthenticatedRequest = async (url, method = 'GET', body = null) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const options = {
    method,
    headers
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    
    // Handle 401 Unauthorized (token expired)
    if (response.status === 401) {
      // Attempt to refresh token
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        // Retry the request with new token
        return makeAuthenticatedRequest(url, method, body);
      } else {
        // Redirect to login if refresh fails
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    }
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};
```

## Step 4: Refresh Token When Needed

Implement token refresh functionality:

```javascript
const refreshAuthToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken
      })
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    
    // Update stored tokens
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('tokenExpiry', Date.now() + (data.data.expiresIn * 1000));
    
    return true;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return false;
  }
};
```

## Step 5: Implement Auto-Refresh

Implement automatic token refresh before expiration:

```javascript
const setupTokenRefresh = () => {
  const checkTokenExpiry = () => {
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (!tokenExpiry) {
      return;
    }
    
    const expiryTime = parseInt(tokenExpiry);
    const currentTime = Date.now();
    
    // Refresh token 5 minutes before expiry
    if (expiryTime - currentTime < 300000) {
      refreshAuthToken();
    }
  };
  
  // Check token expiry every minute
  setInterval(checkTokenExpiry, 60000);
};
```

## Step 6: Implement Logout

Implement logout functionality:

```javascript
const logout = async () => {
  const token = localStorage.getItem('token');
  
  if (token) {
    try {
      // Notify server about logout (optional)
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Logout notification failed:', error);
    }
  }
  
  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('user');
  
  // Redirect to login page
  window.location.href = '/login';
};
```

## Error Handling

When working with authentication endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid credentials format
- 401 Unauthorized: Invalid username or password
- 403 Forbidden: Account disabled or organization inactive
- 429 Too Many Requests: Too many failed login attempts

## Best Practices

1. Always use HTTPS for all API requests
2. Store tokens in HTTP-only cookies when possible
3. Implement automatic token refresh
4. Clear tokens on logout
5. Use a loading state during authentication
6. Implement proper error handling and user feedback
7. Consider implementing multi-factor authentication for sensitive operations
8. Set reasonable token expiration times (typically 15-60 minutes)
9. Implement rate limiting for failed login attempts

================================================================================
FILE: frontend-explanation\api-docs\tutorials\authentication\trial-auth.md
================================================================================

# Trial Authentication

This guide covers the authentication process for trial users of the RadOrderPad API.

## Prerequisites

- You must have received a trial invitation
- You must have completed the trial registration process
- You must know your trial credentials

## Trial Authentication Flow

The trial authentication flow consists of these steps:

1. Register using trial invitation
2. Submit trial login credentials
3. Receive limited-scope JWT token
4. Use token for authenticated requests within trial limitations

## Step 1: Register Using Trial Invitation

When you receive a trial invitation, you'll need to complete the registration process:

```javascript
const registerTrialUser = async (invitationToken, userData) => {
  try {
    const response = await fetch('/api/auth/trial/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        invitationToken,
        ...userData
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to register trial user:', error);
    throw error;
  }
};
```

Required user data includes:
- `email`: Your email address
- `password`: Your chosen password
- `firstName`: Your first name
- `lastName`: Your last name
- `specialty`: Your medical specialty

## Step 2: Submit Trial Login Credentials

After registration, you can log in using your credentials:

```javascript
const trialLogin = async (email, password) => {
  try {
    const response = await fetch('/api/auth/trial/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to authenticate trial user:', error);
    throw error;
  }
};
```

The response will include:
- `token`: The JWT token for authentication
- `refreshToken`: The refresh token for obtaining a new JWT token
- `expiresIn`: The token expiration time in seconds
- `user`: User information including trial-specific permissions
- `trialInfo`: Information about the trial period and limitations

## Step 3: Store Trial Authentication Tokens

Store the tokens securely for future use:

```javascript
const storeTrialAuthTokens = (authData) => {
  // Store in secure HTTP-only cookies (preferred)
  // Or use localStorage with caution
  localStorage.setItem('token', authData.token);
  localStorage.setItem('refreshToken', authData.refreshToken);
  localStorage.setItem('tokenExpiry', Date.now() + (authData.expiresIn * 1000));
  
  // Store user and trial info
  localStorage.setItem('user', JSON.stringify(authData.user));
  localStorage.setItem('trialInfo', JSON.stringify(authData.trialInfo));
};
```

## Step 4: Use Token for Authenticated Requests

Include the token in the Authorization header for all authenticated requests:

```javascript
const makeTrialAuthenticatedRequest = async (url, method = 'GET', body = null) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const options = {
    method,
    headers
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    
    // Handle 401 Unauthorized (token expired)
    if (response.status === 401) {
      // Attempt to refresh token
      const refreshed = await refreshTrialAuthToken();
      if (refreshed) {
        // Retry the request with new token
        return makeTrialAuthenticatedRequest(url, method, body);
      } else {
        // Redirect to login if refresh fails
        window.location.href = '/trial/login';
        throw new Error('Authentication failed');
      }
    }
    
    // Handle 403 Forbidden (trial limitation)
    if (response.status === 403) {
      const errorData = await response.json();
      if (errorData.error === 'trial_limit_exceeded') {
        // Handle trial limitation
        showTrialLimitExceededMessage(errorData.message);
        throw new Error('Trial limit exceeded');
      }
    }
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};
```

## Step 5: Refresh Trial Token When Needed

Implement token refresh functionality:

```javascript
const refreshTrialAuthToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await fetch('/api/auth/trial/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken
      })
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    
    // Update stored tokens
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('tokenExpiry', Date.now() + (data.data.expiresIn * 1000));
    
    // Update trial info if provided
    if (data.data.trialInfo) {
      localStorage.setItem('trialInfo', JSON.stringify(data.data.trialInfo));
    }
    
    return true;
  } catch (error) {
    console.error('Failed to refresh trial token:', error);
    return false;
  }
};
```

## Step 6: Check Trial Status and Limitations

Implement trial status checking:

```javascript
const checkTrialStatus = () => {
  const trialInfoStr = localStorage.getItem('trialInfo');
  
  if (!trialInfoStr) {
    return null;
  }
  
  try {
    const trialInfo = JSON.parse(trialInfoStr);
    
    // Calculate remaining days
    const endDate = new Date(trialInfo.endDate);
    const currentDate = new Date();
    const remainingDays = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
    
    // Check if trial has expired
    if (remainingDays <= 0) {
      return {
        active: false,
        remainingDays: 0,
        usageCount: trialInfo.usageCount,
        usageLimit: trialInfo.usageLimit,
        message: 'Your trial period has expired'
      };
    }
    
    // Check if usage limit is reached
    if (trialInfo.usageCount >= trialInfo.usageLimit) {
      return {
        active: false,
        remainingDays,
        usageCount: trialInfo.usageCount,
        usageLimit: trialInfo.usageLimit,
        message: 'You have reached your trial usage limit'
      };
    }
    
    // Trial is active
    return {
      active: true,
      remainingDays,
      usageCount: trialInfo.usageCount,
      usageLimit: trialInfo.usageLimit,
      message: `Your trial is active with ${remainingDays} days remaining`
    };
  } catch (error) {
    console.error('Failed to parse trial info:', error);
    return null;
  }
};
```

## Step 7: Display Trial Information

Display trial information to the user:

```javascript
const displayTrialInfo = () => {
  const trialStatus = checkTrialStatus();
  
  if (!trialStatus) {
    return;
  }
  
  const trialInfoElement = document.getElementById('trial-info');
  
  if (!trialInfoElement) {
    return;
  }
  
  if (!trialStatus.active) {
    trialInfoElement.innerHTML = `
      <div class="trial-expired">
        <h3>Trial Status: Expired</h3>
        <p>${trialStatus.message}</p>
        <button onclick="upgradeToPaidPlan()">Upgrade to Paid Plan</button>
      </div>
    `;
  } else {
    trialInfoElement.innerHTML = `
      <div class="trial-active">
        <h3>Trial Status: Active</h3>
        <p>${trialStatus.message}</p>
        <p>Usage: ${trialStatus.usageCount} / ${trialStatus.usageLimit}</p>
        <div class="progress-bar">
          <div class="progress" style="width: ${(trialStatus.usageCount / trialStatus.usageLimit) * 100}%"></div>
        </div>
        <button onclick="upgradeToPaidPlan()">Upgrade to Paid Plan</button>
      </div>
    `;
  }
};
```

## Trial Limitations

Trial accounts have the following limitations:

1. Limited number of validation requests (typically 10-20)
2. Limited trial period (typically 14-30 days)
3. No access to administrative features
4. No ability to connect with other organizations
5. Limited to sandbox environment (no production data)
6. Watermarked outputs

## Converting to a Full Account

To convert a trial account to a full account:

```javascript
const upgradeToPaidPlan = async () => {
  try {
    const response = await fetch('/api/auth/trial/upgrade', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Redirect to payment page
    window.location.href = data.data.paymentUrl;
  } catch (error) {
    console.error('Failed to initiate upgrade:', error);
    throw error;
  }
};
```

## Error Handling

When working with trial authentication endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid credentials format
- 401 Unauthorized: Invalid username or password
- 403 Forbidden: Trial expired or usage limit reached
- 404 Not Found: Invalid trial invitation
- 409 Conflict: Email already registered

## Best Practices

1. Always check trial status before making requests
2. Display clear trial limitations to users
3. Provide easy upgrade paths
4. Handle trial expiration gracefully
5. Store trial usage information locally for a better user experience
6. Implement proper error handling with user-friendly messages
7. Consider implementing a countdown or usage meter

================================================================================
FILE: frontend-explanation\api-docs\tutorials\billing\credit-management.md
================================================================================

# Credit Management

This guide covers the credit management system for the RadOrderPad API, which allows organizations to purchase, track, and use credits for validation services.

## Prerequisites

- You must have an administrator role
- Your organization must be active
- You must have a valid JWT token

## Credit System Overview

The credit system consists of these components:

1. Credit Packages: Pre-defined bundles of credits available for purchase
2. Credit Transactions: Records of credit purchases, usage, and adjustments
3. Credit Balance: The current available credits for an organization
4. Usage Tracking: System for tracking credit consumption by validation requests

## Retrieving Credit Information

### Get Current Credit Balance

Retrieve your organization's current credit balance:

```javascript
const getCreditBalance = async (token) => {
  try {
    const response = await fetch('/api/billing/credits/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve credit balance:', error);
    throw error;
  }
};
```

The response will include:
- `balance`: The current credit balance
- `lastUpdated`: Timestamp of the last balance update
- `autoReloadEnabled`: Whether automatic credit reload is enabled
- `autoReloadThreshold`: The threshold for automatic reload
- `autoReloadAmount`: The amount to reload automatically

### Get Credit Transaction History

Retrieve your organization's credit transaction history:

```javascript
const getCreditTransactions = async (token, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/billing/credits/transactions?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve credit transactions:', error);
    throw error;
  }
};
```

The response will include:
- `transactions`: Array of transaction records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of transactions
  - `itemsPerPage`: Number of transactions per page

Each transaction record includes:
- `id`: Transaction ID
- `type`: Transaction type (purchase, usage, adjustment, refund)
- `amount`: Credit amount (positive for additions, negative for deductions)
- `description`: Transaction description
- `createdAt`: Transaction timestamp
- `reference`: Reference information (e.g., order ID, payment ID)

### Get Available Credit Packages

Retrieve available credit packages for purchase:

```javascript
const getCreditPackages = async (token) => {
  try {
    const response = await fetch('/api/billing/credits/packages', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve credit packages:', error);
    throw error;
  }
};
```

The response will include an array of credit packages, each with:
- `id`: Package ID
- `name`: Package name
- `description`: Package description
- `credits`: Number of credits included
- `price`: Package price in cents
- `currency`: Currency code (e.g., USD)
- `discountPercentage`: Discount percentage if applicable
- `isPopular`: Whether this is a popular package

## Purchasing Credits

### Purchase Credits Using a Credit Package

Purchase credits using a pre-defined credit package:

```javascript
const purchaseCredits = async (token, packageId, paymentMethodId) => {
  try {
    const response = await fetch('/api/billing/credits/purchase', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        packageId,
        paymentMethodId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to purchase credits:', error);
    throw error;
  }
};
```

The response will include:
- `transactionId`: The ID of the credit transaction
- `newBalance`: The updated credit balance
- `receipt`: Receipt information
  - `receiptUrl`: URL to the receipt
  - `receiptNumber`: Receipt number
  - `receiptDate`: Receipt date

### Purchase Custom Credit Amount

Purchase a custom amount of credits:

```javascript
const purchaseCustomCredits = async (token, creditAmount, paymentMethodId) => {
  try {
    const response = await fetch('/api/billing/credits/purchase-custom', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creditAmount,
        paymentMethodId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to purchase custom credits:', error);
    throw error;
  }
};
```

## Managing Auto-Reload Settings

### Enable Auto-Reload

Enable automatic credit reload when balance falls below a threshold:

```javascript
const enableAutoReload = async (token, threshold, reloadAmount, paymentMethodId) => {
  try {
    const response = await fetch('/api/billing/credits/auto-reload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enabled: true,
        threshold,
        reloadAmount,
        paymentMethodId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to enable auto-reload:', error);
    throw error;
  }
};
```

### Disable Auto-Reload

Disable automatic credit reload:

```javascript
const disableAutoReload = async (token) => {
  try {
    const response = await fetch('/api/billing/credits/auto-reload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enabled: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to disable auto-reload:', error);
    throw error;
  }
};
```

## Credit Usage Monitoring

### Get Credit Usage Report

Retrieve a report of credit usage over time:

```javascript
const getCreditUsageReport = async (token, startDate, endDate, interval = 'day') => {
  try {
    const response = await fetch(`/api/billing/credits/usage-report?startDate=${startDate}&endDate=${endDate}&interval=${interval}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve credit usage report:', error);
    throw error;
  }
};
```

The response will include:
- `totalUsage`: Total credits used in the period
- `intervals`: Array of usage data points
  - `date`: Interval date
  - `usage`: Credits used in this interval
  - `orders`: Number of orders processed

### Get Usage Breakdown by User

Retrieve credit usage breakdown by user:

```javascript
const getUserCreditUsage = async (token, startDate, endDate, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/billing/credits/user-usage?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve user credit usage:', error);
    throw error;
  }
};
```

## Error Handling

When working with credit management endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input (e.g., negative credit amount)
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-admin role)
- 402 Payment Required: Payment method declined
- 409 Conflict: Duplicate transaction
- 422 Unprocessable Entity: Insufficient credits for operation

## Best Practices

1. Implement a credit balance display in your application
2. Set up alerts for low credit balance
3. Enable auto-reload for uninterrupted service
4. Regularly review credit usage reports
5. Implement proper error handling for payment failures
6. Consider bulk credit purchases for better pricing
7. Monitor user-specific credit usage for accountability
8. Maintain a credit usage history for auditing

================================================================================
FILE: frontend-explanation\api-docs\tutorials\billing\subscription-management.md
================================================================================

# Subscription Management

This guide covers the subscription management system for the RadOrderPad API, which allows organizations to subscribe to various service tiers with different features and capabilities.

## Prerequisites

- You must have an administrator role
- Your organization must be active
- You must have a valid JWT token

## Subscription System Overview

The subscription system consists of these components:

1. Subscription Plans: Different service tiers with varying features and pricing
2. Billing Cycles: Monthly or annual billing options
3. Payment Methods: Credit cards and other payment options
4. Invoices: Records of subscription charges and payments
5. Feature Access: Controls which features are available based on subscription tier

## Retrieving Subscription Information

### Get Current Subscription

Retrieve your organization's current subscription details:

```javascript
const getCurrentSubscription = async (token) => {
  try {
    const response = await fetch('/api/billing/subscription', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve subscription:', error);
    throw error;
  }
};
```

The response will include:
- `planId`: The ID of the current subscription plan
- `planName`: The name of the current subscription plan
- `status`: Subscription status (active, past_due, canceled, etc.)
- `currentPeriodStart`: Start date of the current billing period
- `currentPeriodEnd`: End date of the current billing period
- `cancelAtPeriodEnd`: Whether the subscription will cancel at the end of the period
- `trialEnd`: End date of the trial period (if applicable)
- `features`: Array of features included in the subscription
- `creditAllowance`: Monthly credit allowance (if applicable)
- `billingCycle`: Billing frequency (monthly, annual)
- `price`: Subscription price per billing cycle
- `currency`: Currency code (e.g., USD)

### Get Available Subscription Plans

Retrieve available subscription plans:

```javascript
const getSubscriptionPlans = async (token) => {
  try {
    const response = await fetch('/api/billing/subscription/plans', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve subscription plans:', error);
    throw error;
  }
};
```

The response will include an array of subscription plans, each with:
- `id`: Plan ID
- `name`: Plan name
- `description`: Plan description
- `features`: Array of features included
- `creditAllowance`: Monthly credit allowance (if applicable)
- `pricing`: Pricing options
  - `monthly`: Monthly pricing information
    - `price`: Price in cents
    - `currency`: Currency code
  - `annual`: Annual pricing information
    - `price`: Price in cents
    - `currency`: Currency code
    - `savingsPercentage`: Percentage saved compared to monthly billing
- `isPopular`: Whether this is a popular plan
- `isEnterprise`: Whether this is an enterprise plan requiring custom pricing

### Get Subscription Invoice History

Retrieve your organization's subscription invoice history:

```javascript
const getInvoiceHistory = async (token, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/billing/subscription/invoices?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve invoice history:', error);
    throw error;
  }
};
```

The response will include:
- `invoices`: Array of invoice records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of invoices
  - `itemsPerPage`: Number of invoices per page

Each invoice record includes:
- `id`: Invoice ID
- `number`: Invoice number
- `date`: Invoice date
- `dueDate`: Payment due date
- `amount`: Invoice amount in cents
- `currency`: Currency code
- `status`: Payment status (paid, unpaid, void)
- `description`: Invoice description
- `pdfUrl`: URL to download the invoice PDF
- `items`: Array of line items
  - `description`: Item description
  - `quantity`: Item quantity
  - `unitPrice`: Unit price in cents
  - `amount`: Total item amount in cents

## Managing Subscriptions

### Subscribe to a Plan

Subscribe to a new plan:

```javascript
const subscribeToPlan = async (token, planId, billingCycle, paymentMethodId) => {
  try {
    const response = await fetch('/api/billing/subscription/subscribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planId,
        billingCycle,
        paymentMethodId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to subscribe to plan:', error);
    throw error;
  }
};
```

The response will include:
- `subscriptionId`: The ID of the new subscription
- `status`: Subscription status
- `currentPeriodEnd`: End date of the current billing period
- `invoiceUrl`: URL to the initial invoice

### Change Subscription Plan

Change to a different subscription plan:

```javascript
const changeSubscriptionPlan = async (token, newPlanId, billingCycle) => {
  try {
    const response = await fetch('/api/billing/subscription/change-plan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPlanId,
        billingCycle
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to change subscription plan:', error);
    throw error;
  }
};
```

The response will include:
- `subscriptionId`: The ID of the updated subscription
- `status`: Subscription status
- `currentPeriodEnd`: End date of the current billing period
- `prorationDate`: Date used for proration calculations
- `invoiceUrl`: URL to the proration invoice (if applicable)
- `immediateChange`: Whether the change was applied immediately

### Cancel Subscription

Cancel the current subscription:

```javascript
const cancelSubscription = async (token, cancelImmediately = false) => {
  try {
    const response = await fetch('/api/billing/subscription/cancel', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cancelImmediately
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    throw error;
  }
};
```

The response will include:
- `subscriptionId`: The ID of the canceled subscription
- `status`: Updated subscription status
- `canceledAt`: Timestamp of the cancellation
- `endDate`: Date when access will end
- `refundAmount`: Refund amount (if applicable)
- `refundCurrency`: Refund currency code

### Reactivate Canceled Subscription

Reactivate a previously canceled subscription:

```javascript
const reactivateSubscription = async (token) => {
  try {
    const response = await fetch('/api/billing/subscription/reactivate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to reactivate subscription:', error);
    throw error;
  }
};
```

## Managing Payment Methods

### Get Payment Methods

Retrieve saved payment methods:

```javascript
const getPaymentMethods = async (token) => {
  try {
    const response = await fetch('/api/billing/payment-methods', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve payment methods:', error);
    throw error;
  }
};
```

The response will include an array of payment methods, each with:
- `id`: Payment method ID
- `type`: Payment method type (card, bank_account)
- `isDefault`: Whether this is the default payment method
- `details`: Payment method details
  - For cards:
    - `brand`: Card brand (visa, mastercard, etc.)
    - `last4`: Last 4 digits of the card
    - `expiryMonth`: Expiration month
    - `expiryYear`: Expiration year
  - For bank accounts:
    - `bankName`: Bank name
    - `last4`: Last 4 digits of the account
    - `accountType`: Account type (checking, savings)

### Add Payment Method

Add a new payment method:

```javascript
const addPaymentMethod = async (token, paymentMethodToken, setAsDefault = false) => {
  try {
    const response = await fetch('/api/billing/payment-methods', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentMethodToken,
        setAsDefault
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to add payment method:', error);
    throw error;
  }
};
```

### Update Default Payment Method

Set a payment method as the default:

```javascript
const setDefaultPaymentMethod = async (token, paymentMethodId) => {
  try {
    const response = await fetch(`/api/billing/payment-methods/${paymentMethodId}/default`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to set default payment method:', error);
    throw error;
  }
};
```

### Remove Payment Method

Remove a payment method:

```javascript
const removePaymentMethod = async (token, paymentMethodId) => {
  try {
    const response = await fetch(`/api/billing/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to remove payment method:', error);
    throw error;
  }
};
```

## Error Handling

When working with subscription management endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-admin role)
- 402 Payment Required: Payment method declined
- 409 Conflict: Subscription already exists
- 422 Unprocessable Entity: Invalid subscription change

## Best Practices

1. Display clear subscription information to users
2. Implement a subscription comparison table
3. Provide a smooth upgrade/downgrade experience
4. Send notifications before subscription renewals
5. Implement proper error handling for payment failures
6. Offer annual billing options for cost savings
7. Provide clear cancellation and reactivation options
8. Maintain a subscription history for auditing
9. Implement secure payment method handling
10. Consider offering trial periods for new subscriptions

================================================================================
FILE: frontend-explanation\api-docs\tutorials\connections\managing-requests.md
================================================================================

# Managing Connection Requests

This guide covers the process of managing incoming connection requests from other organizations in the RadOrderPad API.

## Prerequisites

- You must have an administrator role
- Your organization must be active
- You must have a valid JWT token

## Connection Request Management Flow

The connection request management flow consists of these steps:

1. Retrieve incoming connection requests
2. Review request details
3. Approve or reject the request
4. Manage established connections

## Step 1: Retrieve Incoming Connection Requests

Retrieve all incoming connection requests:

```javascript
const getIncomingConnectionRequests = async (token, status = 'pending', page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/connections/incoming?status=${status}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve incoming connection requests:', error);
    throw error;
  }
};
```

The response will include:
- `connections`: Array of connection records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of connections
  - `itemsPerPage`: Number of connections per page

Each connection record includes:
- `id`: Connection ID
- `status`: Connection status (pending_approval, approved, rejected)
- `requestDate`: Date the request was sent
- `sourceOrganization`: Information about the requesting organization
  - `id`: Organization ID
  - `name`: Organization name
  - `type`: Organization type (referring, radiology, both)
  - `address`: Organization address
  - `city`: Organization city
  - `state`: Organization state
  - `zipCode`: Organization ZIP code
  - `phone`: Organization phone number
  - `website`: Organization website
- `message`: The request message

## Step 2: Get Connection Request Details

Retrieve detailed information about a specific connection request:

```javascript
const getConnectionRequestDetails = async (token, connectionId) => {
  try {
    const response = await fetch(`/api/connections/${connectionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve connection request details:', error);
    throw error;
  }
};
```

The response will include:
- `id`: Connection ID
- `status`: Connection status (pending_approval, approved, rejected)
- `requestDate`: Date the request was sent
- `responseDate`: Date of the response (if any)
- `sourceOrganization`: Detailed information about the requesting organization
  - `id`: Organization ID
  - `name`: Organization name
  - `type`: Organization type (referring, radiology, both)
  - `address`: Organization address
  - `city`: Organization city
  - `state`: Organization state
  - `zipCode`: Organization ZIP code
  - `phone`: Organization phone number
  - `website`: Organization website
  - `contactEmail`: Organization contact email
  - `contactName`: Organization contact name
  - `contactPhone`: Organization contact phone
  - `specialties`: Array of organization specialties
- `message`: The request message

## Step 3: Approve a Connection Request

Approve an incoming connection request:

```javascript
const approveConnectionRequest = async (token, connectionId, responseMessage = '') => {
  try {
    const response = await fetch(`/api/connections/${connectionId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        responseMessage
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to approve connection request:', error);
    throw error;
  }
};
```

The response will include:
- `id`: Connection ID
- `status`: Updated connection status (approved)
- `responseDate`: Date of the approval
- `responseMessage`: The response message
- `sourceOrganization`: Information about the requesting organization
- `targetOrganization`: Information about your organization

## Step 4: Reject a Connection Request

Reject an incoming connection request:

```javascript
const rejectConnectionRequest = async (token, connectionId, responseMessage = '') => {
  try {
    const response = await fetch(`/api/connections/${connectionId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        responseMessage
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to reject connection request:', error);
    throw error;
  }
};
```

The response will include:
- `id`: Connection ID
- `status`: Updated connection status (rejected)
- `responseDate`: Date of the rejection
- `responseMessage`: The rejection message

## Step 5: Get All Established Connections

Retrieve all established connections:

```javascript
const getEstablishedConnections = async (token, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/connections/established?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve established connections:', error);
    throw error;
  }
};
```

The response will include:
- `connections`: Array of connection records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of connections
  - `itemsPerPage`: Number of connections per page

Each connection record includes:
- `id`: Connection ID
- `status`: Connection status (approved)
- `requestDate`: Date the request was sent
- `responseDate`: Date of the approval
- `organization`: Information about the connected organization
  - `id`: Organization ID
  - `name`: Organization name
  - `type`: Organization type (referring, radiology, both)
  - `address`: Organization address
  - `city`: Organization city
  - `state`: Organization state
  - `zipCode`: Organization ZIP code
  - `phone`: Organization phone number
  - `website`: Organization website
- `connectionType`: Type of connection (incoming, outgoing)
- `orderCount`: Number of orders exchanged through this connection
- `lastOrderDate`: Date of the last order

## Step 6: Get Connection Statistics

Retrieve statistics about a specific connection:

```javascript
const getConnectionStatistics = async (token, connectionId) => {
  try {
    const response = await fetch(`/api/connections/${connectionId}/statistics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve connection statistics:', error);
    throw error;
  }
};
```

The response will include:
- `connectionId`: Connection ID
- `totalOrders`: Total number of orders exchanged
- `ordersByStatus`: Breakdown of orders by status
  - `pending`: Number of pending orders
  - `completed`: Number of completed orders
  - `canceled`: Number of canceled orders
- `ordersByModality`: Breakdown of orders by modality type
  - `CT`: Number of CT orders
  - `MRI`: Number of MRI orders
  - `XRAY`: Number of X-ray orders
  - `ULTRASOUND`: Number of ultrasound orders
  - `PET`: Number of PET orders
  - `NUCLEAR`: Number of nuclear medicine orders
- `monthlyOrderCounts`: Array of monthly order counts
  - `month`: Month (YYYY-MM format)
  - `count`: Number of orders in that month

## Connection Management Best Practices

### Reviewing Connection Requests

When reviewing incoming connection requests, consider these factors:

1. **Organization Type**: Is the requesting organization a referring physician practice, a radiology provider, or both?
2. **Geographic Location**: Is the organization located in your service area?
3. **Specialties**: Does the organization's specialty align with your services?
4. **Request Message**: Does the message provide clear information about the organization and its needs?
5. **Potential Volume**: How many physicians or orders might come from this connection?

### Approving Requests

When approving a connection request:

1. Include a welcoming response message
2. Provide contact information for support
3. Include any specific instructions or requirements
4. Mention any onboarding process or training resources

Example approval message:

```
Thank you for your connection request. We are pleased to approve this connection between our organizations.

For any technical support needs, please contact our support team at support@example.com or call (555) 123-4567.

We look forward to working with your organization.

Best regards,
[Your Name]
[Your Organization Name]
```

### Rejecting Requests

When rejecting a connection request:

1. Provide a clear reason for the rejection
2. Be professional and courteous
3. Suggest alternatives if applicable
4. Leave the door open for future connections if appropriate

Example rejection message:

```
Thank you for your connection request. Unfortunately, we are unable to approve this connection at this time because [reason for rejection].

We appreciate your interest in connecting with our organization and encourage you to [alternative suggestion or future possibility].

Best regards,
[Your Name]
[Your Organization Name]
```

## Error Handling

When working with connection management endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-admin role)
- 404 Not Found: Connection not found
- 409 Conflict: Connection already approved or rejected

## Connection Lifecycle Management

Effective connection management involves:

1. **Regular Review**: Periodically review incoming connection requests
2. **Timely Responses**: Respond to requests within a reasonable timeframe (1-3 business days)
3. **Connection Monitoring**: Monitor established connections for activity and issues
4. **Documentation**: Maintain records of connection decisions and communications
5. **Relationship Management**: Nurture relationships with connected organizations

================================================================================
FILE: frontend-explanation\api-docs\tutorials\connections\requesting-connections.md
================================================================================

# Requesting Connections

This guide covers the process of requesting connections between organizations in the RadOrderPad API, which enables referring physicians to send orders to radiology organizations.

## Prerequisites

- You must have an administrator role
- Your organization must be active
- You must have a valid JWT token

## Connection Request Flow

The connection request flow consists of these steps:

1. Search for organizations to connect with
2. Send a connection request
3. Wait for the request to be approved or rejected
4. Establish the connection

## Step 1: Search for Organizations

Search for organizations to connect with:

```javascript
const searchOrganizations = async (token, searchTerm, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/organizations/search?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to search organizations:', error);
    throw error;
  }
};
```

The response will include:
- `organizations`: Array of organization records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of organizations
  - `itemsPerPage`: Number of organizations per page

Each organization record includes:
- `id`: Organization ID
- `name`: Organization name
- `type`: Organization type (referring, radiology, both)
- `address`: Organization address
- `city`: Organization city
- `state`: Organization state
- `zipCode`: Organization ZIP code
- `phone`: Organization phone number
- `website`: Organization website
- `connectionStatus`: Connection status (not_connected, pending_outgoing, pending_incoming, connected, rejected)

## Step 2: Send a Connection Request

Send a connection request to an organization:

```javascript
const sendConnectionRequest = async (token, targetOrganizationId, message) => {
  try {
    const response = await fetch('/api/connections/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetOrganizationId,
        message
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to send connection request:', error);
    throw error;
  }
};
```

The response will include:
- `connectionId`: The ID of the connection request
- `status`: Connection status (pending_approval)
- `requestDate`: Date the request was sent
- `targetOrganization`: Basic information about the target organization

## Step 3: Check Connection Request Status

Check the status of a connection request:

```javascript
const getConnectionRequestStatus = async (token, connectionId) => {
  try {
    const response = await fetch(`/api/connections/${connectionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to check connection request status:', error);
    throw error;
  }
};
```

The response will include:
- `id`: Connection ID
- `status`: Connection status (pending_approval, approved, rejected)
- `requestDate`: Date the request was sent
- `responseDate`: Date of the response (if any)
- `sourceOrganization`: Information about the requesting organization
- `targetOrganization`: Information about the target organization
- `message`: The original request message
- `responseMessage`: Response message (if any)

## Step 4: Get All Outgoing Connection Requests

Retrieve all outgoing connection requests:

```javascript
const getOutgoingConnectionRequests = async (token, status = 'all', page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/connections/outgoing?status=${status}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve outgoing connection requests:', error);
    throw error;
  }
};
```

The response will include:
- `connections`: Array of connection records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of connections
  - `itemsPerPage`: Number of connections per page

Each connection record includes:
- `id`: Connection ID
- `status`: Connection status (pending_approval, approved, rejected)
- `requestDate`: Date the request was sent
- `responseDate`: Date of the response (if any)
- `targetOrganization`: Information about the target organization
- `message`: The original request message
- `responseMessage`: Response message (if any)

## Step 5: Cancel a Connection Request

Cancel a pending connection request:

```javascript
const cancelConnectionRequest = async (token, connectionId) => {
  try {
    const response = await fetch(`/api/connections/${connectionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to cancel connection request:', error);
    throw error;
  }
};
```

The response will include:
- `id`: Connection ID
- `status`: Updated connection status (canceled)
- `cancelDate`: Date the request was canceled

## Step 6: Resend a Rejected Connection Request

Resend a connection request that was previously rejected:

```javascript
const resendConnectionRequest = async (token, connectionId, newMessage) => {
  try {
    const response = await fetch(`/api/connections/${connectionId}/resend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: newMessage
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to resend connection request:', error);
    throw error;
  }
};
```

The response will include:
- `id`: Connection ID
- `status`: Updated connection status (pending_approval)
- `requestDate`: New request date
- `message`: The new request message

## Connection Request Lifecycle

A connection request goes through these status changes:

1. `pending_approval`: The request has been sent and is awaiting approval
2. `approved`: The request has been approved and the connection is established
3. `rejected`: The request has been rejected
4. `canceled`: The request has been canceled by the requesting organization

## Error Handling

When working with connection request endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-admin role)
- 404 Not Found: Organization or connection not found
- 409 Conflict: Connection already exists or is already pending

## Best Practices

1. Provide a clear search interface for finding organizations
2. Include relevant organization details in search results
3. Allow users to customize connection request messages
4. Display connection request status clearly
5. Implement notifications for connection status changes
6. Provide options to cancel pending requests
7. Allow resending rejected requests with updated messages
8. Implement pagination for connection request lists
9. Include filtering options for connection status
10. Display timestamps for request and response events

## Example Connection Request Message

When sending a connection request, include relevant information about your organization and the purpose of the connection:

```
Hello,

We are [Your Organization Name], a [specialty] practice located in [City, State]. We would like to establish a connection with your radiology organization to streamline our referral process for imaging studies.

Our practice has approximately [number] physicians who would be sending orders to your facility. We primarily refer patients for [types of imaging studies].

Please let us know if you need any additional information about our practice.

Thank you,
[Your Name]
[Your Title]
[Your Organization Name]
```

## Connection Request Limitations

- You can have up to 100 active connections per organization
- You can have up to 20 pending outgoing connection requests at a time
- You cannot send a new connection request to an organization that has rejected a request within the last 30 days
- Connection requests expire after 90 days if not approved or rejected

================================================================================
FILE: frontend-explanation\api-docs\tutorials\connections\terminating-connections.md
================================================================================

# Terminating Connections

This guide covers the process of terminating established connections between organizations in the RadOrderPad API.

## Prerequisites

- You must have an administrator role
- Your organization must be active
- You must have a valid JWT token

## Connection Termination Flow

The connection termination flow consists of these steps:

1. Review the connection to be terminated
2. Initiate the termination process
3. Provide a reason for termination
4. Handle any pending orders
5. Confirm the termination

## Step 1: Review the Connection

Before terminating a connection, review its details and activity:

```javascript
const getConnectionDetails = async (token, connectionId) => {
  try {
    const response = await fetch(`/api/connections/${connectionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve connection details:', error);
    throw error;
  }
};
```

The response will include:
- `id`: Connection ID
- `status`: Connection status (approved)
- `requestDate`: Date the request was sent
- `responseDate`: Date of the approval
- `sourceOrganization`: Information about the requesting organization
- `targetOrganization`: Information about the target organization
- `connectionType`: Type of connection (incoming, outgoing)
- `orderCount`: Number of orders exchanged through this connection
- `lastOrderDate`: Date of the last order
- `pendingOrderCount`: Number of pending orders

## Step 2: Check for Pending Orders

Check if there are any pending orders that would be affected by terminating the connection:

```javascript
const getPendingOrders = async (token, connectionId, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/connections/${connectionId}/pending-orders?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve pending orders:', error);
    throw error;
  }
};
```

The response will include:
- `orders`: Array of pending order records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of orders
  - `itemsPerPage`: Number of orders per page

Each order record includes:
- `id`: Order ID
- `status`: Order status
- `createdAt`: Date the order was created
- `patientInfo`: Basic patient information
- `modalityType`: Type of imaging modality
- `urgency`: Order urgency level

## Step 3: Initiate Connection Termination

Initiate the termination of a connection:

```javascript
const terminateConnection = async (token, connectionId, reason, handlePendingOrders = 'complete') => {
  try {
    const response = await fetch(`/api/connections/${connectionId}/terminate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason,
        handlePendingOrders
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to terminate connection:', error);
    throw error;
  }
};
```

The `handlePendingOrders` parameter can have these values:
- `complete`: Allow pending orders to complete normally
- `cancel`: Cancel all pending orders
- `transfer`: Transfer pending orders to another connection (requires additional parameters)

The response will include:
- `id`: Connection ID
- `status`: Updated connection status (terminated)
- `terminationDate`: Date of the termination
- `terminationReason`: The provided reason for termination
- `pendingOrdersHandling`: How pending orders were handled
- `affectedOrderCount`: Number of orders affected by the termination

## Step 4: Transfer Pending Orders (Optional)

If you choose to transfer pending orders to another connection:

```javascript
const terminateConnectionWithTransfer = async (token, connectionId, reason, targetConnectionId) => {
  try {
    const response = await fetch(`/api/connections/${connectionId}/terminate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason,
        handlePendingOrders: 'transfer',
        targetConnectionId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to terminate connection with transfer:', error);
    throw error;
  }
};
```

## Step 5: Get Terminated Connection History

Retrieve the history of terminated connections:

```javascript
const getTerminatedConnections = async (token, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/connections/terminated?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve terminated connections:', error);
    throw error;
  }
};
```

The response will include:
- `connections`: Array of terminated connection records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of connections
  - `itemsPerPage`: Number of connections per page

Each connection record includes:
- `id`: Connection ID
- `status`: Connection status (terminated)
- `requestDate`: Date the request was sent
- `responseDate`: Date of the approval
- `terminationDate`: Date of the termination
- `organization`: Information about the connected organization
- `connectionType`: Type of connection (incoming, outgoing)
- `terminationReason`: Reason for termination
- `terminatedBy`: Organization that initiated the termination

## Step 6: Reestablish a Terminated Connection

To reestablish a previously terminated connection:

```javascript
const reestablishConnection = async (token, connectionId, message) => {
  try {
    const response = await fetch(`/api/connections/${connectionId}/reestablish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to reestablish connection:', error);
    throw error;
  }
};
```

The response will include:
- `id`: Connection ID
- `status`: Updated connection status (pending_approval)
- `requestDate`: New request date
- `message`: The new request message

## Connection Termination Considerations

### Reasons for Termination

Common reasons for terminating a connection include:

1. **Organizational Changes**: Mergers, acquisitions, or closures
2. **Service Area Changes**: No longer serving the same geographic area
3. **Relationship Changes**: Moving to a different provider
4. **Quality Issues**: Concerns about service quality
5. **Volume Changes**: Insufficient order volume to maintain the connection
6. **Contractual Issues**: Changes in contractual relationships
7. **Compliance Concerns**: Issues with regulatory compliance

### Impact of Termination

Terminating a connection has these impacts:

1. **Pending Orders**: Orders in progress may need to be completed, canceled, or transferred
2. **Historical Data**: Historical order data remains accessible for the retention period
3. **User Access**: Users from both organizations lose access to the connection
4. **Notifications**: Both organizations receive notifications about the termination
5. **Reporting**: The connection appears in terminated connection reports

### Handling Pending Orders

When terminating a connection, you have three options for handling pending orders:

1. **Complete**: Allow pending orders to complete their normal workflow
   - Best for orderly transitions with few pending orders
   - Ensures patient care continuity
   - Requires continued monitoring until all orders are complete

2. **Cancel**: Cancel all pending orders
   - Best for immediate terminations or compliance issues
   - Requires alternative arrangements for patient care
   - May require manual notification to affected patients

3. **Transfer**: Move pending orders to another connection
   - Best when switching between providers
   - Ensures continuity of care
   - Requires an existing connection with the new provider

## Best Practices for Connection Termination

1. **Plan Ahead**: Whenever possible, plan the termination in advance
2. **Communicate**: Notify the other organization before terminating
3. **Consider Timing**: Choose a time with minimal pending orders
4. **Document**: Keep records of the termination reason and process
5. **Patient Care**: Prioritize patient care continuity
6. **Follow Up**: Verify all pending orders are properly handled
7. **Exit Interview**: Consider conducting an exit interview or survey
8. **Data Retention**: Understand data retention policies for historical orders

## Example Termination Messages

### Professional Relationship Change

```
We are terminating this connection as we have established a new strategic partnership with [New Partner Organization]. All pending orders will be completed through this connection before termination is finalized. We appreciate our past collaboration and wish you continued success.
```

### Service Area Change

```
Due to changes in our service area coverage, we are terminating this connection effective [Date]. We will ensure all pending orders are completed. Thank you for your understanding and past collaboration.
```

### Low Volume

```
We are streamlining our connections and terminating those with low activity. As our organizations have exchanged fewer than 10 orders in the past 6 months, we are terminating this connection. All pending orders will be completed normally.
```

## Error Handling

When working with connection termination endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-admin role)
- 404 Not Found: Connection not found
- 409 Conflict: Connection already terminated
- 422 Unprocessable Entity: Cannot terminate with pending orders (when using certain options)

## Cooling-Off Period

After terminating a connection, there is a 30-day cooling-off period before you can request a new connection with the same organization. This prevents connection cycling and ensures terminations are deliberate decisions.

================================================================================
FILE: frontend-explanation\api-docs\tutorials\file-uploads\direct-to-s3.md
================================================================================

# Direct-to-S3 File Uploads

This guide covers the process of uploading files directly to Amazon S3 using presigned URLs in the RadOrderPad API.

## Prerequisites

- You must have a valid JWT token
- Your organization must be active
- You must have appropriate permissions for file uploads

## Direct-to-S3 Upload Flow

The direct-to-S3 upload flow consists of these steps:

1. Request a presigned URL from the API
2. Upload the file directly to S3 using the presigned URL
3. Notify the API that the upload is complete
4. Associate the uploaded file with an order or other entity

## Step 1: Request a Presigned URL

Request a presigned URL for file upload:

```javascript
const getPresignedUrl = async (token, fileInfo) => {
  try {
    const response = await fetch('/api/uploads/presigned-url', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fileInfo)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to get presigned URL:', error);
    throw error;
  }
};
```

The `fileInfo` object should include:
- `fileName`: Original file name
- `fileType`: MIME type of the file
- `fileSize`: Size of the file in bytes
- `purpose`: Purpose of the upload (order_attachment, patient_record, organization_document)
- `associatedId`: ID of the associated entity (optional)

Example:
```javascript
const fileInfo = {
  fileName: 'patient-history.pdf',
  fileType: 'application/pdf',
  fileSize: 1024000, // 1MB
  purpose: 'order_attachment',
  associatedId: 'order-123'
};
```

The response will include:
- `uploadId`: Unique identifier for this upload
- `presignedUrl`: The S3 presigned URL for uploading
- `fileKey`: The S3 object key for the file
- `expiresIn`: Expiration time for the presigned URL in seconds
- `fields`: Additional fields to include in the upload form (for POST uploads)

## Step 2: Upload the File to S3

### Method 1: Direct PUT Upload

Upload the file directly to S3 using the presigned URL with a PUT request:

```javascript
const uploadFileDirectPut = async (presignedUrl, file) => {
  try {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    return {
      success: true,
      status: response.status
    };
  } catch (error) {
    console.error('Failed to upload file:', error);
    throw error;
  }
};
```

### Method 2: Form POST Upload

Upload the file using a multipart form POST:

```javascript
const uploadFileFormPost = async (presignedData, file) => {
  try {
    const formData = new FormData();
    
    // Add the fields from the presigned URL response
    Object.entries(presignedData.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Add the file as the last field
    formData.append('file', file);
    
    const response = await fetch(presignedData.presignedUrl, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    return {
      success: true,
      status: response.status
    };
  } catch (error) {
    console.error('Failed to upload file:', error);
    throw error;
  }
};
```

## Step 3: Notify the API of Completed Upload

After successfully uploading the file to S3, notify the API:

```javascript
const completeUpload = async (token, uploadId) => {
  try {
    const response = await fetch(`/api/uploads/${uploadId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to complete upload:', error);
    throw error;
  }
};
```

The response will include:
- `uploadId`: The upload ID
- `status`: Upload status (completed)
- `fileUrl`: URL for accessing the file
- `fileName`: Original file name
- `fileType`: MIME type of the file
- `fileSize`: Size of the file in bytes
- `uploadDate`: Date and time of the upload
- `expiryDate`: Date and time when the file will expire (if applicable)

## Step 4: Associate the File with an Entity

If you didn't specify an `associatedId` when requesting the presigned URL, you can associate the file with an entity after upload:

```javascript
const associateFile = async (token, uploadId, entityType, entityId) => {
  try {
    const response = await fetch(`/api/uploads/${uploadId}/associate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entityType,
        entityId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to associate file:', error);
    throw error;
  }
};
```

The `entityType` can be one of:
- `order`
- `patient`
- `organization`
- `user`

## Complete Example: File Upload Process

Here's a complete example of the file upload process:

```javascript
// Function to handle the entire upload process
const handleFileUpload = async (token, file, purpose, associatedId = null) => {
  try {
    // Step 1: Get a presigned URL
    const fileInfo = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      purpose,
      associatedId
    };
    
    const presignedData = await getPresignedUrl(token, fileInfo);
    
    // Step 2: Upload the file to S3
    let uploadResult;
    
    if (presignedData.fields) {
      // Use form POST method if fields are provided
      uploadResult = await uploadFileFormPost(presignedData, file);
    } else {
      // Use direct PUT method
      uploadResult = await uploadFileDirectPut(presignedData.presignedUrl, file);
    }
    
    if (!uploadResult.success) {
      throw new Error('File upload failed');
    }
    
    // Step 3: Notify the API that the upload is complete
    const completedUpload = await completeUpload(token, presignedData.uploadId);
    
    // Step 4: Associate the file with an entity (if not already associated)
    if (!associatedId && entityId) {
      await associateFile(token, presignedData.uploadId, entityType, entityId);
    }
    
    return completedUpload;
  } catch (error) {
    console.error('Upload process failed:', error);
    throw error;
  }
};
```

## File Upload Progress Tracking

To track upload progress, use the `XMLHttpRequest` API instead of `fetch`:

```javascript
const uploadFileWithProgress = (presignedUrl, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    });
    
    // Handle successful upload
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          success: true,
          status: xhr.status
        });
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    
    // Handle upload error
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });
    
    // Handle upload abort
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });
    
    // Set up and send the request
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
};
```

Usage:
```javascript
uploadFileWithProgress(presignedUrl, file, (progress) => {
  console.log(`Upload progress: ${progress.toFixed(2)}%`);
  // Update UI with progress
  progressBar.style.width = `${progress}%`;
}).then(result => {
  console.log('Upload complete!');
}).catch(error => {
  console.error('Upload failed:', error);
});
```

## File Size Limits and Restrictions

The RadOrderPad API enforces these limits for file uploads:

- Maximum file size: 50MB
- Allowed file types:
  - Images: jpg, jpeg, png, gif, bmp, tiff
  - Documents: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf
  - Medical: dcm (DICOM)
- Maximum files per order: 10
- Maximum files per patient: 50
- Maximum files per organization: 1000

## Security Considerations

When implementing direct-to-S3 uploads:

1. **Never expose AWS credentials** in your client-side code
2. **Always use presigned URLs** for client-side uploads
3. **Validate file types and sizes** before requesting presigned URLs
4. **Set appropriate CORS configurations** on your S3 bucket
5. **Implement virus scanning** for uploaded files
6. **Use HTTPS** for all API and S3 communications
7. **Implement proper authentication** for file access
8. **Set appropriate expiration times** for presigned URLs

## Error Handling

When working with file upload endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid file information
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions
- 413 Payload Too Large: File exceeds size limit
- 415 Unsupported Media Type: File type not allowed
- 429 Too Many Requests: Upload rate limit exceeded
- 500 Internal Server Error: Server-side upload processing error

## Best Practices

1. **Validate files client-side** before uploading
2. **Implement retry logic** for failed uploads
3. **Show clear progress indicators** to users
4. **Provide cancel functionality** for long uploads
5. **Handle network interruptions** gracefully
6. **Implement chunked uploads** for large files
7. **Compress files when appropriate** before uploading
8. **Provide clear error messages** for upload failures
9. **Implement file type validation** using both extension and MIME type
10. **Consider implementing resumable uploads** for large files

================================================================================
FILE: frontend-explanation\api-docs\tutorials\file-uploads\document-management.md
================================================================================

# Document Management

This guide covers the document management capabilities of the RadOrderPad API, which allow you to list, retrieve, update, and delete uploaded files.

## Prerequisites

- You must have a valid JWT token
- Your organization must be active
- You must have appropriate permissions for document management

## Document Management Overview

The document management system provides these capabilities:

1. Listing uploaded files
2. Retrieving file metadata
3. Generating download URLs
4. Updating file metadata
5. Deleting files
6. Managing file associations
7. Searching for files

## Listing Uploaded Files

### List Files by Entity

Retrieve files associated with a specific entity:

```javascript
const getFilesByEntity = async (token, entityType, entityId, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/uploads/by-entity/${entityType}/${entityId}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve files:', error);
    throw error;
  }
};
```

The `entityType` can be one of:
- `order`
- `patient`
- `organization`
- `user`

The response will include:
- `files`: Array of file records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of files
  - `itemsPerPage`: Number of files per page

Each file record includes:
- `id`: File ID
- `fileName`: Original file name
- `fileType`: MIME type of the file
- `fileSize`: Size of the file in bytes
- `uploadDate`: Date and time of the upload
- `uploadedBy`: User who uploaded the file
- `purpose`: Purpose of the upload
- `status`: File status (processing, available, deleted)
- `thumbnailUrl`: URL for file thumbnail (for images)

### List Files by Purpose

Retrieve files filtered by purpose:

```javascript
const getFilesByPurpose = async (token, purpose, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/uploads/by-purpose/${purpose}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve files:', error);
    throw error;
  }
};
```

The `purpose` can be one of:
- `order_attachment`
- `patient_record`
- `organization_document`
- `user_profile`
- `system_report`

### List Recent Uploads

Retrieve recently uploaded files:

```javascript
const getRecentUploads = async (token, days = 7, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/uploads/recent?days=${days}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve recent uploads:', error);
    throw error;
  }
};
```

## Retrieving File Information

### Get File Metadata

Retrieve metadata for a specific file:

```javascript
const getFileMetadata = async (token, fileId) => {
  try {
    const response = await fetch(`/api/uploads/${fileId}/metadata`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve file metadata:', error);
    throw error;
  }
};
```

The response will include:
- `id`: File ID
- `fileName`: Original file name
- `fileType`: MIME type of the file
- `fileSize`: Size of the file in bytes
- `uploadDate`: Date and time of the upload
- `uploadedBy`: User who uploaded the file
- `purpose`: Purpose of the upload
- `status`: File status
- `associations`: Array of entity associations
  - `entityType`: Type of associated entity
  - `entityId`: ID of associated entity
  - `associationDate`: Date of the association
- `metadata`: Additional file metadata
  - `contentCreationDate`: Date the content was created (if available)
  - `contentModificationDate`: Date the content was last modified (if available)
  - `author`: Author of the content (if available)
  - `pageCount`: Number of pages (for documents)
  - `dimensions`: Image dimensions (for images)
  - `duration`: Media duration (for audio/video)
  - `tags`: Array of tags

### Generate Download URL

Generate a temporary URL for downloading a file:

```javascript
const getDownloadUrl = async (token, fileId, expiresIn = 3600) => {
  try {
    const response = await fetch(`/api/uploads/${fileId}/download-url?expiresIn=${expiresIn}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to generate download URL:', error);
    throw error;
  }
};
```

The response will include:
- `downloadUrl`: Temporary URL for downloading the file
- `expiresAt`: Expiration time for the download URL
- `fileName`: Original file name

### Download a File

Download a file using the generated download URL:

```javascript
const downloadFile = async (downloadUrl, fileName) => {
  try {
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    
    // Append to the document and trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return true;
  } catch (error) {
    console.error('Failed to download file:', error);
    throw error;
  }
};
```

## Updating File Information

### Update File Metadata

Update metadata for a specific file:

```javascript
const updateFileMetadata = async (token, fileId, metadata) => {
  try {
    const response = await fetch(`/api/uploads/${fileId}/metadata`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update file metadata:', error);
    throw error;
  }
};
```

The `metadata` object can include:
- `fileName`: Updated file name
- `purpose`: Updated purpose
- `tags`: Array of tags
- `description`: File description
- `customMetadata`: Object with custom metadata fields

### Add File Tags

Add tags to a file:

```javascript
const addFileTags = async (token, fileId, tags) => {
  try {
    const response = await fetch(`/api/uploads/${fileId}/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tags })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to add file tags:', error);
    throw error;
  }
};
```

### Remove File Tags

Remove tags from a file:

```javascript
const removeFileTags = async (token, fileId, tags) => {
  try {
    const response = await fetch(`/api/uploads/${fileId}/tags`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tags })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to remove file tags:', error);
    throw error;
  }
};
```

## Managing File Associations

### Associate File with Entity

Associate a file with an entity:

```javascript
const associateFile = async (token, fileId, entityType, entityId) => {
  try {
    const response = await fetch(`/api/uploads/${fileId}/associate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entityType,
        entityId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to associate file:', error);
    throw error;
  }
};
```

### Disassociate File from Entity

Remove a file's association with an entity:

```javascript
const disassociateFile = async (token, fileId, entityType, entityId) => {
  try {
    const response = await fetch(`/api/uploads/${fileId}/disassociate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entityType,
        entityId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to disassociate file:', error);
    throw error;
  }
};
```

## Deleting Files

### Mark File for Deletion

Mark a file for deletion (soft delete):

```javascript
const markFileForDeletion = async (token, fileId, reason = '') => {
  try {
    const response = await fetch(`/api/uploads/${fileId}/mark-for-deletion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to mark file for deletion:', error);
    throw error;
  }
};
```

### Restore Deleted File

Restore a file that was marked for deletion:

```javascript
const restoreDeletedFile = async (token, fileId) => {
  try {
    const response = await fetch(`/api/uploads/${fileId}/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to restore file:', error);
    throw error;
  }
};
```

### Permanently Delete File

Permanently delete a file (requires admin permissions):

```javascript
const permanentlyDeleteFile = async (token, fileId, confirmationCode) => {
  try {
    const response = await fetch(`/api/uploads/${fileId}/permanently-delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ confirmationCode })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to permanently delete file:', error);
    throw error;
  }
};
```

## Searching for Files

### Search Files by Criteria

Search for files using various criteria:

```javascript
const searchFiles = async (token, searchCriteria, page = 1, limit = 20) => {
  try {
    const response = await fetch('/api/uploads/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...searchCriteria,
        page,
        limit
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to search files:', error);
    throw error;
  }
};
```

The `searchCriteria` object can include:
- `fileName`: Search by file name (partial match)
- `fileType`: Search by file type (exact match)
- `uploadDateStart`: Filter by upload date (start)
- `uploadDateEnd`: Filter by upload date (end)
- `uploadedBy`: Filter by uploader user ID
- `purpose`: Filter by purpose
- `tags`: Array of tags to filter by
- `entityType`: Filter by associated entity type
- `entityId`: Filter by associated entity ID
- `status`: Filter by file status

Example:
```javascript
const searchCriteria = {
  fileName: 'report',
  fileType: 'application/pdf',
  uploadDateStart: '2025-01-01',
  tags: ['important', 'patient-history']
};
```

## Document Management Best Practices

1. **Implement proper file organization** using purpose and tags
2. **Use descriptive file names** for better searchability
3. **Add relevant metadata** to improve file management
4. **Implement file versioning** for important documents
5. **Regularly clean up temporary files** that are no longer needed
6. **Implement proper access controls** for sensitive documents
7. **Use file previews** when available instead of downloading
8. **Implement file expiration policies** for temporary documents
9. **Maintain audit logs** for file operations
10. **Implement file retention policies** based on document types

## Error Handling

When working with document management endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions
- 404 Not Found: File not found
- 409 Conflict: File already associated or disassociated
- 410 Gone: File has been deleted
- 429 Too Many Requests: Rate limit exceeded

## File Security Considerations

1. **Implement proper access controls** based on file purpose and associations
2. **Use temporary download URLs** with short expiration times
3. **Validate file types** before allowing downloads
4. **Scan files for malware** before making them available
5. **Implement audit logging** for all file operations
6. **Use secure transmission** (HTTPS) for all file operations
7. **Implement proper backup procedures** for important documents
8. **Consider encryption** for sensitive documents
9. **Implement data retention policies** in compliance with regulations
10. **Provide secure file preview** capabilities when possible

================================================================================
FILE: frontend-explanation\api-docs\tutorials\getting-started.md
================================================================================

# Getting Started with RadOrderPad API

This guide will help you get started with the RadOrderPad API, covering the essential steps to begin integrating with the platform.

## Overview

RadOrderPad is a comprehensive platform for managing radiology orders, from initial clinical dictation to final radiology processing. The API provides access to all functionality, including:

- User authentication and management
- Organization and location management
- Connection management between organizations
- Order creation and validation
- Administrative finalization
- Radiology workflow
- File uploads
- Billing and credit management

## Base URL

All API endpoints are relative to the base URL:

```
https://api.radorderpad.com
```

## Authentication

Most endpoints require authentication using a JWT token. You'll need to include this token in the Authorization header of your requests:

```
Authorization: Bearer <token>
```

### Obtaining a Token

To obtain a token, you need to authenticate using the login endpoint:

```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('https://api.radorderpad.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data; // Contains accessToken and refreshToken
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

The response will include both an access token and a refresh token:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "12345",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "physician",
      "organizationId": "67890"
    }
  }
}
```

### Token Refresh

Access tokens expire after 1 hour. When an access token expires, you can use the refresh token to obtain a new one:

```javascript
const refreshToken = async (refreshToken) => {
  try {
    const response = await fetch('https://api.radorderpad.com/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data; // Contains new accessToken
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};
```

## User Roles

The API supports several user roles, each with different permissions:

- **admin_staff**: Administrative staff at referring organizations
- **physician**: Physicians at referring organizations
- **admin_referring**: Administrators at referring organizations
- **super_admin**: System administrators
- **admin_radiology**: Administrators at radiology organizations
- **scheduler**: Schedulers at radiology organizations
- **radiologist**: Radiologists at radiology organizations
- **trial_physician**: Trial users with limited access

Each endpoint specifies which roles are authorized to access it.

## Request Format

- All request bodies should be in JSON format
- Include the `Content-Type: application/json` header with all requests that include a body

## Response Format

All responses are in JSON format and typically follow this structure:

```json
{
  "success": true,
  "data": {
    // Response data specific to the endpoint
  }
}
```

Or in case of an error:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "error": {
    // Additional error details (optional)
  }
}
```

## Error Handling

The API uses standard HTTP status codes:

- **200 OK**: Request succeeded
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Authenticated but not authorized for the requested resource
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

## Pagination

Endpoints that return lists of items typically support pagination with these query parameters:

- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20)
- `sortBy`: Field to sort by (default varies by endpoint)
- `sortOrder`: Sort direction ("asc" or "desc", default: "desc")

Paginated responses include a pagination object:

```json
{
  "items": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

## Common Workflows

### Physician Workflow

1. Authenticate as a physician
2. Submit clinical dictation for validation
3. Handle clarification requests if needed
4. Finalize and sign the order

### Administrative Workflow

1. Authenticate as admin staff
2. Access the admin order queue
3. Update patient and insurance information
4. Add supplemental documentation
5. Send the order to radiology

### Radiology Workflow

1. Authenticate as radiology staff
2. Access the incoming order queue
3. Update order status
4. Request additional information if needed
5. Complete the order

## Testing Tools

A comprehensive token generator script is provided to simplify API testing across different user roles:

```bash
node generate-all-role-tokens.js
```

This script generates tokens for all roles and saves them to separate files in the `tokens` directory.

## Next Steps

Now that you understand the basics, you can explore the specific areas of the API that are relevant to your integration:

- [Authentication](./authentication/regular-auth.md) - Detailed authentication guide
- [Validation Workflow](./order-workflows/validation-workflow.md) - Guide to the validation process
- [Admin Workflow](./order-workflows/admin-workflow.md) - Guide to the admin finalization process
- [Radiology Workflow](./order-workflows/radiology-workflow.md) - Guide to the radiology process
- [File Uploads](./file-uploads/direct-to-s3.md) - Guide to file uploads
- [Trial Features](./trial-features/physician-sandbox.md) - Guide to the trial features

For a complete reference of all API endpoints, see the [OpenAPI Specification](../openapi/openapi.yaml).

================================================================================
FILE: frontend-explanation\api-docs\tutorials\order-workflows\admin-workflow.md
================================================================================

# Admin Finalization Workflow

This guide covers the administrative finalization workflow in RadOrderPad, which allows administrative staff to add EMR context and send orders to radiology after they've been signed by physicians.

## Overview

The Admin Finalization workflow is a critical part of the RadOrderPad system that bridges the gap between physician order creation and radiology processing. After a physician validates and signs an order, it enters the admin queue where administrative staff can:

1. Add or update patient demographic information
2. Add or update insurance information
3. Add supplemental documentation from the EMR
4. Review all information for accuracy
5. Send the order to the connected radiology organization

## Prerequisites

- You must have an `admin_staff` or `admin_referring` role
- Your organization must be active
- Your organization must have sufficient credits
- Your organization must have an active connection with at least one radiology organization

## Workflow Steps

### Step 1: Access the Admin Queue

First, retrieve the list of orders awaiting administrative finalization:

```javascript
const getAdminQueue = async (token) => {
  try {
    const response = await fetch('/api/admin/orders/queue', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch admin queue:', error);
    throw error;
  }
};
```

#### Request Parameters

The queue endpoint supports pagination and filtering:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| sortBy | string | No | Field to sort by (default: 'created_at') |
| sortOrder | string | No | Sort direction ('asc' or 'desc', default: 'desc') |
| status | string | No | Filter by status (default: 'pending_admin') |

#### Response Structure

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "12345",
        "patientFirstName": "Jane",
        "patientLastName": "Doe",
        "patientDateOfBirth": "1980-01-01",
        "patientGender": "female",
        "modalityType": "MRI",
        "cptCode": "70551",
        "cptDescription": "MRI brain without contrast",
        "icd10Codes": ["G43.909", "R51.9"],
        "icd10Descriptions": ["Migraine, unspecified, not intractable, without status migrainosus", "Headache, unspecified"],
        "clinicalIndication": "45-year-old female with chronic headaches...",
        "status": "pending_admin",
        "createdAt": "2025-04-25T10:30:00Z",
        "signedAt": "2025-04-25T10:35:00Z",
        "signedByUser": {
          "id": "67890",
          "firstName": "John",
          "lastName": "Smith",
          "role": "physician"
        }
      }
      // Additional orders...
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### Step 2: Update Patient Information

Update the patient's demographic information:

```javascript
const updatePatientInfo = async (orderId, patientInfo, token) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/patient-info`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patientInfo)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update patient info:', error);
    throw error;
  }
};
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| firstName | string | Yes | Patient's first name |
| lastName | string | Yes | Patient's last name |
| dateOfBirth | string | Yes | Patient's date of birth (YYYY-MM-DD) |
| gender | string | Yes | Patient's gender (male, female, other) |
| addressLine1 | string | No | Patient's address line 1 |
| addressLine2 | string | No | Patient's address line 2 |
| city | string | No | Patient's city |
| state | string | No | Patient's state |
| zipCode | string | No | Patient's ZIP code |
| phoneNumber | string | No | Patient's phone number |
| email | string | No | Patient's email address |
| mrn | string | No | Medical Record Number |

### Step 3: Update Insurance Information

Update the patient's insurance information:

```javascript
const updateInsuranceInfo = async (orderId, insuranceInfo, token) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/insurance-info`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(insuranceInfo)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update insurance info:', error);
    throw error;
  }
};
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| insurerName | string | No | Name of the insurance company |
| policyNumber | string | No | Insurance policy number |
| groupNumber | string | No | Insurance group number |
| policyHolderName | string | No | Name of the policy holder |
| policyHolderRelationship | string | No | Relationship to the patient (self, spouse, child, other) |
| policyHolderDateOfBirth | string | No | Policy holder's date of birth (YYYY-MM-DD) |
| secondaryInsurerName | string | No | Name of the secondary insurance company |
| secondaryPolicyNumber | string | No | Secondary insurance policy number |
| secondaryGroupNumber | string | No | Secondary insurance group number |

### Step 4: Add Supplemental Documentation

Add supplemental documentation from the EMR:

```javascript
const addSupplementalDocumentation = async (orderId, supplementalText, token) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/paste-supplemental`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        supplementalText
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to add supplemental documentation:', error);
    throw error;
  }
};
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| supplementalText | string | Yes | Supplemental documentation text from EMR |

### Step 5: Send to Radiology

Finally, send the order to the connected radiology organization:

```javascript
const sendToRadiology = async (orderId, token) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/send-to-radiology-fixed`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to send to radiology:', error);
    throw error;
  }
};
```

#### Response Structure

```json
{
  "success": true,
  "data": {
    "orderId": "12345",
    "status": "sent_to_radiology",
    "sentAt": "2025-04-25T11:00:00Z",
    "sentByUserId": "54321",
    "radiologyOrganizationId": "98765",
    "radiologyOrganizationName": "City Radiology Center",
    "creditsUsed": 1,
    "remainingCredits": 42
  }
}
```

## Database Interactions

The admin finalization process interacts with both databases:

### PHI Database
- Updates patient information in the `patients` table
- Updates insurance information in the `patient_insurance` table
- Stores supplemental documentation in the `patient_clinical_records` table
- Updates order status in the `orders` table
- Logs order history in the `order_history` table

### Main Database
- Checks and decrements the organization's credit balance in the `organizations` table
- Logs credit usage in the `credit_usage_logs` table

## Credit Management

The "Send to Radiology" operation consumes one credit from the organization's balance:

1. The system checks if the organization has sufficient credits
2. If sufficient, one credit is deducted from the balance
3. The credit usage is logged for billing transparency
4. If insufficient, a 402 Payment Required error is returned

## Error Handling

When working with admin finalization endpoints, be prepared to handle these common errors:

- **400 Bad Request**: Invalid input (e.g., missing required fields)
- **401 Unauthorized**: Missing or invalid authentication token
- **402 Payment Required**: Insufficient credits to send to radiology
- **403 Forbidden**: Insufficient permissions (non-admin role)
- **404 Not Found**: Order not found or not in expected state
- **500 Internal Server Error**: Server-side error

### Handling Insufficient Credits

```javascript
const sendToRadiologyWithCreditCheck = async (orderId, token) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/send-to-radiology-fixed`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 402) {
      // Handle insufficient credits
      const errorData = await response.json();
      console.error('Insufficient credits:', errorData.message);
      // Redirect to billing page or show purchase credits dialog
      return { success: false, needCredits: true };
    }
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to send to radiology:', error);
    throw error;
  }
};
```

## Best Practices

1. **Complete All Information**: Ensure all required patient and insurance information is complete
2. **Verify Accuracy**: Double-check all information before sending to radiology
3. **Include Relevant EMR Context**: Add all relevant supplemental documentation from the EMR
4. **Monitor Credit Balance**: Regularly check your organization's credit balance
5. **Process Orders Promptly**: Process orders in a timely manner to avoid delays in patient care

## Implementation Considerations

When implementing the admin finalization workflow, consider these technical aspects:

1. **Transaction Management**: The "Send to Radiology" operation involves both databases and requires careful transaction management
2. **Error Handling**: Implement robust error handling, especially for credit-related errors
3. **User Experience**: Provide clear feedback to users about the status of each step
4. **Performance**: The queue can potentially contain many orders, so implement efficient pagination and filtering
5. **Audit Trail**: Maintain a comprehensive audit trail of all actions for compliance purposes

## Conclusion

The Admin Finalization workflow is a critical bridge between physician order creation and radiology processing. By following the steps outlined in this guide, administrative staff can efficiently process orders and ensure they reach the appropriate radiology organization with all necessary information.

================================================================================
FILE: frontend-explanation\api-docs\tutorials\order-workflows\validation-workflow.md
================================================================================

# Validation Workflow

This guide covers the complete validation workflow for submitting clinical dictation and obtaining CPT and ICD-10 codes in the RadOrderPad system.

## Overview

The validation engine is the heart of RadOrderPad, processing clinical indications from physician dictation to assign appropriate CPT and ICD-10 codes. This functionality ensures accurate medical coding and compliance with clinical guidelines.

## Prerequisites

- You must have a physician role
- Your organization must be active
- You should have a valid JWT token

## Validation Architecture

The validation engine uses a sophisticated LLM orchestration system:

- **Primary LLM**: Claude 3.7
- **Fallback LLMs**: Grok 3 → GPT-4.0
- **Specialized Prompts**: Different prompts for various validation scenarios
- **Dual Database Interaction**: Reads from and writes to both PHI and Main databases

## Workflow Steps

The validation workflow consists of these steps:

1. Submit initial dictation
2. Handle clarification requests (if needed)
3. Override validation (if needed after 3 failed attempts)
4. Finalize and sign the order

### Step 1: Submit Initial Dictation

Submit the clinical dictation to the validation endpoint:

```javascript
const submitDictation = async (dictation, modalityType, token) => {
  try {
    const response = await fetch('/api/orders/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dictation,
        modalityType
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to validate dictation:', error);
    throw error;
  }
};
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dictation | string | Yes | The clinical dictation text to validate |
| modalityType | string | Yes | The type of imaging modality (CT, MRI, XRAY, ULTRASOUND, PET, NUCLEAR) |
| patientInfo | object | No | Optional patient information (firstName, lastName, dateOfBirth, gender) |
| orderId | string | No | For subsequent validation attempts, the ID of the existing order |
| isOverrideValidation | boolean | No | Whether this is an override validation after multiple failed attempts |

#### Response Structure

The response will include:

- `orderId`: The ID of the created draft order
- `validationResult`: The validation result with CPT and ICD-10 codes
  - `cptCode`: The assigned CPT code
  - `cptDescription`: Description of the CPT code
  - `icd10Codes`: Array of assigned ICD-10 codes
  - `icd10Descriptions`: Array of ICD-10 code descriptions
  - `confidence`: Confidence score of the validation
- `requiresClarification`: Whether additional clarification is needed
- `clarificationPrompt`: The prompt for clarification if needed
- `attemptNumber`: The current validation attempt number

#### Example Response

```json
{
  "success": true,
  "data": {
    "orderId": "12345",
    "validationResult": {
      "cptCode": "70450",
      "cptDescription": "CT scan of head/brain without contrast",
      "icd10Codes": ["R51.9", "S06.0X0A"],
      "icd10Descriptions": ["Headache, unspecified", "Concussion without loss of consciousness, initial encounter"],
      "confidence": 0.92
    },
    "requiresClarification": false,
    "attemptNumber": 1
  }
}
```

### Step 2: Handle Clarification Requests

If `requiresClarification` is true, you need to submit additional information:

```javascript
const submitClarification = async (orderId, dictation, token) => {
  try {
    const response = await fetch('/api/orders/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        dictation
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to submit clarification:', error);
    throw error;
  }
};
```

#### Clarification Flow

1. The system identifies that more information is needed
2. A clarification prompt is returned in the response
3. The physician provides additional information
4. The system attempts validation again with the combined information
5. This process can repeat up to 3 times before requiring an override

#### Example Clarification Prompt

```
"To accurately determine the appropriate CPT code, please provide more information about:
1. The duration of the patient's symptoms
2. Any prior imaging studies
3. Whether there is a history of trauma or surgery in the affected area"
```

### Step 3: Override Validation (If Needed)

After 3 failed attempts, you can submit an override validation:

```javascript
const submitOverride = async (orderId, dictation, token) => {
  try {
    const response = await fetch('/api/orders/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        dictation,
        isOverrideValidation: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to submit override:', error);
    throw error;
  }
};
```

#### Override Flow

1. After 3 failed validation attempts, the system allows an override
2. The physician submits the dictation with `isOverrideValidation: true`
3. The system processes the override with a specialized prompt
4. The validation result is marked as an override in the database

### Step 4: Finalize and Sign the Order

Once validation is successful, finalize and sign the order:

```javascript
const finalizeOrder = async (orderId, token) => {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'pending_admin'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to finalize order:', error);
    throw error;
  }
};
```

#### Finalization Process

1. The order is updated with the final validation state
2. The physician's signature is recorded
3. The order status is changed to 'pending_admin'
4. The order is added to the admin queue for further processing

## Database Interactions

The validation process interacts with both databases:

### PHI Database
- Creates or updates the `orders` record
- Stores validation attempts in `validation_attempts`
- Logs order history in `order_history`

### Main Database
- Logs validation attempts in `llm_validation_logs` (with PHI sanitized)
- Retrieves prompt templates from `prompt_templates`
- Checks prompt assignments in `prompt_assignments`

## Error Handling

When working with validation endpoints, be prepared to handle these common errors:

- **400 Bad Request**: Invalid input (e.g., missing required fields)
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions (non-physician role)
- **503 Service Unavailable**: LLM service is temporarily unavailable

### Handling LLM Service Unavailability

The LLM service may occasionally be unavailable. Implement retry logic with exponential backoff:

```javascript
const validateWithRetry = async (dictation, modalityType, token, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await submitDictation(dictation, modalityType, token);
    } catch (error) {
      if (error.message.includes('503') && retries < maxRetries - 1) {
        retries++;
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff
        console.log(`Retry ${retries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};
```

## Best Practices for Clinical Dictation

To maximize validation accuracy, follow these best practices:

1. **Include Patient Demographics**
   - Age and gender
   - Relevant physical characteristics

2. **Describe Clinical Symptoms**
   - Location (specific body part)
   - Duration (acute, chronic, specific timeframe)
   - Severity (mild, moderate, severe)
   - Pattern (constant, intermittent, progressive)

3. **Include Relevant History**
   - Prior diagnoses
   - Previous treatments
   - Family history if relevant
   - Prior imaging studies

4. **Provide Clinical Reasoning**
   - Suspected diagnosis
   - Differential diagnoses
   - Reason for the imaging study
   - What you hope to confirm or rule out

5. **Specify Modality Preferences**
   - Preferred imaging modality
   - With or without contrast
   - Special protocols if needed

### Example of Good Clinical Dictation

```
"45-year-old female with 3-week history of progressively worsening right lower quadrant abdominal pain. 
Pain is sharp, rated 7/10, and worse with movement. Patient reports low-grade fever and nausea. 
Physical exam reveals tenderness to palpation in RLQ with guarding. 
No prior abdominal surgeries. Family history significant for colon cancer in father. 
Last colonoscopy 5 years ago was normal. 
Requesting CT abdomen and pelvis with contrast to evaluate for appendicitis, diverticulitis, 
or possible mass lesion."
```

## Validation Performance Metrics

The validation engine achieves the following performance metrics:

- **First-attempt accuracy**: ~85%
- **After clarification accuracy**: ~92%
- **Overall accuracy (including overrides)**: ~98%
- **Average response time**: 2-3 seconds
- **Service availability**: 99.9%

## Conclusion

The validation workflow is a critical component of the RadOrderPad system, ensuring accurate CPT and ICD-10 code assignment for radiology orders. By following the steps outlined in this guide and adhering to best practices for clinical dictation, you can maximize the accuracy and efficiency of the validation process.

================================================================================
FILE: frontend-explanation\api-docs\tutorials\organization-management\location-management.md
================================================================================

# Location Management

This guide covers the management of organization locations in the RadOrderPad API, including creating, retrieving, updating, and deleting location information.

## Prerequisites

- You must have an administrator role
- Your organization must be active
- You must have a valid JWT token

## Location Management Overview

Organizations in RadOrderPad can have multiple physical locations, each with its own:

1. Address and contact information
2. Operating hours
3. Available services
4. Assigned staff members
5. Specific settings and configurations

## Retrieving Location Information

### List All Locations

Retrieve all locations for your organization:

```javascript
const getAllLocations = async (token, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve locations:', error);
    throw error;
  }
};
```

The response will include:
- `locations`: Array of location records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of locations
  - `itemsPerPage`: Number of locations per page

Each location record includes:
- `id`: Location ID
- `name`: Location name
- `status`: Location status (active, inactive)
- `isPrimary`: Whether this is the primary location
- `address`: Location address
  - `street1`: Street address line 1
  - `street2`: Street address line 2 (optional)
  - `city`: City
  - `state`: State/province
  - `zipCode`: ZIP/postal code
  - `country`: Country
- `contactInfo`: Contact information
  - `phone`: Location phone number
  - `fax`: Location fax number
  - `email`: Location email
- `createdAt`: Date the location was created
- `updatedAt`: Date the location was last updated

### Get Location Details

Retrieve detailed information for a specific location:

```javascript
const getLocationDetails = async (token, locationId) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve location details:', error);
    throw error;
  }
};
```

The response will include all location information:
- `id`: Location ID
- `name`: Location name
- `status`: Location status
- `isPrimary`: Whether this is the primary location
- `address`: Location address
- `contactInfo`: Contact information
- `operatingHours`: Operating hours
  - `monday`: Monday hours (e.g., "9:00-17:00" or "Closed")
  - `tuesday`: Tuesday hours
  - `wednesday`: Wednesday hours
  - `thursday`: Thursday hours
  - `friday`: Friday hours
  - `saturday`: Saturday hours
  - `sunday`: Sunday hours
  - `holidays`: Holiday schedule
- `services`: Available services at this location
  - Array of service objects with:
    - `serviceType`: Type of service
    - `availability`: Availability information
    - `specialInstructions`: Special instructions
- `assignedUsers`: Users assigned to this location
  - Array of user IDs and roles
- `settings`: Location-specific settings
  - `defaultLanguage`: Default language
  - `timeZone`: Time zone
  - `notificationPreferences`: Notification settings
- `metadata`: Additional metadata
  - `parkingInfo`: Parking information
  - `directions`: Directions to the location
  - `accessibilityFeatures`: Accessibility features
- `createdAt`: Date the location was created
- `updatedAt`: Date the location was last updated

## Creating and Updating Locations

### Create a New Location

Create a new location for your organization:

```javascript
const createLocation = async (token, locationData) => {
  try {
    const response = await fetch('/api/organizations/mine/locations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(locationData)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to create location:', error);
    throw error;
  }
};
```

The `locationData` object should include:
- `name`: Location name (required)
- `address`: Location address (required)
  - `street1`: Street address line 1 (required)
  - `street2`: Street address line 2 (optional)
  - `city`: City (required)
  - `state`: State/province (required)
  - `zipCode`: ZIP/postal code (required)
  - `country`: Country (required)
- `contactInfo`: Contact information (required)
  - `phone`: Location phone number (required)
  - `fax`: Location fax number (optional)
  - `email`: Location email (optional)
- `isPrimary`: Whether this is the primary location (optional, default: false)
- `operatingHours`: Operating hours (optional)
- `services`: Available services (optional)
- `settings`: Location-specific settings (optional)
- `metadata`: Additional metadata (optional)

### Update a Location

Update an existing location:

```javascript
const updateLocation = async (token, locationId, locationData) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(locationData)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update location:', error);
    throw error;
  }
};
```

The `locationData` object can include any of the fields mentioned in the create operation.

### Set Primary Location

Set a location as the primary location:

```javascript
const setPrimaryLocation = async (token, locationId) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}/set-primary`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to set primary location:', error);
    throw error;
  }
};
```

## Managing Location Services

### Update Location Services

Update the services available at a location:

```javascript
const updateLocationServices = async (token, locationId, services) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}/services`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ services })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update location services:', error);
    throw error;
  }
};
```

The `services` parameter is an array of service objects:
```javascript
const services = [
  {
    serviceType: 'CT_SCAN',
    availability: 'Monday-Friday, 9:00-17:00',
    specialInstructions: 'Please arrive 15 minutes early for preparation.'
  },
  {
    serviceType: 'MRI',
    availability: 'Monday-Friday, 9:00-17:00',
    specialInstructions: 'Please remove all metal objects before the procedure.'
  },
  {
    serviceType: 'X_RAY',
    availability: 'Monday-Saturday, 8:00-20:00',
    specialInstructions: ''
  }
];
```

### Get Available Services

Retrieve the services available at a location:

```javascript
const getLocationServices = async (token, locationId) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}/services`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve location services:', error);
    throw error;
  }
};
```

## Managing Operating Hours

### Update Operating Hours

Update the operating hours for a location:

```javascript
const updateOperatingHours = async (token, locationId, operatingHours) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}/operating-hours`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ operatingHours })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update operating hours:', error);
    throw error;
  }
};
```

The `operatingHours` object should include:
```javascript
const operatingHours = {
  monday: '9:00-17:00',
  tuesday: '9:00-17:00',
  wednesday: '9:00-17:00',
  thursday: '9:00-17:00',
  friday: '9:00-17:00',
  saturday: 'Closed',
  sunday: 'Closed',
  holidays: 'Closed on all federal holidays'
};
```

## Managing User Assignments

### Assign Users to Location

Assign users to a location:

```javascript
const assignUsersToLocation = async (token, locationId, userIds) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}/assign-users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userIds })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to assign users to location:', error);
    throw error;
  }
};
```

The `userIds` parameter is an array of user IDs:
```javascript
const userIds = ['user-123', 'user-456', 'user-789'];
```

### Remove Users from Location

Remove users from a location:

```javascript
const removeUsersFromLocation = async (token, locationId, userIds) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}/remove-users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userIds })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to remove users from location:', error);
    throw error;
  }
};
```

### Get Users Assigned to Location

Retrieve users assigned to a location:

```javascript
const getLocationUsers = async (token, locationId, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}/users?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve location users:', error);
    throw error;
  }
};
```

## Deactivating and Reactivating Locations

### Deactivate a Location

Deactivate a location:

```javascript
const deactivateLocation = async (token, locationId, reason) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}/deactivate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to deactivate location:', error);
    throw error;
  }
};
```

### Reactivate a Location

Reactivate a location:

```javascript
const reactivateLocation = async (token, locationId) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}/reactivate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to reactivate location:', error);
    throw error;
  }
};
```

## Deleting Locations

### Delete a Location

Delete a location:

```javascript
const deleteLocation = async (token, locationId) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to delete location:', error);
    throw error;
  }
};
```

Note: You cannot delete a location if:
- It is the primary location
- It has active users assigned to it
- It has active orders associated with it

## Location Metadata Management

### Update Location Metadata

Update metadata for a location:

```javascript
const updateLocationMetadata = async (token, locationId, metadata) => {
  try {
    const response = await fetch(`/api/organizations/mine/locations/${locationId}/metadata`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ metadata })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update location metadata:', error);
    throw error;
  }
};
```

The `metadata` object can include:
```javascript
const metadata = {
  parkingInfo: 'Free parking available in the rear lot',
  directions: 'Located on the corner of Main St and Oak Ave',
  accessibilityFeatures: 'Wheelchair ramps, elevator access',
  nearbyLandmarks: 'Across from Central Park',
  publicTransportation: 'Bus routes 10, 15, and 22 stop nearby'
};
```

## Error Handling

When working with location management endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-admin role)
- 404 Not Found: Location not found
- 409 Conflict: Conflict with existing data (e.g., duplicate name)
- 422 Unprocessable Entity: Cannot perform the requested operation (e.g., delete primary location)

## Best Practices

1. **Create a primary location first**: Always set up a primary location for your organization
2. **Provide complete address information**: Include all address components for proper mapping
3. **Set accurate operating hours**: Keep operating hours up-to-date for patient scheduling
4. **Assign appropriate services**: Only list services that are actually available at each location
5. **Manage user assignments**: Keep user assignments current as staff changes occur
6. **Use location-specific settings**: Configure settings appropriate for each location
7. **Include helpful metadata**: Add parking, directions, and accessibility information
8. **Maintain active status**: Deactivate locations that are temporarily closed
9. **Delete with caution**: Only delete locations that will never be used again
10. **Regularly review locations**: Periodically review and update location information

================================================================================
FILE: frontend-explanation\api-docs\tutorials\organization-management\organization-profile.md
================================================================================

# Organization Profile Management

This guide covers the management of organization profiles in the RadOrderPad API, including creating, retrieving, updating, and deleting organization information.

## Prerequisites

- You must have an administrator role
- Your organization must be active
- You must have a valid JWT token

## Organization Profile Overview

The organization profile contains essential information about your organization, including:

1. Basic Information: Name, type, contact details
2. Address Information: Physical location and mailing address
3. Billing Information: Payment methods and billing contacts
4. Specialties: Medical specialties offered or required
5. Settings: Organization-specific settings and preferences

## Retrieving Organization Information

### Get Your Organization Profile

Retrieve your own organization's profile:

```javascript
const getMyOrganization = async (token) => {
  try {
    const response = await fetch('/api/organizations/mine', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve organization profile:', error);
    throw error;
  }
};
```

The response will include:
- `id`: Organization ID
- `name`: Organization name
- `type`: Organization type (referring, radiology, both)
- `status`: Organization status (active, inactive, pending)
- `contactEmail`: Primary contact email
- `contactPhone`: Primary contact phone
- `website`: Organization website
- `address`: Physical address
  - `street1`: Street address line 1
  - `street2`: Street address line 2 (optional)
  - `city`: City
  - `state`: State/province
  - `zipCode`: ZIP/postal code
  - `country`: Country
- `mailingAddress`: Mailing address (if different from physical)
- `billingInfo`: Billing information
  - `billingEmail`: Billing email
  - `billingPhone`: Billing phone
  - `billingAddress`: Billing address
  - `taxId`: Tax ID/EIN
- `specialties`: Array of medical specialties
- `settings`: Organization settings
  - `defaultLanguage`: Default language
  - `timeZone`: Time zone
  - `dateFormat`: Date format preference
  - `notificationPreferences`: Notification settings
- `createdAt`: Date the organization was created
- `updatedAt`: Date the organization was last updated

### Get Organization by ID

Retrieve another organization's public profile by ID:

```javascript
const getOrganizationById = async (token, organizationId) => {
  try {
    const response = await fetch(`/api/organizations/${organizationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve organization:', error);
    throw error;
  }
};
```

The response will include the public profile information, which is a subset of the full profile:
- `id`: Organization ID
- `name`: Organization name
- `type`: Organization type
- `contactEmail`: Public contact email
- `contactPhone`: Public contact phone
- `website`: Organization website
- `address`: Physical address
- `specialties`: Array of medical specialties
- `connectionStatus`: Connection status with your organization (if applicable)

## Updating Organization Information

### Update Basic Information

Update your organization's basic information:

```javascript
const updateBasicInfo = async (token, basicInfo) => {
  try {
    const response = await fetch('/api/organizations/mine/basic-info', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(basicInfo)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update basic information:', error);
    throw error;
  }
};
```

The `basicInfo` object can include:
- `name`: Organization name
- `type`: Organization type
- `contactEmail`: Primary contact email
- `contactPhone`: Primary contact phone
- `website`: Organization website

### Update Address Information

Update your organization's address information:

```javascript
const updateAddressInfo = async (token, addressInfo) => {
  try {
    const response = await fetch('/api/organizations/mine/address', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addressInfo)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update address information:', error);
    throw error;
  }
};
```

The `addressInfo` object can include:
- `address`: Physical address
  - `street1`: Street address line 1
  - `street2`: Street address line 2
  - `city`: City
  - `state`: State/province
  - `zipCode`: ZIP/postal code
  - `country`: Country
- `mailingAddress`: Mailing address (if different from physical)
  - `street1`: Street address line 1
  - `street2`: Street address line 2
  - `city`: City
  - `state`: State/province
  - `zipCode`: ZIP/postal code
  - `country`: Country
- `usePhysicalForMailing`: Boolean indicating whether to use physical address for mailing

### Update Billing Information

Update your organization's billing information:

```javascript
const updateBillingInfo = async (token, billingInfo) => {
  try {
    const response = await fetch('/api/organizations/mine/billing-info', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(billingInfo)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update billing information:', error);
    throw error;
  }
};
```

The `billingInfo` object can include:
- `billingEmail`: Billing email
- `billingPhone`: Billing phone
- `billingAddress`: Billing address
  - `street1`: Street address line 1
  - `street2`: Street address line 2
  - `city`: City
  - `state`: State/province
  - `zipCode`: ZIP/postal code
  - `country`: Country
- `taxId`: Tax ID/EIN
- `usePhysicalForBilling`: Boolean indicating whether to use physical address for billing

### Update Specialties

Update your organization's medical specialties:

```javascript
const updateSpecialties = async (token, specialties) => {
  try {
    const response = await fetch('/api/organizations/mine/specialties', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ specialties })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update specialties:', error);
    throw error;
  }
};
```

The `specialties` parameter is an array of specialty codes:
```javascript
const specialties = [
  'RADIOLOGY',
  'CARDIOLOGY',
  'ORTHOPEDICS',
  'NEUROLOGY',
  'ONCOLOGY'
];
```

### Update Organization Settings

Update your organization's settings:

```javascript
const updateSettings = async (token, settings) => {
  try {
    const response = await fetch('/api/organizations/mine/settings', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
};
```

The `settings` object can include:
- `defaultLanguage`: Default language code
- `timeZone`: Time zone identifier
- `dateFormat`: Date format preference
- `notificationPreferences`: Notification settings
  - `email`: Email notification settings
  - `inApp`: In-app notification settings
  - `sms`: SMS notification settings

## Organization Logo Management

### Upload Organization Logo

Upload a logo for your organization:

```javascript
const uploadLogo = async (token, logoFile) => {
  try {
    // First, get a presigned URL for the logo upload
    const presignedUrlResponse = await fetch('/api/organizations/mine/logo-upload-url', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!presignedUrlResponse.ok) {
      throw new Error(`Error: ${presignedUrlResponse.status}`);
    }
    
    const presignedData = await presignedUrlResponse.json();
    
    // Upload the logo to the presigned URL
    const uploadResponse = await fetch(presignedData.data.presignedUrl, {
      method: 'PUT',
      body: logoFile,
      headers: {
        'Content-Type': logoFile.type
      }
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }
    
    // Confirm the logo upload
    const confirmResponse = await fetch('/api/organizations/mine/logo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileKey: presignedData.data.fileKey
      })
    });
    
    if (!confirmResponse.ok) {
      throw new Error(`Error: ${confirmResponse.status}`);
    }
    
    const data = await confirmResponse.json();
    return data.data;
  } catch (error) {
    console.error('Failed to upload logo:', error);
    throw error;
  }
};
```

The response will include:
- `logoUrl`: URL for the uploaded logo
- `thumbnailUrl`: URL for a thumbnail version of the logo
- `uploadDate`: Date the logo was uploaded

### Remove Organization Logo

Remove your organization's logo:

```javascript
const removeLogo = async (token) => {
  try {
    const response = await fetch('/api/organizations/mine/logo', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to remove logo:', error);
    throw error;
  }
};
```

## Organization Verification

### Request Organization Verification

Request verification for your organization:

```javascript
const requestVerification = async (token, verificationDocuments) => {
  try {
    const response = await fetch('/api/organizations/mine/request-verification', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documents: verificationDocuments
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to request verification:', error);
    throw error;
  }
};
```

The `verificationDocuments` parameter is an array of document IDs that have been previously uploaded:
```javascript
const verificationDocuments = [
  'doc-123456',
  'doc-789012'
];
```

### Check Verification Status

Check the status of your organization's verification:

```javascript
const checkVerificationStatus = async (token) => {
  try {
    const response = await fetch('/api/organizations/mine/verification-status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to check verification status:', error);
    throw error;
  }
};
```

The response will include:
- `status`: Verification status (pending, verified, rejected)
- `requestDate`: Date the verification was requested
- `verificationDate`: Date the verification was completed (if verified)
- `rejectionReason`: Reason for rejection (if rejected)
- `documents`: Array of submitted documents
- `nextReviewDate`: Expected date for the next review

## Organization Deactivation

### Deactivate Organization

Deactivate your organization:

```javascript
const deactivateOrganization = async (token, reason) => {
  try {
    const response = await fetch('/api/organizations/mine/deactivate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to deactivate organization:', error);
    throw error;
  }
};
```

### Reactivate Organization

Reactivate your organization:

```javascript
const reactivateOrganization = async (token) => {
  try {
    const response = await fetch('/api/organizations/mine/reactivate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to reactivate organization:', error);
    throw error;
  }
};
```

## Error Handling

When working with organization profile endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-admin role)
- 404 Not Found: Organization not found
- 409 Conflict: Duplicate information (e.g., email already in use)
- 422 Unprocessable Entity: Invalid data format

## Best Practices

1. **Keep information up-to-date**: Regularly review and update your organization profile
2. **Use clear contact information**: Ensure contact details are accurate and monitored
3. **Provide complete address information**: Include all address components for proper delivery
4. **Select appropriate specialties**: Choose specialties that accurately reflect your services
5. **Upload a professional logo**: Use a high-quality logo that represents your brand
6. **Verify your organization**: Complete the verification process for enhanced trust
7. **Configure notification preferences**: Set up notifications to ensure you receive important updates
8. **Maintain accurate billing information**: Keep billing details current to avoid payment issues
9. **Document organization changes**: Keep records of significant profile changes
10. **Review connected organizations**: Periodically review your connections with other organizations

================================================================================
FILE: frontend-explanation\api-docs\tutorials\superadmin\organization-management.md
================================================================================

# Superadmin Organization Management

This guide covers the organization management capabilities available to superadmins in the RadOrderPad API.

## Prerequisites

- You must have a superadmin role
- You must have a valid JWT token with superadmin privileges

## Superadmin Organization Management Overview

Superadmins have extended capabilities for managing organizations, including:

1. Viewing all organizations in the system
2. Creating new organizations
3. Updating organization information
4. Managing organization status
5. Handling organization verification
6. Viewing organization activity and metrics
7. Managing organization settings and configurations

## Retrieving Organization Information

### List All Organizations

Retrieve a list of all organizations in the system:

```javascript
const getAllOrganizations = async (token, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/organizations?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve organizations:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `status`: Filter by organization status (active, inactive, pending, suspended)
- `type`: Filter by organization type (referring, radiology, both)
- `verificationStatus`: Filter by verification status (verified, pending, rejected)
- `createdAfter`: Filter by creation date (ISO date string)
- `createdBefore`: Filter by creation date (ISO date string)
- `search`: Search term for organization name or ID

The response will include:
- `organizations`: Array of organization records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of organizations
  - `itemsPerPage`: Number of organizations per page

Each organization record includes:
- `id`: Organization ID
- `name`: Organization name
- `type`: Organization type
- `status`: Organization status
- `verificationStatus`: Verification status
- `contactEmail`: Contact email
- `contactPhone`: Contact phone
- `address`: Organization address
- `createdAt`: Date the organization was created
- `updatedAt`: Date the organization was last updated
- `userCount`: Number of users in the organization
- `connectionCount`: Number of connections with other organizations

### Get Organization Details

Retrieve detailed information for a specific organization:

```javascript
const getOrganizationDetails = async (token, organizationId) => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve organization details:', error);
    throw error;
  }
};
```

The response will include all organization information, including:
- `id`: Organization ID
- `name`: Organization name
- `type`: Organization type
- `status`: Organization status
- `verificationStatus`: Verification status
- `contactEmail`: Contact email
- `contactPhone`: Contact phone
- `website`: Organization website
- `address`: Organization address
- `mailingAddress`: Mailing address
- `billingInfo`: Billing information
- `specialties`: Array of medical specialties
- `settings`: Organization settings
- `createdAt`: Date the organization was created
- `updatedAt`: Date the organization was last updated
- `users`: Array of users in the organization
- `locations`: Array of organization locations
- `connections`: Array of connections with other organizations
- `subscriptionInfo`: Subscription information
- `creditBalance`: Credit balance information
- `activityMetrics`: Activity metrics
  - `totalOrders`: Total number of orders
  - `ordersLast30Days`: Orders in the last 30 days
  - `validationAccuracy`: Validation accuracy percentage
  - `averageResponseTime`: Average response time in seconds

## Creating and Updating Organizations

### Create a New Organization

Create a new organization:

```javascript
const createOrganization = async (token, organizationData) => {
  try {
    const response = await fetch('/api/superadmin/organizations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(organizationData)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to create organization:', error);
    throw error;
  }
};
```

The `organizationData` object should include:
- `name`: Organization name (required)
- `type`: Organization type (required)
- `contactEmail`: Contact email (required)
- `contactPhone`: Contact phone (required)
- `address`: Organization address (required)
- `specialties`: Array of medical specialties (optional)
- `settings`: Organization settings (optional)
- `initialAdmin`: Initial admin user information (optional)
  - `email`: Admin email
  - `firstName`: Admin first name
  - `lastName`: Admin last name
  - `sendInvite`: Whether to send an invitation email

### Update Organization Information

Update an organization's information:

```javascript
const updateOrganization = async (token, organizationId, organizationData) => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(organizationData)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update organization:', error);
    throw error;
  }
};
```

The `organizationData` object can include any of the fields mentioned in the create operation.

## Managing Organization Status

### Activate an Organization

Activate an organization:

```javascript
const activateOrganization = async (token, organizationId, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to activate organization:', error);
    throw error;
  }
};
```

### Deactivate an Organization

Deactivate an organization:

```javascript
const deactivateOrganization = async (token, organizationId, reason, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}/deactivate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to deactivate organization:', error);
    throw error;
  }
};
```

### Suspend an Organization

Suspend an organization:

```javascript
const suspendOrganization = async (token, organizationId, reason, suspensionPeriod, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}/suspend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason, suspensionPeriod, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to suspend organization:', error);
    throw error;
  }
};
```

The `suspensionPeriod` parameter specifies the suspension duration in days.

### Unsuspend an Organization

Remove the suspension from an organization:

```javascript
const unsuspendOrganization = async (token, organizationId, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}/unsuspend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to unsuspend organization:', error);
    throw error;
  }
};
```

## Managing Organization Verification

### Review Verification Request

Review an organization's verification request:

```javascript
const reviewVerificationRequest = async (token, organizationId, decision, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}/verification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ decision, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to review verification request:', error);
    throw error;
  }
};
```

The `decision` parameter can be either `approve` or `reject`.

### Get Verification Documents

Retrieve verification documents for an organization:

```javascript
const getVerificationDocuments = async (token, organizationId) => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}/verification-documents`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve verification documents:', error);
    throw error;
  }
};
```

The response will include an array of document records, each with:
- `id`: Document ID
- `fileName`: Original file name
- `fileType`: MIME type of the file
- `fileSize`: Size of the file in bytes
- `uploadDate`: Date and time of the upload
- `downloadUrl`: URL for downloading the document

## Managing Organization Settings

### Update Organization Settings

Update an organization's settings:

```javascript
const updateOrganizationSettings = async (token, organizationId, settings) => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}/settings`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ settings })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update organization settings:', error);
    throw error;
  }
};
```

The `settings` object can include:
- `featureFlags`: Feature flags for the organization
- `validationLimits`: Validation limits
- `connectionLimits`: Connection limits
- `userLimits`: User limits
- `securitySettings`: Security settings
- `notificationSettings`: Notification settings

### Reset Organization Password

Reset the password for an organization's admin user:

```javascript
const resetOrganizationPassword = async (token, organizationId, adminUserId) => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}/reset-admin-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ adminUserId })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to reset organization password:', error);
    throw error;
  }
};
```

The response will include:
- `success`: Boolean indicating success
- `resetLink`: Password reset link to provide to the admin user

## Viewing Organization Activity

### Get Organization Activity Log

Retrieve the activity log for an organization:

```javascript
const getOrganizationActivityLog = async (token, organizationId, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/organizations/${organizationId}/activity-log?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve organization activity log:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `activityType`: Filter by activity type
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `userId`: Filter by user ID

The response will include:
- `activities`: Array of activity records
- `pagination`: Pagination information

Each activity record includes:
- `id`: Activity ID
- `timestamp`: Activity timestamp
- `activityType`: Type of activity
- `userId`: ID of the user who performed the activity
- `userName`: Name of the user who performed the activity
- `details`: Activity details
- `ipAddress`: IP address from which the activity was performed
- `userAgent`: User agent information

### Get Organization Metrics

Retrieve metrics for an organization:

```javascript
const getOrganizationMetrics = async (token, organizationId, timeframe = '30d') => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}/metrics?timeframe=${timeframe}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve organization metrics:', error);
    throw error;
  }
};
```

The `timeframe` parameter can be one of:
- `7d`: Last 7 days
- `30d`: Last 30 days
- `90d`: Last 90 days
- `1y`: Last year

The response will include:
- `orderMetrics`: Order-related metrics
  - `totalOrders`: Total number of orders
  - `ordersByStatus`: Breakdown of orders by status
  - `ordersByModality`: Breakdown of orders by modality
  - `orderTrend`: Daily/weekly order counts
- `validationMetrics`: Validation-related metrics
  - `validationAccuracy`: Validation accuracy percentage
  - `averageAttemptsPerOrder`: Average validation attempts per order
  - `clarificationRate`: Percentage of orders requiring clarification
  - `overrideRate`: Percentage of orders requiring override
- `userMetrics`: User-related metrics
  - `activeUsers`: Number of active users
  - `usersByRole`: Breakdown of users by role
  - `newUsers`: Number of new users
- `connectionMetrics`: Connection-related metrics
  - `totalConnections`: Total number of connections
  - `connectionsByStatus`: Breakdown of connections by status
  - `newConnections`: Number of new connections
- `billingMetrics`: Billing-related metrics
  - `creditUsage`: Credit usage
  - `creditPurchases`: Credit purchases
  - `currentBalance`: Current credit balance

## Managing Organization Billing

### Adjust Credit Balance

Adjust an organization's credit balance:

```javascript
const adjustCreditBalance = async (token, organizationId, adjustment, reason, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}/adjust-credits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ adjustment, reason, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to adjust credit balance:', error);
    throw error;
  }
};
```

The `adjustment` parameter can be positive (add credits) or negative (remove credits).

### View Billing History

Retrieve the billing history for an organization:

```javascript
const getBillingHistory = async (token, organizationId, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/superadmin/organizations/${organizationId}/billing-history?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve billing history:', error);
    throw error;
  }
};
```

The response will include:
- `transactions`: Array of transaction records
- `pagination`: Pagination information

Each transaction record includes:
- `id`: Transaction ID
- `type`: Transaction type
- `amount`: Transaction amount
- `date`: Transaction date
- `description`: Transaction description
- `status`: Transaction status
- `paymentMethod`: Payment method information (if applicable)
- `invoiceUrl`: URL to the invoice (if applicable)

## Error Handling

When working with superadmin organization management endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-superadmin role)
- 404 Not Found: Organization not found
- 409 Conflict: Conflict with existing data
- 422 Unprocessable Entity: Cannot perform the requested operation

## Best Practices

1. **Document all actions**: Always provide detailed notes for administrative actions
2. **Use appropriate status changes**: Choose the correct status change for each situation
3. **Verify organizations thoroughly**: Review all verification documents carefully
4. **Monitor organization metrics**: Regularly review organization activity and metrics
5. **Handle billing adjustments carefully**: Document reasons for all credit adjustments
6. **Respect privacy**: Access organization data only when necessary
7. **Follow security protocols**: Adhere to security best practices when resetting passwords
8. **Maintain audit trail**: Ensure all administrative actions are properly logged
9. **Communicate changes**: Notify organization admins of significant changes
10. **Apply consistent policies**: Treat all organizations fairly and consistently

================================================================================
FILE: frontend-explanation\api-docs\tutorials\superadmin\prompt-management.md
================================================================================

# Superadmin Prompt Management

This guide covers the prompt template management capabilities available to superadmins in the RadOrderPad API.

## Prerequisites

- You must have a superadmin role
- You must have a valid JWT token with superadmin privileges

## Prompt Management Overview

Superadmins have extended capabilities for managing prompt templates, which are used by the validation engine to process clinical dictations. These capabilities include:

1. Viewing all prompt templates in the system
2. Creating new prompt templates
3. Updating existing prompt templates
4. Testing prompt templates
5. Assigning prompt templates to organizations
6. Monitoring prompt template performance
7. Managing prompt template versions

## Retrieving Prompt Templates

### List All Prompt Templates

Retrieve a list of all prompt templates in the system:

```javascript
const getAllPromptTemplates = async (token, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/prompts?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve prompt templates:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `status`: Filter by template status (active, inactive, draft)
- `modalityType`: Filter by modality type (CT, MRI, XRAY, ULTRASOUND, PET, NUCLEAR)
- `version`: Filter by version number
- `search`: Search term for template name or description

The response will include:
- `templates`: Array of prompt template records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of templates
  - `itemsPerPage`: Number of templates per page

Each template record includes:
- `id`: Template ID
- `name`: Template name
- `description`: Template description
- `status`: Template status
- `modalityType`: Modality type
- `version`: Version number
- `createdAt`: Date the template was created
- `updatedAt`: Date the template was last updated
- `createdBy`: User who created the template
- `assignedOrganizationsCount`: Number of organizations using this template
- `performanceMetrics`: Performance metrics
  - `accuracy`: Accuracy percentage
  - `clarificationRate`: Clarification rate percentage
  - `overrideRate`: Override rate percentage

### Get Prompt Template Details

Retrieve detailed information for a specific prompt template:

```javascript
const getPromptTemplateDetails = async (token, templateId) => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve prompt template details:', error);
    throw error;
  }
};
```

The response will include all template information, including:
- `id`: Template ID
- `name`: Template name
- `description`: Template description
- `status`: Template status
- `modalityType`: Modality type
- `version`: Version number
- `content`: Template content
- `systemInstructions`: System instructions
- `clarificationStrategy`: Clarification strategy
- `validationRules`: Validation rules
- `outputFormat`: Output format specification
- `createdAt`: Date the template was created
- `updatedAt`: Date the template was last updated
- `createdBy`: User who created the template
- `assignedOrganizations`: Array of organizations using this template
- `performanceMetrics`: Performance metrics
  - `accuracy`: Accuracy percentage
  - `clarificationRate`: Clarification rate percentage
  - `overrideRate`: Override rate percentage
  - `averageProcessingTime`: Average processing time in seconds
  - `usageCount`: Number of times the template has been used

### Get Template Version History

Retrieve the version history for a prompt template:

```javascript
const getTemplateVersionHistory = async (token, templateId) => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}/versions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve template version history:', error);
    throw error;
  }
};
```

The response will include an array of version records, each with:
- `version`: Version number
- `createdAt`: Date the version was created
- `createdBy`: User who created the version
- `changeNotes`: Notes about changes in this version
- `status`: Status of this version
- `performanceMetrics`: Performance metrics for this version

## Creating and Updating Prompt Templates

### Create a New Prompt Template

Create a new prompt template:

```javascript
const createPromptTemplate = async (token, templateData) => {
  try {
    const response = await fetch('/api/superadmin/prompts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to create prompt template:', error);
    throw error;
  }
};
```

The `templateData` object should include:
- `name`: Template name (required)
- `description`: Template description (required)
- `modalityType`: Modality type (required)
- `content`: Template content (required)
- `systemInstructions`: System instructions (required)
- `clarificationStrategy`: Clarification strategy (required)
- `validationRules`: Validation rules (required)
- `outputFormat`: Output format specification (required)
- `status`: Template status (optional, default: 'draft')

### Update a Prompt Template

Update an existing prompt template:

```javascript
const updatePromptTemplate = async (token, templateId, templateData, createNewVersion = false) => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...templateData,
        createNewVersion,
        changeNotes: createNewVersion ? templateData.changeNotes : undefined
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update prompt template:', error);
    throw error;
  }
};
```

The `templateData` object can include any of the fields mentioned in the create operation, plus:
- `changeNotes`: Notes about changes in this version (required if createNewVersion is true)

### Clone a Prompt Template

Clone an existing prompt template:

```javascript
const clonePromptTemplate = async (token, templateId, newName, newDescription) => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}/clone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newName,
        newDescription
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to clone prompt template:', error);
    throw error;
  }
};
```

## Managing Prompt Template Status

### Activate a Prompt Template

Activate a prompt template:

```javascript
const activatePromptTemplate = async (token, templateId, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to activate prompt template:', error);
    throw error;
  }
};
```

### Deactivate a Prompt Template

Deactivate a prompt template:

```javascript
const deactivatePromptTemplate = async (token, templateId, reason, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}/deactivate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to deactivate prompt template:', error);
    throw error;
  }
};
```

### Revert to Previous Version

Revert a prompt template to a previous version:

```javascript
const revertToVersion = async (token, templateId, version, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}/revert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ version, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to revert prompt template:', error);
    throw error;
  }
};
```

## Testing Prompt Templates

### Test a Prompt Template

Test a prompt template with sample dictation:

```javascript
const testPromptTemplate = async (token, templateId, dictation, patientInfo = null) => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dictation,
        patientInfo
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to test prompt template:', error);
    throw error;
  }
};
```

The response will include:
- `result`: Validation result
  - `cptCodes`: Array of CPT codes
  - `icd10Codes`: Array of ICD-10 codes
  - `reasoning`: Reasoning for the code selection
- `requiresClarification`: Whether clarification is needed
- `clarificationPrompt`: Clarification prompt (if applicable)
- `processingTime`: Processing time in seconds
- `promptTokens`: Number of prompt tokens used
- `completionTokens`: Number of completion tokens used
- `totalTokens`: Total number of tokens used
- `rawLlmResponse`: Raw response from the LLM

### Batch Test a Prompt Template

Test a prompt template with multiple sample dictations:

```javascript
const batchTestPromptTemplate = async (token, templateId, testCases) => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}/batch-test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        testCases
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to batch test prompt template:', error);
    throw error;
  }
};
```

The `testCases` parameter is an array of test case objects, each with:
- `dictation`: Clinical dictation
- `patientInfo`: Patient information (optional)
- `expectedCptCodes`: Expected CPT codes (optional)
- `expectedIcd10Codes`: Expected ICD-10 codes (optional)

The response will include:
- `results`: Array of test results, each with:
  - `testCase`: The original test case
  - `result`: Validation result
  - `requiresClarification`: Whether clarification is needed
  - `processingTime`: Processing time in seconds
  - `isMatch`: Whether the result matches the expected codes (if provided)
- `summary`: Summary of test results
  - `totalTests`: Total number of tests
  - `successCount`: Number of successful tests
  - `clarificationCount`: Number of tests requiring clarification
  - `matchCount`: Number of tests with matching codes
  - `averageProcessingTime`: Average processing time in seconds

## Managing Prompt Template Assignments

### Assign Template to Organizations

Assign a prompt template to organizations:

```javascript
const assignTemplateToOrganizations = async (token, templateId, organizationIds, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}/assign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organizationIds,
        notes
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to assign template to organizations:', error);
    throw error;
  }
};
```

### Unassign Template from Organizations

Unassign a prompt template from organizations:

```javascript
const unassignTemplateFromOrganizations = async (token, templateId, organizationIds, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}/unassign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organizationIds,
        notes
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to unassign template from organizations:', error);
    throw error;
  }
};
```

### Get Template Assignments

Retrieve organizations assigned to a prompt template:

```javascript
const getTemplateAssignments = async (token, templateId, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}/assignments?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve template assignments:', error);
    throw error;
  }
};
```

The response will include:
- `assignments`: Array of assignment records
- `pagination`: Pagination information

Each assignment record includes:
- `organizationId`: Organization ID
- `organizationName`: Organization name
- `assignedAt`: Date the template was assigned
- `assignedBy`: User who assigned the template
- `usageCount`: Number of times the template has been used by this organization
- `performanceMetrics`: Performance metrics for this organization

## Monitoring Prompt Template Performance

### Get Template Performance Metrics

Retrieve performance metrics for a prompt template:

```javascript
const getTemplatePerformanceMetrics = async (token, templateId, timeframe = '30d') => {
  try {
    const response = await fetch(`/api/superadmin/prompts/${templateId}/metrics?timeframe=${timeframe}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve template performance metrics:', error);
    throw error;
  }
};
```

The `timeframe` parameter can be one of:
- `7d`: Last 7 days
- `30d`: Last 30 days
- `90d`: Last 90 days
- `1y`: Last year

The response will include:
- `accuracy`: Accuracy percentage
- `clarificationRate`: Clarification rate percentage
- `overrideRate`: Override rate percentage
- `averageProcessingTime`: Average processing time in seconds
- `usageCount`: Number of times the template has been used
- `tokenUsage`: Token usage statistics
- `dailyMetrics`: Array of daily metrics
- `topCptCodes`: Most frequently assigned CPT codes
- `topIcd10Codes`: Most frequently assigned ICD-10 codes
- `organizationPerformance`: Performance breakdown by organization

### Get Template Validation Logs

Retrieve validation logs for a prompt template:

```javascript
const getTemplateValidationLogs = async (token, templateId, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/prompts/${templateId}/validation-logs?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve template validation logs:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `organizationId`: Filter by organization ID
- `status`: Filter by validation status (success, clarification_needed, override)
- `startDate`: Filter by start date
- `endDate`: Filter by end date

The response will include:
- `logs`: Array of validation log records
- `pagination`: Pagination information

Each log record includes:
- `id`: Log ID
- `timestamp`: Validation timestamp
- `organizationId`: Organization ID
- `organizationName`: Organization name
- `userId`: User ID
- `userName`: User name
- `status`: Validation status
- `processingTime`: Processing time in seconds
- `tokenUsage`: Token usage
- `cptCodes`: Assigned CPT codes
- `icd10Codes`: Assigned ICD-10 codes
- `requiresClarification`: Whether clarification was needed
- `isOverride`: Whether override was used

## Error Handling

When working with superadmin prompt management endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-superadmin role)
- 404 Not Found: Prompt template not found
- 409 Conflict: Conflict with existing data
- 422 Unprocessable Entity: Cannot perform the requested operation
- 500 Internal Server Error: Error in the LLM service

## Best Practices

1. **Document template changes**: Always provide detailed notes for template changes
2. **Test thoroughly before activation**: Test templates with various dictation samples
3. **Use version control**: Create new versions for significant changes
4. **Monitor performance metrics**: Regularly review template performance
5. **Assign templates strategically**: Assign templates based on organization needs
6. **Maintain backward compatibility**: Ensure new versions don't break existing integrations
7. **Optimize token usage**: Balance prompt complexity with token efficiency
8. **Implement gradual rollouts**: Roll out new templates to a subset of organizations first
9. **Collect feedback**: Gather feedback from organizations using the templates
10. **Document template design**: Maintain documentation of template design decisions

================================================================================
FILE: frontend-explanation\api-docs\tutorials\superadmin\system-monitoring.md
================================================================================

# Superadmin System Monitoring

This guide covers the system monitoring capabilities available to superadmins in the RadOrderPad API.

## Prerequisites

- You must have a superadmin role
- You must have a valid JWT token with superadmin privileges

## System Monitoring Overview

Superadmins have access to comprehensive system monitoring tools, including:

1. System health and status monitoring
2. Performance metrics and analytics
3. Error and exception logs
4. Audit logs for security and compliance
5. User activity monitoring
6. Resource usage tracking
7. Alert management and notifications

## System Health and Status

### Get System Health Status

Retrieve the current health status of the system:

```javascript
const getSystemHealthStatus = async (token) => {
  try {
    const response = await fetch('/api/superadmin/system/health', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve system health status:', error);
    throw error;
  }
};
```

The response will include:
- `status`: Overall system status (healthy, degraded, unhealthy)
- `timestamp`: Timestamp of the health check
- `components`: Status of individual system components
  - `api`: API service status
  - `database`: Database status
  - `cache`: Cache service status
  - `llm`: LLM service status
  - `storage`: Storage service status
  - `email`: Email service status
  - `background`: Background job service status
- `metrics`: Key system metrics
  - `uptime`: System uptime in seconds
  - `responseTime`: Average API response time in milliseconds
  - `errorRate`: Error rate percentage
  - `cpuUsage`: CPU usage percentage
  - `memoryUsage`: Memory usage percentage
  - `diskUsage`: Disk usage percentage

### Get Service Status

Retrieve detailed status information for a specific service:

```javascript
const getServiceStatus = async (token, serviceName) => {
  try {
    const response = await fetch(`/api/superadmin/system/services/${serviceName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Failed to retrieve ${serviceName} service status:`, error);
    throw error;
  }
};
```

The `serviceName` parameter can be one of:
- `api`: API service
- `database`: Database service
- `cache`: Cache service
- `llm`: LLM service
- `storage`: Storage service
- `email`: Email service
- `background`: Background job service

The response will include service-specific status information and metrics.

## Performance Metrics and Analytics

### Get System Performance Metrics

Retrieve system performance metrics:

```javascript
const getSystemPerformanceMetrics = async (token, timeframe = '1h') => {
  try {
    const response = await fetch(`/api/superadmin/system/metrics?timeframe=${timeframe}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve system performance metrics:', error);
    throw error;
  }
};
```

The `timeframe` parameter can be one of:
- `1h`: Last hour
- `6h`: Last 6 hours
- `24h`: Last 24 hours
- `7d`: Last 7 days
- `30d`: Last 30 days

The response will include:
- `cpu`: CPU usage metrics
  - `current`: Current CPU usage percentage
  - `average`: Average CPU usage percentage
  - `peak`: Peak CPU usage percentage
  - `timeline`: Timeline of CPU usage
- `memory`: Memory usage metrics
  - `current`: Current memory usage
  - `average`: Average memory usage
  - `peak`: Peak memory usage
  - `timeline`: Timeline of memory usage
- `disk`: Disk usage metrics
  - `current`: Current disk usage
  - `available`: Available disk space
  - `timeline`: Timeline of disk usage
- `network`: Network metrics
  - `inbound`: Inbound traffic
  - `outbound`: Outbound traffic
  - `timeline`: Timeline of network traffic
- `api`: API metrics
  - `requestCount`: Number of API requests
  - `averageResponseTime`: Average response time
  - `errorRate`: Error rate percentage
  - `timeline`: Timeline of API metrics
- `database`: Database metrics
  - `queryCount`: Number of database queries
  - `averageQueryTime`: Average query time
  - `connectionCount`: Number of database connections
  - `timeline`: Timeline of database metrics

### Get API Performance Analytics

Retrieve API performance analytics:

```javascript
const getApiPerformanceAnalytics = async (token, timeframe = '24h', filters = {}) => {
  try {
    // Build query string from filters and timeframe
    const queryParams = new URLSearchParams({
      timeframe,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/system/analytics/api?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve API performance analytics:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `endpoint`: Filter by API endpoint
- `method`: Filter by HTTP method
- `statusCode`: Filter by HTTP status code
- `minResponseTime`: Filter by minimum response time
- `maxResponseTime`: Filter by maximum response time

The response will include:
- `requestCount`: Total number of API requests
- `averageResponseTime`: Average response time
- `p95ResponseTime`: 95th percentile response time
- `p99ResponseTime`: 99th percentile response time
- `errorRate`: Error rate percentage
- `statusCodeDistribution`: Distribution of HTTP status codes
- `methodDistribution`: Distribution of HTTP methods
- `endpointPerformance`: Performance metrics by endpoint
- `timeline`: Timeline of API metrics

### Get LLM Performance Analytics

Retrieve LLM performance analytics:

```javascript
const getLlmPerformanceAnalytics = async (token, timeframe = '24h', filters = {}) => {
  try {
    // Build query string from filters and timeframe
    const queryParams = new URLSearchParams({
      timeframe,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/system/analytics/llm?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve LLM performance analytics:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `templateId`: Filter by prompt template ID
- `organizationId`: Filter by organization ID
- `status`: Filter by validation status

The response will include:
- `requestCount`: Total number of LLM requests
- `averageProcessingTime`: Average processing time
- `tokenUsage`: Token usage statistics
  - `promptTokens`: Number of prompt tokens used
  - `completionTokens`: Number of completion tokens used
  - `totalTokens`: Total number of tokens used
- `costEstimate`: Estimated cost of LLM usage
- `successRate`: Success rate percentage
- `clarificationRate`: Clarification rate percentage
- `overrideRate`: Override rate percentage
- `templatePerformance`: Performance metrics by template
- `timeline`: Timeline of LLM metrics

## Error and Exception Logs

### Get System Error Logs

Retrieve system error logs:

```javascript
const getSystemErrorLogs = async (token, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/system/logs/errors?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve system error logs:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `severity`: Filter by error severity (error, warning, critical)
- `service`: Filter by service name
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `search`: Search term for error message or stack trace

The response will include:
- `logs`: Array of error log records
- `pagination`: Pagination information

Each error log record includes:
- `id`: Log ID
- `timestamp`: Error timestamp
- `severity`: Error severity
- `service`: Service name
- `component`: Component name
- `message`: Error message
- `stackTrace`: Stack trace
- `context`: Error context
- `requestId`: Associated request ID (if applicable)
- `userId`: Associated user ID (if applicable)
- `organizationId`: Associated organization ID (if applicable)

### Get Exception Details

Retrieve detailed information for a specific exception:

```javascript
const getExceptionDetails = async (token, exceptionId) => {
  try {
    const response = await fetch(`/api/superadmin/system/logs/exceptions/${exceptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve exception details:', error);
    throw error;
  }
};
```

The response will include detailed exception information, including:
- `id`: Exception ID
- `timestamp`: Exception timestamp
- `severity`: Exception severity
- `service`: Service name
- `component`: Component name
- `message`: Exception message
- `stackTrace`: Full stack trace
- `context`: Exception context
- `requestDetails`: Associated request details
  - `id`: Request ID
  - `method`: HTTP method
  - `url`: Request URL
  - `headers`: Request headers
  - `body`: Request body
  - `ipAddress`: Client IP address
  - `userAgent`: User agent
- `userDetails`: Associated user details (if applicable)
- `organizationDetails`: Associated organization details (if applicable)
- `relatedExceptions`: Related exceptions

## Audit Logs

### Get System Audit Logs

Retrieve system audit logs:

```javascript
const getSystemAuditLogs = async (token, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/system/logs/audit?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve system audit logs:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `actionType`: Filter by action type
- `userId`: Filter by user ID
- `organizationId`: Filter by organization ID
- `resourceType`: Filter by resource type
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `search`: Search term for audit log details

The response will include:
- `logs`: Array of audit log records
- `pagination`: Pagination information

Each audit log record includes:
- `id`: Log ID
- `timestamp`: Action timestamp
- `actionType`: Type of action
- `userId`: ID of the user who performed the action
- `userName`: Name of the user who performed the action
- `organizationId`: ID of the user's organization
- `organizationName`: Name of the user's organization
- `resourceType`: Type of resource affected
- `resourceId`: ID of the resource affected
- `details`: Action details
- `ipAddress`: IP address from which the action was performed
- `userAgent`: User agent information

### Get Security Audit Logs

Retrieve security-specific audit logs:

```javascript
const getSecurityAuditLogs = async (token, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/system/logs/security?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve security audit logs:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `eventType`: Filter by security event type
- `userId`: Filter by user ID
- `ipAddress`: Filter by IP address
- `startDate`: Filter by start date
- `endDate`: Filter by end date

The response will include:
- `logs`: Array of security log records
- `pagination`: Pagination information

Each security log record includes:
- `id`: Log ID
- `timestamp`: Event timestamp
- `eventType`: Type of security event
- `userId`: ID of the associated user
- `userName`: Name of the associated user
- `ipAddress`: IP address
- `location`: Geographic location (if available)
- `userAgent`: User agent information
- `details`: Event details
- `outcome`: Event outcome (success, failure)
- `failureReason`: Reason for failure (if applicable)

## User Activity Monitoring

### Get Active User Sessions

Retrieve currently active user sessions:

```javascript
const getActiveUserSessions = async (token, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/system/sessions?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve active user sessions:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `userId`: Filter by user ID
- `organizationId`: Filter by organization ID
- `ipAddress`: Filter by IP address
- `deviceType`: Filter by device type

The response will include:
- `sessions`: Array of session records
- `pagination`: Pagination information
- `summary`: Summary information
  - `totalActiveSessions`: Total number of active sessions
  - `uniqueUsers`: Number of unique users
  - `uniqueOrganizations`: Number of unique organizations

Each session record includes:
- `id`: Session ID
- `userId`: User ID
- `userName`: User name
- `organizationId`: Organization ID
- `organizationName`: Organization name
- `ipAddress`: IP address
- `deviceType`: Device type
- `userAgent`: User agent information
- `location`: Geographic location (if available)
- `startTime`: Session start time
- `lastActivityTime`: Last activity time
- `expirationTime`: Session expiration time

### Terminate User Sessions

Terminate active user sessions:

```javascript
const terminateUserSessions = async (token, sessionIds, reason = '') => {
  try {
    const response = await fetch('/api/superadmin/system/sessions/terminate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionIds,
        reason
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to terminate user sessions:', error);
    throw error;
  }
};
```

### Get Real-time User Activity

Retrieve real-time user activity:

```javascript
const getRealTimeUserActivity = async (token) => {
  try {
    const response = await fetch('/api/superadmin/system/activity/real-time', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve real-time user activity:', error);
    throw error;
  }
};
```

The response will include:
- `activeUsers`: Number of active users
- `activeOrganizations`: Number of active organizations
- `requestsPerMinute`: Number of API requests per minute
- `currentOperations`: Currently running operations
  - `validations`: Number of ongoing validations
  - `uploads`: Number of ongoing uploads
  - `downloads`: Number of ongoing downloads
- `recentActivity`: Array of recent activity records
- `userDistribution`: Distribution of active users by role
- `geographicDistribution`: Geographic distribution of active users

## Resource Usage Tracking

### Get Resource Usage Statistics

Retrieve resource usage statistics:

```javascript
const getResourceUsageStatistics = async (token, timeframe = '30d') => {
  try {
    const response = await fetch(`/api/superadmin/system/resources/usage?timeframe=${timeframe}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve resource usage statistics:', error);
    throw error;
  }
};
```

The response will include:
- `storage`: Storage usage statistics
  - `total`: Total storage used
  - `byType`: Storage usage by file type
  - `byOrganization`: Storage usage by organization
  - `trend`: Storage usage trend
- `database`: Database usage statistics
  - `size`: Database size
  - `recordCounts`: Record counts by table
  - `growth`: Database growth rate
- `llm`: LLM usage statistics
  - `tokenUsage`: Token usage
  - `costEstimate`: Cost estimate
  - `byOrganization`: Usage by organization
  - `trend`: Usage trend
- `bandwidth`: Bandwidth usage statistics
  - `total`: Total bandwidth used
  - `byEndpoint`: Bandwidth usage by endpoint
  - `byOrganization`: Bandwidth usage by organization
  - `trend`: Bandwidth usage trend

### Get Organization Resource Usage

Retrieve resource usage for a specific organization:

```javascript
const getOrganizationResourceUsage = async (token, organizationId, timeframe = '30d') => {
  try {
    const response = await fetch(`/api/superadmin/system/resources/organizations/${organizationId}?timeframe=${timeframe}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve organization resource usage:', error);
    throw error;
  }
};
```

The response will include organization-specific resource usage statistics.

## Alert Management

### Get System Alerts

Retrieve system alerts:

```javascript
const getSystemAlerts = async (token, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/system/alerts?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve system alerts:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `severity`: Filter by alert severity (info, warning, critical)
- `status`: Filter by alert status (active, resolved, acknowledged)
- `type`: Filter by alert type
- `startDate`: Filter by start date
- `endDate`: Filter by end date

The response will include:
- `alerts`: Array of alert records
- `pagination`: Pagination information

Each alert record includes:
- `id`: Alert ID
- `timestamp`: Alert timestamp
- `severity`: Alert severity
- `type`: Alert type
- `status`: Alert status
- `message`: Alert message
- `details`: Alert details
- `affectedComponent`: Affected component
- `affectedUsers`: Number of affected users
- `affectedOrganizations`: Number of affected organizations
- `resolvedAt`: Resolution timestamp (if resolved)
- `resolvedBy`: User who resolved the alert (if resolved)
- `acknowledgedAt`: Acknowledgment timestamp (if acknowledged)
- `acknowledgedBy`: User who acknowledged the alert (if acknowledged)

### Update Alert Status

Update the status of a system alert:

```javascript
const updateAlertStatus = async (token, alertId, status, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/system/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        notes
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update alert status:', error);
    throw error;
  }
};
```

The `status` parameter can be one of:
- `acknowledged`: Mark the alert as acknowledged
- `resolved`: Mark the alert as resolved

### Create System Notification

Create a system-wide notification:

```javascript
const createSystemNotification = async (token, notification) => {
  try {
    const response = await fetch('/api/superadmin/system/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notification)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to create system notification:', error);
    throw error;
  }
};
```

The `notification` object should include:
- `message`: Notification message (required)
- `type`: Notification type (info, warning, maintenance, outage)
- `startTime`: Start time for the notification
- `endTime`: End time for the notification (for temporary notifications)
- `affectedServices`: Array of affected services
- `targetAudience`: Target audience (all, admins, specific_organizations)
- `targetOrganizationIds`: Array of target organization IDs (if targetAudience is specific_organizations)
- `actionUrl`: URL for additional information or action

## Error Handling

When working with superadmin system monitoring endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-superadmin role)
- 404 Not Found: Resource not found
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Server-side error

## Best Practices

1. **Monitor system health regularly**: Set up a dashboard for continuous monitoring
2. **Investigate performance issues promptly**: Address performance degradation before it affects users
3. **Review error logs systematically**: Look for patterns in errors to identify root causes
4. **Audit security logs regularly**: Monitor for suspicious activity
5. **Track resource usage trends**: Plan for capacity needs based on usage trends
6. **Respond to alerts promptly**: Acknowledge and resolve alerts in a timely manner
7. **Communicate system issues**: Use system notifications to inform users of known issues
8. **Document monitoring procedures**: Maintain documentation of monitoring and response procedures
9. **Set up automated alerts**: Configure alerts for critical metrics
10. **Perform regular security audits**: Review security logs and access patterns

================================================================================
FILE: frontend-explanation\api-docs\tutorials\superadmin\user-management.md
================================================================================

# Superadmin User Management

This guide covers the user management capabilities available to superadmins in the RadOrderPad API.

## Prerequisites

- You must have a superadmin role
- You must have a valid JWT token with superadmin privileges

## Superadmin User Management Overview

Superadmins have extended capabilities for managing users across all organizations, including:

1. Viewing all users in the system
2. Creating new users
3. Updating user information
4. Managing user status
5. Resetting user passwords
6. Assigning and modifying user roles
7. Viewing user activity and audit logs
8. Managing user sessions

## Retrieving User Information

### List All Users

Retrieve a list of all users in the system:

```javascript
const getAllUsers = async (token, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/users?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve users:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `status`: Filter by user status (active, inactive, pending, suspended)
- `role`: Filter by user role (admin, physician, staff, radiologist)
- `organizationId`: Filter by organization ID
- `createdAfter`: Filter by creation date (ISO date string)
- `createdBefore`: Filter by creation date (ISO date string)
- `search`: Search term for user name, email, or ID

The response will include:
- `users`: Array of user records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of users
  - `itemsPerPage`: Number of users per page

Each user record includes:
- `id`: User ID
- `email`: User email
- `firstName`: User first name
- `lastName`: User last name
- `status`: User status
- `role`: User role
- `organizationId`: ID of the user's organization
- `organizationName`: Name of the user's organization
- `createdAt`: Date the user was created
- `updatedAt`: Date the user was last updated
- `lastLoginAt`: Date of the user's last login

### Get User Details

Retrieve detailed information for a specific user:

```javascript
const getUserDetails = async (token, userId) => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve user details:', error);
    throw error;
  }
};
```

The response will include all user information, including:
- `id`: User ID
- `email`: User email
- `firstName`: User first name
- `lastName`: User last name
- `status`: User status
- `role`: User role
- `specialty`: User medical specialty (for physicians)
- `phoneNumber`: User phone number
- `organizationId`: ID of the user's organization
- `organizationName`: Name of the user's organization
- `locations`: Array of locations the user is assigned to
- `permissions`: Array of user permissions
- `createdAt`: Date the user was created
- `updatedAt`: Date the user was last updated
- `lastLoginAt`: Date of the user's last login
- `lastLoginIp`: IP address of the user's last login
- `twoFactorEnabled`: Whether two-factor authentication is enabled
- `profileImageUrl`: URL of the user's profile image
- `activityMetrics`: Activity metrics
  - `totalOrders`: Total number of orders
  - `ordersLast30Days`: Orders in the last 30 days
  - `validationAccuracy`: Validation accuracy percentage
  - `averageResponseTime`: Average response time in seconds

## Creating and Updating Users

### Create a New User

Create a new user:

```javascript
const createUser = async (token, userData) => {
  try {
    const response = await fetch('/api/superadmin/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
};
```

The `userData` object should include:
- `email`: User email (required)
- `firstName`: User first name (required)
- `lastName`: User last name (required)
- `role`: User role (required)
- `organizationId`: ID of the user's organization (required)
- `specialty`: User medical specialty (required for physicians)
- `phoneNumber`: User phone number (optional)
- `sendInvite`: Whether to send an invitation email (optional, default: true)
- `locationIds`: Array of location IDs to assign the user to (optional)
- `customPermissions`: Array of custom permissions (optional)

### Update User Information

Update a user's information:

```javascript
const updateUser = async (token, userId, userData) => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
};
```

The `userData` object can include any of the fields mentioned in the create operation.

## Managing User Status

### Activate a User

Activate a user:

```javascript
const activateUser = async (token, userId, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to activate user:', error);
    throw error;
  }
};
```

### Deactivate a User

Deactivate a user:

```javascript
const deactivateUser = async (token, userId, reason, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/deactivate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    throw error;
  }
};
```

### Suspend a User

Suspend a user:

```javascript
const suspendUser = async (token, userId, reason, suspensionPeriod, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/suspend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason, suspensionPeriod, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to suspend user:', error);
    throw error;
  }
};
```

The `suspensionPeriod` parameter specifies the suspension duration in days.

### Unsuspend a User

Remove the suspension from a user:

```javascript
const unsuspendUser = async (token, userId, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/unsuspend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to unsuspend user:', error);
    throw error;
  }
};
```

## Managing User Roles and Permissions

### Update User Role

Update a user's role:

```javascript
const updateUserRole = async (token, userId, role, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update user role:', error);
    throw error;
  }
};
```

### Update User Permissions

Update a user's custom permissions:

```javascript
const updateUserPermissions = async (token, userId, permissions, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/permissions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ permissions, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update user permissions:', error);
    throw error;
  }
};
```

The `permissions` parameter is an array of permission strings.

### Transfer User to Another Organization

Transfer a user to a different organization:

```javascript
const transferUser = async (token, userId, newOrganizationId, newRole, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/transfer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newOrganizationId, newRole, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to transfer user:', error);
    throw error;
  }
};
```

## Managing User Authentication

### Reset User Password

Reset a user's password:

```javascript
const resetUserPassword = async (token, userId, sendEmail = true, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sendEmail, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to reset user password:', error);
    throw error;
  }
};
```

The response will include:
- `success`: Boolean indicating success
- `resetLink`: Password reset link (if sendEmail is false)

### Force Password Change

Force a user to change their password on next login:

```javascript
const forcePasswordChange = async (token, userId, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/force-password-change`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to force password change:', error);
    throw error;
  }
};
```

### Manage Two-Factor Authentication

Enable or disable two-factor authentication for a user:

```javascript
const manageTwoFactorAuth = async (token, userId, enabled, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/two-factor`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled, notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to manage two-factor authentication:', error);
    throw error;
  }
};
```

### Terminate User Sessions

Terminate all active sessions for a user:

```javascript
const terminateUserSessions = async (token, userId, notes = '') => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/terminate-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to terminate user sessions:', error);
    throw error;
  }
};
```

## Viewing User Activity

### Get User Activity Log

Retrieve the activity log for a user:

```javascript
const getUserActivityLog = async (token, userId, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/superadmin/users/${userId}/activity-log?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve user activity log:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `activityType`: Filter by activity type
- `startDate`: Filter by start date
- `endDate`: Filter by end date

The response will include:
- `activities`: Array of activity records
- `pagination`: Pagination information

Each activity record includes:
- `id`: Activity ID
- `timestamp`: Activity timestamp
- `activityType`: Type of activity
- `details`: Activity details
- `ipAddress`: IP address from which the activity was performed
- `userAgent`: User agent information

### Get User Login History

Retrieve the login history for a user:

```javascript
const getUserLoginHistory = async (token, userId, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/login-history?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve user login history:', error);
    throw error;
  }
};
```

The response will include:
- `logins`: Array of login records
- `pagination`: Pagination information

Each login record includes:
- `id`: Login ID
- `timestamp`: Login timestamp
- `ipAddress`: IP address
- `userAgent`: User agent information
- `deviceType`: Device type
- `location`: Geographic location (if available)
- `status`: Login status (success, failure)
- `failureReason`: Reason for failure (if applicable)

### Get User Sessions

Retrieve active sessions for a user:

```javascript
const getUserSessions = async (token, userId) => {
  try {
    const response = await fetch(`/api/superadmin/users/${userId}/sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve user sessions:', error);
    throw error;
  }
};
```

The response will include an array of session records, each with:
- `id`: Session ID
- `createdAt`: Session creation timestamp
- `expiresAt`: Session expiration timestamp
- `lastActivityAt`: Last activity timestamp
- `ipAddress`: IP address
- `userAgent`: User agent information
- `deviceType`: Device type
- `location`: Geographic location (if available)

## Error Handling

When working with superadmin user management endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-superadmin role)
- 404 Not Found: User not found
- 409 Conflict: Conflict with existing data
- 422 Unprocessable Entity: Cannot perform the requested operation

## Best Practices

1. **Document all actions**: Always provide detailed notes for administrative actions
2. **Use appropriate status changes**: Choose the correct status change for each situation
3. **Respect privacy**: Access user data only when necessary
4. **Follow security protocols**: Adhere to security best practices when resetting passwords
5. **Maintain audit trail**: Ensure all administrative actions are properly logged
6. **Communicate changes**: Notify users of significant changes to their accounts
7. **Apply consistent policies**: Treat all users fairly and consistently
8. **Monitor suspicious activity**: Watch for unusual login patterns or activities
9. **Verify identity**: Confirm user identity before making significant changes
10. **Use least privilege principle**: Assign only necessary permissions to users

================================================================================
FILE: frontend-explanation\api-docs\tutorials\trial-features\physician-sandbox.md
================================================================================

# Physician Trial Sandbox

This guide covers the Physician Trial Sandbox feature, which allows physicians to test the RadOrderPad validation engine without full registration or PHI involvement.

## Overview

The Physician Trial Sandbox is designed to provide a risk-free way for physicians to experience the power of RadOrderPad's validation engine. This feature allows physicians to submit clinical dictations and receive CPT and ICD-10 code assignments without creating an organization account or storing any Protected Health Information (PHI).

## Key Features

- **Limited Registration**: Simple registration with minimal information
- **No PHI Storage**: Dictations are processed but not stored as PHI
- **Limited Validation Count**: Default limit of 10 validations per trial account
- **Full Validation Capabilities**: Access to the same validation engine used in the full system
- **No Administrative Workflow**: Focus solely on the validation experience

## Trial User Registration

### Registration Endpoint

```
POST /api/auth/trial/register
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password (min 8 characters) |
| firstName | string | Yes | User's first name |
| lastName | string | Yes | User's last name |
| specialty | string | Yes | User's medical specialty |

### Example Request

```javascript
const registerTrialUser = async () => {
  try {
    const response = await fetch('/api/auth/trial/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'doctor.smith@example.com',
        password: 'SecurePassword123',
        firstName: 'John',
        lastName: 'Smith',
        specialty: 'Neurology'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to register trial user:', error);
    throw error;
  }
};
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "trial_12345",
      "email": "doctor.smith@example.com",
      "firstName": "John",
      "lastName": "Smith",
      "specialty": "Neurology",
      "role": "trial_physician",
      "validationsRemaining": 10
    }
  }
}
```

## Trial User Login

### Login Endpoint

```
POST /api/auth/trial/login
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

### Example Request

```javascript
const loginTrialUser = async (email, password) => {
  try {
    const response = await fetch('/api/auth/trial/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to login trial user:', error);
    throw error;
  }
};
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "trial_12345",
      "email": "doctor.smith@example.com",
      "firstName": "John",
      "lastName": "Smith",
      "specialty": "Neurology",
      "role": "trial_physician",
      "validationsRemaining": 8
    }
  }
}
```

## Trial Validation

### Validation Endpoint

```
POST /api/orders/validate/trial
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dictation | string | Yes | The clinical dictation text to validate |
| modalityType | string | Yes | The type of imaging modality (CT, MRI, XRAY, ULTRASOUND, PET, NUCLEAR) |

### Example Request

```javascript
const submitTrialValidation = async (dictation, modalityType, token) => {
  try {
    const response = await fetch('/api/orders/validate/trial', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dictation,
        modalityType
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to validate dictation:', error);
    throw error;
  }
};
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "validationResult": {
      "cptCode": "70450",
      "cptDescription": "CT scan of head/brain without contrast",
      "icd10Codes": ["R51.9", "S06.0X0A"],
      "icd10Descriptions": ["Headache, unspecified", "Concussion without loss of consciousness, initial encounter"],
      "confidence": 0.92
    },
    "validationsRemaining": 7
  }
}
```

### Error Responses

#### Validation Limit Reached

```json
{
  "success": false,
  "message": "Validation limit reached. Please register for a full account to continue using the service.",
  "error": {
    "code": "VALIDATION_LIMIT_REACHED",
    "validationsUsed": 10,
    "validationsLimit": 10
  }
}
```

#### LLM Service Unavailable

```json
{
  "success": false,
  "message": "Validation service temporarily unavailable. Please try again later.",
  "error": {
    "code": "SERVICE_UNAVAILABLE"
  }
}
```

## Technical Implementation

### Database Structure

Trial users are stored in a separate `trial_users` table in the Main database:

```sql
CREATE TABLE trial_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100),
  validation_count INTEGER DEFAULT 0,
  validation_limit INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

### Key Differences from Regular Validation

1. **No Order Creation**: Trial validations do not create order records in the PHI database
2. **Validation Counting**: Each validation increments the `validation_count` in the `trial_users` table
3. **Limit Enforcement**: Validations are rejected when `validation_count >= validation_limit`
4. **No Clarification Loop**: Trial validations are one-time only, without the clarification loop
5. **No Override Flow**: Trial validations do not support the override flow
6. **Sanitized Logging**: Validation attempts are logged with fully sanitized inputs

## Best Practices for Trial Validation

1. **Use Real-World Examples**: Test with realistic clinical scenarios
2. **Try Different Modalities**: Test across different imaging modalities
3. **Vary Dictation Length**: Test both concise and detailed dictations
4. **Include Edge Cases**: Test unusual or complex clinical scenarios
5. **Follow Clinical Dictation Guidelines**: Use the same best practices as in the full system

### Example Trial Dictation

```
"72-year-old male with progressive memory loss over the past 6 months. 
Patient reports difficulty finding words and getting lost while driving in familiar areas. 
Family reports personality changes and increased confusion in the evenings. 
No history of head trauma or stroke. 
Requesting MRI brain to evaluate for neurodegenerative disease vs. normal pressure hydrocephalus."
```

## Converting from Trial to Full Account

When a trial user is ready to convert to a full account:

1. They must register a new organization through the standard registration process
2. They can use the same email address as their trial account
3. Their trial account will remain separate but inactive
4. No data is transferred from the trial account to the full account

## Conclusion

The Physician Trial Sandbox provides a valuable way for physicians to experience the power of RadOrderPad's validation engine without committing to a full account. By following the steps outlined in this guide, physicians can quickly test the system's ability to accurately assign CPT and ICD-10 codes based on clinical dictations.

================================================================================
FILE: frontend-explanation\api-docs\tutorials\user-management\location-assignment.md
================================================================================

# Location Assignment

This guide covers the process of assigning users to locations in the RadOrderPad API, which enables organizations to manage which users have access to which physical locations.

## Prerequisites

- You must have an administrator role
- Your organization must be active
- You must have a valid JWT token

## Location Assignment Overview

Location assignment in RadOrderPad allows organizations to:

1. Control which users can access which physical locations
2. Restrict user access to patient data based on location
3. Organize staff by location for scheduling and management
4. Configure location-specific settings and workflows

## Retrieving Location Assignments

### Get User's Assigned Locations

Retrieve the locations assigned to a specific user:

```javascript
const getUserLocations = async (token, userId) => {
  try {
    const response = await fetch(`/api/users/${userId}/locations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve user locations:', error);
    throw error;
  }
};
```

The response will include:
- `locations`: Array of location records
- `isPrimaryLocationAssigned`: Boolean indicating whether a primary location is assigned

Each location record includes:
- `id`: Location ID
- `name`: Location name
- `address`: Location address
- `isPrimary`: Whether this is the user's primary location
- `assignedAt`: Date the location was assigned to the user
- `assignedBy`: User who assigned the location

### Get Your Own Assigned Locations

Retrieve your own assigned locations:

```javascript
const getMyLocations = async (token) => {
  try {
    const response = await fetch('/api/users/me/locations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve my locations:', error);
    throw error;
  }
};
```

### Get Users Assigned to a Location

Retrieve users assigned to a specific location:

```javascript
const getLocationUsers = async (token, locationId, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/locations/${locationId}/users?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve location users:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `role`: Filter by user role
- `status`: Filter by user status
- `search`: Search term for user name or email

The response will include:
- `users`: Array of user records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of users
  - `itemsPerPage`: Number of users per page

Each user record includes:
- `id`: User ID
- `email`: User email
- `firstName`: User first name
- `lastName`: User last name
- `role`: User role
- `status`: User status
- `isPrimaryLocation`: Whether this is the user's primary location
- `assignedAt`: Date the location was assigned to the user
- `assignedBy`: User who assigned the location

## Managing Location Assignments

### Assign User to Locations

Assign a user to one or more locations:

```javascript
const assignUserToLocations = async (token, userId, locationAssignments) => {
  try {
    const response = await fetch(`/api/users/${userId}/locations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ locationAssignments })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to assign user to locations:', error);
    throw error;
  }
};
```

The `locationAssignments` parameter is an array of location assignment objects:
```javascript
const locationAssignments = [
  {
    locationId: 'location-123',
    isPrimary: true
  },
  {
    locationId: 'location-456',
    isPrimary: false
  }
];
```

The response will include:
- `successful`: Array of successful location assignments
- `failed`: Array of failed location assignments with error reasons
- `summary`: Summary of the operation
  - `total`: Total number of assignments
  - `successful`: Number of successful assignments
  - `failed`: Number of failed assignments

### Update User's Primary Location

Update a user's primary location:

```javascript
const updateUserPrimaryLocation = async (token, userId, locationId) => {
  try {
    const response = await fetch(`/api/users/${userId}/locations/primary`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ locationId })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update primary location:', error);
    throw error;
  }
};
```

The response will include:
- `userId`: User ID
- `locationId`: Location ID
- `isPrimary`: Boolean indicating that this is now the primary location
- `updatedAt`: Date and time of the update

### Remove User from Location

Remove a user from a specific location:

```javascript
const removeUserFromLocation = async (token, userId, locationId) => {
  try {
    const response = await fetch(`/api/users/${userId}/locations/${locationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to remove user from location:', error);
    throw error;
  }
};
```

The response will include:
- `userId`: User ID
- `locationId`: Location ID
- `removedAt`: Date and time of the removal

### Remove User from All Locations

Remove a user from all assigned locations:

```javascript
const removeUserFromAllLocations = async (token, userId) => {
  try {
    const response = await fetch(`/api/users/${userId}/locations`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to remove user from all locations:', error);
    throw error;
  }
};
```

The response will include:
- `userId`: User ID
- `removedLocations`: Array of removed location IDs
- `removedAt`: Date and time of the removal

## Bulk Location Assignment

### Assign Multiple Users to a Location

Assign multiple users to a specific location:

```javascript
const assignUsersToLocation = async (token, locationId, userIds, isPrimary = false) => {
  try {
    const response = await fetch(`/api/locations/${locationId}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userIds,
        isPrimary
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to assign users to location:', error);
    throw error;
  }
};
```

The `userIds` parameter is an array of user IDs.

The response will include:
- `successful`: Array of successful user assignments
- `failed`: Array of failed user assignments with error reasons
- `summary`: Summary of the operation
  - `total`: Total number of assignments
  - `successful`: Number of successful assignments
  - `failed`: Number of failed assignments

### Remove Multiple Users from a Location

Remove multiple users from a specific location:

```javascript
const removeUsersFromLocation = async (token, locationId, userIds) => {
  try {
    const response = await fetch(`/api/locations/${locationId}/users/remove`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userIds })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to remove users from location:', error);
    throw error;
  }
};
```

The `userIds` parameter is an array of user IDs.

The response will include:
- `successful`: Array of successfully removed user IDs
- `failed`: Array of failed removals with error reasons
- `summary`: Summary of the operation
  - `total`: Total number of removal attempts
  - `successful`: Number of successful removals
  - `failed`: Number of failed removals

## Location Assignment During User Creation

### Create User with Location Assignments

When creating a new user, you can assign them to locations in the same operation:

```javascript
const createUserWithLocations = async (token, userData, locationAssignments) => {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...userData,
        locationAssignments
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to create user with locations:', error);
    throw error;
  }
};
```

The `userData` object should include:
- `email`: User email (required)
- `firstName`: User first name (required)
- `lastName`: User last name (required)
- `role`: User role (required)
- `specialty`: Medical specialty (required for physician role)
- `phoneNumber`: User phone number (optional)

The `locationAssignments` parameter is an array of location assignment objects, as shown in the assignUserToLocations method.

### Include Location Assignments in User Invitation

When sending a user invitation, you can include location assignments:

```javascript
const sendInvitationWithLocations = async (token, invitationData, locationAssignments) => {
  try {
    const response = await fetch('/api/users/invitations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...invitationData,
        locationAssignments
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to send invitation with locations:', error);
    throw error;
  }
};
```

The `invitationData` object should include the same fields as in the sendUserInvitation method.

The `locationAssignments` parameter is an array of location assignment objects, as shown in the assignUserToLocations method.

## Location-Based Access Control

### Get User's Location Access

Retrieve information about a user's access to a specific location:

```javascript
const getUserLocationAccess = async (token, userId, locationId) => {
  try {
    const response = await fetch(`/api/users/${userId}/locations/${locationId}/access`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve user location access:', error);
    throw error;
  }
};
```

The response will include:
- `userId`: User ID
- `locationId`: Location ID
- `hasAccess`: Boolean indicating whether the user has access to the location
- `isPrimary`: Boolean indicating whether this is the user's primary location
- `assignedAt`: Date the location was assigned to the user
- `assignedBy`: User who assigned the location
- `accessDetails`: Additional access details
  - `canViewPatients`: Whether the user can view patients at this location
  - `canCreateOrders`: Whether the user can create orders at this location
  - `canViewReports`: Whether the user can view reports at this location
  - `canManageUsers`: Whether the user can manage users at this location

### Update User's Location Access

Update a user's access settings for a specific location:

```javascript
const updateUserLocationAccess = async (token, userId, locationId, accessSettings) => {
  try {
    const response = await fetch(`/api/users/${userId}/locations/${locationId}/access`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(accessSettings)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update user location access:', error);
    throw error;
  }
};
```

The `accessSettings` object can include:
```javascript
const accessSettings = {
  canViewPatients: true,
  canCreateOrders: true,
  canViewReports: true,
  canManageUsers: false
};
```

## Location Assignment Audit

### Get Location Assignment History

Retrieve the history of location assignments for a user:

```javascript
const getLocationAssignmentHistory = async (token, userId, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/users/${userId}/locations/history?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve location assignment history:', error);
    throw error;
  }
};
```

The response will include:
- `history`: Array of history records
- `pagination`: Pagination information

Each history record includes:
- `id`: History record ID
- `userId`: User ID
- `locationId`: Location ID
- `locationName`: Location name
- `action`: Action performed (assigned, removed, set_primary)
- `timestamp`: Date and time of the action
- `performedBy`: User who performed the action
- `reason`: Reason for the action (if provided)

## Error Handling

When working with location assignment endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-admin role)
- 404 Not Found: User or location not found
- 409 Conflict: User already assigned to location
- 422 Unprocessable Entity: Cannot perform the requested operation

## Best Practices

1. **Assign users to appropriate locations**: Only assign users to locations they need access to
2. **Set a primary location**: Ensure each user has a primary location
3. **Regularly review location assignments**: Periodically audit and update location assignments
4. **Use bulk operations for efficiency**: Use bulk assignment methods for multiple users
5. **Document location assignment policies**: Maintain documentation of assignment procedures
6. **Consider access control needs**: Configure location-specific access settings
7. **Assign locations during user creation**: Include location assignments when creating users
8. **Maintain assignment history**: Keep records of location assignment changes
9. **Remove unnecessary assignments**: Remove users from locations they no longer need access to
10. **Coordinate with organization structure**: Align location assignments with organizational hierarchy

================================================================================
FILE: frontend-explanation\api-docs\tutorials\user-management\user-invitation.md
================================================================================

# User Invitation

This guide covers the process of inviting and onboarding new users to your organization in the RadOrderPad API.

## Prerequisites

- You must have an administrator role
- Your organization must be active
- You must have a valid JWT token

## User Invitation Flow

The user invitation flow consists of these steps:

1. Administrator sends an invitation to a new user
2. User receives an email with an invitation link
3. User completes registration by setting up their account
4. Administrator assigns locations and permissions to the new user

## Sending User Invitations

### Send a Single Invitation

Send an invitation to a single user:

```javascript
const sendUserInvitation = async (token, invitationData) => {
  try {
    const response = await fetch('/api/users/invitations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invitationData)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to send user invitation:', error);
    throw error;
  }
};
```

The `invitationData` object should include:
- `email`: Email address of the invitee (required)
- `firstName`: First name of the invitee (required)
- `lastName`: Last name of the invitee (required)
- `role`: Role to assign to the user (required)
- `specialty`: Medical specialty (required for physician role)
- `locationIds`: Array of location IDs to assign to the user (optional)
- `message`: Personalized message to include in the invitation (optional)
- `expiresIn`: Invitation expiration time in days (optional, default: 7)

Example:
```javascript
const invitationData = {
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'physician',
  specialty: 'CARDIOLOGY',
  locationIds: ['location-123', 'location-456'],
  message: 'Welcome to our organization! Please complete your registration.',
  expiresIn: 14
};
```

The response will include:
- `id`: Invitation ID
- `email`: Email address of the invitee
- `status`: Invitation status (sent)
- `expiresAt`: Expiration date and time
- `invitationLink`: Link that will be sent to the invitee

### Send Bulk Invitations

Send invitations to multiple users at once:

```javascript
const sendBulkInvitations = async (token, invitations) => {
  try {
    const response = await fetch('/api/users/invitations/bulk', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invitations })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to send bulk invitations:', error);
    throw error;
  }
};
```

The `invitations` parameter is an array of invitation objects, each with the same structure as in the single invitation method.

The response will include:
- `successful`: Array of successfully sent invitations
- `failed`: Array of failed invitations with error reasons
- `summary`: Summary of the operation
  - `total`: Total number of invitations
  - `successful`: Number of successful invitations
  - `failed`: Number of failed invitations

## Managing Invitations

### List Pending Invitations

Retrieve a list of pending invitations:

```javascript
const listPendingInvitations = async (token, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/users/invitations?status=pending&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to list pending invitations:', error);
    throw error;
  }
};
```

The response will include:
- `invitations`: Array of invitation records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of invitations
  - `itemsPerPage`: Number of invitations per page

Each invitation record includes:
- `id`: Invitation ID
- `email`: Email address of the invitee
- `firstName`: First name of the invitee
- `lastName`: Last name of the invitee
- `role`: Role assigned to the user
- `specialty`: Medical specialty (for physician role)
- `status`: Invitation status
- `sentAt`: Date and time the invitation was sent
- `expiresAt`: Expiration date and time
- `sentBy`: User who sent the invitation

### Get Invitation Details

Retrieve details for a specific invitation:

```javascript
const getInvitationDetails = async (token, invitationId) => {
  try {
    const response = await fetch(`/api/users/invitations/${invitationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve invitation details:', error);
    throw error;
  }
};
```

The response will include all invitation details, including:
- `id`: Invitation ID
- `email`: Email address of the invitee
- `firstName`: First name of the invitee
- `lastName`: Last name of the invitee
- `role`: Role assigned to the user
- `specialty`: Medical specialty (for physician role)
- `status`: Invitation status
- `message`: Personalized message included in the invitation
- `locationIds`: Array of location IDs assigned to the user
- `sentAt`: Date and time the invitation was sent
- `expiresAt`: Expiration date and time
- `sentBy`: User who sent the invitation
- `acceptedAt`: Date and time the invitation was accepted (if accepted)
- `canceledAt`: Date and time the invitation was canceled (if canceled)

### Cancel an Invitation

Cancel a pending invitation:

```javascript
const cancelInvitation = async (token, invitationId) => {
  try {
    const response = await fetch(`/api/users/invitations/${invitationId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to cancel invitation:', error);
    throw error;
  }
};
```

The response will include:
- `id`: Invitation ID
- `status`: Updated invitation status (canceled)
- `canceledAt`: Date and time the invitation was canceled

### Resend an Invitation

Resend an expired or pending invitation:

```javascript
const resendInvitation = async (token, invitationId, expiresIn = 7) => {
  try {
    const response = await fetch(`/api/users/invitations/${invitationId}/resend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expiresIn })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to resend invitation:', error);
    throw error;
  }
};
```

The response will include:
- `id`: Invitation ID
- `status`: Updated invitation status (sent)
- `sentAt`: New sent date and time
- `expiresAt`: New expiration date and time

## User Registration Process

### Complete Registration (User Side)

When a user receives an invitation, they will click on the invitation link in the email, which will take them to a registration page. The registration process typically includes:

1. Verifying the email address
2. Setting a password
3. Accepting terms and conditions
4. Setting up two-factor authentication (optional)

The registration endpoint is typically called by the frontend application:

```javascript
const completeRegistration = async (token, registrationData) => {
  try {
    const response = await fetch('/api/auth/complete-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        ...registrationData
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to complete registration:', error);
    throw error;
  }
};
```

The `token` parameter is the invitation token from the URL.

The `registrationData` object should include:
- `password`: User's chosen password
- `acceptTerms`: Boolean indicating acceptance of terms and conditions
- `setupTwoFactor`: Boolean indicating whether to set up two-factor authentication

### Verify Registration Status

Check the status of a user's registration:

```javascript
const checkRegistrationStatus = async (token, userId) => {
  try {
    const response = await fetch(`/api/users/${userId}/registration-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to check registration status:', error);
    throw error;
  }
};
```

The response will include:
- `userId`: User ID
- `status`: Registration status (pending, completed, expired)
- `completedAt`: Date and time registration was completed (if completed)
- `lastLoginAt`: Date and time of the user's last login (if any)

## Post-Registration Setup

### Assign Locations to User

After a user completes registration, you may need to assign them to specific locations:

```javascript
const assignUserToLocations = async (token, userId, locationIds) => {
  try {
    const response = await fetch(`/api/users/${userId}/locations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ locationIds })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to assign user to locations:', error);
    throw error;
  }
};
```

The `locationIds` parameter is an array of location IDs.

### Set User Permissions

Set custom permissions for a user:

```javascript
const setUserPermissions = async (token, userId, permissions) => {
  try {
    const response = await fetch(`/api/users/${userId}/permissions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ permissions })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to set user permissions:', error);
    throw error;
  }
};
```

The `permissions` parameter is an array of permission strings.

## Invitation Templates

### Get Invitation Templates

Retrieve available invitation email templates:

```javascript
const getInvitationTemplates = async (token) => {
  try {
    const response = await fetch('/api/users/invitations/templates', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve invitation templates:', error);
    throw error;
  }
};
```

The response will include an array of template objects, each with:
- `id`: Template ID
- `name`: Template name
- `description`: Template description
- `subject`: Email subject line
- `previewText`: Email preview text
- `isDefault`: Whether this is the default template

### Preview Invitation Email

Preview an invitation email with specific data:

```javascript
const previewInvitationEmail = async (token, previewData) => {
  try {
    const response = await fetch('/api/users/invitations/preview', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(previewData)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to preview invitation email:', error);
    throw error;
  }
};
```

The `previewData` object should include:
- `templateId`: ID of the template to use
- `email`: Email address of the invitee
- `firstName`: First name of the invitee
- `lastName`: Last name of the invitee
- `role`: Role to assign to the user
- `message`: Personalized message to include in the invitation

The response will include:
- `subject`: Email subject line
- `htmlContent`: HTML content of the email
- `textContent`: Plain text content of the email

## Bulk User Import

### Import Users from CSV

Import multiple users from a CSV file:

```javascript
const importUsersFromCsv = async (token, csvFile, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', csvFile);
    
    if (options.sendInvitations !== undefined) {
      formData.append('sendInvitations', options.sendInvitations);
    }
    
    if (options.defaultRole) {
      formData.append('defaultRole', options.defaultRole);
    }
    
    if (options.defaultLocationIds) {
      formData.append('defaultLocationIds', JSON.stringify(options.defaultLocationIds));
    }
    
    const response = await fetch('/api/users/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to import users:', error);
    throw error;
  }
};
```

The CSV file should have the following columns:
- `email` (required): Email address
- `firstName` (required): First name
- `lastName` (required): Last name
- `role` (optional): User role (defaults to the defaultRole option)
- `specialty` (optional): Medical specialty (required for physician role)
- `phoneNumber` (optional): Phone number
- `locations` (optional): Comma-separated list of location IDs

The response will include:
- `importId`: Import operation ID
- `totalRows`: Total number of rows in the CSV
- `validRows`: Number of valid rows
- `invalidRows`: Number of invalid rows
- `importedUsers`: Array of imported user records
- `errors`: Array of error records for invalid rows
- `invitationsSent`: Number of invitations sent (if sendInvitations is true)

### Get Import Status

Check the status of a bulk import operation:

```javascript
const getImportStatus = async (token, importId) => {
  try {
    const response = await fetch(`/api/users/import/${importId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to get import status:', error);
    throw error;
  }
};
```

The response will include:
- `importId`: Import operation ID
- `status`: Import status (processing, completed, failed)
- `progress`: Progress percentage
- `totalRows`: Total number of rows in the CSV
- `processedRows`: Number of processed rows
- `validRows`: Number of valid rows
- `invalidRows`: Number of invalid rows
- `importedUsers`: Array of imported user records
- `errors`: Array of error records for invalid rows
- `invitationsSent`: Number of invitations sent

## Error Handling

When working with user invitation endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions (non-admin role)
- 404 Not Found: Invitation not found
- 409 Conflict: Email already in use
- 410 Gone: Invitation expired or already used
- 422 Unprocessable Entity: Invalid data format

## Best Practices

1. **Use descriptive invitation messages**: Provide clear context in invitation messages
2. **Set appropriate expiration times**: Balance security with user convenience
3. **Follow up on pending invitations**: Regularly check for and follow up on pending invitations
4. **Use bulk import for large user groups**: Save time with CSV imports for many users
5. **Assign appropriate roles**: Give users the minimum necessary permissions
6. **Organize users by location**: Assign users to relevant locations
7. **Customize invitation templates**: Tailor invitation emails to your organization
8. **Preview invitations before sending**: Check how invitations will appear to recipients
9. **Monitor invitation acceptance rates**: Track which invitations are being accepted
10. **Document user onboarding process**: Maintain documentation for administrators

================================================================================
FILE: frontend-explanation\api-docs\tutorials\user-management\user-profiles.md
================================================================================

# User Profiles Management

This guide covers the management of user profiles in the RadOrderPad API, including retrieving, updating, and deleting user information.

## Prerequisites

- You must have a valid JWT token
- Your organization must be active
- You must have appropriate permissions for user management

## User Profile Overview

User profiles in RadOrderPad contain essential information about users, including:

1. Basic Information: Name, email, role
2. Contact Information: Phone number, address
3. Professional Information: Specialty, credentials
4. Account Settings: Notification preferences, UI settings
5. Security Settings: Password, two-factor authentication

## Retrieving User Information

### Get Your Own User Profile

Retrieve your own user profile:

```javascript
const getMyProfile = async (token) => {
  try {
    const response = await fetch('/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve user profile:', error);
    throw error;
  }
};
```

The response will include:
- `id`: User ID
- `email`: User email
- `firstName`: User first name
- `lastName`: User last name
- `role`: User role
- `status`: User status
- `phoneNumber`: User phone number
- `specialty`: User medical specialty (for physicians)
- `organization`: Basic organization information
- `locations`: Array of assigned locations
- `profileImageUrl`: URL to the user's profile image
- `settings`: User settings
  - `notificationPreferences`: Notification preferences
  - `uiPreferences`: UI preferences
  - `language`: Preferred language
  - `timeZone`: Preferred time zone
- `createdAt`: Date the user was created
- `lastLoginAt`: Date of the user's last login

### Get User by ID (Admin Only)

Retrieve a user profile by ID (requires admin role):

```javascript
const getUserById = async (token, userId) => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve user:', error);
    throw error;
  }
};
```

### List Users in Your Organization (Admin Only)

Retrieve a list of users in your organization (requires admin role):

```javascript
const listOrganizationUsers = async (token, filters = {}, page = 1, limit = 20) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    const response = await fetch(`/api/users?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to list users:', error);
    throw error;
  }
};
```

The `filters` object can include:
- `status`: Filter by user status (active, inactive, pending)
- `role`: Filter by user role (admin, physician, staff, radiologist)
- `locationId`: Filter by assigned location
- `search`: Search term for user name or email

The response will include:
- `users`: Array of user records
- `pagination`: Pagination information
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of users
  - `itemsPerPage`: Number of users per page

## Updating User Information

### Update Your Own Profile

Update your own user profile:

```javascript
const updateMyProfile = async (token, profileData) => {
  try {
    const response = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};
```

The `profileData` object can include:
- `firstName`: First name
- `lastName`: Last name
- `phoneNumber`: Phone number
- `specialty`: Medical specialty (for physicians)
- `settings`: User settings
  - `notificationPreferences`: Notification preferences
  - `uiPreferences`: UI preferences
  - `language`: Preferred language
  - `timeZone`: Preferred time zone

### Update User Profile (Admin Only)

Update a user's profile (requires admin role):

```javascript
const updateUserProfile = async (token, userId, profileData) => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
};
```

The `profileData` object can include the same fields as in the updateMyProfile method, plus:
- `role`: User role
- `status`: User status

### Change User Status (Admin Only)

Change a user's status (requires admin role):

```javascript
const changeUserStatus = async (token, userId, status, reason = '') => {
  try {
    const response = await fetch(`/api/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        reason
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to change user status:', error);
    throw error;
  }
};
```

The `status` parameter can be one of:
- `active`: Activate the user
- `inactive`: Deactivate the user

## Managing Profile Images

### Upload Profile Image

Upload a profile image:

```javascript
const uploadProfileImage = async (token, imageFile) => {
  try {
    // First, get a presigned URL for the image upload
    const presignedUrlResponse = await fetch('/api/users/me/profile-image-upload-url', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!presignedUrlResponse.ok) {
      throw new Error(`Error: ${presignedUrlResponse.status}`);
    }
    
    const presignedData = await presignedUrlResponse.json();
    
    // Upload the image to the presigned URL
    const uploadResponse = await fetch(presignedData.data.presignedUrl, {
      method: 'PUT',
      body: imageFile,
      headers: {
        'Content-Type': imageFile.type
      }
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }
    
    // Confirm the image upload
    const confirmResponse = await fetch('/api/users/me/profile-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileKey: presignedData.data.fileKey
      })
    });
    
    if (!confirmResponse.ok) {
      throw new Error(`Error: ${confirmResponse.status}`);
    }
    
    const data = await confirmResponse.json();
    return data.data;
  } catch (error) {
    console.error('Failed to upload profile image:', error);
    throw error;
  }
};
```

The response will include:
- `profileImageUrl`: URL for the uploaded profile image
- `thumbnailUrl`: URL for a thumbnail version of the profile image
- `uploadDate`: Date the image was uploaded

### Remove Profile Image

Remove your profile image:

```javascript
const removeProfileImage = async (token) => {
  try {
    const response = await fetch('/api/users/me/profile-image', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to remove profile image:', error);
    throw error;
  }
};
```

## Managing User Settings

### Update Notification Preferences

Update your notification preferences:

```javascript
const updateNotificationPreferences = async (token, preferences) => {
  try {
    const response = await fetch('/api/users/me/notification-preferences', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preferences })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    throw error;
  }
};
```

The `preferences` object can include:
```javascript
const preferences = {
  email: {
    orderUpdates: true,
    connectionRequests: true,
    systemAnnouncements: true,
    marketingCommunications: false
  },
  inApp: {
    orderUpdates: true,
    connectionRequests: true,
    systemAnnouncements: true
  },
  sms: {
    orderUpdates: false,
    connectionRequests: false,
    systemAnnouncements: false
  }
};
```

### Update UI Preferences

Update your UI preferences:

```javascript
const updateUiPreferences = async (token, preferences) => {
  try {
    const response = await fetch('/api/users/me/ui-preferences', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preferences })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to update UI preferences:', error);
    throw error;
  }
};
```

The `preferences` object can include:
```javascript
const preferences = {
  theme: 'light', // 'light', 'dark', 'system'
  fontSize: 'medium', // 'small', 'medium', 'large'
  compactView: false,
  showTutorials: true,
  dashboardLayout: 'default'
};
```

## Managing Security Settings

### Change Password

Change your password:

```javascript
const changePassword = async (token, currentPassword, newPassword) => {
  try {
    const response = await fetch('/api/users/me/password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to change password:', error);
    throw error;
  }
};
```

### Enable Two-Factor Authentication

Enable two-factor authentication:

```javascript
const enableTwoFactorAuth = async (token) => {
  try {
    // Step 1: Request 2FA setup
    const setupResponse = await fetch('/api/users/me/two-factor/setup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!setupResponse.ok) {
      throw new Error(`Error: ${setupResponse.status}`);
    }
    
    const setupData = await setupResponse.json();
    
    // Step 2: Display QR code to user and get verification code
    const qrCodeUrl = setupData.data.qrCodeUrl;
    const secretKey = setupData.data.secretKey;
    
    // Display QR code to user and prompt for verification code
    // This is a placeholder for your UI implementation
    const verificationCode = await promptUserForVerificationCode(qrCodeUrl, secretKey);
    
    // Step 3: Verify and enable 2FA
    const verifyResponse = await fetch('/api/users/me/two-factor/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        verificationCode
      })
    });
    
    if (!verifyResponse.ok) {
      throw new Error(`Error: ${verifyResponse.status}`);
    }
    
    const verifyData = await verifyResponse.json();
    return verifyData.data;
  } catch (error) {
    console.error('Failed to enable two-factor authentication:', error);
    throw error;
  }
};

// Placeholder function for UI implementation
const promptUserForVerificationCode = async (qrCodeUrl, secretKey) => {
  // Display QR code and secret key to user
  // Prompt user to enter verification code from authenticator app
  // Return the verification code
  return '123456'; // This should be replaced with actual user input
};
```

The response will include:
- `enabled`: Boolean indicating that 2FA is enabled
- `recoveryCodes`: Array of recovery codes to be saved by the user

### Disable Two-Factor Authentication

Disable two-factor authentication:

```javascript
const disableTwoFactorAuth = async (token, verificationCode) => {
  try {
    const response = await fetch('/api/users/me/two-factor/disable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        verificationCode
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to disable two-factor authentication:', error);
    throw error;
  }
};
```

### Get Login History

Retrieve your login history:

```javascript
const getLoginHistory = async (token, page = 1, limit = 20) => {
  try {
    const response = await fetch(`/api/users/me/login-history?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to retrieve login history:', error);
    throw error;
  }
};
```

The response will include:
- `logins`: Array of login records
- `pagination`: Pagination information

Each login record includes:
- `timestamp`: Login timestamp
- `ipAddress`: IP address
- `location`: Geographic location (if available)
- `deviceType`: Device type
- `browser`: Browser information
- `operatingSystem`: Operating system information
- `status`: Login status (success, failure)
- `failureReason`: Reason for failure (if applicable)

## Error Handling

When working with user profile endpoints, be prepared to handle these common errors:

- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions
- 404 Not Found: User not found
- 409 Conflict: Email already in use
- 422 Unprocessable Entity: Invalid data format

## Best Practices

1. **Keep profile information up-to-date**: Regularly review and update user profiles
2. **Use strong passwords**: Encourage users to set strong, unique passwords
3. **Enable two-factor authentication**: Enhance security with 2FA
4. **Monitor login history**: Regularly check login history for suspicious activity
5. **Manage notification preferences**: Configure notifications to avoid alert fatigue
6. **Use appropriate roles**: Assign the least privileged role necessary for each user
7. **Maintain accurate contact information**: Ensure contact details are current for important communications
8. **Respect user privacy**: Only collect and store necessary user information
9. **Provide clear profile settings**: Make it easy for users to update their preferences
10. **Document user management procedures**: Maintain documentation for administrators

================================================================================
FILE: frontend-explanation\api-docs\tutorials\validation-engine-accuracy.md
================================================================================

# Validation Engine Accuracy Optimization

This guide focuses on strategies to maximize the accuracy of the RadOrderPad validation engine when assigning CPT and ICD-10 codes based on clinical indications from physician dictation.

## Understanding the Validation Engine

The validation engine is the core component of RadOrderPad that processes clinical dictations to assign appropriate CPT and ICD-10 codes. Its accuracy is critical for:

1. **Clinical Appropriateness**: Ensuring the right imaging study is ordered
2. **Billing Accuracy**: Ensuring proper reimbursement
3. **Regulatory Compliance**: Meeting documentation requirements
4. **Clinical Decision Support**: Providing evidence-based guidance

## Current Accuracy Metrics

The validation engine currently achieves:

- **First-attempt accuracy**: ~85%
- **After clarification accuracy**: ~92%
- **Overall accuracy (including overrides)**: ~98%

## Factors Affecting Accuracy

### 1. Dictation Quality

The quality of the clinical dictation is the most significant factor affecting validation accuracy:

#### Key Elements for High-Quality Dictation

1. **Patient Demographics**
   - Age
   - Gender
   - Relevant physical characteristics

2. **Clinical Symptoms**
   - Location (specific body part)
   - Duration (acute, chronic, specific timeframe)
   - Severity (mild, moderate, severe)
   - Pattern (constant, intermittent, progressive)

3. **Relevant History**
   - Prior diagnoses
   - Previous treatments
   - Family history if relevant
   - Prior imaging studies

4. **Clinical Reasoning**
   - Suspected diagnosis
   - Differential diagnoses
   - Reason for the imaging study
   - What you hope to confirm or rule out

5. **Modality Preferences**
   - Preferred imaging modality
   - With or without contrast
   - Special protocols if needed

### 2. LLM Configuration

The validation engine uses a sophisticated LLM orchestration system:

- **Primary LLM**: Claude 3.7
- **Fallback LLMs**: Grok 3 → GPT-4.0

#### Prompt Engineering

The prompts used for the LLMs are critical for accuracy:

1. **Specialized Prompts**: Different prompts for various validation scenarios
2. **Context Enrichment**: Including relevant medical guidelines and criteria
3. **Structured Output**: Enforcing consistent JSON response format
4. **Few-Shot Examples**: Including examples of good validations

### 3. Medical Knowledge Base

The validation engine leverages a comprehensive medical knowledge base:

1. **CPT Code Database**: Complete database of radiology CPT codes with descriptions
2. **ICD-10 Code Database**: Comprehensive ICD-10 code database with descriptions
3. **Medical Terminology**: Mapping of common terms to standardized medical terminology
4. **Appropriateness Criteria**: ACR Appropriateness Criteria and other guidelines

## Strategies to Improve Accuracy

### 1. Dictation Guidance for Physicians

Provide clear guidance to physicians on how to structure their dictations:

```javascript
// Example dictation guidance component
const DictationGuidance = () => (
  <div className="dictation-guidance">
    <h3>Dictation Best Practices</h3>
    <ul>
      <li>Include patient age and gender</li>
      <li>Describe symptoms with location, duration, and severity</li>
      <li>Mention relevant medical history</li>
      <li>Explain your clinical reasoning</li>
      <li>Specify preferred imaging modality if known</li>
    </ul>
    <div className="example">
      <h4>Example:</h4>
      <p>
        "45-year-old female with 3-week history of progressively worsening right lower quadrant abdominal pain. 
        Pain is sharp, rated 7/10, and worse with movement. Patient reports low-grade fever and nausea. 
        Physical exam reveals tenderness to palpation in RLQ with guarding. 
        No prior abdominal surgeries. Family history significant for colon cancer in father. 
        Last colonoscopy 5 years ago was normal. 
        Requesting CT abdomen and pelvis with contrast to evaluate for appendicitis, diverticulitis, 
        or possible mass lesion."
      </p>
    </div>
  </div>
);
```

### 2. Dictation Templates

Provide structured templates for common clinical scenarios:

```javascript
// Example dictation template selector
const DictationTemplates = ({ onSelectTemplate }) => {
  const templates = [
    {
      id: 'headache',
      name: 'Headache',
      template: 'PATIENT_AGE-year-old PATIENT_GENDER with headache for DURATION. Pain is SEVERITY and LOCATION. Associated symptoms include SYMPTOMS. Medical history includes HISTORY. Neurological exam shows EXAM_FINDINGS. Requesting MODALITY to evaluate for DIFFERENTIAL_DIAGNOSES.'
    },
    {
      id: 'abdominal_pain',
      name: 'Abdominal Pain',
      template: 'PATIENT_AGE-year-old PATIENT_GENDER with DURATION of LOCATION abdominal pain. Pain is SEVERITY and CHARACTER. Associated symptoms include SYMPTOMS. Medical history includes HISTORY. Abdominal exam shows EXAM_FINDINGS. Requesting MODALITY to evaluate for DIFFERENTIAL_DIAGNOSES.'
    },
    // Additional templates...
  ];
  
  return (
    <div className="template-selector">
      <h3>Select a Template</h3>
      <select onChange={(e) => {
        const selected = templates.find(t => t.id === e.target.value);
        if (selected) onSelectTemplate(selected.template);
      }}>
        <option value="">-- Select Template --</option>
        {templates.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
};
```

### 3. Real-time Dictation Analysis

Implement real-time analysis of dictation to provide immediate feedback:

```javascript
// Example real-time dictation analysis
const analyzeDictation = (dictation) => {
  const analysis = {
    hasDemographics: /\d+[\s-]*(year|yr)[\s-]*(old|female|male|man|woman|patient)/i.test(dictation),
    hasSymptomDuration: /for\s+\d+\s+(day|days|week|weeks|month|months|year|years)/i.test(dictation),
    hasLocation: /(right|left|bilateral|upper|lower|anterior|posterior)/i.test(dictation),
    hasSeverity: /(mild|moderate|severe|intensity|scale)/i.test(dictation),
    hasHistory: /(history|previous|prior|past)/i.test(dictation),
    hasReasoning: /(evaluate|assess|rule out|confirm|suspected|concern for)/i.test(dictation),
  };
  
  return {
    analysis,
    score: Object.values(analysis).filter(Boolean).length / Object.values(analysis).length,
    suggestions: []
  };
};
```

### 4. Clarification Optimization

Optimize the clarification process to gather the most relevant additional information:

```javascript
// Example clarification prompt generator
const generateClarificationPrompt = (validationResult, dictation) => {
  const missingElements = [];
  
  if (!dictation.includes('year') && !dictation.includes('age')) {
    missingElements.push("patient's age");
  }
  
  if (!/(for|since)\s+\d+\s+(day|days|week|weeks|month|months)/i.test(dictation)) {
    missingElements.push("duration of symptoms");
  }
  
  if (!/(right|left|bilateral|upper|lower)/i.test(dictation)) {
    missingElements.push("specific location of symptoms");
  }
  
  // Generate appropriate prompt based on missing elements
  if (missingElements.length > 0) {
    return `To help determine the most appropriate imaging study, please provide additional information about: ${missingElements.join(', ')}.`;
  }
  
  return validationResult.clarificationPrompt || "Please provide any additional relevant clinical information.";
};
```

### 5. Feedback Loop Implementation

Implement a feedback loop to continuously improve the validation engine:

```javascript
// Example feedback collection
const ValidationFeedback = ({ orderId, validationResult }) => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(null);
  
  const submitFeedback = async () => {
    await fetch('/api/validation/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        orderId,
        rating,
        feedback,
        suggestedCPTCode: validationResult.cptCode,
        suggestedICD10Codes: validationResult.icd10Codes,
        wasAccepted: true // Whether the physician accepted the suggested codes
      })
    });
  };
  
  return (
    <div className="validation-feedback">
      <h3>How accurate was this validation?</h3>
      <div className="rating">
        {[1, 2, 3, 4, 5].map(r => (
          <button 
            key={r} 
            className={rating === r ? 'selected' : ''}
            onClick={() => setRating(r)}
          >
            {r}
          </button>
        ))}
      </div>
      <textarea
        placeholder="Please provide any feedback on the validation accuracy..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      <button onClick={submitFeedback}>Submit Feedback</button>
    </div>
  );
};
```

### 6. Continuous Model Training

Implement a continuous training pipeline for the validation engine:

1. **Data Collection**: Collect validation attempts, physician feedback, and final codes
2. **Data Annotation**: Annotate the data with correct CPT and ICD-10 codes
3. **Model Fine-tuning**: Periodically fine-tune the LLMs with the collected data
4. **Prompt Optimization**: Continuously optimize prompts based on performance data
5. **A/B Testing**: Test different prompt variations to identify the most effective approaches

## Implementation Recommendations

### 1. Frontend Optimizations

1. **Dictation Assistant**: Implement a real-time dictation assistant that provides suggestions as the physician types
2. **Structured Input Forms**: Provide structured forms for capturing key clinical information
3. **Visual Feedback**: Provide visual feedback on dictation completeness and quality
4. **Code Selection Interface**: Implement an intuitive interface for reviewing and selecting codes

### 2. Backend Optimizations

1. **Prompt Versioning**: Implement a versioning system for LLM prompts
2. **Performance Monitoring**: Monitor validation accuracy and performance metrics
3. **Fallback Mechanisms**: Implement robust fallback mechanisms for when the primary LLM fails
4. **Caching Strategy**: Implement intelligent caching for similar dictations

### 3. Database Optimizations

1. **Code Database Updates**: Regularly update the CPT and ICD-10 code databases
2. **Synonym Mapping**: Maintain a comprehensive mapping of medical terms and synonyms
3. **Historical Performance**: Track historical performance data for continuous improvement

## Measuring Accuracy Improvements

Implement comprehensive metrics to track accuracy improvements:

1. **Acceptance Rate**: Percentage of validations accepted without modification
2. **Clarification Rate**: Percentage of validations requiring clarification
3. **Override Rate**: Percentage of validations requiring override
4. **Code Change Rate**: Percentage of validations where the physician changed the suggested codes
5. **Feedback Scores**: Average feedback scores from physicians

## Conclusion

Improving the accuracy of the validation engine requires a multi-faceted approach that addresses:

1. The quality of input (clinical dictation)
2. The sophistication of the processing (LLM configuration)
3. The comprehensiveness of the knowledge base (medical codes and guidelines)
4. The effectiveness of the feedback loop (continuous improvement)

By implementing the strategies outlined in this guide, you can significantly improve the accuracy of CPT and ICD-10 code assignment based on clinical indications from physician dictation.