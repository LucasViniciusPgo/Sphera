import { http } from "@/lib/http";
import type {
    ClientServicePrice,
    CreateClientServicePriceCommand,
    ClientServicePriceFormData,
} from "@/interfaces/ClientServicePrice";

export type { ClientServicePrice };

function buildCreatePayload(data: ClientServicePriceFormData): CreateClientServicePriceCommand {
    return {
        clientId: data.clientId,
        serviceId: data.serviceId,
        unitPrice: typeof data.unitPrice === "string" ? parseFloat(data.unitPrice) : data.unitPrice,
        startDate: data.startDate,
    };
}

export async function createClientServicePrice(data: ClientServicePriceFormData) {
    const payload = buildCreatePayload(data);
    const res = await http.post<ClientServicePrice>("billing/ClientServicePrices", payload);
    return res.data;
}

export async function getClientServicePrices(params?: {
    ClientId?: string;
    ServiceId?: string;
    OnlyActive?: boolean;
}) {
    const { ClientId, ServiceId, OnlyActive } = params || {};

    const res = await http.get<ClientServicePrice[] | { items: ClientServicePrice[] }>(
        "billing/ClientServicePrices",
        {
            params: {
                ClientId,
                ServiceId,
                OnlyActive,
            },
        }
    );

    const raw = res.data;
    const items: ClientServicePrice[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.items)
            ? (raw as any).items
            : [];

    return { items, raw };
}

export async function getClientServicePriceById(id: string) {
    const res = await http.get<ClientServicePrice>(`billing/ClientServicePrices/${id}`);
    return res.data;
}
