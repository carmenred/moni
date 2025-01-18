import { defineStore } from 'pinia';
import { ref } from 'vue';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../main';
import { UserType } from '../types';
import imageCompression from 'browser-image-compression';

/**
 * Store for managing user profile operations
 * Handles avatar updates, profile data, and user information
 */
export const useProfileStore = defineStore('profile', () => {
    /**
     * Current user profile data
     */
    const userData = ref<UserType | null>(null);

    /**
     * Processes and compresses an image file
     * Converts to WebP format and optimizes for storage
     * 
     * @param file - The image file to process
     * @returns Promise containing the base64 string of the processed image
     * @throws Error if image processing fails
     */
    const processImage = async (file: File): Promise<string> => {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 800,
            useWebWorker: true,
            fileType: 'image/webp'
        };

        try {
            const compressedFile = await imageCompression(file, options);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(compressedFile);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
            });
        } catch (error) {
            console.error('Error processing image:', error);
            throw error;
        }
    };

    /**
     * Updates user's avatar
     * Processes the image and saves it to Firestore
     * 
     * @param userId - The ID of the user
     * @param file - The image file to use as avatar
     * @returns Promise containing the base64 string of the processed image
     * @throws Error if avatar update fails
     */
    const updateAvatar = async (userId: string, file: File) => {
        try {
            const base64Image = await processImage(file);
            const userDocRef = doc(firestore, 'users', userId);
            await setDoc(userDocRef, {
                avatarUrl: base64Image
            }, { merge: true });
            
            // Update local state immediately after successful upload
            if (userData.value) {
                userData.value = {
                    ...userData.value,
                    avatarUrl: base64Image
                };
            }
            
            return base64Image;
        } catch (error) {
            console.error('Error updating avatar:', error);
            throw error;
        }
    };

    /**
     * Updates user profile information
     * Merges new data with existing profile in Firestore
     * 
     * @param userId - The ID of the user
     * @param data - Partial user data to update
     * @throws Error if profile update fails
     */
    const updateProfile = async (userId: string, data: Partial<UserType>) => {
        try {
            const userDocRef = doc(firestore, 'users', userId);
            await setDoc(userDocRef, {
                ...data,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    /**
     * Retrieves user profile data from Firestore
     * Updates local userData state with fetched data
     * 
     * @param userId - The ID of the user
     * @returns Promise containing the user data or null if not found
     * @throws Error if profile fetch fails
     */
    const getUserProfile = async (userId: string) => {
        try {
            const userDoc = await getDoc(doc(firestore, 'users', userId));
            if (userDoc.exists()) {
                userData.value = userDoc.data() as UserType;
                return userData.value;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    };

    return {
        userData,
        updateAvatar,
        updateProfile,
        getUserProfile
    };
}); 