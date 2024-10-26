<template>
        
        <v-main>
            <v-navigation-drawer expand-on-hover rail></v-navigation-drawer>
            LOGIN VIEW

        <v-form class="d-flex justify-center align-center" v-if="!isLoggedIn">
            <v-card width="40%" class="pa-4 d-flex flex-column">
                <v-text-field label="Email" v-model="email" />
                <v-text-field label="Password" v-model="password" />
                <v-btn @click="signIn">Sign in</v-btn>
                <p>{{ logMsg }}</p>
            </v-card>
        </v-form>

        <v-card class="d-flex justify-center align-center" v-if="isLoggedIn">
            <h1>Welcome {{ auth.currentUser?.email }}</h1>
        </v-card>
    </v-main>
</template>

<script setup lang="ts">
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, onMounted } from 'vue';

const email = ref('');
const password = ref('');
const auth = getAuth();

const logMsg = ref('');
const isLoggedIn = ref(false);

onMounted(() => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            isLoggedIn.value = true;
        } else {
            isLoggedIn.value = false;
        }
    });
});

const signIn = async () => {
    try {
        await signInWithEmailAndPassword(auth, email.value, password.value);
        logMsg.value = 'Signed in successfully';
        isLoggedIn.value = true;
    } catch (error) {
        logMsg.value = 'Invalid credentials';
    }
}

</script>