import { http } from "@/lib/http";
import type { ServicoFormData } from "@/pages/CadastroServico";
import { Servico } from "@/interfaces/Servico.ts";

export interface CreateServiceCommand {
    name: string;
    code: string;
    defaultDueInDays?: number | null;
}

export interface UpdateServiceCommand {
    name: string;
    defaultDueInDays?: number | null;
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

export function mapServiceToViewModel(dto: Servico): ServicoViewModel {
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
    const res = await http.post<Servico>("Services", payload);
    return res.data;
}

export async function updateService(id: string, data: ServicoFormData) {
    const payload = buildUpdatePayload(data);
    const res = await http.put<Servico>(`Services/${id}`, payload);
    return res.data;
}

export async function getServiceById(id: string) {
    const res = await http.get<Servico>(`Services/${id}`);
    return res.data;
}

export async function getServices(params?: {
    code?: string;
    name?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
}) {
    const { code, name, isActive, search, page, pageSize } = params || {};
    const actualParams: Record<string, any> = {};
    if (code) actualParams.code = code;
    if (name) actualParams.name = name;
    if (isActive) actualParams.isActive = isActive;
    if (search) actualParams.Search = search;
    if (page) actualParams.Page = page;
    if (pageSize) actualParams.PageSize = pageSize;

    const response = await http.get<Servico[] | { items: Servico[] }>(
        "Services", { params: actualParams });

    const raw = response.data;
    let items: Servico[] = [];
    let totalCount = 0;

    if (Array.isArray(raw)) {
        items = raw;
        totalCount = raw.length;
    } else {
        items = (raw as any).items || [];
        totalCount = (raw as any).totalCount || (raw as any).total || 0;
    }

    return { items, raw, totalCount };
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
