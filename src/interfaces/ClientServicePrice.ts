export interface ClientServicePrice {
    id: string;
    clientId: string;
    serviceId: string;
    unitPrice: number;
    startDate: string;
    endDate?: string | null;
    isActive: boolean;
    createdAt: string;
    createdBy: string;
    updatedAt?: string | null;
    updatedBy?: string | null;
}

export interface CreateClientServicePriceCommand {
    clientId: string;
    serviceId: string;
    unitPrice: number;
    startDate: string;
}

export interface ClientServicePriceFormData {
    clientId: string;
    serviceId: string;
    unitPrice: number | string;
    startDate: string;
}
