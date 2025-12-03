export interface UserContact {
    id: string;
    type: number;
    role: number;
    phoneType?: number | null;
    value: string;
}

export interface Usuario {
    id: string;
    roleId: number;
    name: string;
    email: string;
    isFirstAccess: boolean;
    active: boolean;
    contacts: UserContact[];
}