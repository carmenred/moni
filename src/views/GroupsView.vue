<template>
    <v-main>
        <v-container>
                <!-- Groups List -->
                <v-row>
                    <v-col cols="12">
                        <v-card class="mb-4 bg-grey-lighten-5">
                            <v-card-title class="text-h5 d-flex justify-space-between align-center mb-4">
                                Your Groups
                                <v-tooltip text="Create new group" location="bottom">
                                    <template v-slot:activator="{ props }">
                                        <v-btn 
                                            color="white" 
                                            icon="mdi-plus" 
                                            size="small" 
                                            @click="newGroupDialog = true"
                                            v-bind="props"
                                        ></v-btn>
                                    </template>
                                </v-tooltip>
                            </v-card-title>
                        </v-card>
                        <v-card v-if="groupStore.groups.length" class="bg-grey-lighten-5">
                            <v-card-text>
                                <v-expansion-panels>
                                    <v-expansion-panel
                                        v-for="group in groupStore.groups"
                                        :key="group.id"
                                    >
                                        <v-expansion-panel-title>
                                            <div class="d-flex justify-space-between align-center w-100">
                                                <span class="text-h6">{{ group.name }}</span>
                                                <v-chip
                                                    :color="group.createdBy === authStore.user?.uid ? 'primary' : 'grey'"
                                                    size="small"
                                                >
                                                    {{ group.createdBy === authStore.user?.uid ? 'Owner' : 'Member' }}
                                                </v-chip>
                                            </div>
                                        </v-expansion-panel-title>
                                        <v-expansion-panel-text>
                                            <div class="mb-4">
                                                <div class="text-subtitle-1 mb-2 font-weight-bold">Description</div>
                                                <div>{{ group.description || 'No description' }}</div>
                                            </div>

                                            <div class="mb-4">
                                                <div class="text-subtitle-1 mb-2 font-weight-bold">Members</div>
                                                <v-list>
                                                    <v-list-item
                                                        v-for="member in group.memberDetails"
                                                        :key="member.userId"
                                                    >
                                                        <template v-slot:prepend>
                                                            <v-avatar size="32">
                                                                <v-img 
                                                                    v-if="member.avatarUrl" 
                                                                    :src="member.avatarUrl" 
                                                                    :alt="member.name"
                                                                ></v-img>
                                                                <v-icon v-else color="grey">mdi-account</v-icon>
                                                            </v-avatar>
                                                        </template>
                                                        <v-list-item-title>
                                                            {{ member.name }} ({{ member.email }})
                                                        </v-list-item-title>
                                                        <template v-slot:append>
                                                            <v-btn
                                                                v-if="group.createdBy === authStore.user?.uid && member.userId !== authStore.user?.uid"
                                                                icon="mdi-close"
                                                                size="small"
                                                                color="error"
                                                                variant="text"
                                                                @click="removeMember(group.id!, member.userId)"
                                                            ></v-btn>
                                                        </template>
                                                    </v-list-item>
                                                </v-list>
                                            </div>

                                            <div class="mb-4">
                                                <div class="text-subtitle-1 mb-2 font-weight-bold">Shared Budgets</div>
                                                <v-list v-if="budgetStore.getBudgetsByGroupId(group.id!).length">
                                                    <v-list-item
                                                        v-for="budget in budgetStore.getBudgetsByGroupId(group.id!)"
                                                        :key="budget.id"
                                                    >
                                                        <template v-slot:prepend>
                                                            <v-icon color="primary">mdi-wallet</v-icon>
                                                        </template>
                                                        <v-list-item-title>
                                                            {{ budget.name }}
                                                        </v-list-item-title>
                                                        <template v-slot:append>
                                                            <span :class="{
                                                                'text-error': budget.spent > budget.amount,
                                                                'text-success': budget.spent <= budget.amount
                                                            }">
                                                                {{ budget.spent }}€ / {{ budget.amount }}€
                                                            </span>
                                                        </template>
                                                    </v-list-item>
                                                </v-list>
                                                <div v-else class="text-subtitle-2 text-grey">
                                                    No shared budgets in this group
                                                </div>
                                            </div>

                                            <div class="mb-4">
                                                <div class="text-subtitle-1 mb-2 font-weight-bold">Shared Expenses</div>
                                                <v-list v-if="expenseStore.expenses.filter(e => e.groupId === group.id).length">
                                                    <v-list-item
                                                        v-for="expense in expenseStore.expenses.filter(e => e.groupId === group.id)"
                                                        :key="expense.id"
                                                    >
                                                        <template v-slot:prepend>
                                                            <v-icon color="primary">mdi-cash</v-icon>
                                                        </template>
                                                        <v-list-item-title>
                                                            {{ expense.name }}
                                                        </v-list-item-title>
                                                        <template v-slot:subtitle>
                                                            <div class="d-flex align-center ga-2">
                                                                <span class="mr-2">Total: {{ expense.amount }}€</span>
                                                                <v-divider vertical></v-divider>
                                                                <span>Per person: {{ expense.splitAmount }}€</span>
                                                            </div>
                                                        </template>
                                                        <template v-slot:append>
                                                            <v-chip
                                                                :color="expense.paidBy[authStore.user!.uid]?.paid ? 'success' : 'warning'"
                                                                size="small"
                                                            >
                                                                {{ expense.paidBy[authStore.user!.uid]?.paid ? 'Paid' : 'Pending' }}
                                                            </v-chip>
                                                        </template>
                                                    </v-list-item>
                                                </v-list>
                                                <div v-else class="text-subtitle-2 text-grey">
                                                    No shared expenses in this group
                                                </div>
                                            </div>

                                            <!-- Add Member Section (only for group owner) -->
                                            <div v-if="group.createdBy === authStore.user?.uid" class="mb-4">
                                                <v-text-field
                                                    v-model="searchEmail"
                                                    label="Search users by email"
                                                    variant="outlined"
                                                    append-inner-icon="mdi-magnify"
                                                    @update:model-value="searchUsers"
                                                    clearable
                                                ></v-text-field>

                                                <v-list v-if="searchResults.length" class="mb-4">
                                                    <v-list-item
                                                        v-for="user in searchResults"
                                                        :key="user.id"
                                                        :disabled="group.members.includes(user.id!)"
                                                        @click="addMember(group.id!, user.id!)"
                                                    >
                                                        <template v-slot:prepend>
                                                            <v-avatar color="grey" size="32">
                                                                <v-icon>mdi-account</v-icon>
                                                            </v-avatar>
                                                        </template>
                                                        <v-list-item-title>{{ user.email }}</v-list-item-title>
                                                    </v-list-item>
                                                </v-list>
                                            </div>

                                            <!-- Group Actions -->
                                            <div class="d-flex ga-2">
                                                <v-btn
                                                    v-if="group.createdBy === authStore.user?.uid"
                                                    color="primary"
                                                    prepend-icon="mdi-pencil"
                                                    @click="openEditDialog(group)"
                                                    class="font-weight-bold"
                                                >
                                                    Edit
                                                </v-btn>
                                                <v-btn
                                                    v-if="group.createdBy === authStore.user?.uid"
                                                    color="error"
                                                    prepend-icon="mdi-delete"
                                                    @click="openDeleteDialog(group)"
                                                    class="font-weight-bold"
                                                >
                                                    Delete
                                                </v-btn>
                                            </div>
                                        </v-expansion-panel-text>
                                    </v-expansion-panel>
                                </v-expansion-panels>
                            </v-card-text>
                        </v-card>
                        <v-card v-else>
                            <v-card-text class="text-center pa-4 bg-grey-lighten-5">
                                You're not a member of any groups yet
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>

            <!-- New Group Dialog -->
            <v-dialog v-model="newGroupDialog" max-width="500px">
                <v-card>
                    <v-card-title class="text-h5">Create New Group</v-card-title>
                    <v-card-text>
                        <v-form ref="newGroupForm">
                            <v-text-field
                                v-model="newGroup.name"
                                label="Group Name"
                                :rules="nameRules"
                                required
                            ></v-text-field>
                            <v-textarea
                                v-model="newGroup.description"
                                label="Description"
                                rows="3"
                            ></v-textarea>
                        </v-form>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="grey" variant="text" @click="newGroupDialog = false">Cancel</v-btn>
                        <v-btn color="primary" @click="createGroup">Create</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <!-- Edit Group Dialog -->
            <v-dialog v-model="editGroupDialog" max-width="500px">
                <v-card>
                    <v-card-title class="text-h5">Edit Group</v-card-title>
                    <v-card-text>
                        <v-form ref="editGroupForm">
                            <v-text-field
                                v-model="editingGroup.name"
                                label="Group Name"
                                :rules="nameRules"
                                required
                            ></v-text-field>
                            <v-textarea
                                v-model="editingGroup.description"
                                label="Description"
                                rows="3"
                            ></v-textarea>
                        </v-form>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="grey" variant="text" @click="editGroupDialog = false">Cancel</v-btn>
                        <v-btn color="primary" @click="saveGroupEdit">Save</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <!-- Delete Group Dialog -->
            <v-dialog v-model="deleteGroupDialog" max-width="500px">
                <v-card>
                    <v-card-title class="text-h5">Delete Group</v-card-title>
                    <v-card-text>
                        Are you sure you want to delete this group? This action cannot be undone.
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="grey" variant="text" @click="deleteGroupDialog = false">Cancel</v-btn>
                        <v-btn color="error" @click="confirmDeleteGroup">Delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-main>
    </template>

    <script setup lang="ts">

    import { ref, onMounted, watch } from 'vue';
    import { useGroupStore } from '../stores/groups';
    import { useAuthStore } from '../stores/auth';
    import type { Group, UserType } from '../types';
    import { VForm } from 'vuetify/components/VForm';
    import { useBudgetStore } from '../stores/budgets';
    import { useExpenseStore } from '../stores/expenses';

    /**
     * Store instances for groups and authentication
     */
    const groupStore = useGroupStore();
    const authStore = useAuthStore();
    const budgetStore = useBudgetStore();
    const expenseStore = useExpenseStore();

    /**
     * Form references for validation
     * @type {Ref<VForm | null>}
     */
    const newGroupForm = ref<VForm | null>(null);
    const editGroupForm = ref<VForm | null>(null);

    /**
     * Dialog visibility controls
     * @type {Ref<boolean>}
     */
    const newGroupDialog = ref(false);
    const editGroupDialog = ref(false);
    const deleteGroupDialog = ref(false);

    /**
     * Form data for group operations
     */
    const newGroup = ref({ name: '', description: '' });
    const editingGroup = ref<Partial<Group>>({});
    const groupToDelete = ref<Group | null>(null);

    /**
     * User search state
     */
    const searchEmail = ref('');
    const searchResults = ref<UserType[]>([]);

    /**
     * Form validation rules
     * @type {((v: string) => boolean | string)[]}
     */
    const nameRules = [
        (v: string) => !!v || 'Name is required',
        (v: string) => v.length <= 50 || 'Name must be less than 50 characters'
    ];

    /**
     * Creates a new group with the provided name and description
     * Validates form data before submission
     * @async
     * @throws {Error} If validation fails or group creation fails
     */
    const createGroup = async () => {
        if (!newGroupForm.value) return;
        const { valid } = await newGroupForm.value.validate();
        if (!valid) return;

        await groupStore.createGroup(newGroup.value);
        newGroup.value = { name: '', description: '' };
        newGroupDialog.value = false;
    };

    /**
     * Opens the edit dialog for a specific group
     * @param {Group} group - The group to be edited
     */
    const openEditDialog = (group: Group) => {
        editingGroup.value = { ...group };
        editGroupDialog.value = true;
    };

    /**
     * Saves the edited group details
     * Validates form data before submission
     * @async
     * @throws {Error} If validation fails or update fails
     */
    const saveGroupEdit = async () => {
        if (!editGroupForm.value || !editingGroup.value.id) return;
        const { valid } = await editGroupForm.value.validate();
        if (!valid) return;

        await groupStore.updateGroup(editingGroup.value.id, {
            name: editingGroup.value.name,
            description: editingGroup.value.description
        });
        editGroupDialog.value = false;
    };

    /**
     * Opens the delete confirmation dialog for a group
     * @param {Group} group - The group to be deleted
     */
    const openDeleteDialog = (group: Group) => {
        groupToDelete.value = group;
        deleteGroupDialog.value = true;
    };

    /**
     * Confirms and executes group deletion
     * @async
     * @throws {Error} If deletion fails
     */
    const confirmDeleteGroup = async () => {
        if (!groupToDelete.value?.id) return;
        await groupStore.deleteGroup(groupToDelete.value.id);
        deleteGroupDialog.value = false;
        groupToDelete.value = null;
    };

    /**
     * Searches for users by email
     * Minimum 3 characters required for search
     * @async
     * @throws {Error} If search operation fails
     */
    const searchUsers = async () => {
        if (searchEmail.value.length < 3) {
            searchResults.value = [];
            return;
        }
        searchResults.value = await authStore.searchUsersByEmail(searchEmail.value);
    };

    /**
     * Adds a user to a group
     * @param {string} groupId - The ID of the group
     * @param {string} userId - The ID of the user to add
     * @async
     * @throws {Error} If member addition fails
     */
    const addMember = async (groupId: string, userId: string) => {
        await groupStore.addGroupMember(groupId, userId);
        searchEmail.value = '';
        searchResults.value = [];
    };

    /**
     * Removes a user from a group
     * @param {string} groupId - The ID of the group
     * @param {string} userId - The ID of the user to remove
     * @async
     * @throws {Error} If member removal fails
     */
    const removeMember = async (groupId: string, userId: string) => {
        await groupStore.removeGroupMember(groupId, userId);
    };

    /**
     * Lifecycle hooks and watchers
     */
    onMounted(() => {
        if (authStore.isLoggedIn && authStore.user) {
            groupStore.fetchUserGroups();
        }
    });

    /**
     * Watches for authentication state changes
     * Fetches groups when user logs in
     */
    watch(() => authStore.isLoggedIn, async (isLoggedIn) => {
        if (isLoggedIn && authStore.user) {
            await groupStore.fetchUserGroups();
        }
    }, { immediate: true });
    </script>

    <style scoped></style>
