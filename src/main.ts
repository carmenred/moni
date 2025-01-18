import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css'
import { VNumberInput } from 'vuetify/labs/components';
import { createApp } from "vue";
import { createVuetify } from "vuetify";
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { createPinia } from 'pinia'

import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

import App from "./App.vue";
import router from './router/router';

const pinia = createPinia()

const moniTheme = {
  dark: false,
  colors: {
    primary: '#546E7A',
  },
};

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'moniTheme',
  themes: {
    moniTheme
  },
},
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  components: {
    ...components,
    VNumberInput,
  },
  directives,
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

createApp(App).use(router).use(vuetify).use(pinia).mount("#app");

export { firebaseApp, auth, firestore };
