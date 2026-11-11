/**
 * Chart Manager using Chart.js v4 with Butter Theme & Dynamic Currency
 */

const ChartsManager = {
  historyChart: null,
  doughnutChart: null,
  dailyTrendChart: null,
  budgetBarChart: null,
  currencySymbol: '₹', // Default or dynamically updated

  setCurrencySymbol(sym) {
    this.currencySymbol = sym || '₹';
  },

  getColors(isDark) {
    return {
      textColor: isDark ? '#d6cfbe' : '#78716c',
      gridColor: isDark ? 'rgba(254, 252, 232, 0.08)' : 'rgba(180, 130, 20, 0.08)',
      incomeColor: '#10b981',
      expenseColor: '#ef4444',
      primaryColor: '#facc15',
      primaryLight: 'rgba(250, 204, 21, 0.2)'
    };
  },

  // 1. History Bar Chart (Income vs Expense - Last 6 Months)
  renderHistoryChart(canvasId, historyData) {
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const colors = this.getColors(isDark);
    const sym = this.currencySymbol;

    const labels = historyData.map(d => d.label);
    const incomeVals = historyData.map(d => d.income);
    const expenseVals = historyData.map(d => d.expense);

    if (this.historyChart) {
      this.historyChart.data.labels = labels;
      this.historyChart.data.datasets[0].data = incomeVals;
      this.historyChart.data.datasets[1].data = expenseVals;
      this.historyChart.options.scales.x.ticks.color = colors.textColor;
      this.historyChart.options.scales.x.grid.color = colors.gridColor;
      this.historyChart.options.scales.y.ticks.color = colors.textColor;
      this.historyChart.options.scales.y.grid.color = colors.gridColor;
      this.historyChart.update();
      return;
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    this.historyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeVals,
            backgroundColor: '#10b981',
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.6
          },
          {
            label: 'Expense',
            data: expenseVals,
            backgroundColor: '#ef4444',
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', weight: '600' }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${sym}${Number(ctx.raw).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Plus Jakarta Sans' } }
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans' },
              callback: (val) => `${sym}${val >= 1000 ? (val / 1000) + 'k' : val}`
            }
          }
        }
      }
    });
  },

  // 2. Spending by Category (Doughnut Chart)
  renderDoughnutChart(canvasId, categoryData) {
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const colors = this.getColors(isDark);
    const sym = this.currencySymbol;

    const labels = categoryData.length > 0 ? categoryData.map(c => c.name) : ['No Expenses Yet'];
    const dataVals = categoryData.length > 0 ? categoryData.map(c => c.total) : [1];
    const bgColors = categoryData.length > 0 
      ? categoryData.map(c => c.color || '#facc15') 
      : [isDark ? '#3d3424' : '#f3edd9'];

    if (this.doughnutChart) {
      this.doughnutChart.data.labels = labels;
      this.doughnutChart.data.datasets[0].data = dataVals;
      this.doughnutChart.data.datasets[0].backgroundColor = bgColors;
      this.doughnutChart.options.plugins.legend.labels.color = colors.textColor;
      this.doughnutChart.update();
      return;
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: dataVals,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: isDark ? '#1f1b14' : '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 10,
              usePointStyle: true,
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', size: 12, weight: '500' }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                if (categoryData.length === 0) return ' No expense data';
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${sym}${Number(ctx.raw).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  // 3. Daily Spending Flow (Line / Area Chart)
  renderDailyTrendChart(canvasId, dailyData) {
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const colors = this.getColors(isDark);
    const sym = this.currencySymbol;

    const labels = dailyData.map(d => {
      const parts = d.date.split('-');
      return `${parseInt(parts[2], 10)}`;
    });
    const expenseVals = dailyData.map(d => d.expense);
    const incomeVals = dailyData.map(d => d.income);

    if (this.dailyTrendChart) {
      this.dailyTrendChart.data.labels = labels;
      this.dailyTrendChart.data.datasets[0].data = expenseVals;
      this.dailyTrendChart.data.datasets[1].data = incomeVals;
      this.dailyTrendChart.options.scales.x.ticks.color = colors.textColor;
      this.dailyTrendChart.options.scales.x.grid.color = colors.gridColor;
      this.dailyTrendChart.options.scales.y.ticks.color = colors.textColor;
      this.dailyTrendChart.options.scales.y.grid.color = colors.gridColor;
      this.dailyTrendChart.update();
      return;
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    this.dailyTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Daily Expense',
            data: expenseVals,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 6
          },
          {
            label: 'Daily Income',
            data: incomeVals,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', weight: '600' }
            }
          },
          tooltip: {
            callbacks: {
              title: (ctx) => `Day ${ctx[0].label}`,
              label: (ctx) => ` ${ctx.dataset.label}: ${sym}${Number(ctx.raw).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Day of Month', color: colors.textColor, font: { size: 11 } },
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Plus Jakarta Sans' } }
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans' },
              callback: (val) => `${sym}${val}`
            }
          }
        }
      }
    });
  },

  // 4. Budget vs Actual Comparison (Horizontal Bar Chart)
  renderBudgetBarChart(canvasId, budgets) {
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const colors = this.getColors(isDark);
    const sym = this.currencySymbol;

    const labels = budgets.map(b => b.category_name);
    const budgetAmounts = budgets.map(b => b.amount);
    const actualSpent = budgets.map(b => b.spent);

    if (this.budgetBarChart) {
      this.budgetBarChart.data.labels = labels;
      this.budgetBarChart.data.datasets[0].data = budgetAmounts;
      this.budgetBarChart.data.datasets[1].data = actualSpent;
      this.budgetBarChart.options.scales.x.ticks.color = colors.textColor;
      this.budgetBarChart.options.scales.x.grid.color = colors.gridColor;
      this.budgetBarChart.options.scales.y.ticks.color = colors.textColor;
      this.budgetBarChart.update();
      return;
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    this.budgetBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Budget Limit',
            data: budgetAmounts,
            backgroundColor: isDark ? 'rgba(214, 207, 190, 0.25)' : 'rgba(226, 217, 200, 0.7)',
            borderRadius: 5,
            barPercentage: 0.8
          },
          {
            label: 'Actual Spent',
            data: actualSpent,
            backgroundColor: (ctx) => {
              const idx = ctx.dataIndex;
              const b = budgets[idx];
              if (!b) return '#facc15';
              if (b.status === 'exceeded') return '#ef4444';
              if (b.status === 'warning') return '#f59e0b';
              return '#10b981';
            },
            borderRadius: 5,
            barPercentage: 0.8
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', weight: '600' }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${sym}${Number(ctx.raw).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans' },
              callback: (val) => `${sym}${val}`
            }
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', weight: '500' } }
          }
        }
      }
    });
  },

  updateAllThemeColors() {
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const colors = this.getColors(isDark);

    [this.historyChart, this.doughnutChart, this.dailyTrendChart, this.budgetBarChart].forEach(chart => {
      if (chart) {
        if (chart.options.plugins?.legend?.labels) {
          chart.options.plugins.legend.labels.color = colors.textColor;
        }
        if (chart.options.scales?.x?.ticks) chart.options.scales.x.ticks.color = colors.textColor;
        if (chart.options.scales?.y?.ticks) chart.options.scales.y.ticks.color = colors.textColor;
        if (chart.options.scales?.x?.grid) chart.options.scales.x.grid.color = colors.gridColor;
        if (chart.options.scales?.y?.grid) chart.options.scales.y.grid.color = colors.gridColor;
        chart.update();
      }
    });
  }
};
