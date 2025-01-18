<template>
  <v-main>
    <v-container>
      <v-card class="bg-grey-lighten-5">
        <v-card-title class="d-flex justify-space-between align-center text-h4 text-grey-darken-2 mb-4">
          All Expenses
        </v-card-title>

        <v-table class="text-center">
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Budget</th>
              <th>Group</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="expense in expenseStore.expenses" :key="expense.id">
              <td>{{ expense.name }}</td>
              <td>{{ expense.amount }}€</td>
              <td>{{ new Date(expense.date).toLocaleDateString('es-ES') }}</td>
              <td>{{ getBudgetName(expense.budgetId) }}</td>
              <td>{{ getGroupName(expense.groupId) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
import { useExpenseStore } from '../stores/expenses';
import { useBudgetStore } from '../stores/budgets';
import { useGroupStore } from '../stores/groups';

/**
 * Store instances for managing expenses, budgets and groups
 */
const expenseStore = useExpenseStore();
const budgetStore = useBudgetStore();
const groupStore = useGroupStore();

/**
 * Gets the name of a budget by its ID
 * Returns a default message if budget is not found
 * 
 * @param budgetId - The ID of the budget to look up
 * @returns The budget name or "No budget" if not found
 */
const getBudgetName = (budgetId: string | undefined | null) => {
  if (!budgetId) return 'No budget';
  return budgetStore.budgets.find(b => b.id === budgetId)?.name || 'No budget';
};

/**
 * Gets the name of a group by its ID
 * Returns a default message if group is not found
 * 
 * @param groupId - The ID of the group to look up
 * @returns The group name or "No group" if not found
 */
const getGroupName = (groupId: string | undefined | null) => {
  if (!groupId) return 'No group';
  return groupStore.groups.find(g => g.id === groupId)?.name || 'No group';
};
</script> 

<style scoped>
th {
  font-weight: bold !important;
  text-align: center !important;
}
</style>