<template>
    <v-main class="d-flex justify-center align-center">
        <h1>Home View</h1>
    </v-main>
</template>

<script setup lang="ts">
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { onMounted } from 'vue';
import router from '../router/router';


onMounted(() => {
    const auth = getAuth();

    onAuthStateChanged(auth, (user) => {
        user ? console.log(user) : router.push('/signin');
    });

});
</script>

<style scoped></style>
