<template>
  <!-- v-app so that vuetify styles are applied through the app -->
  <v-app class="bg-white px-2 px-sm-8">
    <!-- Topbar -->
    <v-app-bar app flat color="primary">
      <template v-slot:prepend>
        <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      </template>
      <v-toolbar-title class="text-h5">{{ title }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <div v-if="authStore.isLoggedIn" class="d-flex align-center pr-4">
        <span class="text-h6 color-primary d-none d-sm-flex pr-4">
          {{ welcomeMsg }}
        </span>
        <v-menu transition="slide-y-transition">
          <template v-slot:activator="{ props }">
            <v-avatar size="32" class="mr-2 cursor-pointer" v-bind="props">
              <v-img v-if="userData?.avatarUrl" :src="userData.avatarUrl" alt="Avatar"></v-img>
              <v-icon v-else color="white">mdi-account-circle</v-icon>
            </v-avatar>
          </template>
          <v-list>
            <v-list-item class="d-flex flex-column">
              <v-list-item-title class="mb-2">
                <v-btn prepend-icon="mdi-pencil" @click="router.push('/settings')" block>Edit account</v-btn>
              </v-list-item-title>
              <v-list-item-title>
                <v-btn prepend-icon="mdi-account" @click="router.push('/profile')" block>View profile</v-btn>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>

    <!-- Sidebar -->
    <v-navigation-drawer app rail v-model="drawer" class="d-flex justify-center align-center pa-1 bg-primary">
      <template v-if="isLoggedIn">
        <v-tooltip text="Home">
          <template v-slot:activator="{ props }">
            <v-btn @click="router.push('/')" icon="mdi-home" flat class="bg-transparent" v-bind="props"></v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Groups">
          <template v-slot:activator="{ props }">
            <v-btn @click="router.push('/groups')" icon="mdi-account-group" flat class="bg-transparent" v-bind="props"></v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Statistics">
          <template v-slot:activator="{ props }">
            <v-btn @click="router.push('/stats')" icon="mdi-chart-bar" flat class="bg-transparent" v-bind="props"></v-btn>
          </template>
        </v-tooltip>
      </template>
      <v-tooltip :text="signInOrSignUpText">
        <template v-slot:activator="{ props }">
          <v-btn @click="signInOrSignUp" :icon="logIcon" flat class="bg-transparent" v-bind="props"></v-btn>
        </template>
      </v-tooltip>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import router from './router/router';
import { useAuthStore } from './stores/auth';
import { useProfileStore } from './stores/profile';

/**
 * Store instances for managing authentication and user profile
 * Handles global app state and user session management
 */
const authStore = useAuthStore();
const profileStore = useProfileStore();

/**
 * Computes the current page title from route name
 * Capitalizes first letter for display
 * 
 * @returns {string} Formatted page title
 */
const title = computed(() => {
  const routeName = router.currentRoute.value.name?.toString() || '';
  return routeName.charAt(0).toUpperCase() + routeName.slice(1);
});

/**
 * Navigation drawer state
 * Controls sidebar visibility
 */
const drawer = ref(false);

/**
 * Computed property for user authentication state
 * @returns {boolean} True if user is authenticated
 */
const isLoggedIn = computed(() => !!authStore.user);

/**
 * Extracts username from user's email address
 * Takes the portion before the @ symbol
 * 
 * @returns {string | null} Username or null if not logged in
 */
const userEmail = computed(() => 
  authStore.user?.email 
    ? authStore.user.email.slice(0, authStore.user.email.indexOf('@')) 
    : null
);

/**
 * Computes text for authentication button
 * Changes based on login state
 * 
 * @returns {string} "Sign out" if logged in, "Sign in" otherwise
 */
const signInOrSignUpText = computed(() => {
  return isLoggedIn.value ? 'Sign out' : 'Sign in';
});

/**
 * Computes welcome message for user
 * Personalizes message with username when logged in
 * 
 * @returns {string} Personalized welcome message or default text
 */
const welcomeMsg = computed(() => {
  return isLoggedIn.value ? `Welcome, ${userEmail.value}` : 'Not logged in';
});

/**
 * Computes icon for authentication button
 * Changes based on login state
 * 
 * @returns {string} Icon name for current auth state
 */
const logIcon = computed(() => {
  return isLoggedIn.value ? 'mdi-logout' : 'mdi-login';
});

/**
 * Handles authentication button click
 * Routes to sign in or triggers logout based on current state
 */
const signInOrSignUp = () => {
  isLoggedIn.value ? logout() : router.push('/signin');
};

/**
 * Handles user logout process
 * Signs out user and redirects to sign in page
 * 
 * @throws {Error} If logout operation fails
 */
const logout = async () => {
  try {
    await authStore.signOut();
    router.push('/signin');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

/**
 * Computed property for current user data
 * @returns {UserType | null} Current user profile data
 */
const userData = computed(() => profileStore.userData);

/**
 * Loads user profile data including avatar
 * Called on mount and auth state changes
 * 
 * @async
 */
const loadUserData = async () => {
  if (authStore.user) {
    await profileStore.getUserProfile(authStore.user.uid);
  }
};

// Lifecycle hooks and watchers
onMounted(loadUserData);

/**
 * Watches for authentication state changes
 * Updates user profile data accordingly
 */
watch(() => authStore.isLoggedIn, async (isLoggedIn) => {
  if (isLoggedIn) {
    await loadUserData();
  } else {
    profileStore.userData = null;
  }
}, { immediate: true });

// Initialize authentication state
authStore.init();
</script>

<style scoped>
.v-text-field .v-input__control {
  border: 1px solid #c01dd2;
  color: #99abb4;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
