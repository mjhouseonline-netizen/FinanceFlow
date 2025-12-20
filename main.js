const API_BASE = 'https://financeflow-api-4mua.onrender.com';

const PRICE_MAP = {
  starter: 'price_1SbZFqFj4r8OeJwWBlvD7LFZ',
  professional: 'price_1SbZHFFj4r8OeJwWnKSUaDiu',
  enterprise: 'price_1SbZHlFj4r8OeJwWRWXPpTUu'
};

class FinanceFlow {
  constructor() {
    // Demo data used if API fails
    this.demoDashboard = {
      revenue: 47250,
      subscriptions: 328,
      outstanding: 12300,
      budgetPercent: 68,
      taxDeductible: 8940
    };

    this.expenses = [
      { id: 1, amount: 52.99, description: 'Adobe Creative Cloud', date: '2025-12-05', client: 'Personal', taxDeductible: true },
      { id: 2, amount: 28.50, description: 'Client coffee meeting', date: '2025-12-04', client: 'Acme Corp', taxDeductible: true },
      { id: 3, amount: 89.99, description: 'Office supplies', date: '2025-12-03', client: 'Personal', taxDeductible: true },
      { id: 4, amount: 150.00, description: 'Software license', date: '2025-12-02', client: 'Personal', taxDeductible: true },
      { id: 5, amount: 75.50, description: 'Business dinner', date: '2025-12-01', client: 'Tech Startup', taxDeductible: true }
    ];

    this.clients = [
      { id: 1, name: 'Acme Corp', email: 'contact@acme.com', revenue: 15000, balance: 2500 },
      { id: 2, name: 'Tech Startup', email: 'hello@techstartup.com', revenue: 8500, balance: 1200 },
      { id: 3, name: 'Creative Agency', email: 'projects@creative.com', revenue: 12000, balance: 0 }
    ];

    this.budgets = {
      software: { allocated: 1500, spent: 1240 },
      marketing: { allocated: 1000, spent: 750 },
      travel: { allocated: 500, spent: 320 },
      equipment: { allocated: 800, spent: 450 }
    };

    this.init();
  }

  // -----------------------------------------
  // INITIALISATION
  // -----------------------------------------
  init() {
    this.setupBasicUI();
    this.initializeAnimations();
    this.initializeCharts();
    this.setupScrollReveal();
    this.setupPlanButtons();
    this.fetchDashboard();
    this.checkWebhookHealth();
  }

  setupBasicUI() {
    const mobileToggle = document.getElementById('mobileNavToggle');
    const mobileMenu = document.getElementById('mobileNav');

    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }
  }

  // -----------------------------------------
  // ANIMATIONS / REVEAL
  // -----------------------------------------
  initializeAnimations() {
    if (typeof anime === 'undefined') return;

    const cards = document.querySelectorAll('.reveal');
    if (!cards.length) return;

    anime({
      targets: cards,
      opacity: [0, 1],
      translateY: [16, 0],
      delay: anime.stagger(80),
      duration: 600,
      easing: 'easeOutQuad'
    });
  }

  setupScrollReveal() {
    const els = document.querySelectorAll('.reveal-on-scroll');
    if (!els.length || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    els.forEach(el => observer.observe(el));
  }

  // -----------------------------------------
  // CHARTS (safe no-op if elements missing)
  // -----------------------------------------
  initializeCharts() {
    if (typeof echarts === 'undefined') return;

    const spendEl = document.getElementById('spendChart');
    if (!spendEl) return;

    const chart = echarts.init(spendEl);
    const option = {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: [320, 280, 360, 410, 380, 450, 390],
          smooth: true
        }
      ]
    };

    chart.setOption(option);
  }

  // -----------------------------------------
  // DASHBOARD DATA (API + fallback)
  // -----------------------------------------
    async fetchDashboard() {
    try {
      const res = await Auth.get('/api/dashboard');

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      this.applyDashboardData(data);
    } catch (err) {
      console.warn('Dashboard fetch failed, using demo data instead:', err);
      this.useDemoDashboard();
    }
  }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      this.applyDashboardData(data);
    } catch (err) {
      console.warn('Dashboard fetch failed, using demo data instead:', err);
      this.useDemoDashboard();
    }
  }

  applyDashboardData(data) {
    const byId = id => document.getElementById(id);

    const revenueEl = byId('totalRevenue');
    const outstandingEl = byId('outstanding');
    const budgetEl = byId('budgetUsed');
    const taxEl = byId('taxDeductible');
    const subsEl = byId('activeSubs');

    if (revenueEl && typeof data.revenue === 'number') {
      revenueEl.textContent = `$${data.revenue.toLocaleString()}`;
    }

    if (outstandingEl && typeof data.outstanding === 'number') {
      outstandingEl.textContent = `$${data.outstanding.toLocaleString()}`;
    }

    if (budgetEl && typeof data.budgetPercent === 'number') {
      budgetEl.textContent = `${data.budgetPercent}%`;
    }

    if (taxEl && typeof data.taxDeductible === 'number') {
      taxEl.textContent = `$${data.taxDeductible.toLocaleString()}`;
    }

    if (subsEl && typeof data.subscriptions === 'number') {
      subsEl.textContent = data.subscriptions.toString();
    }
  }

  useDemoDashboard() {
    this.applyDashboardData(this.demoDashboard);
  }

  // -----------------------------------------
  // BACKEND HEALTH CHECK (optional)
  // -----------------------------------------
    async checkWebhookHealth() {
    try {
      const res = await Auth.get('/api/health');
      if (!res.ok) return;

      const data = await res.json();
      console.log('API health:', data);
    } catch (err) {
      console.warn('Health check failed:', err);
    }
  }

  // -----------------------------------------
 // STRIPE PLAN BUTTONS & CHECKOUT
// -----------------------------------------
setupPlanButtons() {
  // Buttons with data-plan attributes
  const planButtons = document.querySelectorAll('[data-plan]');

  planButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const planType = btn.dataset.plan;
      if (!planType) return;

      // 1) Visually highlight the selected button
      planButtons.forEach(b => {
        b.classList.remove(
          'ring-2',
          'ring-purple-500',
          'bg-purple-50',
          'text-purple-700',
          'scale-105'
        );
      });

      btn.classList.add(
        'ring-2',
        'ring-purple-500',
        'bg-purple-50',
        'text-purple-700',
        'scale-105'
      );

      // 2) Trigger checkout
      async startCheckout(planType) {
  try {
    const priceId = PRICE_MAP[planType];
    if (!priceId) {
      alert(`Unknown plan: ${planType}. Check PRICE_MAP in main.js.`);
      return;
    }

    const response = await Auth.post('/api/create-checkout-session', { priceId });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Checkout HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    if (data && data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'No checkout URL returned from server');
    }
  } catch (e) {
    console.error('Checkout error:', e);
    alert('Could not start checkout: ' + e.message);
  }
}

  // Optional: ?plan=professional in URL
  const urlParams = new URLSearchParams(window.location.search);
  const planFromUrl = urlParams.get('plan');
  if (planFromUrl && PRICE_MAP[planFromUrl]) {
    console.log('Plan from URL:', planFromUrl);
  }
}

async startCheckout(planType) {
  try {
    const priceId = PRICE_MAP[planType];
    if (!priceId) {
      alert(`Unknown plan: ${planType}. Check PRICE_MAP in main.js.`);
      return;
    }

    const response = await fetch(`${API_BASE}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ priceId })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Checkout HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    if (data && data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'No checkout URL returned from server');
    }
  } catch (e) {
    console.error('Checkout error:', e);
    alert('Could not start checkout: ' + e.message);
  }
}

  // -----------------------------------------
  // SIMPLE TOAST NOTIFICATIONS (optional)
  // -----------------------------------------
  showNotification(message, type = 'info') {
    const containerId = 'fflow-toast-container';
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = 'fixed top-4 right-4 space-y-3 z-50';
      document.body.appendChild(container);
    }

    const note = document.createElement('div');
    const baseClasses = 'px-4 py-3 rounded-xl shadow-lg text-sm flex items-center gap-3 transform transition-all duration-300 translate-x-full';
    const typeClass =
      type === 'success'
        ? 'bg-green-50 text-green-800 border border-green-200'
        : type === 'error'
        ? 'bg-red-50 text-red-800 border border-red-200'
        : 'bg-purple-50 text-purple-800 border border-purple-200';

    note.className = `${baseClasses} ${typeClass}`;
    note.textContent = message;
    container.appendChild(note);

    requestAnimationFrame(() => {
      note.classList.remove('translate-x-full');
    });

    setTimeout(() => {
      note.classList.add('translate-x-full');
      setTimeout(() => note.remove(), 300);
    }, 3000);
  }
}

// -----------------------------------------
// BOOTSTRAP
// -----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  window.financeFlow = new FinanceFlow();
});

// Export for CommonJS (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinanceFlow;
}
