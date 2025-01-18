import { defineStore } from 'pinia';
import { ref } from 'vue';
import { 
    collection, 
    deleteDoc, 
    doc, 
    getDocs, 
    setDoc,
    query,
    where
} from 'firebase/firestore';
import { firestore } from '../main';
import { useAuthStore } from './auth';
import type { Income } from '../types';

export const useIncomeStore = defineStore('income', () => {
    /**
     * Store instance for authentication
     */
    const authStore = useAuthStore();

    /**
     * Array of user's income records
     * @type {Ref<Income[]>}
     */
    const incomes = ref<Income[]>([]);

    /**
     * Creates a new income record
     * @param {Object} incomeData - Income creation data
     * @param {string} incomeData.name - Income name/description
     * @param {number} incomeData.amount - Income amount
     * @param {Date} incomeData.date - Income date
     * @returns {Promise<void>}
     * @throws {Error} If income creation fails
     */
    const createIncome = async (incomeData: { 
        name: string; 
        amount: number;
        date: Date;
    }) => {
        if (!authStore.user) return;

        const newIncome: Income = {
            ...incomeData,
            userId: authStore.user.uid,
            createdAt: new Date()
        };

        await setDoc(doc(collection(firestore, 'incomes')), newIncome);
        await fetchIncomes();
    };

    /**
     * Fetches all income records for current user
     * @returns {Promise<void>}
     */
    const fetchIncomes = async () => {
        if (!authStore.user) return;
        
        const userIncomesQuery = query(
            collection(firestore, 'incomes'),
            where('userId', '==', authStore.user.uid)
        );

        const querySnapshot = await getDocs(userIncomesQuery);
        incomes.value = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            date: doc.data().date.toDate()
        })) as Income[];
    };

    /**
     * Updates an existing income record
     * @param {string} id - Income ID to update
     * @param {Partial<Income>} incomeData - Updated income data
     * @returns {Promise<void>}
     * @throws {Error} If update fails
     */
    const updateIncome = async (id: string, incomeData: Partial<Income>) => {
        await setDoc(doc(collection(firestore, 'incomes'), id), incomeData, { merge: true });
        await fetchIncomes();
    };

    /**
     * Deletes an income record
     * @param {string} id - Income ID to delete
     * @returns {Promise<void>}
     * @throws {Error} If deletion fails
     */
    const deleteIncome = async (id: string) => {
        await deleteDoc(doc(collection(firestore, 'incomes'), id));
        await fetchIncomes();
    };

    /**
     * Gets monthly income totals for the last 5 months
     * @returns {[string, number][]} Array of [month-year, total] pairs
     */
    const getMonthlyTotals = () => {
        const monthlyTotals = new Map<string, number>();
        
        incomes.value.forEach(income => {
            const monthYear = new Date(income.date).toLocaleString('en', {
                month: 'long',
                year: 'numeric'
            });
            
            const currentTotal = monthlyTotals.get(monthYear) || 0;
            monthlyTotals.set(monthYear, currentTotal + income.amount);
        });

        return Array.from(monthlyTotals.entries())
            .sort((a, b) => {
                const dateA = new Date(a[0]);
                const dateB = new Date(b[0]);
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5);
    };

    return {
        incomes,
        createIncome,
        fetchIncomes,
        updateIncome,
        deleteIncome,
        getMonthlyTotals
    };
}); 