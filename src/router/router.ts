import {
  createRouter,
  createWebHistory,
} from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";

const routes = [
    { path: "/login", name: "login", component: LoginView },
    { path: "/", name: "home", component: HomeView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
