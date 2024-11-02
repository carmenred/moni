<template>
    <v-main class="d-flex justify-center align-center">

        <v-card class="w-100 w-md-50 w-xl-25 bg-grey-lighten-5 pa-4">
            <v-card-title class="d-flex justify-space-between align-center text-h4 text-grey-darken-2">
                Your expenses
                <v-btn color="white" icon="mdi-plus" size="small" @click="newExpenseDialog = true"></v-btn>
            </v-card-title>
            <v-card-text>
                <v-card class="bg-white-5 mb-4 pa-4">
                    <v-card-title class="text-grey-darken-2">Total expenses</v-card-title>
                    <v-card-text class="text-h3 font-weight-bold text-primary">
                        {{ expenses.reduce((acc, cur) => acc + cur.amount, 0) }}€
                    </v-card-text>
                </v-card>
                <v-card v-for="(expense, index) in expenses" :key="index"
                    class="bg-white mb-4 pa-4 d-flex justify-space-between align-center">
                    <div class="d-flex flex-column">
                        <div class="font-weight-bold text-h6 text-blue-grey-darken-2">{{ expense.name }}</div>
                        <div class="text-caption grey-darken-2">On {{ new Date(expense.date).toLocaleString('en-GB',
                            { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) }}
                        </div>
                    </div>
                    <div class="d-flex flex-row align-center ga-6">
                        <div class="font-weight-bold text-h5 text-primary">{{ expense.amount }}€</div>
                        <v-menu transition="slide-y-transition">
                            <template v-slot:activator="{ props }">
                                <v-btn color="blue-grey-darken-1"
                                    icon="mdi-dots-vertical" size="x-small" v-bind="props"></v-btn>
                                </template>
                            <v-list>
                                <v-list-item class="d-flex flex-column">
                                    <v-list-item-title class="mb-2">
                                        <v-btn prepend-icon="mdi-pencil" @click="openEditExpenseDialog(expense)" block>Edit</v-btn>
                                    </v-list-item-title>
                                    <v-list-item-title>
                                        <v-btn prepend-icon="mdi-trash-can-outline" @click="deleteExpense(expense)" block>Delete</v-btn>
                                    </v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </div>
                </v-card>
            </v-card-text>
        </v-card>

        <v-dialog v-model="newExpenseDialog" class="w-100 w-md-50 w-xl-25">
            <v-card class="pa-8">
                <div class="text-h5 mb-4 text-primary">New expense</div>
                <v-form ref="addForm">
                    <v-text-field label="Name" v-model="newExpenseName" :rules="nameRules" variant="outlined" clearable
                        flat></v-text-field>
                    <v-number-input label="Amount" v-model="newExpenseAmount" :rules="amountRules" variant="outlined"
                        clearable flat></v-number-input>
                    <v-btn color="primary" block @click="addExpense">Add</v-btn>
                </v-form>
            </v-card>
        </v-dialog>

        <v-dialog v-model="editExpenseDialog" class="w-100 w-md-50 w-xl-25">
            <v-card class="pa-8">
                <div class="text-h5 mb-4 text-primary">Edit expense</div>
                <v-form ref="editForm">
                    <v-text-field label="Name" v-model="editExpenseName" :rules="nameRules" variant="outlined" clearable
                        flat></v-text-field>
                    <v-number-input label="Amount" v-model="editExpenseAmount" :rules="amountRules" variant="outlined"
                        clearable flat></v-number-input>
                    <v-btn color="primary" block @click="editExpense">Edit</v-btn>
                </v-form>
            </v-card>
        </v-dialog>

    </v-main>
</template>

<script setup lang="ts">
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { onMounted, ref } from 'vue';
import router from '../router/router';
import { firestore } from '../main';
import { doc, collection, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { VForm } from 'vuetify/components/VForm';

const newExpenseDialog = ref(false);
const newExpenseName = ref('');
const newExpenseAmount = ref(0);
const editExpenseDialog = ref(false);
const editExpenseName = ref('');
const editExpenseAmount = ref(0);
const editExpenseDate = ref('');
const currentEditExpense = ref<Expense | null>(null);
const addForm = ref<VForm | null>(null);
const editForm = ref<VForm | null>(null);
const expenses = ref<Expense[]>([]);

type Expense = {
    name: string;
    amount: number;
    date: string;
    id?: string;
}

// FORMS
const nameRules = [
    (v: string) => !!v || 'Name is required',
];
const amountRules = [
    (v: number) => !!v || 'Amount is required',
];

/**
 * Resets the form fields
 */
const resetFormFields = (formRef: VForm | null) => {
    formRef.value?.reset();
}

/**
 * Adds a new expense to the database
 */
async function addExpense() {
    // Creates a new expense object
    const newExpense = {
        name: newExpenseName.value,
        amount: newExpenseAmount.value,
        date: new Date().toISOString(),
    }
    // Adds the expense to the database
    await setDoc(doc(collection(firestore, 'expenses'), new Date().getTime().toString()), newExpense);
    newExpenseDialog.value = false;
    resetFormFields(addForm);
    // Updates the expenses array
    getExpenses();
}

/**
 * Gets the expenses from the database
 */
async function getExpenses() {
    // Resets the expenses array
    expenses.value = [];
    // Gets the expenses from the database
    const expensesSnapshot = await getDocs(collection(firestore, 'expenses'));
    // Pushes the expenses to the expenses array
    expensesSnapshot.forEach((doc) => {
        expenses.value.push({
            name: doc.data().name,
            amount: doc.data().amount,
            date: doc.data().date,
            id: doc.id
        });
    });
    console.log(expenses.value);
}

/**
 * Opens the edit expense dialog and sets the form fields to the current expense values
 * @param expense the expense to edit
 */
function openEditExpenseDialog(expense: Expense) {
    editExpenseDialog.value = true;
    editExpenseName.value = expense.name;
    editExpenseAmount.value = expense.amount;
    editExpenseDate.value = expense.date;
    currentEditExpense.value = expense;
}

/**
 * Edits the current expense
 */
function editExpense() {
    const id = currentEditExpense.value?.id;
    const newExpense = {
        name: editExpenseName.value,
        amount: editExpenseAmount.value,
        date: editExpenseDate.value,
    }
    setDoc(doc(collection(firestore, 'expenses'), id), newExpense);
    editExpenseDialog.value = false;
    currentEditExpense.value = null;
    resetFormFields(editForm);
    // Updates the expenses array
    getExpenses();
}

function deleteExpense(expense: Expense) {
    const id = expense.id;
    deleteDoc(doc(collection(firestore, 'expenses'), id));
    // Updates the expenses array
    getExpenses();
}

onMounted(() => {
    const auth = getAuth();
    getExpenses();

    /**
     * Checks if the user is logged in
     */
    onAuthStateChanged(auth, (user) => {
        user ? console.log(user) : router.push('/signin');
    });

});
</script>

<style scoped></style>
