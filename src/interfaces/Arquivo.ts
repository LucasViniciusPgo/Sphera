export enum EExpirationStatus {
    WithinDeadline = 0,
    AboutToExpire = 1,
    Expired = 2
}

export type StatusType = "vencido" | "a-vencer" | "dentro-prazo";

export interface Arquivo {
    id: string;
    fileName: string;
    issueDate: string;
    dueDate: string;
    notes?: string;
    file?: File;
    status: EExpirationStatus;

    clientName?: string;
    clientId?: string;

    serviceName?: string;
    serviceId?: string;

    partnerName?: string;
    partnerId?: string;

    responsibleName?: string;
    responsibleId?: string;

    createdBy: string;
    createdAt: string;

    updatedBy: string;
    updatedAt: string;
}
