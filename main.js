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
        // Navigation menu toggle for mobile
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', this.toggleMobileMenu.bind(this));
        }
        
        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', this.handleQuickAction.bind(this));
        });
        
        // Add expense button
        const addExpenseBtn = document.querySelector('button:contains("Add Expense")');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', this.showAddExpenseModal.bind(this));
        }
        
        // AI assistant buttons
        document.querySelectorAll('.ai-suggestion-btn').forEach(btn => {
            btn.addEventListener('click', this.handleAISuggestion.bind(this));
        });
        
        // Chart time period buttons
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.addEventListener('click', this.changeChartPeriod.bind(this));
        });
    }
    
    initializeAnimations() {
        // Floating elements animation
        anime({
            targets: '.floating-element',
            translateY: [-10, 10],
            duration: 3000,
            easing: 'easeInOutSine',
            direction: 'alternate',
            loop: true,
            delay: anime.stagger(200)
        });
        
        // Metric cards entrance animation
        anime({
            targets: '.metric-card',
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutElastic(1, .8)',
            delay: anime.stagger(100, {start: 200})
        });
        
        // Progress bar animations
        this.animateProgressBars();
    }
    
    animateProgressBars() {
        const progressBars = document.querySelectorAll('.progress-bar');
        progressBars.forEach(bar => {
            const width = bar.style.width || bar.getAttribute('data-width') || '0%';
            anime({
                targets: bar,
                width: width,
                duration: 1500,
                easing: 'easeOutQuart',
                delay: 500
            });
        });
    }
    
    initializeCharts() {
        this.createExpenseChart();
        this.createBudgetChart();
        this.createRevenueChart();
    }
    
    createExpenseChart() {
        const chartElement = document.getElementById('expenseChart');
        if (!chartElement) return;
        
        const chart = echarts.init(chartElement);
        
        const option = {
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#7C3AED',
                borderWidth: 1,
                textStyle: {
                    color: '#374151'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['Dec 1', 'Dec 2', 'Dec 3', 'Dec 4', 'Dec 5', 'Dec 6', 'Dec 7'],
                axisLine: {
                    lineStyle: {
                        color: '#E5E7EB'
                    }
                },
                axisLabel: {
                    color: '#6B7280'
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: '#E5E7EB'
                    }
                },
                axisLabel: {
                    color: '#6B7280'
                },
                splitLine: {
                    lineStyle: {
                        color: '#F3F4F6'
                    }
                }
            },
            series: [
                {
                    name: 'Expenses',
                    type: 'line',
                    smooth: true,
                    data: [120, 200, 150, 80, 70, 110, 130],
                    lineStyle: {
                        color: '#7C3AED',
                        width: 3
                    },
                    itemStyle: {
                        color: '#7C3AED'
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(124, 58, 237, 0.3)' },
                                { offset: 1, color: 'rgba(124, 58, 237, 0.05)' }
                            ]
                        }
                    }
                },
                {
                    name: 'Tax Deductible',
                    type: 'line',
                    smooth: true,
                    data: [100, 180, 130, 70, 60, 95, 115],
                    lineStyle: {
                        color: '#10B981',
                        width: 2
                    },
                    itemStyle: {
                        color: '#10B981'
                    }
                }
            ]
        };
        
        chart.setOption(option);
        
        // Animate chart on load
        setTimeout(() => {
            chart.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                dataIndex: 6
            });
        }, 1000);
        
        // Responsive resize
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }
    
    createBudgetChart() {
        const chartElement = document.getElementById('budgetChart');
        if (!chartElement) return;
        
        const chart = echarts.init(chartElement);
        
        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: ${c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                textStyle: {
                    color: '#6B7280'
                }
            },
            series: [
                {
                    name: 'Budget Allocation',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['60%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 8,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: '18',
                            fontWeight: 'bold'
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: [
                        { value: 1500, name: 'Software', itemStyle: { color: '#7C3AED' } },
                        { value: 1200, name: 'Travel', itemStyle: { color: '#A78BFA' } },
                        { value: 500, name: 'Marketing', itemStyle: { color: '#10B981' } },
                        { value: 800, name: 'Equipment', itemStyle: { color: '#F59E0B' } }
                    ]
                }
            ]
        };
        
        chart.setOption(option);
        
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }
    
    createRevenueChart() {
        const chartElement = document.getElementById('revenueChart');
        if (!chartElement) return;
        
        const chart = echarts.init(chartElement);
        
        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: '#E5E7EB'
                    }
                },
                axisLabel: {
                    color: '#6B7280'
                }
            },
            yAxis: {
                type: 'category',
                data: ['Creative Agency', 'Tech Startup', 'Acme Corp'],
                axisLine: {
                    lineStyle: {
                        color: '#E5E7EB'
                    }
                },
                axisLabel: {
                    color: '#6B7280'
                }
            },
            series: [
                {
                    name: 'Revenue',
                    type: 'bar',
                    data: [12000, 8500, 15000],
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 1,
                            y2: 0,
                            colorStops: [
                                { offset: 0, color: '#7C3AED' },
                                { offset: 1, color: '#A78BFA' }
                            ]
                        },
                        borderRadius: [0, 4, 4, 0]
                    }
                }
            ]
        };
        
        chart.setOption(option);
        
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }
    
    setupScrollReveal() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.reveal').forEach(el => {
            observer.observe(el);
        });
    }
    
    startTypewriterEffect() {
        const typewriterElements = document.querySelectorAll('.typewriter');
        typewriterElements.forEach((element, index) => {
            setTimeout(() => {
                this.typeWriter(element);
            }, index * 2000);
        });
    }
    
    typeWriter(element) {
        const text = element.textContent;
        element.textContent = '';
        element.style.borderRight = '2px solid #7C3AED';
        
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
                setTimeout(() => {
                    element.style.borderRight = 'none';
                }, 1000);
            }
        }, 50);
    }
    
    handleQuickAction(event) {
        const action = event.currentTarget.dataset.action;
        
        switch(action) {
            case 'add-expense':
                this.showAddExpenseModal();
                break;
            case 'create-invoice':
                this.showCreateInvoiceModal();
                break;
            case 'view-reports':
                window.location.href = 'reports.html';
                break;
            case 'ai-insights':
                this.showAIInsights();
                break;
        }
    }
    
    showAddExpenseModal() {
        const modal = this.createModal('Add New Expense', this.getExpenseFormHTML());
        document.body.appendChild(modal);
        
        // Animate modal appearance
        anime({
            targets: modal,
            opacity: [0, 1],
            scale: [0.8, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
        
        // Setup form handlers
        this.setupExpenseFormHandlers(modal);
    }
    
    getExpenseFormHTML() {
        return `
            <form class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input type="number" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="0.00">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="What was this expense for?">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option>Software</option>
                        <option>Equipment</option>
                        <option>Travel</option>
                        <option>Meals</option>
                        <option>Marketing</option>
                        <option>Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Client (Optional)</label>
                    <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option>Personal</option>
                        <option>Acme Corp</option>
                        <option>Tech Startup</option>
                        <option>Creative Agency</option>
                    </select>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="taxDeductible" class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <label for="taxDeductible" class="ml-2 text-sm text-gray-700">Tax deductible expense</label>
                </div>
                <div class="flex space-x-3 pt-4">
                    <button type="submit" class="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">Add Expense</button>
                    <button type="button" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors cancel-btn">Cancel</button>
                </div>
            </form>
        `;
    }
    
    setupExpenseFormHandlers(modal) {
        const form = modal.querySelector('form');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleExpenseSubmit(form, modal);
        });
        
        cancelBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }
    
    handleExpenseSubmit(form, modal) {
        const formData = new FormData(form);
        const expense = {
            id: this.expenses.length + 1,
            amount: parseFloat(formData.get('amount') || form.querySelector('input[type="number"]').value),
            description: formData.get('description') || form.querySelector('input[type="text"]').value,
            category: form.querySelector('select').value,
            client: form.querySelectorAll('select')[1].value,
            date: new Date().toISOString().split('T')[0],
            taxDeductible: form.querySelector('input[type="checkbox"]').checked
        };
        
        this.expenses.unshift(expense);
        this.showSuccessMessage('Expense added successfully!');
        this.closeModal(modal);
        
        // Refresh displays if on relevant pages
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
                    <button class="text-gray-400 hover:text-gray-600 close-btn">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                ${content}
            </div>
        `;
        
        // Close button handler
        modal.querySelector('.close-btn').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        return modal;
    }
    
    closeModal(modal) {
        anime({
            targets: modal,
            opacity: [1, 0],
            scale: [1, 0.8],
            duration: 200,
            easing: 'easeInQuart',
            complete: () => {
                modal.remove();
            }
        });
    }
    
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        
        document.body.appendChild(toast);
        
        anime({
            targets: toast,
            opacity: [0, 1],
            translateX: ['100%', '0%'],
            duration: 300,
            easing: 'easeOutQuart',
            complete: () => {
                setTimeout(() => {
                    anime({
                        targets: toast,
                        opacity: [1, 0],
                        translateX: ['0%', '100%'],
                        duration: 300,
                        easing: 'easeInQuart',
                        complete: () => {
                            toast.remove();
                        }
                    });
                }, 3000);
            }
        });
    }
    
    refreshExpenseDisplay() {
        // This would refresh any expense displays on the current page
        // Implementation depends on which page is currently active
        if (window.location.pathname.includes('expenses.html')) {
            this.updateExpensesList();
        }
    }
    
    updateExpensesList() {
        // Update expenses list on expenses page
        const expensesList = document.getElementById('expensesList');
        if (expensesList) {
            // Re-render the expenses list
            this.renderExpensesList(expensesList);
        }
    }
    
    renderExpensesList(container) {
        // Clear existing content
        container.innerHTML = '';
        
        // Render each expense
        this.expenses.forEach(expense => {
            const expenseElement = this.createExpenseElement(expense);
            container.appendChild(expenseElement);
        });
        
        // Animate new elements
        anime({
            targets: container.children,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 600,
            easing: 'easeOutQuart',
            delay: anime.stagger(100)
        });
    }
    
    createExpenseElement(expense) {
        const element = document.createElement('div');
        element.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-lg';
        
        const categoryColors = {
            'Software': 'bg-purple-100 text-purple-600',
            'Equipment': 'bg-blue-100 text-blue-600',
            'Travel': 'bg-green-100 text-green-600',
            'Meals': 'bg-amber-100 text-amber-600',
            'Marketing': 'bg-pink-100 text-pink-600',
            'Other': 'bg-gray-100 text-gray-600'
        };
        
        element.innerHTML = `
            <div class="flex items-center">
                <div class="w-10 h-10 ${categoryColors[expense.category] || categoryColors['Other']} rounded-lg flex items-center justify-center mr-3">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"></path>
                    </svg>
                </div>
                <div>
                    <p class="font-medium text-gray-900">${expense.description}</p>
                    <p class="text-sm text-gray-500">${expense.category} • ${expense.date}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-semibold text-gray-900">$${expense.amount.toFixed(2)}</p>
                ${expense.taxDeductible ? '<p class="text-xs text-green-600">Tax deductible</p>' : ''}
            </div>
        `;
        
        return element;
    }
    
    // AI Assistant functionality
    handleAISuggestion(event) {
        const suggestion = event.currentTarget.textContent;
        this.processAIQuery(suggestion);
    }
    
    processAIQuery(query) {
        // Simulate AI processing
        const aiResponse = this.generateAIResponse(query);
        this.displayAIResponse(aiResponse);
    }
    
    generateAIResponse(query) {
        const responses = {
            'Show tax-deductible expenses': 'You have $8,940 in tax-deductible expenses this year, potentially saving you $2,235 in taxes.',
            'Budget optimization tips': 'Consider reducing marketing spend by 20% and reallocating to software tools for better ROI.',
            'Cash flow forecast': 'Based on current trends, your cash flow will remain positive with $15,000 projected for next month.'
        };
        
        return responses[query] || 'I\'m analyzing your financial data to provide personalized insights.';
    }
    
    displayAIResponse(response) {
        const aiContainer = document.querySelector('.ai-bubble .space-y-4');
        if (aiContainer) {
            const responseElement = document.createElement('div');
            responseElement.className = 'bg-purple-50 p-4 rounded-lg';
            responseElement.innerHTML = `<p class="text-sm text-gray-700">${response}</p>`;
            
            aiContainer.appendChild(responseElement);
            
            // Animate response appearance
            anime({
                targets: responseElement,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 400,
                easing: 'easeOutQuart'
            });
        }
    }
    
    // Chart period change functionality
    changeChartPeriod(event) {
        const period = event.currentTarget.textContent;
        
        // Update active button
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.classList.remove('bg-purple-100', 'text-purple-600');
            btn.classList.add('text-gray-600', 'hover:bg-gray-100');
        });
        
        event.currentTarget.classList.add('bg-purple-100', 'text-purple-600');
        event.currentTarget.classList.remove('text-gray-600', 'hover:bg-gray-100');
        
        // Update chart data based on period
        this.updateChartData(period);
    }
    
    updateChartData(period) {
        const chart = echarts.getInstanceByDom(document.getElementById('expenseChart'));
        if (!chart) return;
        
        let data, categories;
        
        switch(period) {
            case '7D':
                categories = ['Dec 1', 'Dec 2', 'Dec 3', 'Dec 4', 'Dec 5', 'Dec 6', 'Dec 7'];
                data = [120, 200, 150, 80, 70, 110, 130];
                break;
            case '30D':
                categories = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                data = [850, 1200, 950, 1100];
                break;
            case '90D':
                categories = ['Oct', 'Nov', 'Dec'];
                data = [3200, 3800, 4100];
                break;
        }
        
        chart.setOption({
            xAxis: {
                data: categories
            },
            series: [{
                data: data
            }]
        });
    }
    
    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }
    
    // Mobile menu toggle
    toggleMobileMenu() {
        const mobileMenu = document.querySelector('.mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    }
}

// Initialize FinanceFlow when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.financeFlow = new FinanceFlow();
});

		// Animate settings cards on load
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
		// Handle preference toggles
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
		
		// Add loading state
		updateBtn.classList.add('loading');
		updateBtn.textContent = 'Updating...';
		
		// Simulate API call
		setTimeout(() => {
			// Show success message
			this.showSettingsNotification('Profile updated successfully!', 'success');
			
			// Reset button
			updateBtn.classList.remove('loading');
			updateBtn.textContent = originalText;
		}, 1500);
	}
	
	handlePreferenceChange(toggle) {
		const preference = toggle.closest('.flex');
		const label = preference.querySelector('h3').textContent;
		const isEnabled = toggle.checked;
		
		// Show immediate feedback
		this.showSettingsNotification(`${label} ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
		
		// Simulate saving preference
		setTimeout(() => {
			// Preference saved (in real app, this would be an API call)
			console.log(`Preference ${label} set to ${isEnabled}`);
		}, 500);
	}
	
	showSettingsNotification(message, type = 'info') {
		// Create notification element
		const notification = document.createElement('div');
		notification.className = `fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
			type === 'success' ? 'bg-green-500 text-white' :
			type === 'error' ? 'bg-red-500 text-white' :
			'bg-blue-500 text-white'
		}`;
		notification.textContent = message;
		
		document.body.appendChild(notification);
		
		// Animate in
		setTimeout(() => {
			notification.classList.remove('translate-x-full');
		}, 100);
		
		// Animate out and remove
		setTimeout(() => {
			notification.classList.add('translate-x-full');
			setTimeout(() => {
				document.body.removeChild(notification);
			}, 300);
		}, 3000);
	}
}

// Initialize FinanceFlow when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	window.financeFlow = new FinanceFlow();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = FinanceFlow;
}
    // Settings page functionality  
    initializeSettingsPage() {
        // Initialize settings page specific features
        this.setupSettingsAnimations();
        this.setupProfileFormHandlers();
        this.setupPreferenceHandlers();
    }
    
    setupSettingsAnimations() {
        // Animate settings cards on load
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
        // Handle preference toggles
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
        
        // Add loading state
        updateBtn.classList.add('loading');
        updateBtn.textContent = 'Updating...';
        
        // Simulate API call
        setTimeout(() => {
            // Show success message
            this.showSettingsNotification('Profile updated successfully!', 'success');
            
            // Reset button
            updateBtn.classList.remove('loading');
            updateBtn.textContent = originalText;
        }, 1500);
    }
    
    handlePreferenceChange(toggle) {
        const preference = toggle.closest('.flex');
        const label = preference.querySelector('h3').textContent;
        const isEnabled = toggle.checked;
        
        // Show immediate feedback
        this.showSettingsNotification(`${label} ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
        
        // Simulate saving preference
        setTimeout(() => {
            // Preference saved (in real app, this would be an API call)
            console.log(`Preference ${label} set to ${isEnabled}`);
        }, 500);
    }
    
    showSettingsNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    }   // ← this closes the FinanceFlow class

}   // ← this closes the class FinanceFlow { ... }

// Initialize FinanceFlow when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.financeFlow = new FinanceFlow();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinanceFlow;
}
