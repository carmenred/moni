<template>
    <v-card class="bg-grey-lighten-5 h-100">
        <v-card-title class="d-flex justify-space-between align-center text-h4 text-grey-darken-2">
            Income
            <div class="d-flex align-center ga-2">
                <v-tooltip text="View all income" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn 
                            color="white" 
                            icon="mdi-format-list-bulleted" 
                            size="small"
                            @click="router.push('/income')"
                            v-bind="props"
                        ></v-btn>
                    </template>
                </v-tooltip>
                <v-tooltip text="Add new income" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn 
                            color="white" 
                            icon="mdi-plus" 
                            size="small" 
                            @click="newIncomeDialog = true"
                            v-bind="props"
                        ></v-btn>
                    </template>
                </v-tooltip>
            </div>
        </v-card-title>
        <v-card-text>
            <!-- Monthly Totals -->
            <v-card class="bg-white-5 mb-4 pa-4">
                <v-card-title class="text-grey-darken-2">Monthly Totals</v-card-title>
                <v-list>
                    <v-list-item
                        v-for="[month, total] in incomeStore.getMonthlyTotals()"
                        :key="month"
                        :title="month"
                        class="border-b-1"
                    >
                        <template v-slot:append>
                            <span class="text-success font-weight-bold text-subtitle-1">{{ total }}€</span>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card>

            <!-- Recent Income List -->
            <v-card v-for="income in filteredIncomes" :key="income.id"
                class="bg-white mb-4 pa-4 d-flex justify-space-between align-center">
                <div class="d-flex flex-column">
                    <div class="font-weight-bold text-h6 text-blue-grey-darken-2">{{ income.name }}</div>
                    <div class="text-caption grey-darken-2">
                        {{ new Date(income.date).toLocaleString('es-ES', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                        }) }}
                    </div>
                </div>
                <div class="d-flex flex-row align-center ga-6">
                    <div class="font-weight-bold text-h5 text-success">{{ income.amount }}€</div>
                    <v-menu transition="slide-y-transition">
                        <template v-slot:activator="{ props }">
                            <v-btn color="primary" icon="mdi-dots-vertical" size="x-small"
                                v-bind="props"></v-btn>
                        </template>
                        <v-list>
                            <v-list-item class="d-flex flex-column">
                                <v-list-item-title class="mb-2">
                                    <v-btn prepend-icon="mdi-pencil" @click="openEditIncomeDialog(income)"
                                        block>Edit</v-btn>
                                </v-list-item-title>
                                <v-list-item-title>
                                    <v-btn prepend-icon="mdi-trash-can-outline" 
                                        @click="openDeleteIncomeDialog(income)"
                                        block>Delete</v-btn>
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </div>
            </v-card>
        </v-card-text>

        <!-- New Income Dialog -->
        <v-dialog v-model="newIncomeDialog" class="w-100 w-md-50 w-xl-25">
            <v-card class="pa-8">
                <div class="text-h5 mb-4 text-primary">New Income</div>
                <v-form ref="addForm">
                    <v-text-field 
                        label="Name" 
                        v-model="newIncomeName" 
                        :rules="nameRules" 
                        variant="outlined" 
                        clearable
                        flat
                    ></v-text-field>
                    <v-number-input 
                        label="Amount" 
                        v-model="newIncomeAmount" 
                        :rules="amountRules" 
                        variant="outlined"
                        clearable 
                        flat
                        :min="0"
                        :step="0.01"
                        hide-spin-buttons
                    ></v-number-input>
                    <v-text-field
                        label="Date"
                        v-model="newIncomeDate"
                        type="date"
                        :rules="dateRules"
                        variant="outlined"
                        clearable
                        flat
                    ></v-text-field>
                    <v-btn color="primary" block @click="addIncome" class="mt-4 font-weight-bold">Add</v-btn>
                </v-form>
            </v-card>
        </v-dialog>

        <!-- Edit Income Dialog -->
        <v-dialog v-model="editIncomeDialog" class="w-100 w-md-50 w-xl-25">
            <v-card class="pa-8">
                <div class="text-h5 mb-4 text-primary">Edit Income</div>
                <v-form ref="editForm">
                    <v-text-field 
                        label="Name" 
                        v-model="editIncomeName" 
                        :rules="nameRules" 
                        variant="outlined" 
                        clearable
                        flat
                    ></v-text-field>
                    <v-number-input 
                        label="Amount" 
                        v-model="editIncomeAmount" 
                        :rules="amountRules" 
                        variant="outlined"
                        clearable 
                        flat
                        :min="0"
                        :step="0.01"
                        hide-spin-buttons
                    ></v-number-input>
                    <v-text-field
                        label="Date"
                        v-model="editIncomeDate"
                        type="date"
                        :rules="dateRules"
                        variant="outlined"
                        clearable
                        flat
                    ></v-text-field>
                    <v-btn color="primary" block @click="editIncome" class="mt-4 font-weight-bold">Save Changes</v-btn>
                </v-form>
            </v-card>
        </v-dialog>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteIncomeDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h5 pa-4">Delete Income</v-card-title>
                <v-card-text class="pa-4">
                    Are you sure you want to delete this income? This action cannot be undone.
                </v-card-text>
                <v-card-actions class="pa-4">
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="deleteIncomeDialog = false">Cancel</v-btn>
                    <v-btn 
                        color="error" 
                        @click="confirmDeleteIncome"
                    >Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script setup lang="ts">
/**
 * @fileoverview Income management component.
 * Handles the display, creation, editing, and deletion of income entries.
 * Provides functionality for tracking monthly income totals and recent transactions.
 */

import { ref, computed } from 'vue';
import { VForm } from 'vuetify/components/VForm';
import { useIncomeStore } from '../stores/income';
import type { Income } from '../types';
import { useRouter } from 'vue-router';

/**
 * Store instance for income management
 */
const incomeStore = useIncomeStore();

/**
 * Dialog visibility controls and form data for new income
 * @type {Ref<boolean>}
 */
const newIncomeDialog = ref(false);
const newIncomeName = ref('');
const newIncomeAmount = ref<number>(0);
const newIncomeDate = ref(new Date().toISOString().split('T')[0]);

/**
 * Dialog visibility controls and form data for editing income
 */
const editIncomeDialog = ref(false);
const editIncomeName = ref('');
const editIncomeAmount = ref<number>(0);
const editIncomeDate = ref('');
const currentEditIncome = ref<Income | null>(null);

/**
 * Dialog visibility controls and data for deleting income
 */
const deleteIncomeDialog = ref(false);
const incomeToDelete = ref<Income | null>(null);

/**
 * Form references for validation
 * @type {Ref<VForm | null>}
 */
const addForm = ref<VForm | null>(null);
const editForm = ref<VForm | null>(null);

/**
 * Form validation rules
 * @type {((v: string | number) => boolean | string)[]}
 */
const nameRules = [(v: string) => !!v || 'Name is required'];
const amountRules = [(v: number) => !!v || 'Amount is required'];
const dateRules = [(v: string) => !!v || 'Date is required'];

/**
 * Resets form fields to their initial state
 * @param {VForm | null} formRef - Reference to the form to be reset
 */
const resetFormFields = (formRef: VForm | null) => {
    if (formRef) formRef.reset();
}

/**
 * Creates a new income entry with the provided data
 * Validates form data before submission
 * @async
 * @throws {Error} If validation fails or income creation fails
 */
async function addIncome() {
    if (!addForm.value) return;
    const { valid } = await addForm.value.validate();
    if (!valid) return;

    await incomeStore.createIncome({
        name: newIncomeName.value,
        amount: Number(newIncomeAmount.value),
        date: new Date(newIncomeDate.value)
    });
    
    newIncomeDialog.value = false;
    resetFormFields(addForm.value);
}

/**
 * Opens the edit dialog for a specific income entry
 * Populates form with current income data
 * @param {Income} income - The income entry to be edited
 */
function openEditIncomeDialog(income: Income) {
    editIncomeDialog.value = true;
    editIncomeName.value = income.name;
    editIncomeAmount.value = income.amount;
    editIncomeDate.value = new Date(income.date).toISOString().split('T')[0];
    currentEditIncome.value = income;
}

/**
 * Updates an existing income entry with new data
 * Validates form data before submission
 * @async
 * @throws {Error} If validation fails or update fails
 */
async function editIncome() {
    if (!currentEditIncome.value?.id || !editForm.value) return;
    const { valid } = await editForm.value.validate();
    if (!valid) return;

    await incomeStore.updateIncome(currentEditIncome.value.id, {
        name: editIncomeName.value,
        amount: Number(editIncomeAmount.value),
        date: new Date(editIncomeDate.value)
    });
    
    editIncomeDialog.value = false;
    currentEditIncome.value = null;
    resetFormFields(editForm.value);
}

/**
 * Opens the delete confirmation dialog for an income entry
 * @param {Income} income - The income entry to be deleted
 */
function openDeleteIncomeDialog(income: Income) {
    incomeToDelete.value = income;
    deleteIncomeDialog.value = true;
}

/**
 * Confirms and executes income entry deletion
 * @async
 * @throws {Error} If deletion fails
 */
async function confirmDeleteIncome() {
    if (incomeToDelete.value?.id) {
        await incomeStore.deleteIncome(incomeToDelete.value.id);
        deleteIncomeDialog.value = false;
        incomeToDelete.value = null;
    }
}

/**
 * Computed property to filter and limit incomes
 * @returns {Income[]} Filtered and limited incomes
 */
const filteredIncomes = computed(() => {
    return incomeStore.incomes
        // Ordenar por fecha y hora más reciente
        .sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);
});

/**
 * Router instance
 */
const router = useRouter();
</script> 