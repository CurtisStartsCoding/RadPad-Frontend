import { Request, Response } from 'express';
import { log } from './vite';

/**
 * Parse JWT token and extract payload
 */
export function parseJwtToken(token: string): any {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }
    return JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
  } catch (e) {
    console.error("Error parsing token:", e);
    return null;
  }
}

/**
 * Check if a user is a trial user based on their JWT token
 */
export function isTrialUser(req: Request): boolean {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = parseJwtToken(token);
    
    if (payload) {
      return payload.isTrial === true || 
             payload.role === 'trial_physician' || 
             payload.role === 'trial_user';
    }
  }
  
  return false;
}

/**
 * Create standard error response
 */
export function errorResponse(res: Response, status: number, message: string): void {
  res.status(status).json({
    success: false,
    error: message,
    status
  });
}

/**
 * Generate analytics data from orders
 */
function generateAnalyticsFromOrders(orders: any[]): any {
  // Create a map of months for activity data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentDate = new Date();
  const activityData = [];
  
  // Generate last 6 months of activity data
  for (let i = 5; i >= 0; i--) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = monthNames[month.getMonth()];
    
    // Count orders for this month
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === month.getMonth() &&
             orderDate.getFullYear() === month.getFullYear();
    });
    
    // Count validations (assuming all orders are validated)
    const validations = monthOrders.length;
    
    activityData.push({
      name: monthName,
      orders: monthOrders.length,
      validations: validations
    });
  }
  
  // Generate modality distribution
  const modalityCounts: Record<string, number> = {};
  orders.forEach(order => {
    const modality = order.modality || 'Unknown';
    modalityCounts[modality] = (modalityCounts[modality] || 0) + 1;
  });
  
  const modalityDistribution = Object.entries(modalityCounts).map(([name, value]) => ({
    name,
    value
  }));
  
  // Calculate stats
  const totalOrders = orders.length;
  const completedStudies = orders.filter(order => order.status === 'completed').length;
  const pendingOrders = orders.filter(order =>
    order.status === 'pending_admin' ||
    order.status === 'pending_radiology' ||
    order.status === 'pending_validation'
  ).length;
  
  // Get unique patients
  const uniquePatientIds = new Set();
  orders.forEach(order => {
    if (order.patient_id) {
      uniquePatientIds.add(order.patient_id);
    }
  });
  const activePatients = uniquePatientIds.size;
  
  // Calculate average completion time (in hours)
  let totalCompletionTime = 0;
  let completedOrdersWithTime = 0;
  
  orders.forEach(order => {
    if (order.status === 'completed' && order.created_at && order.updated_at) {
      const createdDate = new Date(order.created_at);
      const completedDate = new Date(order.updated_at);
      const completionTime = (completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60); // hours
      
      if (completionTime > 0) {
        totalCompletionTime += completionTime;
        completedOrdersWithTime++;
      }
    }
  });
  
  const avgCompletionTime = completedOrdersWithTime > 0 ?
    Math.round(totalCompletionTime / completedOrdersWithTime) :
    48; // Default to 48 hours if no data
  
  // Calculate validation success rate
  const validationSuccessRate = totalOrders > 0 ?
    Math.round((completedStudies / totalOrders) * 100) :
    0;
  
  // Calculate orders this quarter
  const currentQuarter = Math.floor(currentDate.getMonth() / 3);
  const quarterStartMonth = currentQuarter * 3;
  const quarterStartDate = new Date(currentDate.getFullYear(), quarterStartMonth, 1);
  
  const ordersThisQuarter = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= quarterStartDate;
  }).length;
  
  return {
    activity_data: activityData,
    modality_distribution: modalityDistribution,
    stats: {
      total_orders: totalOrders,
      completed_studies: completedStudies,
      active_patients: activePatients,
      pending_orders: pendingOrders,
      avg_completion_time: avgCompletionTime,
      validation_success_rate: validationSuccessRate,
      orders_this_quarter: ordersThisQuarter
    }
  };
}

/**
 * Register analytics routes
 */
export function registerAnalyticsRoutes(app: any) {
  // Get API URL from environment variable or use default
  const apiUrl = process.env.API_URL || 'https://api.radorderpad.com';

  // Analytics dashboard endpoint
  app.get('/api/analytics/dashboard', async (req: Request, res: Response) => {
    try {
      log('ANALYTICS DASHBOARD REQUEST: Generating from orders data', 'analytics');
      
      // Get auth token from request
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return errorResponse(res, 401, 'Unauthorized');
      }
      
      // Check if this is a trial user
      const trialUser = isTrialUser(req);
      
      // Fetch orders data from the real API to generate analytics
      log('Fetching orders data to generate analytics', 'analytics');
      
      // Determine the appropriate endpoint based on user type
      let ordersEndpoint = '/api/orders';
      if (trialUser) {
        log('Trial user detected, using trial-specific endpoint', 'analytics');
        ordersEndpoint = '/api/orders/trial';
      }
      
      // Add query parameters to get all orders
      ordersEndpoint = `${ordersEndpoint}?limit=100`;
      
      log(`Fetching orders from ${apiUrl}${ordersEndpoint}`, 'analytics');
      
      // Make a direct fetch request to the API
      const url = `${apiUrl}${ordersEndpoint}`;
      const options: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authHeader
        }
      };
      
      log(`Directly fetching orders from ${url}`, 'analytics');
      
      // Make the request
      const response = await fetch(url, options);
      
      if (!response.ok) {
        log(`Failed to fetch orders: ${response.status} ${response.statusText}`, 'error');
        return errorResponse(res, response.status, 'Failed to fetch orders data for analytics');
      }
      
      // Parse the response
      const ordersData = await response.json();
      
      if (!ordersData || !ordersData.orders) {
        log('No orders data available to generate analytics', 'analytics');
        return errorResponse(res, 404, 'No orders data available to generate analytics');
      }
      
      log(`Successfully fetched ${ordersData.orders.length} orders for analytics`, 'analytics');
      
      // Generate analytics data from orders
      const analyticsData = generateAnalyticsFromOrders(ordersData.orders);
      
      // Return the analytics data
      res.status(200).json(analyticsData);
    } catch (error) {
      log(`Error handling analytics request: ${error}`, 'error');
      errorResponse(res, 500, 'Internal server error during analytics dashboard generation');
    }
  });
}