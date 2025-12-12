import { http } from "@/lib/http";
import type {
    BillingEntry,
    CreateBillingEntryCommand,
    UpdateBillingEntryCommand,
    BillingEntryFormData,
} from "@/interfaces/BillingEntry";

export type { BillingEntry };

function buildCreatePayload(data: BillingEntryFormData): CreateBillingEntryCommand {
    return {
        clientId: data.clientId,
        serviceId: data.serviceId,
        quantity: typeof data.quantity === "string" ? parseFloat(data.quantity) : data.quantity,
        serviceDate: data.serviceDate,
        notes: data.notes || null,
    };
}

function buildUpdatePayload(data: BillingEntryFormData): UpdateBillingEntryCommand {
    return {
        quantity: typeof data.quantity === "string" ? parseFloat(data.quantity) : data.quantity,
        notes: data.notes || null,
        isBillable: data.isBillable ?? true,
    };
}

export async function createBillingEntry(data: BillingEntryFormData) {
    const payload = buildCreatePayload(data);
    const res = await http.post<BillingEntry>("billing/BillingEntries", payload);
    return res.data;
}

export async function updateBillingEntry(id: string, data: BillingEntryFormData) {
    const payload = buildUpdatePayload(data);
    const res = await http.put<BillingEntry>(`billing/BillingEntries/${id}`, payload);
    return res.data;
}

export async function getBillingEntries(params?: {
    ClientId?: string;
    ServiceDateStart?: string;
    ServiceDateEnd?: string;
    IsBillable?: boolean;
    OnlyWithoutInvoice?: boolean;
}) {
    const { ClientId, ServiceDateStart, ServiceDateEnd, IsBillable, OnlyWithoutInvoice } = params || {};

    const res = await http.get<BillingEntry[] | { items: BillingEntry[] }>(
        "billing/BillingEntries",
        {
            params: {
                ClientId,
                ServiceDateStart,
                ServiceDateEnd,
                IsBillable,
                OnlyWithoutInvoice,
            },
        }
    );

    const raw = res.data;
    const items: BillingEntry[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.items)
            ? (raw as any).items
            : [];

    return { items, raw };
}

export async function getBillingEntryById(id: string) {
    const res = await http.get<BillingEntry>(`billing/BillingEntries/${id}`);
    return res.data;
}
