import { ApiAnalytics } from './types';

/**
 * Generate analytics data from orders
 */
export function generateAnalyticsFromOrders(orders: any[]): ApiAnalytics {
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