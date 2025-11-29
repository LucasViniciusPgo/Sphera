export interface Servico {
    id: string;
    name: string;
    code: string;
    dueDate: string;
    remainingDays: number;
    isActive: boolean;
    createdAt: string;
    createdBy: string;
    updatedAt: string | null;
    updatedBy: string | null;
}