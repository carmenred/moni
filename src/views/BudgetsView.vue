<template>
  <v-main>
    <v-container>
      <v-card class="bg-grey-lighten-5">
        <v-card-title class="d-flex justify-space-between text-h4 text-grey-darken-2 mb-4">
          All Budgets
        </v-card-title>
        <v-table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Spent</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="budget in budgetStore.budgets" :key="budget.id">
              <td>{{ budget.name }}</td>
              <td>{{ budget.amount }}€</td>
              <td>{{ budget.spent }}€</td>
              <td>
                <v-progress-linear
                  :model-value="(budget.spent / budget.amount) * 100"
                  :color="budget.spent > budget.amount ? 'error' : 'primary'"
                  height="8"
                ></v-progress-linear>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
import { useBudgetStore } from '../stores/budgets';

const budgetStore = useBudgetStore();
</script> 

<style scoped>
th {
  font-weight: bold !important;
}
</style>