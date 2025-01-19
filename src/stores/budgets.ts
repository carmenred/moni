import { defineStore } from 'pinia';
import { ref } from 'vue';
import { 
    collection, 
    deleteDoc, 
    doc, 
    getDocs, 
    setDoc,
    query,
    where,
    updateDoc
} from 'firebase/firestore';
import { firestore } from '../main';
import { useAuthStore } from './auth';
import type { Budget } from '../types';

// Type for budget creation/update data
type BudgetData = {
    name: string;
    amount: number;
    sharedWithGroup?: boolean;
    groupId?: string | null;
};

export const useBudgetStore = defineStore('budgets', () => {
    /**
     * Store instance for authentication
     */
    const authStore = useAuthStore();

    /**
     * Array of user's budgets
     * @type {Ref<Budget[]>}
     */
    const budgets = ref<Budget[]>([]);

    /**
     * Prepares a budget object for Firestore, omitting undefined/null fields
     * @param {BudgetData} data - The budget data to prepare
     * @param {boolean} isNew - Whether this is a new budget
     * @returns {Partial<Budget>} The prepared budget data
     */
    const prepareBudgetData = (data: BudgetData, isNew = false): Partial<Budget> => {
        const baseData: Partial<Budget> = {
            name: data.name,
            amount: data.amount,
            userId: authStore.user?.uid,
            sharedWithGroup: data.sharedWithGroup ?? false,
        };

        if (isNew) {
            baseData.spent = 0;
            baseData.createdAt = new Date();
        }

        // Only include groupId if it has a valid value
        if (data.groupId) {
            baseData.groupId = data.groupId;
        }

        return baseData;
    };

    /**
     * Creates a new budget
     * @param {Object} budgetData - Budget creation data
     * @param {string} budgetData.name - Budget name
     * @param {number} budgetData.amount - Budget amount limit
     * @param {string} [budgetData.groupId] - Associated group ID
     * @param {boolean} [budgetData.sharedWithGroup] - Whether budget is shared
     * @returns {Promise<void>}
     * @throws {Error} If budget creation fails
     */
    const createBudget = async (budgetData: BudgetData) => {
        if (!authStore.user) return;

        const newBudget = prepareBudgetData(budgetData, true);
        await setDoc(doc(collection(firestore, 'budgets')), newBudget);
        await fetchBudgets();
    };

    /**
     * Fetches all budgets for current user
     * Includes personal and shared group budgets
     * @returns {Promise<void>}
     */
    const fetchBudgets = async () => {
        if (!authStore.user) return;
        
        const userBudgetsQuery = query(
            collection(firestore, 'budgets'),
            where('userId', '==', authStore.user.uid)
        );

        const sharedBudgetsQuery = query(
            collection(firestore, 'budgets'),
            where('sharedWithGroup', '==', true)
        );

        const [userBudgets, sharedBudgets] = await Promise.all([
            getDocs(userBudgetsQuery),
            getDocs(sharedBudgetsQuery)
        ]);

        const budgetsMap = new Map();

        userBudgets.forEach((doc) => {
            budgetsMap.set(doc.id, {
                ...doc.data(),
                id: doc.id,
            });
        });

        sharedBudgets.forEach((doc) => {
            const budgetData = doc.data();
            if (!budgetsMap.has(doc.id) && budgetData.groupId) {
                budgetsMap.set(doc.id, {
                    ...budgetData,
                    id: doc.id,
                });
            }
        });

        budgets.value = Array.from(budgetsMap.values()) as Budget[];
    };

    /**
     * Updates an existing budget
     * @param {string} id - Budget ID to update
     * @param {Partial<Budget>} budgetData - Updated budget data
     * @returns {Promise<void>}
     * @throws {Error} If update fails
     */
    const updateBudget = async (id: string, budgetData: BudgetData) => {
        if (!authStore.user) return;

        const updateData = prepareBudgetData(budgetData);
        await setDoc(doc(collection(firestore, 'budgets'), id), updateData, { merge: true });
        await fetchBudgets();
    };

    /**
     * Updates the spent amount for a budget
     * @param {string} id - Budget ID
     * @param {number} amount - Amount to add to spent total
     * @returns {Promise<void>}
     * @throws {Error} If update fails
     */
    const updateBudgetSpent = async (id: string, amount: number) => {
        const budget = budgets.value.find(b => b.id === id);
        if (!budget) return;

        const newSpent = budget.spent + amount;
        await updateDoc(doc(firestore, 'budgets', id), {
            spent: newSpent
        });
        await fetchBudgets();
    };

    /**
     * Deletes a budget
     * @param {string} id - Budget ID to delete
     * @returns {Promise<void>}
     * @throws {Error} If deletion fails
     */
    const deleteBudget = async (id: string) => {
        await deleteDoc(doc(collection(firestore, 'budgets'), id));
        await fetchBudgets();
    };

    /**
     * Gets budgets for a specific group
     * @param {string} groupId - Group ID to filter by
     * @returns {Budget[]} Filtered budgets
     */
    const getBudgetsByGroupId = (groupId: string) => {
        return budgets.value.filter(budget => budget.groupId === groupId);
    };

    return {
        budgets,
        createBudget,
        fetchBudgets,
        updateBudget,
        updateBudgetSpent,
        deleteBudget,
        getBudgetsByGroupId
    };
}); 