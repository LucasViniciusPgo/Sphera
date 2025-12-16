import { http } from "@/lib/http";
import type {
    Invoice,
    InvoiceFilters,
    CreateInvoiceCommand,
    UpdateInvoiceCommand,
    CloseInvoicesForPeriodCommand,
    AdditionalValue,
    UpdateInvoiceItemCommand,
    Installment,
    CloseInvoicesFormData,
} from "@/interfaces/Invoice";

export type { Invoice };

/**
 * Build the payload for closing invoices
 */
function buildCloseInvoicesPayload(data: CloseInvoicesFormData): CloseInvoicesForPeriodCommand {
    const payload: CloseInvoicesForPeriodCommand = {
        clientId: data.clientId,
        issueDate: data.issueDate,
        missingPriceBehavior: data.missingPriceBehavior,
    };

    // Add optional fields
    if (data.overrideTotalAmount !== undefined && data.overrideTotalAmount !== null) {
        payload.totalAmount = data.overrideTotalAmount;
    }

    if (data.overrideDueDate) {
        payload.dueDate = data.overrideDueDate;
    }

    // Add installments if configured
    if (data.closeWithInstallments && data.customInstallments && data.customInstallments.length > 0) {
        payload.installments = data.customInstallments;
    }

    return payload;
}

/**
 * Calculate installments based on total amount, count, and first due date
 */
export function calculateInstallments(
    totalAmount: number,
    installmentCount: number,
    firstDueDate: string
): Installment[] {
    if (installmentCount < 2) {
        throw new Error("Installment count must be at least 2");
    }

    const installments: Installment[] = [];
    const baseAmount = Math.floor((totalAmount / installmentCount) * 100) / 100;
    let remainingAmount = totalAmount;

    const firstDate = new Date(firstDueDate);

    for (let i = 0; i < installmentCount; i++) {
        const dueDate = new Date(firstDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const amount = i === installmentCount - 1
            ? Math.round(remainingAmount * 100) / 100 // Last installment gets the remainder
            : baseAmount;

        installments.push({
            number: i + 1,
            amount: amount,
            dueDate: dueDate.toISOString().split('T')[0],
        });

        remainingAmount -= amount;
    }

    return installments;
}

/**
 * Get list of invoices with optional filters
 */
export async function getInvoices(params?: InvoiceFilters) {
    const { ClientId, PeriodStart, PeriodEnd, Status } = params || {};

    const res = await http.get<Invoice[] | { items: Invoice[] }>(
        "billing/Invoices",
        {
            params: {
                ClientId,
                PeriodStart,
                PeriodEnd,
                Status,
            },
        }
    );

    const raw = res.data;
    const items: Invoice[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.items)
            ? (raw as any).items
            : [];

    return { items, raw };
}

/**
 * Get a single invoice by ID
 */
export async function getInvoiceById(id: string) {
    const res = await http.get<Invoice>(`billing/Invoices/${id}`);
    return res.data;
}

/**
 * Create a new invoice
 */
export async function createInvoice(data: CreateInvoiceCommand) {
    const res = await http.post<Invoice>("billing/Invoices", data);
    return res.data;
}

/**
 * Update an existing invoice
 */
export async function updateInvoice(id: string, data: UpdateInvoiceCommand) {
    const res = await http.put<Invoice>(`billing/Invoices/${id}`, data);
    return res.data;
}

/**
 * Close invoices for a period
 */
export async function closeInvoices(data: CloseInvoicesFormData) {
    const payload = buildCloseInvoicesPayload(data);
    const res = await http.put<void>("billing/Invoices/close", payload);
    return res.data;
}

/**
 * Update additional values for an invoice
 */
export async function updateInvoiceAdditionalValues(id: string, values: AdditionalValue[]) {
    const res = await http.put<void>(`billing/Invoices/${id}/additional-values`, values);
    return res.data;
}

/**
 * Update an invoice item
 */
export async function updateInvoiceItem(
    invoiceId: string,
    itemId: string,
    data: UpdateInvoiceItemCommand
) {
    const res = await http.put<void>(`billing/Invoices/${invoiceId}/items/${itemId}`, data);
    return res.data;
}
