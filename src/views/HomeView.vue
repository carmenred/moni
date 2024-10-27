<template>
    <v-main class="d-flex justify-center align-center">
        
        <v-card class="w-100 w-md-50 w-xl-25">
            <v-card-title class="d-flex justify-space-between align-center text-h4">
                Your expenses 
                <v-btn color="primary" icon="mdi-plus" @click="newExpenseDialog = true"></v-btn>
            </v-card-title>
            <v-card-text>
                <v-list class="d-flex flex-column gap-2">
                    <v-list-item v-for="(expense, index) in expenses" :key="index">
                        <div class="d-flex justify-space-between align-center bg-primary rounded-pill px-8 py-4">
                            <div class="d-flex flex-column">
                                <div class="font-weight-bold text-h6">{{ expense.name }}</div>
                                <div class="text-caption">On {{ new Date(expense.date).toLocaleString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) }}</div>
                            </div>
                            <div class="font-weight-bold text-h6">- {{ expense.amount }}€</div>
                        </div>
                    </v-list-item>
                </v-list>
            </v-card-text>
        </v-card>

        <v-dialog v-model="newExpenseDialog" class="w-100 w-md-50 w-xl-25">
            <v-card class="pa-8">
                <div class="text-h5 mb-4 text-primary">New expense</div>
                <v-form ref="form">
                    <v-text-field label="Name" v-model="newExpenseName" :rules="nameRules" 
                    variant="outlined" clearable flat></v-text-field>
                    <v-number-input label="Amount" v-model="newExpenseAmount" :rules="amountRules" 
                    variant="outlined" clearable flat></v-number-input>
                    <v-btn color="primary" block @click="addExpense">Add</v-btn>
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
import { doc, collection, setDoc, getDocs } from 'firebase/firestore';
import { VForm } from 'vuetify/components/VForm';

const newExpenseDialog = ref(false);
const newExpenseName = ref('');
const newExpenseAmount = ref(0);
const form = ref<VForm | null>(null);
const expenses = ref<Expense[]>([]);

type Expense = {
    name: string;
    amount: number;
    date: string;
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
 const resetFormFields = () => {
    form.value?.reset();
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
    resetFormFields();
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
        });
    });
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
