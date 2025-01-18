import {
  createRouter,
  createWebHistory,
} from "vue-router";
import HomeView from "../views/HomeView.vue";
import LandingView from "../views/LandingView.vue";
import UserPanelView from "../views/UserPanelView.vue";
import ProfileView from "../views/ProfileView.vue";
import GroupsView from "../views/GroupsView.vue";
import StatsView from "../views/StatsView.vue";
import ExpensesView from "../views/ExpensesView.vue";
import IncomesView from "../views/IncomesView.vue";
import BudgetsView from "../views/BudgetsView.vue";
import { useAuthStore } from "../stores/auth";

const routes = [
  { 
    path: "/groups", 
    name: "groups", 
    component: GroupsView,
    meta: { requiresAuth: true }
  },
  { 
    path: "/profile", 
    name: "profile", 
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  { 
    path: "/settings", 
    name: "settings", 
    component: UserPanelView,
    meta: { requiresAuth: true }
  },
  { 
    path: "/signin", 
    name: "signin", 
    component: LandingView 
  },
  { 
    path: "/signup", 
    name: "signup", 
    component: LandingView 
  },
  { 
    path: "/", 
    name: "home", 
    component: HomeView,
    meta: { requiresAuth: true }
  }, 
  { 
    path: "/stats", 
    name: "stats", 
    component: StatsView,
    meta: { requiresAuth: true }
  },
  { 
    path: "/expenses", 
    name: "expenses", 
    component: ExpensesView,
    meta: { requiresAuth: true }
  },
  { 
    path: "/income", 
    name: "income", 
    component: IncomesView,
    meta: { requiresAuth: true }
  },
  { 
    path: "/budgets", 
    name: "budgets", 
    component: BudgetsView,
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !authStore.isLoggedIn) {
    next('/signin');
  } else if ((to.name === 'signin' || to.name === 'signup') && authStore.isLoggedIn) {
    next('/');
  } else {
    next();
  }
});

export default router;
