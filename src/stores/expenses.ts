import { defineStore } from 'pinia';
import { ref } from 'vue';
import { 
    collection, 
    deleteDoc, 
    doc, 
    getDocs, 
    setDoc, 
    updateDoc,
    query,
    where
} from 'firebase/firestore';
import { firestore } from '../main';
import { useAuthStore } from './auth';
import type { Expense } from '../types';
import { useBudgetStore } from './budgets';
import { useGroupStore } from './groups';

export const useExpenseStore = defineStore('expenses', () => {
    /**
     * Store instances for related functionality
     */
    const authStore = useAuthStore();
    const budgetStore = useBudgetStore();
    const groupStore = useGroupStore();

    /**
     * Array of user's expenses
     * @type {Ref<Expense[]>}
     */
    const expenses = ref<Expense[]>([]);

    /**
     * Creates a new expense
     * @param {Object} expenseData - Expense creation data
     * @param {string} expenseData.name - Expense name
     * @param {number} expenseData.amount - Expense amount
     * @param {string} expenseData.date - Expense date
     * @param {string} [expenseData.budgetId] - Associated budget ID
     * @param {boolean} [expenseData.isShared] - Whether expense is shared
     * @param {string} [expenseData.groupId] - Associated group ID
     * @returns {Promise<void>}
     * @throws {Error} If expense creation fails
     */
    const addExpense = async (expenseData: {
        name: string;
        amount: number;
        date: string;
        budgetId?: string;
        isShared?: boolean;
        groupId?: string;
    }) => {
        if (!authStore.user) return;

        const group = expenseData.groupId ? 
            groupStore.groups.find(g => g.id === expenseData.groupId) : null;

        const paidBy: { [key: string]: { paid: boolean; amount: number } } = {};
        
        if (expenseData.isShared && group) {
            const splitAmount = expenseData.amount / group.members.length;
            group.members.forEach(memberId => {
                paidBy[memberId] = {
                    paid: memberId === authStore.user!.uid,
                    amount: splitAmount
                };
            });
        }
        
        const newExpense: any = {
            name: expenseData.name,
            amount: expenseData.amount,
            date: expenseData.date,
            userId: authStore.user.uid,
            isShared: expenseData.isShared || false,
            paidBy: Object.keys(paidBy).length > 0 ? paidBy : {}
        };

        if (expenseData.budgetId) {
            newExpense.budgetId = expenseData.budgetId;
        }

        if (expenseData.groupId) {
            newExpense.groupId = expenseData.groupId;
            newExpense.splitAmount = expenseData.amount / (group?.members.length || 1);
        }

        const docRef = await setDoc(doc(collection(firestore, 'expenses')), newExpense);
        
        if (expenseData.budgetId) {
            await budgetStore.updateBudgetSpent(expenseData.budgetId, expenseData.amount);
        }

        await fetchExpenses();
        return docRef;
    };

    /**
     * Fetches all expenses for current user
     * Includes personal and shared group expenses
     * @returns {Promise<void>}
     */
    const fetchExpenses = async () => {
        if (!authStore.user) return;
        expenses.value = [];
        
        // Get user's groups
        await groupStore.fetchUserGroups();
        const userGroupIds = groupStore.groups.map(group => group.id!);

        // Query for user's own expenses
        const userExpensesQuery = query(
            collection(firestore, 'expenses'),
            where('userId', '==', authStore.user.uid)
        );

        // Query for shared expenses if user is in any groups
        let sharedExpensesQuery;
        if (userGroupIds.length > 0) {
            sharedExpensesQuery = query(
                collection(firestore, 'expenses'),
                where('groupId', 'in', userGroupIds)
            );
        }

        const [userExpensesSnapshot] = await Promise.all([
            getDocs(userExpensesQuery),
            ...(sharedExpensesQuery ? [getDocs(sharedExpensesQuery)] : [])
        ]);

        const expensesMap = new Map();

        userExpensesSnapshot.forEach(doc => {
            expensesMap.set(doc.id, {
                ...doc.data(),
                id: doc.id,
            });
        });

        if (sharedExpensesQuery) {
            const sharedExpensesSnapshot = await getDocs(sharedExpensesQuery);
            sharedExpensesSnapshot.forEach(doc => {
                if (!expensesMap.has(doc.id)) {
                    expensesMap.set(doc.id, {
                        ...doc.data(),
                        id: doc.id,
                    });
                }
            });
        }

        expenses.value = Array.from(expensesMap.values()) as Expense[];
    };

    /**
     * Updates an existing expense
     * @param {string} id - Expense ID to update
     * @param {Partial<Expense>} expenseData - Updated expense data
     * @returns {Promise<void>}
     * @throws {Error} If update fails
     */
    const updateExpense = async (id: string | undefined, expenseData: Partial<Expense>) => {
        if (!id || !authStore.user) return;
        
        // Get the current expense data
        const currentExpense = expenses.value.find(e => e.id === id);
        if (!currentExpense) return;

        // Create the updated expense object
        const updatedExpense = {
            ...currentExpense,
            ...expenseData,
            userId: authStore.user.uid,
            // Explicitly set budgetId to undefined if it's not provided
            budgetId: expenseData.budgetId === undefined ? currentExpense.budgetId : expenseData.budgetId
        };

        // If budgetId is explicitly set to undefined (cleared in form), remove it from the object
        if (expenseData.budgetId === undefined) {
            delete updatedExpense.budgetId;
        }
        
        await setDoc(doc(collection(firestore, 'expenses'), id), updatedExpense);
        await fetchExpenses();
    };

    /**
     * Deletes an expense
     * @param {string} id - Expense ID to delete
     * @returns {Promise<void>}
     * @throws {Error} If deletion fails
     */
    const deleteExpense = async (id: string | undefined) => {
        if (!id) return;
        await deleteDoc(doc(collection(firestore, 'expenses'), id));
        await fetchExpenses();
    };

    /**
     * Gets expenses for a specific budget
     * @param {string} budgetId - Budget ID to filter by
     * @returns {Expense[]} Filtered expenses
     */
    const getExpensesByBudget = (budgetId: string | undefined) => {
        if (!budgetId) return [];
        return expenses.value.filter(expense => expense.budgetId === budgetId);
    };

    /**
     * Gets pending shared expenses for current user
     * @returns {Expense[]} Pending shared expenses
     */
    const getPendingSharedExpenses = () => {
        if (!authStore.user) return [];
        const userId = authStore.user.uid;
        return expenses.value.filter(expense => 
            expense.isShared && 
            expense.paidBy[userId] && 
            !expense.paidBy[userId].paid
        );
    };

    /**
     * Marks a shared expense as paid by current user
     * @param {string} expenseId - Expense ID to mark as paid
     * @returns {Promise<void>}
     * @throws {Error} If update fails
     */
    const markExpenseAsPaid = async (expenseId: string) => {
        if (!authStore.user || !expenseId) return;

        const expense = expenses.value.find(e => e.id === expenseId);
        if (!expense) return;

        const updatedPaidBy = {
            ...expense.paidBy,
            [authStore.user.uid]: {
                ...expense.paidBy[authStore.user.uid],
                paid: true
            }
        };

        await updateDoc(doc(firestore, 'expenses', expenseId), {
            paidBy: updatedPaidBy
        });

        await fetchExpenses();
    };

    return {
        expenses,
        addExpense,
        fetchExpenses,
        updateExpense,
        deleteExpense,
        getExpensesByBudget,
        getPendingSharedExpenses,
        markExpenseAsPaid
    };
}); 