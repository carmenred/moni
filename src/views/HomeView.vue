<template>
    <v-main>
        <!-- Pending shared expenses -->
        <v-alert
            v-if="expenseStore.getPendingSharedExpenses().length"
            color="warning"
            class="mb-4"
        >
            <div class="text-h6 mb-2">Pending Shared Payments</div>
            <v-list>
                <v-list-item
                    v-for="expense in expenseStore.getPendingSharedExpenses()"
                    :key="expense.id"
                    :title="expense.name"
                    :subtitle="`Amount to pay: ${expense.paidBy[authStore.user!.uid].amount}€`"
                >
                    <template v-slot:append>
                        <v-btn
                            color="success"
                            @click="expenseStore.markExpenseAsPaid(expense.id!)"
                            class="font-weight-bold"
                        >
                            Mark as paid
                        </v-btn>
                    </template>
                </v-list-item>
            </v-list>
        </v-alert>

        <v-container fluid>
            <v-row>
                <!-- Income Card -->
                <v-col cols="12" sm="12" md="6" lg="4">
                    <IncomeCard />
                </v-col>
                <!-- Expenses Card -->
                <v-col cols="12" sm="12" md="6" lg="4">
                    <ExpensesCard />
                </v-col>
                <!-- Budgets Card -->
                <v-col cols="12" sm="12" md="12" lg="4">
                    <BudgetsCard />
                </v-col>
            </v-row>
        </v-container>
    </v-main>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budgets';
import { useExpenseStore } from '../stores/expenses';
import { useIncomeStore } from '../stores/income';
import ExpensesCard from '../components/ExpensesCard.vue';
import BudgetsCard from '../components/BudgetsCard.vue';
import IncomeCard from '../components/IncomeCard.vue';

/**
 * Store instances for managing application state
 * Handles expenses, budgets, income and authentication
 */
const authStore = useAuthStore();
const budgetStore = useBudgetStore();
const expenseStore = useExpenseStore();
const incomeStore = useIncomeStore();

/**
 * Watches for authentication state changes
 * Initializes data when user logs in by fetching:
 * - Expenses
 * - Budgets
 * - Income records
 */
watch(() => authStore.isLoggedIn, async (isLoggedIn: boolean) => {
    if (isLoggedIn && authStore.user) {
        await Promise.all([
            expenseStore.fetchExpenses(),
            budgetStore.fetchBudgets(),
            incomeStore.fetchIncomes()
        ]);
    }
}, { immediate: true });
</script>
