<script setup lang="ts">
import { getAuth, signOut } from 'firebase/auth';
import router from './router/router';
import { ref, onMounted, computed } from 'vue';
import { auth } from './main';

const logout = () => {
  const auth = getAuth();
  signOut(auth).then(() => {
    router.push('/signin');
    isLoggedIn.value = false;
  });
};

const signInOrSignUp = () => {
  isLoggedIn.value ? logout() : router.push('/signin');
};

const isLoggedIn = ref<boolean | null>(null);

const logIcon = computed(() => {
  return isLoggedIn.value === true ? 'mdi-logout' : 'mdi-login';
});

const drawer = ref(false);

onMounted(() => {
  auth.onAuthStateChanged((user) => {
    isLoggedIn.value = !!user;
  });
});

</script>

<template>
  <v-app class="bg-blue-grey-lighten-5">

    <v-app-bar flat color="white">
      <v-toolbar-title class="text-h5 text-primary">Moni</v-toolbar-title>
      <v-spacer></v-spacer>
      <template v-slot:prepend>
        <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer" color="primary"></v-app-bar-nav-icon>
      </template>
    </v-app-bar>

    <v-navigation-drawer rail v-model="drawer" class="d-flex justify-center align-center pa-1">
      <v-btn @click="signInOrSignUp" :icon="logIcon" flat class="bg-primary"></v-btn>
    </v-navigation-drawer>

    
    <RouterView />
  </v-app>
</template>

<style scoped>
.v-text-field .v-input__control {
  border: 1px solid #c01dd2;
  color: #99abb4;
}
</style>
