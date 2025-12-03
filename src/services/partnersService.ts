import {http, setAuthToken} from "@/lib/http";
import type { ParceiroFormData } from "@/pages/CadastroParceiros";
import {cleanCEP, cleanCNPJ} from "@/utils/format.ts";
import {
    addContactToPartner,
    removeContactFromPartner,
    buildContactsFromForm,
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
    clients: any[];
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
        zipCode: cleanCEP(data.cep) || "",
        lot: data.lote || null,
    };
}

export async function createPartner(data: ParceiroFormData) {
    const payload: CreatePartnerCommand = {
        legalName: data.razaoSocial,
        cnpj: cleanCNPJ(data.cnpj),
        address: buildAddressFromForm(data),
    };

    const res = await http.post<any>("Partners", payload);
    const partner = res.data;
    const partnerId: string = partner.id;

    const contacts = buildContactsFromForm(data);

    if (contacts.length > 0) {
        await Promise.all(
            contacts.map((c) => addContactToPartner(partnerId, c))
        );
    }

    return partner;
}

export async function updatePartner(id: string, data: ParceiroFormData, currentStatus?: boolean, existingContacts?: PartnerContact[]) {
    const newStatusBool = data.status === "ativo";

    const payload: UpdatePartnerCommand = {
        legalName: data.razaoSocial,
        cnpj: cleanCNPJ(data.cnpj),
        address: buildAddressFromForm(data),
        status: true,
    };

    await http.put(`Partners/${id}`, payload);

    if (typeof currentStatus === "boolean" && currentStatus !== newStatusBool){
        if (newStatusBool) {
            await activatePartner(id);
        } else {
            await deactivatePartner(id);
        }
    }

    if (existingContacts && existingContacts.length > 0) {
        await Promise.all(
            existingContacts.map((c) => removeContactFromPartner(id, c.id))
        );
    }

    const contacts = buildContactsFromForm(data);

    if (contacts.length) {
        await Promise.all(
            contacts.map((c) => addContactToPartner(id, c))
        );
    }
}

export async function getPartnerById(id: string) {
    return http.get<PartnerDetails>(`Partners/${id}`);
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

    const res = await http.get<PartnerDetails[] | { items: PartnerDetails[] }>("Partners", {
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
    return http.patch(`Partners/${id}/activate`);
}

export async function deactivatePartner(id: string) {
    return http.patch(`Partners/${id}/deactivate`);
}

export async function deletePartner(id: string) {
    return http.delete(`Partners/${id}`);
}
