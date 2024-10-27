import {
  createRouter,
  createWebHistory,
} from "vue-router";
import HomeView from "../views/HomeView.vue";
import LandingView from "../views/LandingView.vue";

const routes = [
    { path: "/signin", name: "signin", component: LandingView },
    { path: "/signup", name: "signup", component: LandingView },
    { path: "/", name: "home", component: HomeView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
