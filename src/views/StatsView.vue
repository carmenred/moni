<template>
    <v-main>
        <v-container>
            <v-row>
                <!-- Expenses Card -->
                <v-col cols="12" sm="12" md="6" class="d-flex">
                    <v-card class="bg-grey-lighten-5 pa-4 flex-grow-1" style="max-width: 100%;">
                        <v-card-title class="text-h5 mb-4">Total Expenses</v-card-title>
                        <v-card-text>
                            <div class="mb-6 chart-container">
                                <Line
                                    v-if="chartData.datasets[0].data.length"
                                    :data="chartData"
                                    :options="chartOptions"
                                />
                            </div>
                            <div class="mt-6 chart-container">
                                <Pie
                                    v-if="pieData.datasets[0].data.length"
                                    :data="pieData"
                                    :options="pieOptions"
                                />
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>

                <!-- Income Card -->
                <v-col cols="12" sm="12" md="6" class="d-flex">
                    <v-card class="bg-grey-lighten-5 pa-4 flex-grow-1" style="max-width: 100%;">
                        <v-card-title class="text-h5 mb-4">Total Income</v-card-title>
                        <v-card-text>
                            <div class="mb-6 chart-container">
                                <Line
                                    v-if="incomeChartData.datasets[0].data.length"
                                    :data="incomeChartData"
                                    :options="chartOptions"
                                />
                            </div>
                            <div class="mt-6 chart-container">
                                <Pie
                                    v-if="incomePieData.datasets[0].data.length"
                                    :data="incomePieData"
                                    :options="pieOptions"
                                />
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </v-main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Line, Pie } from 'vue-chartjs';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { useExpenseStore } from '../stores/expenses';
import { useIncomeStore } from '../stores/income';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

/**
 * Store instances for accessing expense and income data
 */
const expenseStore = useExpenseStore();
const incomeStore = useIncomeStore();

/**
 * Chart configuration options
 * Defines how charts will be displayed
 */
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: {
            type: 'category' as const,
            title: {
                display: true,
                text: 'Month'
            }
        },
        y: {
            type: 'linear' as const,
            title: {
                display: true,
                text: 'Amount (€)'
            }
        }
    }
};

/**
 * Pie chart specific options
 * Configures legend position and label styles
 */
const pieOptions = {
    responsive: true,
    maintainAspectRatio: false
};

/**
 * Processes expense data for the line chart visualization
 * @returns {ComputedRef<ChartData>} Computed chart data with monthly expenses
 */
const chartData = computed(() => {
    const monthlyExpenses = new Map();
    
    expenseStore.expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        const currentAmount = monthlyExpenses.get(monthYear) || 0;
        monthlyExpenses.set(monthYear, currentAmount + expense.amount);
    });

    const labels = Array.from(monthlyExpenses.keys());
    const data = Array.from(monthlyExpenses.values());

    return {
        labels,
        datasets: [{
            label: 'Total Expenses',
            data,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };
});

/**
 * Processes expense data for the pie chart visualization
 * Shows the distribution of the last 30 expenses by category
 * @returns {ComputedRef<ChartData>} Computed pie chart data
 */
const pieData = computed(() => {
    const expensesByName = new Map();
    
    // Sort expenses by date and take the last 30
    const last30Expenses = [...expenseStore.expenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);
    
    last30Expenses.forEach(expense => {
        const currentAmount = expensesByName.get(expense.name) || 0;
        expensesByName.set(expense.name, currentAmount + expense.amount);
    });

    return {
        labels: Array.from(expensesByName.keys()),
        datasets: [{
            data: Array.from(expensesByName.values()),
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40'
            ]
        }]
    };
});

/**
 * Processes income data for the line chart visualization
 * @returns {ComputedRef<ChartData>} Computed chart data with monthly income
 */
const incomeChartData = computed(() => {
    const monthlyIncome = new Map();
    
    incomeStore.incomes.forEach(income => {
        const date = new Date(income.date);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        const currentAmount = monthlyIncome.get(monthYear) || 0;
        monthlyIncome.set(monthYear, currentAmount + income.amount);
    });

    const labels = Array.from(monthlyIncome.keys());
    const data = Array.from(monthlyIncome.values());

    return {
        labels,
        datasets: [{
            label: 'Total Income',
            data,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };
});

/**
 * Processes income data for the pie chart visualization
 * Shows the distribution of the last 30 income entries by category
 * @returns {ComputedRef<ChartData>} Computed pie chart data
 */
const incomePieData = computed(() => {
    const incomeByName = new Map();
    
    const last30Incomes = [...incomeStore.incomes]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);
    
    last30Incomes.forEach(income => {
        const currentAmount = incomeByName.get(income.name) || 0;
        incomeByName.set(income.name, currentAmount + income.amount);
    });

    return {
        labels: Array.from(incomeByName.keys()),
        datasets: [{
            data: Array.from(incomeByName.values()),
            backgroundColor: [
                '#4CAF50',
                '#8BC34A',
                '#CDDC39',
                '#FFC107',
                '#FF9800',
                '#FF5722'
            ]
        }]
    };
});

onMounted(async () => {
    await Promise.all([
        expenseStore.fetchExpenses(),
        incomeStore.fetchIncomes()
    ]);
});
</script>

<style scoped>
.v-card-text {
    height: 600px;
}

.chart-container {
    position: relative;
    height: 45%;
    width: 100%;
}

/* Ajustes responsive */
@media (max-width: 960px) {
    .v-card-text {
        height: 500px;
    }
}

@media (max-width: 600px) {
    .v-card-text {
        height: 400px;
    }
}
</style> 