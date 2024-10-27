<template>
  <v-app class="bg-blue-grey-lighten-5 pa-8">

    <v-app-bar flat color="white">
      <v-toolbar-title class="text-h5 text-primary">{{ title }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <template v-slot:prepend>
        <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer" color="primary"></v-app-bar-nav-icon>
      </template>
    </v-app-bar>

    <v-navigation-drawer rail v-model="drawer" class="d-flex justify-center align-center pa-1">
      <v-btn @click="signInOrSignUp" :icon="logIcon" flat class="text-primary"></v-btn>
    </v-navigation-drawer>

    <RouterView />
  </v-app>
</template>

<script setup lang="ts">
import { getAuth, signOut } from 'firebase/auth';
import router from './router/router';
// import { useRoute } from 'vue-router';
import { ref, onMounted, computed, watch } from 'vue';
import { auth } from './main';

// const route = useRoute();

const userEmail = ref<string | null | undefined>(null);
const signInOrSignUp = () => {
  isLoggedIn.value ? logout() : router.push('/signin');
};
const isLoggedIn = ref<boolean | null>(null);

const title = ref("Moni");
const logIcon = computed(() => {
  return isLoggedIn.value === true ? 'mdi-logout' : 'mdi-login';
});
const drawer = ref(false);

const logout = () => {
  const auth = getAuth();
  signOut(auth).then(() => {
    router.push('/signin');
    isLoggedIn.value = false;
  });
};

// watch(() => route, (newPath) => {
//   switch (newPath.path) {
//     case '/': title.value = "Moni"; break;
//     case '/signin': title.value = "Sign In"; break;
//     case '/signup': title.value = "Sign Up"; break;
//     case '/home': title.value = "Dashboard"; break;
//   }
// });

onMounted(() => {
  auth.onAuthStateChanged((user) => {
    isLoggedIn.value = !!user;
    userEmail.value = user?.email;
  });
});

</script>

<style scoped>
.v-text-field .v-input__control {
  border: 1px solid #c01dd2;
  color: #99abb4;
}
</style>
