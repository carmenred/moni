<template>
     <v-main class="bg-grey-lighten-5 d-flex justify-center align-center">
        <v-card class="mx-auto pa-4 bg-white w-md-25 w-sm-75 w-100 ma-4">
            <v-card-title class="font-weight-bold text-h5 text-blue-grey-darken-3">{{ landingText.title }}</v-card-title>
            <v-card-subtitle>{{landingText.subtitle}}</v-card-subtitle>

            <v-card-text>
                <v-form ref="form">
                    <v-text-field label="Email" prepend-inner-icon="mdi-email-outline" v-model="email" 
                    :rules="emailRules" variant="outlined" clearable flat></v-text-field>
                    <v-text-field :type="showPassword ? 'text' : 'password'" label="Password" prepend-inner-icon="mdi-lock-outline" v-model="password" 
                    :rules="passwordRules" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" @click:append-inner="showPassword = !showPassword"
                     variant="outlined" clearable flat></v-text-field>
                    <v-btn block color="primary" @click="signInOrSignUp" class="mt-4 font-weight-bold">{{ landingText.button }}</v-btn>
                    <!-- TO DO <v-btn class="mt-2 font-weight-bold" prepend-icon="mdi-google" color="blue-grey-darken-3" 
                    @click="signInWithGoogle" block>Sign in with google</v-btn> -->

                    <p class="text-red-darken-3">{{ logMsg }}</p>
                </v-form>

                <div class="d-flex justify-center text-subtitle-2 text-blue-grey-darken-3 mt-4">{{landingText.underText}}
                    <a class="text-primary font-weight-bold text-decoration-none cursor-pointer ml-1" @click="switchRoute">
                        {{landingText.link}}</a>
                </div>
            </v-card-text>
        </v-card> 

    </v-main>
</template>

<script setup lang="ts">
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, onMounted, computed } from 'vue';
import router from '../router/router';
import { VForm } from 'vuetify/components';

const currentRoute = ref(router.currentRoute.value.name);

const form = ref<VForm | null>(null);
const email = ref('');
const password = ref('');
const auth = getAuth();

const logMsg = ref('');
const isLoggedIn = ref(false);
const showPassword = ref(false);

/**
 * Computed property that returns the landing text based on the current route (sign in or sign up)
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
 * Email and password rules
 */
const emailRules = [
    (v: string) => !!v || 'Email is required',
    (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid',
];

const passwordRules = [
    (v: string) => !!v || 'Password is required',
    (v: string) => v.length >= 8 || 'Password must be at least 8 characters long',
];

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
 * If the route is signup, it will call the sign up function
 * It also resets the form fields after the action is complete
 */
const signInOrSignUp = async () => {
    try {
        const action = currentRoute.value === 'signin' ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
        await action(auth, email.value, password.value);
        resetFormFields();
    } catch (error) {
        logMsg.value = 'Invalid credentials';
    }
}

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