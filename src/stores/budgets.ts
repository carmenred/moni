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
     * Creates a new budget
     * @param {Object} budgetData - Budget creation data
     * @param {string} budgetData.name - Budget name
     * @param {number} budgetData.amount - Budget amount limit
     * @param {string} [budgetData.groupId] - Associated group ID
     * @param {boolean} [budgetData.sharedWithGroup] - Whether budget is shared
     * @returns {Promise<void>}
     * @throws {Error} If budget creation fails
     */
    const createBudget = async (budgetData: {
        name: string;
        amount: number;
        groupId?: string;
        sharedWithGroup?: boolean;
    }) => {
        if (!authStore.user) return;

        const newBudget: Budget = {
            name: budgetData.name,
            amount: budgetData.amount,
            spent: 0,
            userId: authStore.user.uid,
            sharedWithGroup: budgetData.sharedWithGroup || false,
            groupId: budgetData.groupId,
            createdAt: new Date()
        };

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
    const updateBudget = async (id: string, budgetData: Partial<Budget>) => {
        await setDoc(doc(collection(firestore, 'budgets'), id), {
            ...budgetData,
            userId: authStore.user?.uid
        }, { merge: true });
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