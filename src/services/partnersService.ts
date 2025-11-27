import {http, setAuthToken} from "@/lib/http";
import type { ParceiroFormData } from "@/pages/CadastroParceiros";
import { cleanCNPJ } from "@/utils/format.ts";
import {
    addContactToPartner,
    EContactRole,
    EContactType,
    EPhoneType,
    PartnerContact
} from "./partnersContactsService.ts"
import { cleanPhone } from "@/utils/format.ts";


export interface AddressDTO {
    street: string;
    number: number;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    lot?: string | null;
}

export interface ApiPartner {
    id: string;
    legalName: string;
    cnpj?: string | null;
    address?: AddressDTO | null;
    status: boolean;
}

export interface PartnerDetails {
    id: string;
    legalName: string;
    cnpj: string | null;
    address?: AddressDTO | null;
    status: boolean;
    createdAt: string;
    createdBy: string;
    updatedAt: string | null;
    updatedBy: string | null;
    contacts: PartnerContact[];
}

export interface CreatePartnerCommand {
    legalName: string;
    cnpj?: string | null;
    address?: AddressDTO | null;
}

export interface UpdatePartnerCommand extends CreatePartnerCommand {
    status: boolean;
}

function buildAddressFromForm(data: ParceiroFormData): AddressDTO | null {
    if (!data.rua && !data.numero && !data.cidade && !data.estado) return null;

    return {
        street: data.rua || "",
        number: data.numero ? Number(data.numero) : null,
        complement: data.complemento || null,
        neighborhood: data.bairro || "",
        city: data.cidade || "",
        state: (data.estado || "").toUpperCase(),
        zipCode: data.cep || "",
        lot: data.lote || null,
    };
}

export async function createPartner(data: ParceiroFormData) {
    const payload: CreatePartnerCommand = {
        legalName: data.razaoSocial,
        cnpj: cleanCNPJ(data.cnpj),
        address: buildAddressFromForm(data),
    };

    setAuthToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbHMiOiJhYm5lcnNhbnRvMjAxNEBnbWFpbC5jb20iLCJuYW1lIjoiQWJuZXIgT2xpdmVpcmEiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA5LzA5L2lkZW50aXR5L2NsYWltcy9hY3RvciI6IjliYWJhYTRlLTIwNmEtNDNhYi1hMGZhLTgyODY5M2FkN2M1YyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluaXN0cmFkb3IiLCJleHAiOjE3NjQyMTEzMjQsImlzcyI6IlNwaGVyYS5BUEkiLCJhdWQiOiJTcGhlcmFBcHAifQ.OB0BOP5BsNld89BwJaha1whkzLopqLTlYfNRrXKMWRI")

    const res = await http.post<any>("/api/v1/Partners", payload);
    const partner = res.data;
    const partnerId: string = partner.id;

    const contactsPayloads = [];

    if (data.emailFinanceiro) {
        contactsPayloads.push({
            type: EContactType.Email,
            role: EContactRole.Financial,
            phoneType: null,
            value: data.emailFinanceiro,
        });
    }

    if (data.telefoneFinanceiro) {
        contactsPayloads.push({
            type: EContactType.Phone,
            role: EContactRole.Financial,
            phoneType: null,
            value: cleanPhone(data.telefoneFinanceiro)!,
        });
    }

    if (data.emailResponsavel) {
        contactsPayloads.push({
            type: EContactType.Email,
            role: EContactRole.Personal,
            phoneType: null,
            value: data.emailResponsavel,
        });
    }

    if (data.telefoneResponsavel) {
        contactsPayloads.push({
            type: EContactType.Phone,
            role: EContactRole.Personal,
            phoneType: null,
            value: cleanPhone(data.telefoneResponsavel)!,
        });
    }

    if (data.telefoneFixo) {
        contactsPayloads.push({
            type: EContactType.Phone,
            role: EContactRole.General,
            phoneType: EPhoneType.Landline,
            value: cleanPhone(data.telefoneFixo)!,
        });
    }

    if (data.celular) {
        contactsPayloads.push({
            type: EContactType.Phone,
            role: EContactRole.General,
            phoneType: EPhoneType.Mobile,
            value: cleanPhone(data.celular)!,
        });
    }

    if (data.telefoneReserva) {
        contactsPayloads.push({
            type: EContactType.Phone,
            role: EContactRole.General,
            phoneType: EPhoneType.Backup,
            value: cleanPhone(data.telefoneReserva)!,
        });
    }

    if (contactsPayloads.length > 0) {
        await Promise.all(
            contactsPayloads.map((c) => addContactToPartner(partnerId, c))
        );
    }

    return partner;
}

export async function updatePartner(id: string, data: ParceiroFormData, currentStatus?: boolean) {
    const newStatusBool = data.status === "ativo";

    const payload: UpdatePartnerCommand = {
        legalName: data.razaoSocial,
        cnpj: cleanCNPJ(data.cnpj),
        address: buildAddressFromForm(data),
        status: true,
    };

    await http.put(`/api/v1/Partners/${id}`, payload);

    if (typeof currentStatus === "boolean" && currentStatus !== newStatusBool){
        if (newStatusBool) {
            await activatePartner(id);
        } else {
            await deactivatePartner(id);
        }
    }
}

export async function getPartnerById(id: string) {
    return http.get<PartnerDetails>(`/api/v1/Partners/${id}`);
}

export async function getPartners(params?: {
    search?: string;
    status?: boolean;
    cnpj?: string;
    page?: number;
    pageSize?: number;
    includeClients?: boolean;
}) {
    const { search, status, cnpj, page, pageSize, includeClients } = params || {};

    const res = await http.get<PartnerDetails[] | { items: PartnerDetails[] }>("/api/v1/Partners", {
        params: {
            Search: search,
            Status: status,
            Cnpj: cnpj,
            Page: page,
            PageSize: pageSize,
            IncludeClients: includeClients,
        },
    });

    const raw = res.data;

    const items: PartnerDetails[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items)
            ? raw.items
            : [];

    return { items, raw }; // devolvo items + raw pra vc usar depois se quiser paginação
}

export async function activatePartner(id: string) {
    return http.patch(`/api/v1/Partners/${id}/activate`);
}

export async function deactivatePartner(id: string) {
    return http.patch(`/api/v1/Partners/${id}/deactivate`);
}

export async function deletePartner(id: string) {
    return http.delete(`/api/v1/Partners/${id}`);
}
