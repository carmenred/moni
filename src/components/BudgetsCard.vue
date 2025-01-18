<template>
    <v-card class="bg-grey-lighten-5 h-100">
        <v-card-title class="d-flex justify-space-between align-center text-h4 text-grey-darken-2">
            Budgets
            <div class="d-flex align-center ga-2">
                <v-tooltip text="View all budgets" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn 
                            color="white" 
                            icon="mdi-format-list-bulleted" 
                            size="small"
                            @click="router.push('/budgets')"
                            v-bind="props"
                        ></v-btn>
                    </template>
                </v-tooltip>
                <v-tooltip text="Add new budget" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn 
                            color="white" 
                            icon="mdi-plus" 
                            size="small" 
                            @click="newBudgetDialog = true"
                            v-bind="props"
                        ></v-btn>
                    </template>
                </v-tooltip>
            </div>
        </v-card-title>
        <v-card-text>
            <v-expansion-panels v-if="filteredBudgets.length">
                <v-expansion-panel v-for="budget in filteredBudgets" :key="budget.id">
                    <v-expansion-panel-title>
                        <div class="d-flex justify-space-between align-center w-100">
                            <span class="text-h6">{{ budget.name }}</span>
                            <span :class="{
                                'text-error': budget.spent > budget.amount,
                                'text-success': budget.spent <= budget.amount
                            }">
                                {{ budget.spent }}€ / {{ budget.amount }}€
                            </span>
                        </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <div class="d-flex flex-column ga-4">
                            <!-- Progress Section -->
                            <div class="budget-progress">
                                <v-progress-linear
                                    :model-value="(budget.spent / budget.amount) * 100"
                                    :color="budget.spent > budget.amount ? 'error' : 'primary'"
                                    height="8"
                                    class="mb-2"
                                ></v-progress-linear>
                                <div class="d-flex justify-space-between text-caption">
                                    <span>Progress</span>
                                    <span>{{ Math.round((budget.spent / budget.amount) * 100) }}%</span>
                                </div>
                            </div>

                            <!-- Details Section -->
                            <div class="budget-details">
                                <div class="d-flex justify-space-between mb-2">
                                    <span>Total Budget:</span>
                                    <span class="font-weight-bold">{{ budget.amount }}€</span>
                                </div>
                                <div class="d-flex justify-space-between mb-2">
                                    <span>Spent Amount:</span>
                                    <span class="font-weight-bold" :class="{
                                        'text-error': budget.spent > budget.amount,
                                        'text-success': budget.spent <= budget.amount
                                    }">{{ budget.spent }}€</span>
                                </div>
                                <div class="d-flex justify-space-between mb-2">
                                    <span>Remaining:</span>
                                    <span class="font-weight-bold" :class="{
                                        'text-error': budget.spent > budget.amount,
                                        'text-success': budget.spent <= budget.amount
                                    }">{{ budget.amount - budget.spent }}€</span>
                                </div>
                                <div class="d-flex justify-space-between mb-2">
                                    <span>Status:</span>
                                    <span class="font-weight-bold" :class="{
                                        'text-error': budget.spent > budget.amount,
                                        'text-success': budget.spent <= budget.amount
                                    }">
                                        {{ budget.spent > budget.amount ? 'Over budget' : 'Within budget' }}
                                    </span>
                                </div>
                                <div class="d-flex justify-space-between">
                                    <span>Created:</span>
                                    <span>{{ 
                                        'seconds' in budget.createdAt 
                                            ? new Date(budget.createdAt.seconds * 1000).toLocaleString('es-ES', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })
                                            : (budget.createdAt as Date).toLocaleString('es-ES', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })
                                    }}</span>
                                </div>
                            </div>

                            <!-- Related Expenses Section -->
                            <div class="budget-expenses" v-if="budget.id && expenseStore.getExpensesByBudget(budget.id).length">
                                <div class="text-subtitle-1 font-weight-bold mb-2">Related Expenses</div>
                                <v-list density="compact">
                                    <v-list-item
                                        v-for="expense in expenseStore.getExpensesByBudget(budget.id)"
                                        :key="expense.id"
                                        :title="expense.name"
                                        :subtitle="new Date(expense.date).toLocaleString('en-GB',
                                            { day: '2-digit', month: '2-digit', year: 'numeric' })"
                                    >
                                        <template v-slot:append>
                                            <span class="text-primary font-weight-bold">{{ expense.amount }}€</span>
                                        </template>
                                    </v-list-item>
                                </v-list>
                            </div>

                            <div class="d-flex mt-4 ga-2">
                                <v-btn 
                                    color="primary" 
                                    style="flex: 1"
                                    @click="openEditBudgetDialog(budget)"
                                    prepend-icon="mdi-pencil"
                                    class="font-weight-bold"
                                >
                                    Edit
                                </v-btn>
                                <v-btn 
                                    color="error" 
                                    style="flex: 1"
                                    @click="openDeleteBudgetDialog(budget)"
                                    prepend-icon="mdi-delete"
                                    class="font-weight-bold"
                                >
                                    Delete
                                </v-btn>
                            </div>
                        </div>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
            <div v-else class="text-center pa-4">No budgets created yet</div>
        </v-card-text>

        <!-- Budget Dialogs -->
        <v-dialog v-model="newBudgetDialog" class="w-100 w-md-50 w-xl-25">
            <v-card class="pa-8">
                <div class="text-h5 mb-4 text-primary">New budget</div>
                <v-form ref="budgetForm">
                    <v-text-field
                        label="Name"
                        v-model="newBudgetName"
                        :rules="nameRules"
                        variant="outlined"
                        clearable
                        flat
                    ></v-text-field>
                    <v-number-input
                        label="Amount"
                        v-model="newBudgetAmount"
                        :rules="amountRules"
                        variant="outlined"
                        clearable
                        flat
                    ></v-number-input>
                    <v-switch
                        v-model="isSharedBudget"
                        label="Share with group"
                        class="mb-4"
                    ></v-switch>

                    <v-select
                        v-if="isSharedBudget"
                        v-model="selectedGroupId"
                        :items="groupStore.groups"
                        item-title="name"
                        item-value="id"
                        label="Select group"
                        variant="outlined"
                        :rules="groupRules"
                        required
                    ></v-select>

                    <v-btn color="primary" block @click="addBudget" class="font-weight-bold">Create Budget</v-btn>
                </v-form>
            </v-card>
        </v-dialog>

        <v-dialog v-model="editBudgetDialog" class="w-100 w-md-50 w-xl-25">
            <v-card class="pa-8">
                <div class="text-h5 mb-4 text-primary">Edit budget</div>
                <v-form ref="editBudgetForm">
                    <v-text-field
                        label="Name"
                        v-model="editBudgetName"
                        :rules="nameRules"
                        variant="outlined"
                        clearable
                        flat
                    ></v-text-field>
                    <v-number-input
                        label="Amount"
                        v-model="editBudgetAmount"
                        :rules="amountRules"
                        variant="outlined"
                        clearable
                        flat
                    ></v-number-input>
                    
                    <v-switch
                        v-model="editIsSharedBudget"
                        label="Share with group"
                        class="mb-4"
                    ></v-switch>

                    <v-select
                        v-if="editIsSharedBudget"
                        v-model="editSelectedGroupId"
                        :items="groupStore.groups"
                        item-title="name"
                        item-value="id"
                        label="Select group"
                        variant="outlined"
                        :rules="groupRules"
                        required
                    ></v-select>

                    <v-btn color="primary" block @click="editBudget" class="font-weight-bold">Save Changes</v-btn>
                </v-form>
            </v-card>
        </v-dialog>

        <v-dialog v-model="deleteBudgetDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h5 pa-4">Delete Budget</v-card-title>
                <v-card-text class="pa-4">
                    Are you sure you want to delete this budget? This action cannot be undone.
                </v-card-text>
                <v-card-actions class="pa-4">
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="deleteBudgetDialog = false" class="font-weight-bold">Cancel</v-btn>
                    <v-btn color="error" @click="confirmDeleteBudget" class="font-weight-bold">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script setup lang="ts">

import { ref } from 'vue';
import { VForm } from 'vuetify/components/VForm';
import { useBudgetStore } from '../stores/budgets';
import { useExpenseStore } from '../stores/expenses';
import type { Budget } from '../types';
import { useGroupStore } from '../stores/groups';
import { useRouter } from 'vue-router';
import { computed } from 'vue';

/**
 * Dialog visibility controls and form data for new budget
 * @type {Ref<boolean>}
 */
const newBudgetDialog = ref(false);
const newBudgetName = ref('');
const newBudgetAmount = ref(0);
const budgetForm = ref<VForm | null>(null);

/**
 * Dialog visibility controls and form data for editing budget
 */
const editBudgetDialog = ref(false);
const editBudgetName = ref('');
const editBudgetAmount = ref(0);
const currentEditBudget = ref<Budget | null>(null);
const editBudgetForm = ref<VForm | null>(null);

/**
 * Dialog visibility controls and data for deleting budget
 */
const deleteBudgetDialog = ref(false);
const budgetToDelete = ref<Budget | null>(null);

/**
 * Store instances for budget and expense management
 */
const budgetStore = useBudgetStore();
const expenseStore = useExpenseStore();
const groupStore = useGroupStore();
const router = useRouter();

/**
 * Form validation rules
 * @type {((v: string | number) => boolean | string)[]}
 */
const nameRules = [(v: string) => !!v || 'Name is required'];
const amountRules = [(v: number) => !!v || 'Amount is required'];
const groupRules = [
    (v: string) => !isSharedBudget.value || !!v || 'Group is required when sharing budget'
];

/**
 * Resets form fields to their initial state
 * @param {VForm | null} formRef - Reference to the form to be reset
 */
const resetFormFields = (formRef: VForm | null) => {
    if (formRef) formRef.reset();
}

/**
 * Creates a new budget with the provided name and amount
 * Validates form data before submission
 * @throws {Error} If validation fails or budget creation fails
 */
async function addBudget() {
    if (!budgetForm.value) return;
    const { valid } = await budgetForm.value.validate();
    if (!valid) return;

    await budgetStore.createBudget({
        name: newBudgetName.value,
        amount: newBudgetAmount.value,
        groupId: isSharedBudget.value ? selectedGroupId.value || undefined : undefined,
        sharedWithGroup: isSharedBudget.value
    });
    
    newBudgetDialog.value = false;
    resetFormFields(budgetForm.value);
    isSharedBudget.value = false;
    selectedGroupId.value = null;
}

/**
 * Opens the edit dialog for a specific budget
 * Populates form with current budget data
 * @param {Budget} budget - The budget to be edited
 */
function openEditBudgetDialog(budget: Budget) {
    editBudgetDialog.value = true;
    editBudgetName.value = budget.name;
    editBudgetAmount.value = budget.amount;
    editIsSharedBudget.value = budget.sharedWithGroup;
    editSelectedGroupId.value = budget.groupId || null;
    currentEditBudget.value = budget;
}

/**
 * Updates an existing budget with new data
 * If sharing is disabled, removes group access
 * @async
 * @throws {Error} If validation fails or update fails
 */
async function editBudget() {
    if (!currentEditBudget.value?.id || !editBudgetForm.value) return;
    
    const { valid } = await editBudgetForm.value.validate();
    if (!valid) return;

    const updateData: Partial<Budget> = {
        name: editBudgetName.value,
        amount: editBudgetAmount.value,
        sharedWithGroup: editIsSharedBudget.value,
        groupId: editIsSharedBudget.value ? editSelectedGroupId.value || undefined : undefined
    };

    await budgetStore.updateBudget(currentEditBudget.value.id, updateData);
    
    editBudgetDialog.value = false;
    currentEditBudget.value = null;
    resetFormFields(editBudgetForm.value);
    editIsSharedBudget.value = false;
    editSelectedGroupId.value = null;
}

/**
 * Opens the delete confirmation dialog for a budget
 * @param {Budget} budget - The budget to be deleted
 */
function openDeleteBudgetDialog(budget: Budget) {
    budgetToDelete.value = budget;
    deleteBudgetDialog.value = true;
}

/**
 * Confirms and executes budget deletion
 * @async
 * @throws {Error} If deletion fails
 */
async function confirmDeleteBudget() {
    if (budgetToDelete.value?.id) {
        await budgetStore.deleteBudget(budgetToDelete.value.id);
        deleteBudgetDialog.value = false;
        budgetToDelete.value = null;
    }
}

/**
 * Add these with the other refs
 */
const isSharedBudget = ref(false);
const selectedGroupId = ref<string | null>(null);

/**
 * Add new refs for edit form
 */
const editIsSharedBudget = ref(false);
const editSelectedGroupId = ref<string | null>(null);

/**
 * Computed property to filter and sort budgets
 * Returns the 10 most recently created budgets
 */
const filteredBudgets = computed(() => {
    return budgetStore.budgets
        .sort((a, b) => {
            const dateA = 'seconds' in a.createdAt 
                ? new Date(a.createdAt.seconds * 1000) 
                : new Date(a.createdAt);
            const dateB = 'seconds' in b.createdAt 
                ? new Date(b.createdAt.seconds * 1000) 
                : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);
});
</script>

<style scoped>
/**
 * Styles for budget sections
 * Provides consistent styling for progress, details, and expenses sections
 */
.budget-progress, .budget-details, .budget-expenses {
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    padding: 16px;
}
</style> 