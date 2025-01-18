import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    type User,
    updateEmail as firebaseUpdateEmail,
    updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { auth } from '../main';
import { collection, query, where, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../main';
import type { UserType } from '../types';

export const useAuthStore = defineStore('auth', () => {
    /**
     * Current authenticated user
     * @type {Ref<User | null>}
     */
    const user = ref<User | null>(null);

    /**
     * Authentication loading state
     * @type {Ref<boolean>}
     */
    const loading = ref(true);

    /**
     * Computed property to check if user is logged in
     * @returns {boolean} True if user is authenticated
     */
    const isLoggedIn = computed(() => !!user.value);

    /**
     * Initializes auth state listener
     * Sets up Firebase auth state change subscription
     */
    const init = () => {
        onAuthStateChanged(auth, (userData) => {
            user.value = userData;
            loading.value = false;
        });
    };

    /**
     * Signs in a user with email and password
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @returns {Promise<void>}
     * @throws {Error} If sign in fails
     */
    const signIn = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            user.value = userCredential.user;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    /**
     * Creates a new user account
     * @param {string} email - New user's email address
     * @param {string} password - New user's password
     * @returns {Promise<void>}
     * @throws {Error} If account creation fails
     */
    const signUp = async (email: string, password: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            user.value = userCredential.user;
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    };

    /**
     * Signs out the current user
     * @returns {Promise<void>}
     * @throws {Error} If sign out fails
     */
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            user.value = null;
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    /**
     * Searches users by email
     * @param {string} email - Email to search for
     * @returns {Promise<UserType[]>} Array of matching users
     */
    const searchUsersByEmail = async (email: string) => {
        if (!email) return [];
        
        const q = query(
            collection(firestore, 'users'),
            where('email', '>=', email),
            where('email', '<=', email + '\uf8ff')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map(doc => ({
                ...doc.data(),
                id: doc.id
            }))
            .filter(user => user.id !== auth.currentUser?.uid) as UserType[];
    };

    /**
     * Gets user details by array of IDs
     * @param {string[]} userIds - Array of user IDs to fetch
     * @returns {Promise<UserType[]>} Array of user details
     */
    const getUsersByIds = async (userIds: string[]) => {
        if (!userIds.length) return [];
        
        const users: UserType[] = [];
        
        for (const userId of userIds) {
            const userDoc = await getDoc(doc(firestore, 'users', userId));
            if (userDoc.exists()) {
                users.push({
                    ...userDoc.data(),
                    id: userDoc.id,
                    userId: userDoc.id
                } as UserType);
            }
        }
        
        return users;
    };

    /**
     * Updates user's email address
     * @param {User} user - Current user
     * @param {string} newEmail - New email address
     * @returns {Promise<void>}
     * @throws {Error} If email update fails
     */
    const updateEmail = async (user: User, newEmail: string) => {
        await firebaseUpdateEmail(user, newEmail);
        await updateDoc(doc(firestore, 'users', user.uid), {
            email: newEmail
        });
    };

    /**
     * Updates user's password
     * @param {User} user - Current user
     * @param {string} newPassword - New password
     * @returns {Promise<void>}
     */
    const updatePassword = async (user: User, newPassword: string) => {
        await firebaseUpdatePassword(user, newPassword);
    };

    /**
     * Gets user data from Firestore
     * @param {User} user - User to get data for
     * @returns {Promise<UserType>} User data
     */
    const getUserData = async (user: User) => {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        return userDoc.data() as UserType;
    };

    return {
        user,
        loading,
        isLoggedIn,
        init,
        signIn,
        signUp,
        signOut,
        searchUsersByEmail,
        getUsersByIds,
        updateEmail,
        updatePassword,
        getUserData
    };
});