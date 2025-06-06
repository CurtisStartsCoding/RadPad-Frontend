Order Creation Workflow Endpoints for Frontend Developers
 
## Base URL
```https://api.radorderpad.com/api
```
 
## Authentication
All endpoints require a JWT token in the Authorization header:
```Authorization: Bearer {token}
```
 
## 1. Validation Endpoint
**Endpoint: `POST /orders/validate`*
 
*Description: Validates dictation text without creating an order (stateless)*
 
*Request:*
```json
{
  "dictationText": "Patient with chest pain, shortness of breath. History of hypertension. Please evaluate for possible coronary artery disease."
}
```
 
*Response:*
```json
{
  "success": true,
  "validationResult": {
    "validationStatus": "appropriate",
    "complianceScore": 9,
    "feedback": "Initial imaging should begin with ECG for chest pain...",
    "suggestedICD10Codes": [
      {
        "code": "R07.9",
        "description": "Chest pain, unspecified",
        "isPrimary": true
      },
      {
        "code": "I10",
        "description": "Essential (primary) hypertension",
        "isPrimary": false
      }
    ],
    "suggestedCPTCodes": [
      {
        "code": "93000",
        "description": "Electrocardiogram, routine ECG with at least 12 leads; with interpretation and report",
        "isPrimary": false
      },
      // Additional codes...
    ]
  }
}
```
 
## 2. Order Creation Endpoint
*Endpoint: `PUT /orders/new`*
 
*Description: Creates a new order after validation is complete*
 
*Request:*
```json
{
  "dictationText": "Patient with chest pain, shortness of breath. History of hypertension...",
  "patientInfo": {
    "id": 1
    // Can also include firstName, lastName, dateOfBirth, gender, etc. if creating a new patient
  },
  "validationResult": {
    // Include the validation result from the validation endpoint
  },
  "status": "pending_admin",
  "finalValidationStatus": "appropriate",
  "finalCPTCode": "93000",
  "clinicalIndication": "Patient with chest pain, shortness of breath...",
  "finalICD10Codes": [
    "R07.9",
    "I10"
  ],
  "referring_organization_name": "Test Organization"
}
```
 
*Response:*
```json
{
  "success": true,
  "message": "Order created successfully",
  "orderId": 946
}
```
 
## 3. Order Finalization Endpoint
*Endpoint: `PUT /orders/{orderId}`*
 
*Description: Finalizes an order with signature*
 
*Request:*
```json
{
  "signature": "base64-encoded-signature-data",
  "status": "pending_admin"
}
```
 
*Response:*
```json
{
  "success": true,
  "message": "Order finalized successfully"
}
```
 
## 4. Order Status Check
*Endpoint: `GET /orders/{orderId}`*
 
*Description: Gets the current status of an order*
 
*Response:*
```json
{
  "id": 946,
  "status": "pending_admin",
  "patient": {
    // Patient details
  },
  "dictation": "Patient with chest pain...",
  // Additional order details
}
```
 
## 5. Order Listing
*Endpoint: `GET /orders`*
 
*Description: Lists all orders for the current user*
 
*Query Parameters:*
- `status`: Filter by status (optional)
- `page`: Page number (optional)
- `limit`: Items per page (optional)
 
*Response:*
```json
{
  "orders": [
    {
      "id": 946,
      "status": "pending_admin",
      "patient": {
        // Patient details
      },
      "createdAt": "2025-06-06T10:54:00Z"
    },
    // Additional orders...
  ],
  "total": 894,
  "page": 1,
  "limit": 20
}
```
 
## Important Notes for Frontend Implementation
 
1. *Stateless Validation Flow:*
   - The validation endpoint doesn't create any orders
   - Multiple validation attempts can be made before creating an order
   - For clarification loops, append new text to the original dictation
 
2. *Order Creation:*
   - `radiology_organization_id` should NOT be included (it's assigned later by admin staff)
   - Include all validation results from the final validation attempt
 
3. *Error Handling:**
   - Handle 401 errors (authentication)
   - Handle 400 errors (validation)
   - Handle 500 errors (server issues)
   - Handle 503 errors (service unavailable)