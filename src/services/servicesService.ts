import { http } from "@/lib/http";
import type { ServicoFormData } from "@/pages/CadastroServico";

export interface CreateServiceCommand {
    name: string;
    code: string;
    defaultDueInDays?: number | null;
}

export interface UpdateServiceCommand {
    name: string;
    defaultDueInDays?: number | null;
}

export interface ServiceDetails {
    id: string;
    name: string;
    code: string;
    dueDate: string | null;
    remainingDays: number | null;
    isActive: boolean;
    createdAt?: string;
    createdBy?: string;
    updatedAt?: string | null;
    updatedBy?: string | null;
}

function buildCreatePayload(data: ServicoFormData): CreateServiceCommand {
    return {
        name: data.nomeServico,
        code: data.codigo,
        defaultDueInDays: data.vencimentoDoc ?? null,
    };
}

function buildUpdatePayload(data: ServicoFormData): UpdateServiceCommand {
    return {
        name: data.nomeServico,
        defaultDueInDays: data.vencimentoDoc ?? null,
    };
}

export type ServicoViewModel = {
    id: string;
    nomeServico: string;
    codigo: string;
    vencimentoDoc: number | null;
    status: "ativo" | "inativo";
    dueDate: string | null;
    createdAt: string;
    createdBy: string;
    updatedAt: string | null;
    updatedBy: string | null;
};

export function mapServiceToViewModel(dto: ServiceDetails) : ServicoViewModel {
    return {
        id: dto.id,
        nomeServico: dto.name,
        codigo: dto.code,
        vencimentoDoc: dto.remainingDays ?? null,
        status: dto.isActive ? "ativo" : "inativo",
        dueDate: dto.dueDate ?? null,
        createdBy: dto.createdBy ?? "",
        createdAt: dto.createdAt ?? "",
        updatedBy: dto.updatedBy ?? "",
        updatedAt: dto.updatedAt ?? "",
    };
}

export async function createService(data: ServicoFormData) {
    const payload = buildCreatePayload(data);
    const res = await http.post<ServiceDetails>("Services", payload);
    return res.data;
}

export async function updateService(id: string, data: ServicoFormData) {
    const payload = buildUpdatePayload(data);
    const res = await http.put<ServiceDetails>(`Services/${id}`, payload);
    return res.data;
}

export async function getServiceById(id: string) {
    const res = await http.get<ServiceDetails>(`Services/${id}`);
    return res.data;
}

export async function getServices(params?: {
    code?: string;
    name?: string;
    isActive?: boolean;
}) {
    const { code, name, isActive } = params || {};

    const res = await http.get<ServiceDetails[] | { items: ServiceDetails[] }>(
        "Services",
        {
            params: {
                Code: code,
                Name: name,
                IsActive: typeof isActive === "boolean" ? isActive : undefined,
            },
        },
    );

    const raw = res.data as any;
    const items: ServiceDetails[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items)
            ? raw.items
            : [];

    return { items, raw };
}

export async function activateService(id: string) {
    return http.patch(`Services/${id}/activate`);
}

export async function deactivateService(id: string) {
    return http.patch(`Services/${id}/deactivate`);
}

export async function deleteService(id: string) {
    return http.delete(`Services/${id}`);
}
