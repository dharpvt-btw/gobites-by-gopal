// Global States
let activeView = 'dashboard';
let activeQueueStatus = 'all';
let searchKeyword = '';
let selectedOrderId = null;
let ordersList = [];
let kpiData = {};
let eventSource = null;

// Chart instances
let revenueChart = null;
let ordersChart = null;

// DOM Elements
const views = {
  dashboard: document.getElementById('view-dashboard'),
  reports: document.getElementById('view-reports'),
  menu: document.getElementById('view-menu'),
  feedback: document.getElementById('view-feedback'),
  notifications: document.getElementById('view-notifications')
};

const menuButtons = {
  dashboard: document.getElementById('menu-btn-orders'),
  reports: document.getElementById('menu-btn-reports'),
  menu: document.getElementById('menu-btn-menu'),
  feedback: document.getElementById('menu-btn-feedback'),
  notifications: document.getElementById('menu-btn-notifications')
};

// Priming Sound Alarm
// Web Audio API Synthesized Bell Chime (no external files needed)
function playNewOrderAlarm() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, startTime, duration, type='sine') => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = audioCtx.currentTime;
    // Premium telephone bell chime synth
    playTone(880, now, 0.12, 'triangle');   // A5
    playTone(880, now + 0.15, 0.12, 'triangle');
    playTone(1046.5, now + 0.3, 0.4, 'sine'); // C6
  } catch (err) {
    console.warn('Web Audio alarm failed:', err);
  }
}

// View Router
function switchView(viewName) {
  activeView = viewName;
  Object.keys(views).forEach(key => {
    if (key === viewName) {
      views[key].style.display = 'block';
      menuButtons[key].classList.add('active');
    } else {
      views[key].style.display = 'none';
      menuButtons[key].classList.remove('active');
    }
  });

  // Load view-specific data
  if (viewName === 'dashboard') {
    fetchStats();
    fetchOrders();
  } else if (viewName === 'reports') {
    loadReports('daily');
  } else if (viewName === 'menu') {
    fetchAdminMenu();
  } else if (viewName === 'feedback') {
    fetchFeedbackStats();
  } else if (viewName === 'notifications') {
    fetchNotificationLogs();
  }
}

// Bind Sidebar Menu
Object.keys(menuButtons).forEach(key => {
  menuButtons[key].addEventListener('click', () => switchView(key));
});

// 1. DASHBOARD OPERATIONS
async function fetchStats() {
  try {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    if (data.success) {
      kpiData = data.stats;
      updateStatsUI();
    }
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
}

function updateStatsUI() {
  document.getElementById('kpi-revenue').textContent = `₹${parseFloat(kpiData.revenueToday).toFixed(2)}`;
  document.getElementById('kpi-orders-count').textContent = kpiData.totalOrdersToday;
  document.getElementById('kpi-active-preparing').textContent = kpiData.preparingOrdersCount;
  document.getElementById('kpi-top-food').textContent = kpiData.topSellingItemToday || 'N/A';
}

// Fetch and Render Orders Queue
async function fetchOrders() {
  try {
    const statusParam = activeQueueStatus !== 'all' ? `status=${activeQueueStatus}` : '';
    const searchParam = searchKeyword.trim() !== '' ? `search=${encodeURIComponent(searchKeyword)}` : '';
    
    let queryStr = [statusParam, searchParam].filter(Boolean).join('&');
    if (queryStr) queryStr = `?${queryStr}`;

    const res = await fetch(`/api/admin/orders${queryStr}`);
    const data = await res.json();
    
    if (data.success) {
      ordersList = data.orders;
      renderOrdersQueue();
      
      // Auto re-select inspector order if it is still in the list
      if (selectedOrderId) {
        const matching = ordersList.find(o => o.order_id === selectedOrderId);
        if (matching) {
          renderOrderDetails(matching);
        } else {
          // If the order is no longer in the list (filtered out), keep the panel or clear
          // Let's reload details from API to keep showing it in inspector
          fetchSingleOrder(selectedOrderId);
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch orders:', err);
  }
}

async function fetchSingleOrder(orderId) {
  try {
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    if (data.success) {
      renderOrderDetails(data.order);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderOrdersQueue() {
  const container = document.getElementById('admin-orders-queue');
  
  if (ordersList.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)">No orders in this filter queue.</div>`;
    return;
  }

  container.innerHTML = ordersList.map(o => {
    const timeStr = new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const itemsSnippet = o.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    const isSelected = o.order_id === selectedOrderId ? 'selected' : '';

    return `
      <div class="order-card ${isSelected}" onclick="selectOrder(${o.order_id})">
        <div class="order-card-header">
          <span class="order-id">Order #${o.order_id}</span>
          <span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span>
        </div>
        <div class="order-items-snippet">${itemsSnippet}</div>
        <div class="order-card-footer">
          <span>${o.customer_name}</span>
          <span>${timeStr} • ₹${o.total_price.toFixed(2)}</span>
        </div>
      </div>
    `;
  }).join('');
}

window.selectOrder = function(orderId) {
  selectedOrderId = orderId;
  
  // Highlight active card
  document.querySelectorAll('.order-card').forEach(card => card.classList.remove('selected'));
  const clickedCard = document.querySelector(`[onclick="selectOrder(${orderId})"]`);
  if (clickedCard) clickedCard.classList.add('selected');

  const order = ordersList.find(o => o.order_id === orderId);
  if (order) {
    renderOrderDetails(order);
  } else {
    fetchSingleOrder(orderId);
  }
};

function renderOrderDetails(order) {
  const inspector = document.getElementById('order-inspector-panel');
  const dateObj = new Date(order.created_at);
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = dateObj.toLocaleDateString();

  // Create items list HTML
  const itemsHtml = order.items.map(i => `
    <div class="flex justify-between align-center" style="font-size: 0.9rem; padding: 4px 0;">
      <span>${i.quantity}x ${i.name} (${i.category})</span>
      <span style="font-family: var(--font-display); font-weight:600;">₹${(i.item_price * i.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  // Determine actions based on status
  let actionButtonsHtml = '';
  if (order.status === 'Pending Owner Approval') {
    actionButtonsHtml = `
      <button class="action-btn action-btn-primary" onclick="updateStatus(${order.order_id}, 'Preparing')">Accept & Prepare</button>
      <button class="action-btn action-btn-danger" onclick="openRejectReasonModal(${order.order_id})">Reject Order</button>
    `;
  } else if (order.status === 'Pending') {
    actionButtonsHtml = `
      <button class="action-btn action-btn-primary" onclick="updateStatus(${order.order_id}, 'Preparing')">Accept & Prepare</button>
      <button class="action-btn action-btn-danger" onclick="openRejectReasonModal(${order.order_id})">Reject Order</button>
    `;
  } else if (order.status === 'Preparing') {
    actionButtonsHtml = `
      <button class="action-btn action-btn-success" onclick="updateStatus(${order.order_id}, 'Ready')">Mark Ready</button>
      <button class="action-btn action-btn-danger" onclick="openRejectReasonModal(${order.order_id})">Reject Order</button>
    `;
  } else if (order.status === 'Ready') {
    actionButtonsHtml = `
      <button class="action-btn action-btn-primary" onclick="updateStatus(${order.order_id}, 'Completed')">Complete Order</button>
      <button class="action-btn action-btn-danger" onclick="openRejectReasonModal(${order.order_id})">Reject Order</button>
    `;
  } else {
    // Completed or Cancelled
    const finishLabel = order.status === 'Completed' ? 'Completed At' : 'Cancelled At';
    const finishTime = order.completed_at ? new Date(order.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
    actionButtonsHtml = `
      <div style="font-size:0.85rem; color:var(--text-muted); text-align:center; width:100%; padding:10px; background:var(--bg-base); border-radius:var(--border-radius-md);">
        <strong>${finishLabel}:</strong> ${finishTime} - No further operations.
      </div>
    `;
  }

  inspector.innerHTML = `
    <div class="panel-header" style="border-bottom:1px solid var(--border-color); padding-bottom:14px; margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="panel-title" style="font-size:1.4rem;">Order #${order.order_id}</span>
        <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted);">${dateStr} at ${timeStr}</div>
    </div>

    <div class="inspector-body">
      <div class="inspector-row">
        <span class="inspector-label">Customer Name</span>
        <span class="inspector-value">${order.customer_name}</span>
      </div>
      <div class="inspector-row">
        <span class="inspector-label">Phone Number</span>
        <span class="inspector-value"><a href="tel:${order.phone_number}" style="color:var(--primary);text-decoration:underline;">${order.phone_number}</a></span>
      </div>
      <div class="inspector-row">
        <span class="inspector-label">Address</span>
        <span class="inspector-value">${order.customer_address || 'Store Pickup'}</span>
      </div>
      
      <div>
        <span class="inspector-label" style="display:block; margin-bottom:8px;">Items Ordered</span>
        <div class="inspector-items-list">
          ${itemsHtml}
          <div class="flex justify-between" style="border-top:1px dotted var(--border-color); padding-top:8px; margin-top:8px; font-weight:700;">
            <span>Total Price</span>
            <span>₹${order.total_price.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <span class="inspector-label" style="display:block; margin-bottom:6px;">Special Instructions</span>
        <div style="background:var(--bg-base); padding:12px; border:1px solid var(--border-color); border-radius:var(--border-radius-md); font-size:0.9rem; font-style:italic;">
          ${order.special_instructions || 'None'}
        </div>
      </div>
      
      <div class="inspector-row">
        <span class="inspector-label">Estimated Cook Time</span>
        <span class="inspector-value" style="color:var(--primary);">${order.estimated_time} Minutes</span>
      </div>
    </div>

    <div class="action-bar">
      ${actionButtonsHtml}
    </div>
  `;
}

// Update Order Status API Call
window.updateStatus = async function(orderId, newStatus) {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    
    const data = await res.json();
    if (data.success) {
      // Refresh list & stats
      fetchStats();
      fetchOrders();
    } else {
      alert(`Error updating status: ${data.message}`);
    }
  } catch (err) {
    console.error(err);
  }
};

// Queue Bindings
document.getElementById('order-status-tabs').addEventListener('click', (e) => {
  if (e.target.classList.contains('filter-btn')) {
    document.querySelectorAll('#order-status-tabs .filter-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    activeQueueStatus = e.target.dataset.status;
    fetchOrders();
  }
});

document.getElementById('admin-order-search').addEventListener('input', (e) => {
  searchKeyword = e.target.value;
  fetchOrders();
});


// 2. REPORTS & ANALYTICS VIEWS
const reportPeriodBtns = {
  daily: document.getElementById('btn-report-daily'),
  weekly: document.getElementById('btn-report-weekly'),
  monthly: document.getElementById('btn-report-monthly')
};

Object.keys(reportPeriodBtns).forEach(key => {
  reportPeriodBtns[key].addEventListener('click', () => {
    Object.keys(reportPeriodBtns).forEach(k => reportPeriodBtns[k].classList.remove('active'));
    reportPeriodBtns[key].classList.add('active');
    loadReports(key);
  });
});

async function loadReports(period) {
  try {
    const res = await fetch(`/api/admin/reports/${period}`);
    const data = await res.json();
    if (data.success) {
      renderReportSummaries(period, data.report);
      renderReportTable(data.report.summary.bestSellingFoods);
      renderCharts(period, data.report);
    }
  } catch (err) {
    console.error('Failed to load reports:', err);
  }
}

function renderReportSummaries(period, report) {
  const cardsContainer = document.getElementById('report-summary-cards');
  
  if (period === 'daily') {
    cardsContainer.innerHTML = `
      <div class="metric-card accent-orange">
        <span class="metric-title">Today's Revenue</span>
        <span class="metric-value">₹${parseFloat(report.summary.revenue).toFixed(2)}</span>
      </div>
      <div class="metric-card">
        <span class="metric-title">Total Orders</span>
        <span class="metric-value">${report.summary.totalOrders}</span>
      </div>
      <div class="metric-card accent-green">
        <span class="metric-title">Completed Orders</span>
        <span class="metric-value">${report.summary.completed}</span>
      </div>
      <div class="metric-card accent-blue">
        <span class="metric-title">Cancelled Orders</span>
        <span class="metric-value" style="color:var(--danger);">${report.summary.cancelled}</span>
      </div>
    `;
  } else if (period === 'weekly') {
    cardsContainer.innerHTML = `
      <div class="metric-card accent-orange">
        <span class="metric-title">Weekly Revenue</span>
        <span class="metric-value">₹${parseFloat(report.summary.weeklyRevenue).toFixed(2)}</span>
      </div>
      <div class="metric-card">
        <span class="metric-title">Weekly Orders Count</span>
        <span class="metric-value">${report.summary.weeklyOrders}</span>
      </div>
      <div class="metric-card accent-green">
        <span class="metric-title">Daily Average Sales</span>
        <span class="metric-value">₹${(report.summary.weeklyRevenue / 7).toFixed(2)}</span>
      </div>
    `;
  } else if (period === 'monthly') {
    const revGrowthClass = report.summary.revenueGrowth >= 0 ? 'color:var(--success)' : 'color:var(--danger)';
    const ordGrowthClass = report.summary.ordersGrowth >= 0 ? 'color:var(--success)' : 'color:var(--danger)';

    cardsContainer.innerHTML = `
      <div class="metric-card accent-orange">
        <span class="metric-title">Monthly Revenue</span>
        <span class="metric-value">₹${parseFloat(report.summary.monthlyRevenue).toFixed(2)}</span>
        <span class="metric-sub" style="${revGrowthClass}">Growth: ${report.summary.revenueGrowth}% MoM</span>
      </div>
      <div class="metric-card">
        <span class="metric-title">Monthly Orders</span>
        <span class="metric-value">${report.summary.monthlyOrders}</span>
        <span class="metric-sub" style="${ordGrowthClass}">Growth: ${report.summary.ordersGrowth}% MoM</span>
      </div>
      <div class="metric-card accent-green">
        <span class="metric-title">Avg. Order Basket</span>
        <span class="metric-value">₹${report.summary.monthlyOrders > 0 ? (report.summary.monthlyRevenue / report.summary.monthlyOrders).toFixed(2) : '0.00'}</span>
      </div>
    `;
  }
}

function renderReportTable(foods) {
  const tbody = document.getElementById('report-foods-table-body');
  
  if (!foods || foods.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No sales data available.</td></tr>`;
    return;
  }

  tbody.innerHTML = foods.map(f => `
    <tr>
      <td style="font-weight:600;">${f.name}</td>
      <td><span class="badge badge-orange">${f.category}</span></td>
      <td>${f.total_quantity || f.qty}</td>
      <td style="font-family:var(--font-display);font-weight:600;">₹${parseFloat(f.total_revenue || (f.qty * 150)).toFixed(2)}</td>
    </tr>
  `).join('');
}

// Chart.js Drawing Configuration
function renderCharts(period, report) {
  // Destroy previous chart instances
  if (revenueChart) revenueChart.destroy();
  if (ordersChart) ordersChart.destroy();

  let labels = [];
  let revenueData = [];
  let ordersData = [];

  if (period === 'daily') {
    // Continuous hourly breakdown (12 PM to 9 PM)
    const hours = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
    labels = hours;
    revenueData = hours.map(h => {
      const match = report.dailyBreakdown.find(d => d.date_label === h);
      return match ? match.revenue : 0;
    });
    ordersData = hours.map(h => {
      const match = report.dailyBreakdown.find(d => d.date_label === h);
      return match ? match.order_count : 0;
    });
  } else {
    // Map dates from timeline
    labels = report.dailyBreakdown.map(d => {
      const parts = d.date_label.split('-');
      return `${parts[2]}/${parts[1]}`; // DD/MM format
    });
    revenueData = report.dailyBreakdown.map(d => d.revenue);
    ordersData = report.dailyBreakdown.map(d => d.order_count);
  }

  // Draw Revenue Chart
  const revCtx = document.getElementById('revenue-chart-canvas').getContext('2d');
  revenueChart = new Chart(revCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Sales Revenue (₹)',
        data: revenueData,
        borderColor: '#FF6B00',
        backgroundColor: 'rgba(255, 107, 0, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointBackgroundColor: '#FF6B00'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#b0b7c3' }
        },
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#b0b7c3' }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  // Draw Orders Chart
  const ordCtx = document.getElementById('orders-chart-canvas').getContext('2d');
  ordersChart = new Chart(ordCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Orders',
        data: ordersData,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#b0b7c3', stepSize: 1 }
        },
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#b0b7c3' }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}


// 3. NOTIFICATION LOGS SYSTEM AUDIT
async function fetchNotificationLogs() {
  try {
    const res = await fetch('/api/admin/notifications');
    const data = await res.json();
    if (data.success) {
      renderNotificationLogs(data.logs);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderNotificationLogs(logs) {
  const tbody = document.getElementById('notifications-table-body');
  
  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No notifications sent out yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const timestamp = new Date(l.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' });
    const isError = l.status.toLowerCase().includes('failed');
    const statusColor = isError ? 'color:var(--danger)' : 'color:var(--success)';
    
    return `
      <tr>
        <td style="font-size:0.8rem;white-space:nowrap;">${timestamp}</td>
        <td><strong style="font-size:0.8rem;">${l.type}</strong></td>
        <td><span class="badge ${l.channel === 'WhatsApp' ? 'badge-open' : 'badge-orange'}" style="${l.channel === 'WhatsApp' ? 'color:#25D366;border-color:rgba(37,211,102,0.2);background:rgba(37,211,102,0.05)' : ''}">${l.channel}</span></td>
        <td style="font-size:0.85rem;font-family:var(--font-display);">${l.recipient}</td>
        <td><div style="max-width:300px;font-size:0.85rem;white-space:pre-wrap;line-height:1.3;max-height:80px;overflow-y:auto;background:var(--bg-base);padding:8px;border:1px solid var(--border-color);border-radius:var(--border-radius-sm);">${l.content}</div></td>
        <td style="font-size:0.85rem;font-weight:600;${statusColor}">${l.status}</td>
      </tr>
    `;
  }).join('');
}


// 4. REAL-TIME EVENT STREAM (SSE OWNER LISTENER)
function setupOwnerEventListener() {
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource('/api/events');

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle Incoming New Order
      if (data.type === 'new-order' && data.order) {
        // Play Alarm Sound
        playNewOrderAlarm();

        // Show Desktop Notification
        triggerBrowserNotice(`New Order #${data.order.order_id}`, `Received order from ${data.order.customer_name} for ₹${data.order.total_price.toFixed(2)}`);

        // Refresh view states
        if (activeView === 'dashboard') {
          fetchStats();
          fetchOrders();
        } else if (activeView === 'notifications') {
          fetchNotificationLogs();
        }
      }

      // Handle Order Update
      if (data.type === 'order-updated') {
        if (activeView === 'dashboard') {
          fetchStats();
          fetchOrders();
        }
      }
    } catch (err) {
      console.error('SSE JSON error:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.error('SSE Connection broken. Reconnecting...', err);
  };
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function triggerBrowserNotice(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '/favicon.ico'
    });
  }
}


// Start Up
switchView('dashboard');
setupOwnerEventListener();
requestNotificationPermission();

// Reject reason modal cancel click
document.getElementById('reject-modal-cancel-btn').addEventListener('click', () => {
  document.getElementById('reject-reason-modal').style.display = 'none';
});

// Reject reason form submission
document.getElementById('reject-reason-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const reason = document.getElementById('reject-reason-input').value;
  if (!reason.trim()) return;

  try {
    const res = await fetch(`/api/admin/orders/${rejectOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Cancelled', reason: reason })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('reject-reason-modal').style.display = 'none';
      fetchStats();
      fetchOrders();
    } else {
      alert(`Error rejecting order: ${data.message}`);
    }
  } catch (err) {
    console.error(err);
  }
});

let rejectOrderId = null;
window.openRejectReasonModal = function(orderId) {
  rejectOrderId = orderId;
  const modal = document.getElementById('reject-reason-modal');
  document.getElementById('reject-reason-input').value = '';
  modal.style.display = 'flex';
};

// Menu Management logic
let adminMenuData = [];
async function fetchAdminMenu() {
  try {
    const res = await fetch('/api/menu');
    const data = await res.json();
    if (data.success) {
      adminMenuData = data.menu;
      renderAdminMenuTable();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderAdminMenuTable() {
  const tbody = document.getElementById('admin-menu-table-body');
  if (adminMenuData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);">No items in menu.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminMenuData.map(item => {
    const isOutOfStock = item.description && item.description.includes('[OUT_OF_STOCK]');
    const isHidden = item.description && item.description.includes('[HIDDEN]');
    
    const displayDesc = item.description 
      ? item.description.replace('[OUT_OF_STOCK]', '').replace('[HIDDEN]', '').trim() 
      : '';

    const stockBadge = isOutOfStock 
      ? `<span class="badge-stock out-of-stock">Out of Stock</span>` 
      : `<span class="badge-stock available">Available</span>`;
      
    const visibilityBadge = isHidden 
      ? `<span class="badge-visibility hidden">Hidden</span>` 
      : `<span class="badge-visibility visible">Visible</span>`;

    const stockActionText = isOutOfStock ? 'Mark Available' : 'Mark Out of Stock';
    const visibilityActionText = isHidden ? 'Show Item' : 'Hide Item';

    return `
      <tr>
        <td>
          <img class="menu-item-thumb" src="${item.image || '/assets/veg_noodles.svg'}" onerror="this.onerror=null; this.src='/assets/veg_noodles.svg';">
        </td>
        <td>
          <strong style="color: var(--text-primary);">${item.name}</strong>
          <div style="font-size:0.8rem; color:var(--text-muted); max-width:250px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${displayDesc}</div>
        </td>
        <td><span class="status-badge status-preparing" style="background:rgba(59,130,246,0.15);">${item.category}</span></td>
        <td style="font-family:var(--font-display); font-weight:700;">₹${item.price.toFixed(2)}</td>
        <td>${stockBadge}</td>
        <td>${visibilityBadge}</td>
        <td>
          <button class="action-link" onclick="openEditMenuModal(${item.id})">✏ Edit</button>
          <button class="action-link" onclick="toggleStockStatus(${item.id})">📦 ${stockActionText}</button>
          <button class="action-link" onclick="toggleVisibilityStatus(${item.id})">👁 ${visibilityActionText}</button>
          <button class="action-link delete-link" onclick="deleteMenuItem(${item.id})">🗑 Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

const menuModal = document.getElementById('menu-item-modal');
const menuForm = document.getElementById('menu-item-form');
const menuModalTitle = document.getElementById('menu-modal-title');
const menuUploadStatus = document.getElementById('menu-item-upload-status');
const menuPreviewImg = document.getElementById('menu-item-img-preview');
const fileInput = document.getElementById('menu-item-file-input');

document.getElementById('admin-add-item-btn').addEventListener('click', () => {
  menuForm.reset();
  document.getElementById('menu-item-id').value = '';
  menuModalTitle.textContent = 'Add Menu Item';
  menuPreviewImg.style.display = 'none';
  menuUploadStatus.textContent = '';
  menuModal.style.display = 'flex';
});

document.getElementById('menu-modal-cancel-btn').addEventListener('click', () => {
  menuModal.style.display = 'none';
});

document.getElementById('menu-item-upload-trigger').addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  menuUploadStatus.textContent = 'Uploading...';
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const res = await fetch('/api/admin/menu/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, data: reader.result })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('menu-item-img-url').value = data.url;
        menuPreviewImg.src = data.url;
        menuPreviewImg.style.display = 'block';
        menuUploadStatus.textContent = 'Upload complete!';
      } else {
        menuUploadStatus.textContent = 'Upload failed.';
      }
    } catch (err) {
      console.error(err);
      menuUploadStatus.textContent = 'Upload error.';
    }
  };
  reader.readAsDataURL(file);
});

window.openEditMenuModal = function(id) {
  const item = adminMenuData.find(i => i.id === id);
  if (!item) return;

  document.getElementById('menu-item-id').value = item.id;
  document.getElementById('menu-item-name').value = item.name;
  document.getElementById('menu-item-category').value = item.category;
  document.getElementById('menu-item-price').value = item.price;
  
  const cleanDesc = item.description 
    ? item.description.replace('[OUT_OF_STOCK]', '').replace('[HIDDEN]', '').trim() 
    : '';
  document.getElementById('menu-item-desc').value = cleanDesc;
  
  document.getElementById('menu-item-img-url').value = item.image || '';
  if (item.image) {
    menuPreviewImg.src = item.image;
    menuPreviewImg.style.display = 'block';
  } else {
    menuPreviewImg.style.display = 'none';
  }
  menuUploadStatus.textContent = '';
  menuModalTitle.textContent = 'Edit Menu Item';
  menuModal.style.display = 'flex';
};

menuForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('menu-item-id').value;
  const name = document.getElementById('menu-item-name').value;
  const category = document.getElementById('menu-item-category').value;
  const price = parseFloat(document.getElementById('menu-item-price').value);
  const cleanDesc = document.getElementById('menu-item-desc').value;
  const image = document.getElementById('menu-item-img-url').value;

  let finalDesc = cleanDesc;
  if (id) {
    const oldItem = adminMenuData.find(i => i.id == id);
    if (oldItem && oldItem.description) {
      if (oldItem.description.includes('[OUT_OF_STOCK]')) {
        finalDesc += ' [OUT_OF_STOCK]';
      }
      if (oldItem.description.includes('[HIDDEN]')) {
        finalDesc += ' [HIDDEN]';
      }
    }
  }

  const url = id ? `/api/admin/menu/${id}` : '/api/admin/menu';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, price, description: finalDesc, image })
    });
    const data = await res.json();
    if (data.success) {
      menuModal.style.display = 'none';
      fetchAdminMenu();
    } else {
      alert(`Save failed: ${data.message}`);
    }
  } catch (err) {
    console.error(err);
  }
});

window.toggleStockStatus = async function(id) {
  const item = adminMenuData.find(i => i.id === id);
  if (!item) return;

  const desc = item.description || '';
  const isOutOfStock = desc.includes('[OUT_OF_STOCK]');
  let newDesc = desc;

  if (isOutOfStock) {
    newDesc = desc.replace('[OUT_OF_STOCK]', '').trim();
  } else {
    newDesc = (desc + ' [OUT_OF_STOCK]').trim();
  }

  try {
    const res = await fetch(`/api/admin/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: item.name,
        category: item.category,
        price: item.price,
        description: newDesc,
        image: item.image
      })
    });
    if ((await res.json()).success) {
      fetchAdminMenu();
    }
  } catch (err) {
    console.error(err);
  }
};

window.toggleVisibilityStatus = async function(id) {
  const item = adminMenuData.find(i => i.id === id);
  if (!item) return;

  const desc = item.description || '';
  const isHidden = desc.includes('[HIDDEN]');
  let newDesc = desc;

  if (isHidden) {
    newDesc = desc.replace('[HIDDEN]', '').trim();
  } else {
    newDesc = (desc + ' [HIDDEN]').trim();
  }

  try {
    const res = await fetch(`/api/admin/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: item.name,
        category: item.category,
        price: item.price,
        description: newDesc,
        image: item.image
      })
    });
    if ((await res.json()).success) {
      fetchAdminMenu();
    }
  } catch (err) {
    console.error(err);
  }
};

window.deleteMenuItem = async function(id) {
  if (!confirm('Are you sure you want to delete this menu item?')) return;

  try {
    const res = await fetch(`/api/admin/menu/${id}`, {
      method: 'DELETE'
    });
    if ((await res.json()).success) {
      fetchAdminMenu();
    }
  } catch (err) {
    console.error(err);
  }
};

// Customer Feedback Dashboard logic
async function fetchFeedbackStats() {
  try {
    const res = await fetch('/api/admin/feedback/stats');
    const data = await res.json();
    if (data.success) {
      renderFeedbackUI(data.stats);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderFeedbackUI(stats) {
  document.getElementById('feedback-avg-rating').textContent = stats.averageRating.toFixed(1);
  document.getElementById('feedback-total-reviews').textContent = stats.totalReviews;

  const lovedItemContainer = document.getElementById('feedback-loved-item');
  if (stats.mostLovedItems && stats.mostLovedItems.length > 0) {
    lovedItemContainer.textContent = `${stats.mostLovedItems[0].name} (${stats.mostLovedItems[0].qty} ratings)`;
  } else {
    lovedItemContainer.textContent = 'N/A';
  }

  document.getElementById('complaint-taste-count').textContent = stats.complaints.taste;
  document.getElementById('complaint-service-count').textContent = stats.complaints.service;
  document.getElementById('complaint-quality-count').textContent = stats.complaints.quality;

  const tbody = document.getElementById('feedback-reviews-table-body');
  if (!stats.latestReviews || stats.latestReviews.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No reviews submitted yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = stats.latestReviews.map(r => {
    const dateStr = new Date(r.created_at).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' });
    const customer = r.customer_name ? `${r.customer_name} (${r.phone_number})` : `Order #${r.order_id}`;
    const starsHtml = '<span class="review-stars">' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</span>';
    
    let tagsHtml = '';
    if (r.taste) tagsHtml += `<span class="review-tag">😋 Taste</span>`;
    if (r.service) tagsHtml += `<span class="review-tag">⚡ Service</span>`;
    if (r.quality) tagsHtml += `<span class="review-tag">🍜 Quality</span>`;
    if (!tagsHtml) tagsHtml = `<span class="review-tag" style="color:var(--text-muted);">None</span>`;

    return `
      <tr>
        <td style="font-size:0.8rem; white-space:nowrap;">${dateStr}</td>
        <td><strong style="color:var(--text-primary); font-size:0.85rem;">${customer}</strong></td>
        <td>${starsHtml}</td>
        <td>${tagsHtml}</td>
        <td><span class="review-comment">${r.comment || 'No comment.'}</span></td>
      </tr>
    `;
  }).join('');
}
