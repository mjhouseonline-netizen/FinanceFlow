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

        this.budgets = {
            software: { allocated: 1500, spent: 1240 },
            travel: { allocated: 1200, spent: 890 },
            marketing: { allocated: 500, spent: 650 },
            equipment: { allocated: 800, spent: 450 }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeAnimations();
        this.initializeCharts();
        this.setupScrollReveal();
        this.startTypewriterEffect();
    }

    setupEventListeners() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', this.toggleMobileMenu.bind(this));
        }

        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', this.handleQuickAction.bind(this));
        });

        // VALID replacement for :contains
        const addExpenseBtn = Array.from(document.querySelectorAll('button'))
                                   .find(btn => btn.textContent.includes('Add Expense'));
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', this.showAddExpenseModal.bind(this));
        }

        document.querySelectorAll('.ai-suggestion-btn').forEach(btn => {
            btn.addEventListener('click', this.handleAISuggestion.bind(this));
        });

        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.addEventListener('click', this.changeChartPeriod.bind(this));
        });
    }

    /*  ----  all your existing methods ----  */
    initializeAnimations() { /* ... */ }
    animateProgressBars() { /* ... */ }
    initializeCharts() { /* ... */ }
    createExpenseChart() { /* ... */ }
    createBudgetChart() { /* ... */ }
    createRevenueChart() { /* ... */ }
    setupScrollReveal() { /* ... */ }
    startTypewriterEffect() { /* ... */ }
    typeWriter(element) { /* ... */ }
    handleQuickAction(event) { /* ... */ }
    showAddExpenseModal() { /* ... */ }
    getExpenseFormHTML() { /* ... */ }
    setupExpenseFormHandlers(modal) { /* ... */ }
    handleExpenseSubmit(form, modal) { /* ... */ }
    createModal(title, content) { /* ... */ }
    closeModal(modal) { /* ... */ }
    showSuccessMessage(message) { /* ... */ }
    refreshExpenseDisplay() { /* ... */ }
    updateExpensesList() { /* ... */ }
    renderExpensesList(container) { /* ... */ }
    createExpenseElement(expense) { /* ... */ }
    handleAISuggestion(event) { /* ... */ }
    processAIQuery(query) { /* ... */ }
    generateAIResponse(query) { /* ... */ }
    displayAIResponse(response) { /* ... */ }
    changeChartPeriod(event) { /* ... */ }
    updateChartData(period) { /* ... */ }
    formatCurrency(amount) { /* ... */ }
    formatDate(date) { /* ... */ }
    toggleMobileMenu() { /* ... */ }

    /*  ----  settings-page methods (kept inside class) ----  */
    initializeSettingsPage() {
        this.setupSettingsAnimations();
        this.setupProfileFormHandlers();
        this.setupPreferenceHandlers();
    }
    setupSettingsAnimations() {
        const settingsCards = document.querySelectorAll('.glass-effect');
        if (settingsCards.length > 0) {
            anime({
                targets: settingsCards,
                opacity: [0, 1],
                translateY: [30, 0],
                duration: 800,
                delay: anime.stagger(200),
                easing: 'easeOutExpo'
            });
        }
    }
    setupProfileFormHandlers() {
        const profileForm = document.querySelector('form');
        if (profileForm) {
            const updateBtn = profileForm.querySelector('button[type="submit"]');
            if (updateBtn) {
                updateBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleProfileUpdate();
                });
            }
        }
    }
    setupPreferenceHandlers() {
        const toggles = document.querySelectorAll('input[type="checkbox"]');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.handlePreferenceChange(e.target);
            });
        });
    }
    handleProfileUpdate() {
        const updateBtn = event.target;
        const originalText = updateBtn.textContent;
        updateBtn.classList.add('loading');
        updateBtn.textContent = 'Updating...';
        setTimeout(() => {
            this.showSettingsNotification('Profile updated successfully!', 'success');
            updateBtn.classList.remove('loading');
            updateBtn.textContent = originalText;
        }, 1500);
    }
    handlePreferenceChange(toggle) {
        const preference = toggle.closest('.flex');
        const label = preference.querySelector('h3').textContent;
        const isEnabled = toggle.checked;
        this.showSettingsNotification(`${label} ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
        setTimeout(() => console.log(`Preference ${label} set to ${isEnabled}`), 500);
    }
    showSettingsNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.remove('translate-x-full'), 100);
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}   // closes FinanceFlow class

// Initialize FinanceFlow when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.financeFlow = new FinanceFlow();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinanceFlow;
}