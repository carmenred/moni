<template>
    <v-main>
        HOME VIEW
    </v-main>
</template>

<script setup lang="ts">
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { onMounted } from 'vue';
import router from '../router/router';

onMounted(() => {
    const auth = getAuth();

    onAuthStateChanged(auth, (user) => {
        user ? console.log(user) : router.push('/login');
    });

});
</script>

<style scoped></style>
