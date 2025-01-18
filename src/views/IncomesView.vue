<template>
  <v-main>
    <v-container>
      <v-card class="bg-grey-lighten-5">
        <v-card-title class="d-flex justify-space-between align-center text-h4 text-grey-darken-2 mb-4">
          All Income
        </v-card-title>
        <v-table class="text-center">
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="income in incomeStore.incomes" :key="income.id">
              <td>{{ income.name }}</td>
              <td>{{ income.amount }}€</td>
              <td>{{ new Date(income.date).toLocaleDateString('es-ES') }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
import { useIncomeStore } from '../stores/income';

const incomeStore = useIncomeStore();
</script> 

<style scoped>
th {
  font-weight: bold !important;
  text-align: center !important;
}
</style>
