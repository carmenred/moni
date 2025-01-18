<template>
    <v-card class="bg-grey-lighten-5 h-100">
        <v-card-title class="d-flex justify-space-between align-center text-h4 text-grey-darken-2">
            Expenses
            <div class="d-flex align-center ga-2">
                <v-tooltip text="View all expenses" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn 
                            color="white" 
                            icon="mdi-format-list-bulleted" 
                            size="small"
                            @click="router.push('/expenses')"
                            v-bind="props"
                        ></v-btn>
                    </template>
                </v-tooltip>
                <v-tooltip text="Add new expense" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn 
                            color="white" 
                            icon="mdi-plus" 
                            size="small" 
                            @click="newExpenseDialog = true"
                            v-bind="props"
                        ></v-btn>
                    </template>
                </v-tooltip>
            </div>
        </v-card-title>
        <v-card-text>
            <v-card class="bg-white-5 mb-4 pa-4">
                <v-card-title class="text-grey-darken-2">Total expenses</v-card-title>
                <v-card-text class="text-h3 font-weight-bold text-primary">
                    {{ totalExpenses }}€
                </v-card-text>
            </v-card>
            <!-- Show only last 5 expenses -->
            <v-card v-for="expense in filteredExpenses" :key="expense.id"
                class="bg-white mb-4 pa-4 d-flex justify-space-between align-center">
                <div class="d-flex flex-column">
                    <div class="font-weight-bold text-h6 text-blue-grey-darken-2">{{ expense.name }}</div>
                    <div class="text-caption grey-darken-2">On {{ new Date(expense.date).toLocaleString('es-ES',
                        { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                    </div>
                </div>
                <div class="d-flex flex-row align-center ga-6">
                    <div class="font-weight-bold text-h5 text-primary">{{ expense.amount }}€</div>
                    <v-menu transition="slide-y-transition">
                        <template v-slot:activator="{ props }">
                            <v-btn color="primary" icon="mdi-dots-vertical" size="x-small"
                                v-bind="props"></v-btn>
                        </template>
                        <v-list>
                            <v-list-item class="d-flex flex-column">
                                <v-list-item-title class="mb-2">
                                    <v-btn prepend-icon="mdi-pencil" @click="openEditExpenseDialog(expense)"
                                        block>Edit</v-btn>
                                </v-list-item-title>
                                <v-list-item-title>
                                    <v-btn prepend-icon="mdi-trash-can-outline" 
                                        @click="openDeleteExpenseDialog(expense)"
                                        block>Delete</v-btn>
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </div>
            </v-card>
        </v-card-text>

        <!-- Expense Dialogs -->
        <v-dialog v-model="newExpenseDialog" class="w-100 w-md-50 w-xl-25">
            <v-card class="pa-8">
                <div class="text-h5 mb-4 text-primary">New expense</div>
                <v-form ref="addForm">
                    <v-text-field label="Name" v-model="newExpenseName" :rules="nameRules" variant="outlined" clearable
                        flat></v-text-field>
                    <v-number-input label="Amount" v-model="newExpenseAmount" :rules="amountRules" variant="outlined"
                        clearable flat></v-number-input>
                    <v-text-field
                        type="date"
                        label="Date"
                        v-model="newExpenseDate"
                        :rules="dateRules"
                        :max="new Date().toISOString().split('T')[0]"
                        variant="outlined"
                        clearable
                        flat
                    ></v-text-field>
                    <v-select
                        v-model="selectedBudgetId"
                        :items="budgetStore.budgets"
                        item-title="name"
                        item-value="id"
                        label="Add to budget (optional)"
                        variant="outlined"
                        clearable
                        flat
                    ></v-select>
                    <v-switch
                        v-model="isSharedExpense"
                        label="Share expense with group"
                        class="mb-4"
                    ></v-switch>

                    <v-select
                        v-if="isSharedExpense"
                        v-model="selectedGroupId"
                        :items="groupStore.groups"
                        item-title="name"
                        item-value="id"
                        label="Select group"
                        variant="outlined"
                        :rules="groupRules"
                        required
                    ></v-select>

                    <div v-if="isSharedExpense && selectedGroupId" class="pa-4 mb-4 bg-grey-lighten-4 rounded">
                        <div class="text-subtitle-1 mb-2">Cost Distribution</div>
                        <div class="text-body-1">
                            Amount per person: {{ (newExpenseAmount / (getSelectedGroupMembers.length || 1)).toFixed(2) }}€
                        </div>
                        <div class="text-caption">
                            Split between {{ getSelectedGroupMembers.length }} members
                        </div>
                    </div>

                    <v-btn color="primary" block @click="addExpense" class="font-weight-bold">Add</v-btn>
                </v-form>
            </v-card>
        </v-dialog>

        <v-dialog v-model="editExpenseDialog" class="w-100 w-md-50 w-xl-25">
            <v-card class="pa-8">
                <div class="text-h5 mb-4 text-primary">Edit expense</div>
                <v-form ref="editForm">
                    <v-text-field 
                        label="Name" 
                        v-model="editExpenseName" 
                        :rules="nameRules" 
                        variant="outlined" 
                        clearable
                        flat
                    ></v-text-field>
                    <v-number-input 
                        label="Amount" 
                        v-model="editExpenseAmount" 
                        :rules="amountRules" 
                        variant="outlined"
                        clearable 
                        flat
                    ></v-number-input>
                    <v-select
                        v-model="editBudgetId"
                        :items="budgetStore.budgets"
                        item-title="name"
                        item-value="id"
                        label="Assign to budget (optional)"
                        variant="outlined"
                        clearable
                        flat
                    ></v-select>
                    <v-btn color="primary" block @click="editExpense" class="font-weight-bold">SAVE CHANGES</v-btn>
                </v-form>
            </v-card>
        </v-dialog>

        <v-dialog v-model="deleteExpenseDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h5 pa-4">Delete Expense</v-card-title>
                <v-card-text class="pa-4">
                    Are you sure you want to delete this expense? This action cannot be undone.
                </v-card-text>
                <v-card-actions class="pa-4">
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="deleteExpenseDialog = false">Cancel</v-btn>
                    <v-btn 
                        color="error" 
                        @click="confirmDeleteExpense"
                    >Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script setup lang="ts">
/**
 * @fileoverview Expenses management component.
 * Handles the display, creation, editing, and deletion of expenses.
 * Provides functionality for assigning expenses to budgets and tracking total expenses.
 */

import { ref, computed } from 'vue';
import { VForm } from 'vuetify/components/VForm';
import { useBudgetStore } from '../stores/budgets';
import { useExpenseStore } from '../stores/expenses';
import type { Expense } from '../types';
import { useGroupStore } from '../stores/groups';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

/**
 * Dialog visibility controls and form data
 * @type {Ref<boolean>}
 */
const newExpenseDialog = ref(false);
const editExpenseDialog = ref(false);
const deleteExpenseDialog = ref(false);

/**
 * New expense form data
 */
const newExpenseName = ref('');
const newExpenseAmount = ref(0);
const newExpenseDate = ref(new Date().toISOString().split('T')[0]);
const selectedBudgetId = ref<string | null>(null);
const isSharedExpense = ref(false);
const selectedGroupId = ref<string | null>(null);

/**
 * Edit expense form data
 */
const editExpenseName = ref('');
const editExpenseAmount = ref(0);
const editExpenseDate = ref('');
const editBudgetId = ref<string | null>(null);
const currentEditExpense = ref<Expense | null>(null);

/**
 * Delete expense data
 */
const expenseToDelete = ref<Expense | null>(null);

/**
 * Form references for validation
 * @type {Ref<VForm | null>}
 */
const addForm = ref<VForm | null>(null);
const editForm = ref<VForm | null>(null);

/**
 * Store instances
 */
const budgetStore = useBudgetStore();
const expenseStore = useExpenseStore();
const groupStore = useGroupStore();
const authStore = useAuthStore();
const router = useRouter();

/**
 * Form validation rules
 * @type {((v: string | number) => boolean | string)[]}
 */
const nameRules = [(v: string) => !!v || 'Name is required'];
const amountRules = [(v: number) => !!v || 'Amount is required'];
const groupRules = [(v: string) => !!v || 'Group is required'];
const dateRules = [(v: string) => !!v || 'Date is required'];

/**
 * Resets form fields to their initial state
 * @param {VForm | null} formRef - Reference to the form to be reset
 */
const resetFormFields = (formRef: VForm | null) => {
    if (formRef) formRef.reset();
}

/**
 * Creates a new expense with the provided data
 * Updates associated budget if one is selected
 * @async
 * @throws {Error} If expense creation or budget update fails
 */
async function addExpense() {
    if (!addForm.value) return;
    const { valid } = await addForm.value.validate();
    if (!valid) return;

    const selectedDate = new Date(newExpenseDate.value);
    const now = new Date();
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    await expenseStore.addExpense({
        name: newExpenseName.value,
        amount: newExpenseAmount.value,
        date: selectedDate.toISOString(),
        budgetId: selectedBudgetId.value || undefined,
        isShared: isSharedExpense.value,
        groupId: selectedGroupId.value || undefined
    });
    
    newExpenseDialog.value = false;
    resetFormFields(addForm.value);
    selectedBudgetId.value = null;
    isSharedExpense.value = false;
    selectedGroupId.value = null;
    newExpenseDate.value = new Date().toISOString().split('T')[0];
}

/**
 * Opens the edit dialog for a specific expense
 * Populates form with current expense data
 * @param {Expense} expense - The expense to be edited
 */
function openEditExpenseDialog(expense: Expense) {
    editExpenseDialog.value = true;
    editExpenseName.value = expense.name;
    editExpenseAmount.value = expense.amount;
    editExpenseDate.value = expense.date;
    editBudgetId.value = expense.budgetId || null;
    currentEditExpense.value = expense;
}

/**
 * Updates an existing expense and handles budget adjustments
 * Manages budget amount updates when changing budgets or amounts
 * @async
 * @throws {Error} If expense update or budget adjustments fail
 */
async function editExpense() {
    if (!currentEditExpense.value?.id) return;
    
    const selectedDate = new Date(editExpenseDate.value);
    const now = new Date();
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    
    await expenseStore.updateExpense(currentEditExpense.value.id, {
        name: editExpenseName.value,
        amount: editExpenseAmount.value,
        date: selectedDate.toISOString(),
        budgetId: editBudgetId.value || undefined
    });

    // Handle budget updates
    await updateBudgets(currentEditExpense.value.budgetId, editBudgetId.value, editExpenseAmount.value - currentEditExpense.value.amount);
    
    editExpenseDialog.value = false;
    currentEditExpense.value = null;
    editBudgetId.value = null;
    resetFormFields(editForm.value);
}

/**
 * Updates budget amounts when editing an expense
 * @param {string | undefined} oldBudgetId - Previous budget ID
 * @param {string | null} newBudgetId - New budget ID
 * @param {number} amountDiff - Difference in expense amount
 * @async
 * @private
 */
async function updateBudgets(oldBudgetId: string | undefined, newBudgetId: string | null, amountDiff: number) {
    if (oldBudgetId !== newBudgetId) {
        if (oldBudgetId) {
            await budgetStore.updateBudgetSpent(oldBudgetId, -currentEditExpense.value!.amount);
        }
        if (newBudgetId !== null) {
            await budgetStore.updateBudgetSpent(newBudgetId, editExpenseAmount.value);
        }
    } else if (oldBudgetId && amountDiff !== 0) {
        await budgetStore.updateBudgetSpent(oldBudgetId, amountDiff);
    }
}

/**
 * Opens the delete confirmation dialog for an expense
 * @param {Expense} expense - The expense to be deleted
 */
function openDeleteExpenseDialog(expense: Expense) {
    expenseToDelete.value = expense;
    deleteExpenseDialog.value = true;
}

/**
 * Confirms and executes expense deletion
 * @async
 * @throws {Error} If deletion fails
 */
async function confirmDeleteExpense() {
    if (expenseToDelete.value?.id) {
        await expenseStore.deleteExpense(expenseToDelete.value.id);
        deleteExpenseDialog.value = false;
        expenseToDelete.value = null;
    }
}

/**
 * Computed property to get selected group members
 */
const getSelectedGroupMembers = computed(() => {
    if (!selectedGroupId.value) return [];
    const group = groupStore.groups.find(g => g.id === selectedGroupId.value);
    return group ? group.members : [];
});

/**
 * Computed property that filters expenses
 * Excludes pending shared expenses
 */
const filteredExpenses = computed(() => {
    return expenseStore.expenses
        .filter(expense => {
            if (!expense.isShared) return true;
            return expense.paidBy[authStore.user!.uid]?.paid;
        })
        // Sort by most recent date and time
        .sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);
});

/**
 * Computed property to calculate total expenses
 * Excludes pending shared expenses
 */
const totalExpenses = computed(() => {
    return filteredExpenses.value.reduce((acc, expense) => acc + expense.amount, 0);
});
</script> 