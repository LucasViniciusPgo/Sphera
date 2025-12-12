export interface BillingEntry {
    id: string;
    clientId: string;
    serviceId: string;
    quantity: number;
    serviceDate: string;
    notes?: string | null;
    isBillable: boolean;
    invoiceId?: string | null;
    createdAt: string;
    createdBy: string;
    updatedAt?: string | null;
    updatedBy?: string | null;
}

export interface CreateBillingEntryCommand {
    clientId: string;
    serviceId: string;
    quantity: number;
    serviceDate: string;
    notes?: string | null;
}

export interface UpdateBillingEntryCommand {
    quantity: number;
    notes?: string | null;
    isBillable: boolean;
}

export interface BillingEntryFormData {
    clientId: string;
    serviceId: string;
    quantity: number | string;
    serviceDate: string;
    notes?: string;
    isBillable?: boolean;
}
