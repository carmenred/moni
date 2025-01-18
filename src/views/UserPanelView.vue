<template>
    <v-card class="bg-grey-lighten-5 pa-4 mt-8 mx-auto w-sm-75 w-100 ma-4">
        <v-card-title class="text-h4 text-blue-grey-darken-3">User Settings</v-card-title>
        
        <!-- Avatar Section -->
        <div class="d-flex justify-center align-center pa-4">
            <v-avatar size="150" class="mb-4">
                <v-img v-if="avatarUrl" :src="avatarUrl" alt="Avatar"></v-img>
                <v-icon v-else size="100" icon="mdi-account-circle"></v-icon>
            </v-avatar>
        </div>
        <div class="d-flex justify-center mb-6">
            <v-file-input
                v-model="avatarFile"
                accept="image/*"
                label="Change avatar"
                prepend-icon="mdi-camera"
                variant="outlined"
                density="compact"
                :rules="fileRules"
                class="max-width-300"
                @update:model-value="handleAvatarChange"
            ></v-file-input>
        </div>

        <v-card-text>
            <v-form ref="form" validate-on="submit lazy" @submit.prevent="submit">
                <v-list>
                    <v-list-item>
                        <v-list-item-title
                            class="text-h6 text-blue-grey-darken-2 font-weight-bold mb-2">Name</v-list-item-title>
                        <v-text-field label="Name" variant="outlined" clearable flat v-model="name"></v-text-field>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-title
                            class="text-h6 text-blue-grey-darken-2 font-weight-bold">Email</v-list-item-title>
                        <v-text-field label="Name" variant="outlined" clearable flat v-model="email"
                            :rules="emailRules"></v-text-field>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-title
                            class="text-h6 text-blue-grey-darken-2 font-weight-bold">Password</v-list-item-title>
                        <v-text-field :type="showPassword ? 'text' : 'password'" label="Password" v-model="password"
                            :rules="passwordRules" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                            @click:append-inner="showPassword = !showPassword" variant="outlined" clearable
                            flat></v-text-field>
                    </v-list-item>
                </v-list>
                <v-btn class="mt-2 bg-primary font-weight-bold float-right" text="Submit" type="submit">SAVE SETTINGS</v-btn>
            </v-form>
        </v-card-text>
    </v-card>

    <v-dialog v-model="showSuccessDialog" width="auto">
        <v-card>
            <v-card-text class="pa-4">
                <div class="d-flex align-center flex-column justify-center">
                    <v-icon color="success" class="mb-2">mdi-check-circle</v-icon>
                    <span>Settings updated successfully</span>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="showSuccessDialog = false">OK</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useProfileStore } from '../stores/profile';

/**
 * Store instances for authentication and profile management
 */
const authStore = useAuthStore();
const profileStore = useProfileStore();

/**
 * Validation rules for password field
 * Requires minimum 8 characters if not empty
 */
const passwordRules = [
    (v: string) => v.length === 0 || v.length >= 8 || 'Password must be at least 8 characters long',
];

/**
 * Validation rules for email field
 * Requires valid email format
 */
const emailRules = [
    (v: string) => !!v || 'Email is required',
    (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid',
];

/**
 * File size validation for avatar upload
 * Maximum size allowed is 5MB
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const fileRules = [
    (files: File[] | null) => {
        if (!files || !files.length) return true;
        const file = files[0];
        return file.size <= MAX_FILE_SIZE || 'File size must be less than 5MB';
    }
];

/**
 * Reactive references for form fields and UI state
 */
const showPassword = ref(false);
const password = ref('');
const email = ref('');
const name = ref('');
const avatarFile = ref<File[] | null>(null);
const avatarUrl = ref<string | null>(null);
const showSuccessDialog = ref(false);

/**
 * Handles avatar file change event
 * Processes and uploads new avatar image
 * 
 * @param files - File or array of files from input
 */
const handleAvatarChange = async (files: File | File[]) => {
    if (!files || !authStore.user) return;
    
    const file = Array.isArray(files) ? files[0] : files;
    if (!file) return;

    try {
        if (file.size > MAX_FILE_SIZE) {
            console.error('File size exceeds 5MB limit');
            return;
        }

        const newAvatarUrl = await profileStore.updateAvatar(authStore.user.uid, file);
        avatarUrl.value = newAvatarUrl;
        
    } catch (error) {
        console.error('Error updating avatar:', error);
    }
};

/**
 * Updates user email in Firebase Auth
 * 
 * @param email - New email address
 * @throws Error if user is not authenticated
 */
const updateEmail = async (email: string) => {
    if (!authStore.user) throw new Error('User not authenticated');
    await authStore.updateEmail(authStore.user, email);
}

/**
 * Updates user password in Firebase Auth
 * Skips if password field is empty
 * 
 * @throws Error if user is not authenticated
 */
const updatePassword = async () => {
    if (!authStore.user) throw new Error('User not authenticated');
    if (password.value === '') return;
    await authStore.updatePassword(authStore.user, password.value);
};

/**
 * Handles form submission
 * Updates user profile information including email and password if changed
 */
const submit = async () => {
    try {
        if (!authStore.user) return;

        if (email.value !== authStore.user.email) {
            await updateEmail(email.value);
        }

        if (password.value) {
            await updatePassword();
        }

        await profileStore.updateProfile(authStore.user.uid, {
            email: email.value,
            name: name.value,
        });

        showSuccessDialog.value = true;
        password.value = '';

    } catch (error) {
        console.error('Error updating user settings:', error);
    }
};

/**
 * Lifecycle hook to load initial user data
 */
onMounted(async () => {
    if (authStore.user) {
        const profile = await profileStore.getUserProfile(authStore.user.uid);
        if (profile) {
            avatarUrl.value = profile.avatarUrl || null;
        }
    }
});

/**
 * Watches for authentication state changes
 * Updates form fields with user data when logged in
 */
watch(() => authStore.isLoggedIn, async (isLoggedIn: boolean) => {
    if (isLoggedIn && authStore.user) {
        email.value = authStore.user.email || '';
        const profile = await profileStore.getUserProfile(authStore.user.uid);
        if (profile) {
            name.value = profile.name || '';
        }
    }
}, { immediate: true });

/**
 * Keeps local avatar in sync with store
 */
watch(() => profileStore.userData?.avatarUrl, (newAvatarUrl) => {
    avatarUrl.value = newAvatarUrl || null;
});

</script>

<style scoped>
.max-width-300 {
    max-width: 300px;
}
</style>