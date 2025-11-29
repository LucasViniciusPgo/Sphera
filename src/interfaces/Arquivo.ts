export interface Arquivo {
    id: string;
    fileName: string;
    issueDate: string;
    dueDate: string;
    notes?: string;
    file?: File;
    status?: StatusType;

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

export type StatusType = "vencido" | "a-vencer" | "dentro-prazo";
