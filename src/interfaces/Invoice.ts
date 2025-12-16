export enum InvoiceStatus {
    Draft = "Draft",
    Open = "Open",
    Closed = "Closed",
    Cancelled = "Cancelled",
    Overdue = "Overdue",
}

export enum MissingPriceBehavior {
    Block = 1,
    AllowManual = 2
}

export interface Installment {
    number: number;
    amount: number;
    dueDate: string;
}

export interface Invoice {
    id: string;
    clientId: string;
    issueDate?: string | null;
    totalAmount: number;
    status: InvoiceStatus | string;
    dueDate?: string | null;
    createdAt: string;
    createdBy: string;
    updatedAt?: string | null;
    updatedBy?: string | null;
    notes?: string | null;
}

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    billingEntryId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface AdditionalValue {
    id?: string;
    invoiceId?: string;
    description: string;
    amount: number;
    type: "Discount" | "Fee" | "Tax" | "Other";
}

export interface CloseInvoicesForPeriodCommand {
    clientId: string;
    issueDate: string;
    missingPriceBehavior: MissingPriceBehavior | string;
    totalAmount?: number | null;
    dueDate?: string | null;
    installments?: Installment[] | null;
}

export interface CreateInvoiceCommand {
    clientId: string;
    issueDate?: string | null;
    dueDate?: string | null;
    notes?: string | null;
    items: CreateInvoiceItem[];
}

export interface UpdateInvoiceCommand {
    status?: InvoiceStatus | string;
    dueDate?: string | null;
    totalAmount?: number | null;
    notes?: string | null;
}

export interface UpdateInvoiceItemCommand {
    quantity?: number;
    unitPrice?: number;
}

export interface InvoiceFilters {
    ClientId?: string;
    PeriodStart?: string;
    PeriodEnd?: string;
    Status?: string;
}

export interface InvoiceFormData {
    clientId: string;
    issueDate?: string | null;
    dueDate?: string;
    totalAmount?: number | string;
    status?: InvoiceStatus | string;
    notes?: string;
}

export interface CloseInvoicesFormData {
    selectedInvoiceIds: string[];
    clientId: string;
    issueDate: string;
    missingPriceBehavior: MissingPriceBehavior | string;
    closeWithInstallments: boolean;
    installmentCount?: number;
    firstDueDate?: string;
    customInstallments?: Installment[];
    overrideTotalAmount?: number;
    overrideDueDate?: string;
}

export interface CreateInvoiceItem {
    serviceId?: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    additionalAmount?: number;
    isAdditional?: boolean;
}
