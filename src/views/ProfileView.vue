<template>
  <v-container v-if="userData" class="max-w-[600px]">
    <!-- Avatar Display -->
    <v-card class="mb-4 bg-grey-lighten-5">
      <v-card-text class="d-flex flex-column align-center justify-center">
        <v-card-title class="text-subtitle-1 text-grey-darken-1 text-center">User Avatar</v-card-title>
        <v-avatar size="150">
          <v-img v-if="userData.avatarUrl" :src="userData.avatarUrl" alt="Avatar"></v-img>
          <v-icon v-else size="100" icon="mdi-account-circle"></v-icon>
        </v-avatar>
      </v-card-text>
    </v-card>

    <v-card class="mb-4 bg-grey-lighten-5">
      <v-card-title class="text-subtitle-1 text-grey-darken-1">
        Name
      </v-card-title>
      <v-card-text class="text-h6">
        {{ userData.name }}
      </v-card-text>
    </v-card>

    <v-card class="bg-grey-lighten-5">
      <v-card-title class="text-subtitle-1 text-grey-darken-1">
        Email
      </v-card-title>
      <v-card-text class="text-h6">
        {{ userData.email }}
      </v-card-text>
    </v-card>
  </v-container>
  <div v-else-if="authStore.loading" class="text-h5 text-center">Loading user information...</div>
  <div v-else class="text-h5 text-center">User not found</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../main';
import { useAuthStore } from '../stores/auth';
import { UserType } from '../types';

/**
 * Router and store instances
 */
const router = useRouter();
const authStore = useAuthStore();

/**
 * User profile data state
 * @type {Ref<UserType | null>}
 */
const userData = ref<UserType | null>(null);

/**
 * Lifecycle hook to load initial user data
 * Redirects to signin if user is not authenticated
 */
onMounted(async () => {
    if (!authStore.user) {
        router.push('/signin');
        return;
    }

    try {
        const userDocRef = doc(firestore, 'users', authStore.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            userData.value = userDoc.data() as UserType;
        } else {
            console.error('User document not found in Firestore');
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
});
</script>
