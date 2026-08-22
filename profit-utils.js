/**
 * Business Analytics & Profit Calculation Utilities
 * Single source of truth for profit, margin, shipping cost, and date filtering logic.
 */

/**
 * Calculates profit metrics for a single order.
 *
 * Formulas:
 * Revenue = final order total (amount paid by customer after discounts & shipping)
 * Product Cost = sum(quantity * costPriceSnapshot)
 * Gross Profit = Revenue - Product Cost
 * Net Profit = Revenue - Product Cost - Shipping Cost
 * Profit Margin = (Net Profit / Revenue) * 100
 */
export function calculateOrderProfit(order, productCostsMap = {}) {
  if (!order) {
    return {
      revenue: 0,
      productCost: 0,
      grossProfit: 0,
      shippingCost: null,
      netProfit: null,
      profitMargin: 0,
      hasMissingCost: true,
      hasMissingShipping: true,
      isCostFrozen: false,
      isCostPending: false,
      costStatus: 'MISSING',
      costStatusText: '⚠️ Missing Cost Data',
      itemsCostBreakdown: []
    };
  }

  const revenue = typeof order.total === 'number' ? order.total : 0;
  let productCost = 0;
  let hasMissingCost = false;
  let hasPendingCost = false;
  const itemsCostBreakdown = [];

  const isOrderFrozen = Boolean(order.isCostFrozen || order.profitCostSnapshotAt);

  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach(item => {
      const qty = item.quantity || 1;
      const displayName = item.name || item.productName || 'Product';
      const pId = item.productId || displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      // Priority 1: Frozen item cost price or cost total snapshot inside order document
      let itemCostPrice = null;
      let isItemFrozen = false;

      if (typeof item.costPrice === 'number' && !isNaN(item.costPrice)) {
        itemCostPrice = item.costPrice;
        isItemFrozen = true;
      } else if (typeof item.costTotal === 'number' && !isNaN(item.costTotal) && qty > 0) {
        itemCostPrice = item.costTotal / qty;
        isItemFrozen = true;
      } else if (!isOrderFrozen && productCostsMap && typeof productCostsMap[pId] === 'number') {
        // Priority 3: Fallback to Admin productCostsMap preview if order is not frozen yet
        itemCostPrice = productCostsMap[pId];
        hasPendingCost = true;
      }

      if (itemCostPrice === null) {
        hasMissingCost = true;
        itemsCostBreakdown.push({
          ...item,
          productId: pId,
          costPrice: null,
          costTotal: null,
          hasCost: false,
          isFrozen: false
        });
      } else {
        const costTotal = itemCostPrice * qty;
        productCost += costTotal;
        itemsCostBreakdown.push({
          ...item,
          productId: pId,
          costPrice: itemCostPrice,
          costTotal: costTotal,
          hasCost: true,
          isFrozen: isItemFrozen
        });
      }
    });
  } else {
    hasMissingCost = true;
  }

  // Priority 2: Override productCost with frozen top-level order.productCost if available and frozen
  if (isOrderFrozen && typeof order.productCost === 'number' && !isNaN(order.productCost) && productCost === 0) {
    productCost = order.productCost;
  }

  const grossProfit = revenue - productCost;

  // Actual shipping expense entered by admin (stored as order.shippingCost)
  let shippingCost = null;
  if (typeof order.shippingCost === 'number' && !isNaN(order.shippingCost)) {
    shippingCost = order.shippingCost;
  }

  const hasMissingShipping = shippingCost === null;
  const effectiveShippingCost = shippingCost !== null ? shippingCost : 0;
  const netProfit = revenue - productCost - effectiveShippingCost;

  let profitMargin = 0;
  if (revenue > 0 && !hasMissingCost) {
    profitMargin = (netProfit / revenue) * 100;
  }

  // Prevent NaN or Infinity
  if (isNaN(profitMargin) || !isFinite(profitMargin)) {
    profitMargin = 0;
  }

  let costStatus = 'MISSING';
  let costStatusText = '⚠️ Missing Cost Data';

  if (isOrderFrozen || (!hasMissingCost && !hasPendingCost)) {
    costStatus = 'FROZEN';
    costStatusText = '✓ Cost Data Available';
  } else if (hasPendingCost || (!isOrderFrozen && !hasMissingCost)) {
    costStatus = 'PENDING';
    costStatusText = '⏳ Cost snapshot pending';
  }

  return {
    revenue,
    productCost,
    grossProfit,
    shippingCost,
    netProfit,
    profitMargin,
    hasMissingCost,
    hasMissingShipping,
    isCostFrozen: isOrderFrozen,
    isCostPending: costStatus === 'PENDING',
    costStatus,
    costStatusText,
    itemsCostBreakdown
  };
}

/**
 * Filter an array of orders based on selected date filter preset or custom date range.
 */
export function filterOrdersByDateRange(orders = [], filterType = 'ALL', customStartDate = null, customEndDate = null) {
  if (!Array.isArray(orders) || orders.length === 0) return [];

  const now = new Date();

  // Helper to extract timestamp millis from Firestore timestamp object or JS Date
  const getOrderTimestamp = (order) => {
    if (!order || !order.createdAt) return 0;
    if (typeof order.createdAt.toMillis === 'function') return order.createdAt.toMillis();
    if (typeof order.createdAt.seconds === 'number') return order.createdAt.seconds * 1000;
    if (order.createdAt instanceof Date) return order.createdAt.getTime();
    if (typeof order.createdAt === 'string' || typeof order.createdAt === 'number') {
      const d = new Date(order.createdAt);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    return 0;
  };

  return orders.filter(order => {
    const ts = getOrderTimestamp(order);
    if (!ts) return filterType === 'ALL'; // Include legacy orders with missing date only in ALL time

    const orderDate = new Date(ts);

    if (filterType === 'TODAY') {
      return orderDate.getFullYear() === now.getFullYear() &&
             orderDate.getMonth() === now.getMonth() &&
             orderDate.getDate() === now.getDate();
    }

    if (filterType === 'YESTERDAY') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return orderDate.getFullYear() === yesterday.getFullYear() &&
             orderDate.getMonth() === yesterday.getMonth() &&
             orderDate.getDate() === yesterday.getDate();
    }

    if (filterType === 'THIS_WEEK') {
      // Start of current week (Sunday or Monday, let's use last 7 days or start of week)
      const startOfWeek = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      return orderDate >= startOfWeek;
    }

    if (filterType === 'THIS_MONTH') {
      return orderDate.getFullYear() === now.getFullYear() &&
             orderDate.getMonth() === now.getMonth();
    }

    if (filterType === 'LAST_MONTH') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return orderDate >= lastMonth && orderDate <= endOfLastMonth;
    }

    if (filterType === 'CUSTOM') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (!isNaN(start.getTime()) && orderDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (!isNaN(end.getTime()) && orderDate > end) return false;
      }
      return true;
    }

    return true; // ALL time
  });
}

/**
 * Calculates complete business analytics for a filtered collection of orders.
 * Excludes cancelled or payment rejected orders.
 */
export function calculateBusinessAnalytics(orders = [], catalogProducts = [], productCostsMap = {}) {
  let totalSales = 0;
  let completeCostSales = 0;
  let totalProductCost = 0;
  let totalShippingExpenses = 0;
  let validOrdersCount = 0;
  let completeCostOrdersCount = 0;
  let missingCostOrdersCount = 0;
  let missingShippingOrdersCount = 0;
  let totalItemsSold = 0;

  const productAnalyticsMap = {};

  orders.forEach(order => {
    // Exclude cancelled/refunded/rejected orders
    const isCancelled = (order.orderStatus === 'Cancelled' || order.paymentStatus === 'Payment Rejected');
    if (isCancelled) return;

    validOrdersCount++;
    const profit = calculateOrderProfit(order, productCostsMap);

    totalSales += profit.revenue;

    if (profit.hasMissingCost) {
      missingCostOrdersCount++;
    } else {
      completeCostOrdersCount++;
      completeCostSales += profit.revenue;
      totalProductCost += profit.productCost;
    }

    if (profit.hasMissingShipping) {
      missingShippingOrdersCount++;
    } else {
      totalShippingExpenses += (profit.shippingCost || 0);
    }

    // Process product-level statistics
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const qty = item.quantity || 1;
        totalItemsSold += qty;

        const displayName = item.name || 'Unknown Product';
        const pId = item.productId || displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const appliedPrice = typeof item.appliedPrice === 'number' ? item.appliedPrice : (item.price || 0);
        const itemRevenue = appliedPrice * qty;

        let itemCostPrice = null;
        if (typeof item.costPrice === 'number' && !isNaN(item.costPrice)) {
          itemCostPrice = item.costPrice;
        } else if (typeof item.costTotal === 'number' && qty > 0) {
          itemCostPrice = item.costTotal / qty;
        }

        const itemCostTotal = itemCostPrice !== null ? (itemCostPrice * qty) : null;
        const itemProfit = itemCostTotal !== null ? (itemRevenue - itemCostTotal) : null;

        if (!productAnalyticsMap[pId]) {
          productAnalyticsMap[pId] = {
            id: pId,
            name: displayName,
            image: item.image || '',
            category: item.category || '',
            unitsSold: 0,
            revenue: 0,
            productCost: 0,
            profit: 0,
            hasCostData: true
          };
        }

        productAnalyticsMap[pId].unitsSold += qty;
        productAnalyticsMap[pId].revenue += itemRevenue;

        if (itemCostTotal !== null) {
          productAnalyticsMap[pId].productCost += itemCostTotal;
          productAnalyticsMap[pId].profit += itemProfit;
        } else {
          productAnalyticsMap[pId].hasCostData = false;
        }
      });
    }
  });

  const hasCompleteCostData = (missingCostOrdersCount === 0);
  const relevantSales = hasCompleteCostData ? totalSales : completeCostSales;
  const grossProfit = relevantSales - totalProductCost;
  const netProfit = relevantSales - totalProductCost - totalShippingExpenses;
  let profitMargin = 0;
  if (relevantSales > 0) {
    profitMargin = (netProfit / relevantSales) * 100;
  }
  if (isNaN(profitMargin) || !isFinite(profitMargin)) {
    profitMargin = 0;
  }

  // Convert product analytics map to array & integrate catalog cost prices for unsold products
  const productList = Object.values(productAnalyticsMap);

  // Top products by profit
  const topByProfit = [...productList]
    .filter(p => p.unitsSold > 0 && p.hasCostData)
    .sort((a, b) => b.profit - a.profit);

  // Top products by revenue
  const topByRevenue = [...productList]
    .filter(p => p.unitsSold > 0)
    .sort((a, b) => b.revenue - a.revenue);

  return {
    totalSales,
    completeCostSales,
    totalProductCost,
    totalShippingExpenses,
    grossProfit,
    netProfit,
    profitMargin,
    validOrdersCount,
    completeCostOrdersCount,
    totalItemsSold,
    missingCostOrdersCount,
    missingShippingOrdersCount,
    hasCompleteCostData,
    productAnalyticsList: productList,
    topByProfit,
    topByRevenue
  };
}

if (typeof window !== 'undefined') {
  window.calculateOrderProfit = calculateOrderProfit;
  window.filterOrdersByDateRange = filterOrdersByDateRange;
  window.calculateBusinessAnalytics = calculateBusinessAnalytics;
}
