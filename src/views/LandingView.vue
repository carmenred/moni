<template>
    <v-main class="d-flex align-center">
        <v-container>
            <v-row justify="center" align="center">
                <v-col cols="12" sm="12" md="12" lg="4" class="px-0 px-sm-4">
                    <v-card class="bg-grey-lighten-5 mx-auto" style="max-width: 75%;">
                        <v-card-title class="font-weight-bold text-h5 text-blue-grey-darken-3">{{ landingText.title }}</v-card-title>
                        <v-card-subtitle>{{landingText.subtitle}}</v-card-subtitle>

                        <v-card-text>
                            <v-form ref="form">
                                <v-text-field v-if="currentRoute === 'signup'" label="Name" prepend-inner-icon="mdi-account-outline" v-model="name" 
                                :rules="nameRules" variant="outlined" clearable flat></v-text-field>
                                <v-text-field label="Email" prepend-inner-icon="mdi-email-outline" v-model="email" 
                                :rules="emailRules" variant="outlined" clearable flat></v-text-field>
                                <v-text-field :type="showPassword ? 'text' : 'password'" label="Password" prepend-inner-icon="mdi-lock-outline" v-model="password" 
                                :rules="passwordRules" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" @click:append-inner="showPassword = !showPassword"
                                 variant="outlined" clearable flat></v-text-field>
                                <v-btn block color="primary" @click="signInOrSignUp" class="mt-4 font-weight-bold">{{ landingText.button }}</v-btn>

                                <p class="text-red-darken-3">{{ logMsg }}</p>
                            </v-form>

                            <div class="d-flex justify-center text-subtitle-2 text-blue-grey-darken-3 mt-4">{{landingText.underText}}
                                <a class="text-primary font-weight-bold text-decoration-none cursor-pointer ml-1" @click="switchRoute">
                                    {{landingText.link}}</a>
                            </div>
                        </v-card-text>
                    </v-card> 

                </v-col>
            </v-row>
        </v-container>
    </v-main>
</template>

<script setup lang="ts">
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, onMounted, computed } from 'vue';
import router from '../router/router';
import { VForm } from 'vuetify/components';
import { collection, doc, setDoc } from 'firebase/firestore';
import { firestore } from '../main';

const currentRoute = ref(router.currentRoute.value.name);

/**
 * Form and validation state
 */
const form = ref<VForm | null>(null);
const email = ref('');
const password = ref('');
const name = ref('');
const auth = getAuth();

/**
 * Error message state for authentication operations
 */
const logMsg = ref('');
const isLoggedIn = ref(false);
const showPassword = ref(false);

/**
 * Computed properties for landing page text content
 * Changes based on whether user is signing in or signing up
 */
const landingText = computed(() => {
    return currentRoute.value === 'signin' ? {
        title: 'Sign in',
        subtitle: 'Enter your email and password to access your account',
        button: 'Sign In',
        link: 'Sign up',
        underText: 'Don\'t have an account?'
    } : {
        title: 'Sign up',
        subtitle: 'Enter your email and password to create an account',
        button: 'Sign Up',
        link: 'Sign in',
        underText: 'Already have an account?'
    }
});

/**
 * Form validation rules
 */
const emailRules = [
    (v: string) => !!v || 'Email is required',
    (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid',
];

const passwordRules = [
    (v: string) => !!v || 'Password is required',
    (v: string) => v.length >= 8 || 'Password must be at least 8 characters long',
];

const nameRules = [(v: string) => !!v || 'Name is required'];

/**
 * Resets the form fields
 */
const resetFormFields = () => {
    logMsg.value = '';
    form.value?.reset();
}

/**
 * Handles the function to use based on the current route
 * If the route is signin, it will call the sign in function
 * If the route is signup, it will call the sign up function and create a new document in the users collection to store that user's information
 * It also resets the form fields after the action is complete
 */
 const signInOrSignUp = async () => {
    try {
        if (currentRoute.value === "signin") {
            // Sign In
            await signInWithEmailAndPassword(auth, email.value, password.value);
        } else {
            // Sign Up
            const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
            const user = userCredential.user;

            // Save user data to Firestore
            await setDoc(doc(collection(firestore, 'users'), user.uid), {
                email: email.value,
                name: name.value,
                createdAt: new Date().toISOString(),
                id: user.uid,
            });
        }

        resetFormFields();
        router.push("/");
    } catch (error) {
        logMsg.value = "Invalid credentials";
    }
};

/**
 * Switches the route based on the current route
 * It also resets the form fields after the action is complete
 */
const switchRoute = () => {
    currentRoute.value = currentRoute.value === 'signin' ? 'signup' : 'signin';
    router.push(`/${currentRoute.value}`);
    resetFormFields();
}

onMounted(() => {
    // Check if user is logged in, if so, redirect to home
    auth.onAuthStateChanged((user) => {
        if (user) {
            isLoggedIn.value = true;
            router.push('/');
        } else {
            isLoggedIn.value = false;
        }
    });
});
</script>

<style scoped>
</style>