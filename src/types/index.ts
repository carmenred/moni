export type UserType = {
    name: string;
    email: string;
    createdAt: string;
    id?: string;
    userId: string;
    avatarUrl?: string;
}

export type Group = {
    id?: string;
    name: string;
    description?: string;
    createdBy: string;
    members: string[];
    createdAt: Date;
  }

export interface Budget {
    id?: string;
    name: string;
    amount: number;
    spent: number;
    userId: string;
    groupId?: string;
    sharedWithGroup: boolean;
    createdAt: Date | { seconds: number; nanoseconds: number };
}

export type Expense = {
    name: string;
    amount: number;
    date: string;
    id?: string;
    userId: string;
    budgetId?: string;
    isShared: boolean;
    groupId?: string;
    splitAmount?: number;
    paidBy: {
        [userId: string]: {
            paid: boolean;
            amount: number;
        }
    };
}

export type Income = {
    id?: string;
    name: string;
    amount: number;
    date: Date;
    userId: string;
    createdAt: Date;
}