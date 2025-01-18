import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
    collection, 
    deleteDoc, 
    doc, 
    getDocs, 
    setDoc,
    query,
    where,
    updateDoc
} from 'firebase/firestore';
import { firestore } from '../main';
import { useAuthStore } from './auth';
import type { Group, UserType } from '../types';

export const useGroupStore = defineStore('groups', () => {
    /**
     * Store instance for authentication
     */
    const authStore = useAuthStore();

    /**
     * Array of user's groups
     * @type {Ref<Group[]>}
     */
    const groups = ref<Group[]>([]);

    /**
     * Map of group members details
     * @type {Ref<Map<string, UserType[]>>}
     */
    const groupMembers = ref<Map<string, UserType[]>>(new Map());

    /**
     * Computed property that combines groups with member details
     */
    const groupsWithDetails = computed(() => 
        groups.value.map(group => ({
            ...group,
            memberDetails: groupMembers.value.get(group.id!) || []
        }))
    );

    /**
     * Creates a new group
     * @param {Object} groupData - Group creation data
     * @param {string} groupData.name - Group name
     * @param {string} [groupData.description] - Group description
     * @returns {Promise<void>}
     * @throws {Error} If group creation fails
     */
    const createGroup = async (groupData: { name: string; description?: string }) => {
        if (!authStore.user) return;

        const newGroup: Group = {
            name: groupData.name,
            description: groupData.description,
            createdBy: authStore.user.uid,
            members: [authStore.user.uid],
            createdAt: new Date()
        };

        await setDoc(doc(collection(firestore, 'groups')), newGroup);
        await fetchUserGroups();
    };

    /**
     * Fetches all groups for current user
     * Includes created and joined groups
     * @returns {Promise<void>}
     */
    const fetchUserGroups = async () => {
        if (!authStore.user) return;
        
        const userGroupsQuery = query(
            collection(firestore, 'groups'),
            where('members', 'array-contains', authStore.user.uid)
        );

        const querySnapshot = await getDocs(userGroupsQuery);
        groups.value = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        })) as Group[];

        await Promise.all(
            groups.value.map(group => 
                fetchMembersForGroup(group.id!, group.members)
            )
        );
    };

    /**
     * Updates an existing group
     * @param {string} id - Group ID to update
     * @param {Partial<Group>} groupData - Updated group data
     * @returns {Promise<void>}
     * @throws {Error} If update fails
     */
    const updateGroup = async (id: string, groupData: Partial<Group>) => {
        await setDoc(doc(collection(firestore, 'groups'), id), groupData, { merge: true });
        await fetchUserGroups();
    };

    /**
     * Adds a member to a group
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID to add
     * @returns {Promise<void>}
     * @throws {Error} If member addition fails
     */
    const addGroupMember = async (groupId: string, userId: string) => {
        const group = groups.value.find(g => g.id === groupId);
        if (!group) return;

        const updatedMembers = [...new Set([...group.members, userId])];
        await updateDoc(doc(firestore, 'groups', groupId), {
            members: updatedMembers
        });
        await fetchUserGroups();
    };

    /**
     * Removes a member from a group
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID to remove
     * @returns {Promise<void>}
     * @throws {Error} If member removal fails
     */
    const removeGroupMember = async (groupId: string, userId: string) => {
        const group = groups.value.find(g => g.id === groupId);
        if (!group) return;

        const updatedMembers = group.members.filter(id => id !== userId);
        await updateDoc(doc(firestore, 'groups', groupId), {
            members: updatedMembers
        });
        await fetchUserGroups();
    };

    /**
     * Deletes a group
     * @param {string} id - Group ID to delete
     * @returns {Promise<void>}
     * @throws {Error} If deletion fails
     */
    const deleteGroup = async (id: string) => {
        await deleteDoc(doc(collection(firestore, 'groups'), id));
        await fetchUserGroups();
    };

    /**
     * Fetches member details for a group
     * @param {string} groupId - Group ID
     * @param {string[]} memberIds - Array of member IDs
     */
    const fetchMembersForGroup = async (groupId: string, memberIds: string[]) => {
        const members = await authStore.getUsersByIds(memberIds);
        groupMembers.value.set(groupId, members);
    };

    return {
        groups: groupsWithDetails,
        createGroup,
        fetchUserGroups,
        updateGroup,
        addGroupMember,
        removeGroupMember,
        deleteGroup
    };
});