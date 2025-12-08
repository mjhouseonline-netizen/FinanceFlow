// FinanceFlow Main JavaScript
class FinanceFlow {
  constructor() {
    this.expenses = [
      { id: 1, amount: 52.99, description: 'Adobe Creative Suite', category: 'Software', date: '2025-12-05', client: 'Personal', taxDeductible: true },
      { id: 2, amount: 28.50, description: 'Client Lunch - Starbucks', category: 'Meals', date: '2025-12-04', client: 'Acme Corp', taxDeductible: true },
      { id: 3, amount: 89.99, description: 'Office Supplies', category: 'Equipment', date: '2025-12-03', client: 'Personal', taxDeductible: true },
      { id: 4, amount: 150.00, description: 'Software License', category: 'Software', date: '2025-12-02', client: 'Personal', taxDeductible: true },
      { id: 5, amount: 75.50, description: 'Business Dinner', category: 'Meals', date: '2025-12-01', client: 'Tech Startup', taxDeductible: true }
    ];
    this.clients = [
      { id: 1, name: 'Acme Corp', email: 'contact@acme.com', revenue: 15000, balance: 2500 },
      { id: 2, name: 'Tech Startup', email: 'hello@techstartup.com', revenue: 8500, balance: 1200 },
      { id: 3, name: 'Creative Agency', email: 'projects@creative.com', revenue: 12000, balance: 0 }
    ];
    this.budgets = { software: { allocated: 1500, spent: 1240 }, travel: { allocated: 1200, spent: 890 }, marketing: { allocated: 500, spent: 650 }, equipment: { allocated: 800, spent: 450 } };
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeAnimations();
    this.initializeCharts();
    this.setupScrollReveal();
    this.startTypewriterEffect();
    this.fetchDashboard();          // load real Stripe numbers
  }

  /* ----------  DASHBOARD FETCH  ---------- */
  async fetchDashboard() {
    try {
      const res = await fetch('https://financeflow-api.onrender.com/api/dashboard');
      const data = await res.json();
      const el = id => document.getElementById(id);
      if (el('totalRevenue')) el('totalRevenue').textContent = `$${data.revenue.toLocaleString()}`;
      if (el('activeSubs')) el('activeSubs').textContent = data.subscriptions;
      if (el('outstanding')) el('outstanding').textContent = `$${data.outstanding.toLocaleString()}`;
      if (el('budgetUsed')) el('budgetUsed').textContent = `${data.budgetPercent}%`;
      if (el('taxDeductible')) el('taxDeductible').textContent = `$${data.taxDeductible.toLocaleString()}`;
    } catch (e) {
      console.warn('Dashboard fetch failed', e);
      // keeps static fallback numbers
    }
  }

  /* ----------  EVENTS  ---------- */
  setupEventListeners() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());

    document.querySelectorAll('.quick-action-btn').forEach(btn =>
      btn.addEventListener('click', e => this.handleQuickAction(e))
    );

    // "Add Expense" button (valid selector)
    const addExpenseBtn = Array.from(document.querySelectorAll('button'))
                               .find(btn => btn.textContent.includes('Add Expense'));
    if (addExpenseBtn) addExpenseBtn.addEventListener('click', () => this.showAddExpenseModal());

    // NEW: Stripe Checkout button
    const upgradeBtn = document.getElementById('upgradeBtn');
    if (upgradeBtn) upgradeBtn.addEventListener('click', () => this.startCheckout(process.env.STRIPE_PRICE_ID || 'price_1XXXXXXXXXX'));

    document.querySelectorAll('.ai-suggestion-btn').forEach(btn =>
      btn.addEventListener('click', e => this.handleAISuggestion(e))
    );

    document.querySelectorAll('.chart-period-btn').forEach(btn =>
      btn.addEventListener('click', e => this.changeChartPeriod(e))
    );
  }

  /* ----------  STRIPE CHECKOUT  ---------- */
  async startCheckout(priceId) {
    try {
      const res = await fetch('https://financeflow-api.onrender.com/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      });
      const { url } = await res.json();
      window.location = url; // redirect to Stripe Checkout
    } catch (e) {
      console.error('Checkout error', e);
      alert('Could not start checkout');
    }
  }

  /* ----------  ANIMATIONS  ---------- */
  initializeAnimations() {
    anime({ targets: '.floating-element', translateY: [-10, 10], duration: 3000, easing: 'easeInOutSine', direction: 'alternate', loop: true, delay: anime.stagger(200) });
    anime({ targets: '.metric-card', scale: [0.9, 1], opacity: [0, 1], duration: 800, easing: 'easeOutElastic(1, .8)', delay: anime.stagger(100, { start: 200 }) });
    this.animateProgressBars();
  }
  animateProgressBars() {
    document.querySelectorAll('.progress-bar').forEach(bar => {
      const width = bar.style.width || bar.dataset.width || '0%';
      anime({ targets: bar, width: width, duration: 1500, easing: 'easeOutQuart', delay: 500 });
    });
  }

  /* ----------  CHARTS  ---------- */
  initializeCharts() {
    this.createExpenseChart();
    this.createBudgetChart();
    this.createRevenueChart();
  }
  createExpenseChart() {
    const el = document.getElementById('expenseChart');
    if (!el) return;
    const chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,.95)', borderColor: '#7C3AED', textStyle: { color: '#374151' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['Dec 1', 'Dec 2', 'Dec 3', 'Dec 4', 'Dec 5', 'Dec 6', 'Dec 7'], axisLine: { lineStyle: { color: '#E5E7EB' } }, axisLabel: { color: '#6B7280' } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: '#E5E7EB' } }, axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#F3F4F6' } } },
      series: [
        { name: 'Expenses', type: 'line', smooth: true, data: [120, 200, 150, 80, 70, 110, 130], lineStyle: { color: '#7C3AED', width: 3 }, itemStyle: { color: '#7C3AED' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(124,58,237,.3)' }, { offset: 1, color: 'rgba(124,58,237,.05)' }] } } },
        { name: 'Tax Deductible', type: 'line', smooth: true, data: [100, 180, 130, 70, 60, 95, 115], lineStyle: { color: '#10B981', width: 2 }, itemStyle: { color: '#10B981' } }
      ]
    });
    setTimeout(() => chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: 6 }), 1000);
    window.addEventListener('resize', () => chart.resize());
  }
  createBudgetChart() {
    const el = document.getElementById('budgetChart');
    if (!el) return;
    const chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{a}<br/>{b}: ${c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', textStyle: { color: '#6B7280' } },
      series: [{ name: 'Budget Allocation', type: 'pie', radius: ['40%', '70%'], center: ['60%', '50%'], itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 }, label: { show: false, position: 'center' }, emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold' } }, labelLine: { show: false }, data: [{ value: 1500, name: 'Software', itemStyle: { color: '#7C3AED' } }, { value: 1200, name: 'Travel', itemStyle: { color: '#A78BFA' } }, { value: 500, name: 'Marketing', itemStyle: { color: '#10B981' } }, { value: 800, name: 'Equipment', itemStyle: { color: '#F59E0B' } }] }]
    });
    window.addEventListener('resize', () => chart.resize());
  }
  createRevenueChart() {
    const el = document.getElementById('revenueChart');
    if (!el) return;
    const chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', axisLine: { lineStyle: { color: '#E5E7EB' } }, axisLabel: { color: '#6B7280' } },
      yAxis: { type: 'category', data: ['Creative Agency', 'Tech Startup', 'Acme Corp'], axisLine: { lineStyle: { color: '#E5E7EB' } }, axisLabel: { color: '#6B7280' } },
      series: [{ name: 'Revenue', type: 'bar', data: [12000, 8500, 15000], itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#7C3AED' }, { offset: 1, color: '#A78BFA' }] }, borderRadius: [0, 4, 4, 0] } }]
    });
    window.addEventListener('resize', () => chart.resize());
  }

  /* ----------  REVEAL / TYPEWRITER  ---------- */
  setupScrollReveal() {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
  }
  startTypewriterEffect() {
    document.querySelectorAll('.typewriter').forEach((el, i) => setTimeout(() => this.typeWriter(el), i * 2000));
  }
  typeWriter(element) {
    const text = element.textContent;
    element.textContent = '';
    element.style.borderRight = '2px solid #7C3AED';
    let i = 0;
    const intv = setInterval(() => {
      if (i < text.length) element.textContent += text.charAt(i++);
      else { clearInterval(intv); setTimeout(() => element.style.borderRight = 'none', 1000); }
    }, 50);
  }

  /* ----------  QUICK ACTIONS  ---------- */
  handleQuickAction(e) {
    const action = e.currentTarget.dataset.action;
    switch (action) {
      case 'add-expense': this.showAddExpenseModal(); break;
      case 'view-reports': window.location.href = 'reports.html'; break;
    }
  }

  /* ----------  MODAL & EXPENSE  ---------- */
  showAddExpenseModal() {
    const modal = this.createModal('Add New Expense', this.getExpenseFormHTML());
    document.body.appendChild(modal);
    anime({ targets: modal, opacity: [0, 1], scale: [0.8, 1], duration: 300, easing: 'easeOutQuart' });
    this.setupExpenseFormHandlers(modal);
  }
  getExpenseFormHTML() {
    return `
      <form class="space-y-4">
        <div><label class="block text-sm font-medium text-gray-700 mb-2">Amount</label><input type="number" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="0.00"></div>
        <div><label class="block text-sm font-medium text-gray-700 mb-2">Description</label><input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="What was this expense for?"></div>
        <div><label class="block text-sm font-medium text-gray-700 mb-2">Category</label><select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"><option>Software</option><option>Equipment</option><option>Travel</option><option>Meals</option><option>Marketing</option><option>Other</option></select></div>
        <div><label class="block text-sm font-medium text-gray-700 mb-2">Client (Optional)</label><select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"><option>Personal</option><option>Acme Corp</option><option>Tech Startup</option><option>Creative Agency</option></select></div>
        <div class="flex items-center"><input type="checkbox" id="taxDeductible" class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"><label for="taxDeductible" class="ml-2 text-sm text-gray-700">Tax deductible expense</label></div>
        <div class="flex space-x-3 pt-4"><button type="submit" class="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">Add Expense</button><button type="button" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors cancel-btn">Cancel</button></div>
      </form>`;
  }
  setupExpenseFormHandlers(modal) {
    const form = modal.querySelector('form');
    const cancelBtn = modal.querySelector('.cancel-btn');
    form.addEventListener('submit', e => { e.preventDefault(); this.handleExpenseSubmit(form, modal); });
    cancelBtn.addEventListener('click', () => this.closeModal(modal));
    modal.addEventListener('click', e => { if (e.target === modal) this.closeModal(modal); });
  }
  handleExpenseSubmit(form, modal) {
    const expense = {
      id: this.expenses.length + 1,
      amount: parseFloat(form.querySelector('input[type="number"]').value),
      description: form.querySelector('input[type="text"]').value,
      category: form.querySelector('select').value,
      client: form.querySelectorAll('select')[1].value,
      date: new Date().toISOString().split('T')[0],
      taxDeductible: form.querySelector('input[type="checkbox"]').checked
    };
    this.expenses.unshift(expense);
    this.showSuccessMessage('Expense added successfully!');
    this.closeModal(modal);
    this.refreshExpenseDisplay();
  }
  createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.style.opacity = '0';
    modal.innerHTML = `
      <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-gray-900">${title}</h3>
          <button class="text-gray-400 hover:text-gray-600 close-btn"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
        ${content}
      </div>`;
    modal.querySelector('.close-btn').addEventListener('click', () => this.closeModal(modal));
    return modal;
  }
  closeModal(modal) {
    anime({ targets: modal, opacity: [1, 0], scale: [1, 0.8], duration: 200, easing: 'easeInQuart', complete: () => modal.remove() });
  }
  showSuccessMessage(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = msg; toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)';
    document.body.appendChild(toast);
    anime({ targets: toast, opacity: [0, 1], translateX: ['100%', '0%'], duration: 300, easing: 'easeOutQuart', complete: () => {
      setTimeout(() => anime({ targets: toast, opacity: [1, 0], translateX: ['0%', '100%'], duration: 300, easing: 'easeInQuart', complete: () => toast.remove() }), 3000);
    }});
  }
  refreshExpenseDisplay() {
    if (window.location.pathname.includes('expenses.html')) this.updateExpensesList();
  }
  updateExpensesList() {
    const container = document.getElementById('expensesList');
    if (container) this.renderExpensesList(container);
  }
  renderExpensesList(container) {
    container.innerHTML = '';
    this.expenses.forEach(expense => container.appendChild(this.createExpenseElement(expense)));
    anime({ targets: container.children, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: 'easeOutQuart', delay: anime.stagger(100) });
  }
  createExpenseElement(expense) {
    const catColors = { Software: 'bg-purple-100 text-purple-600', Equipment: 'bg-blue-100 text-blue-600', Travel: 'bg-green-100 text-green-600', Meals: 'bg-amber-100 text-amber-600', Marketing: 'bg-pink-100 text-pink-600', Other: 'bg-gray-100 text-gray-600' };
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-lg';
    div.innerHTML = `
      <div class="flex items-center">
        <div class="w-10 h-10 ${catColors[expense.category] || catColors.Other} rounded-lg flex items-center justify-center mr-3"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"></path></svg></div>
        <div><p class="font-medium text-gray-900">${expense.description}</p><p class="text-sm text-gray-500">${expense.category} • ${expense.date}</p></div>
      </