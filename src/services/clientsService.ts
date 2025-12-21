import { http } from "@/lib/http";
import type { ClienteFormData } from "@/pages/CadastroClientes";
import { cleanCNPJ, cleanPhone, cleanCEP } from "@/utils/format.ts";
import {
    buildContactsFromForm,
    addContactToClient,
    removeContactFromClient,
    type ClientContact,
} from "./clientsContactsService.ts";

export interface AddressDTO {
    street: string;
    number: number | null;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    lot?: string | null;
}

export interface ClientPartnerInfo {
    id: string;
    legalName: string;
}

export interface ApiClient {
    id: string;
    tradeName: string;
    legalName: string;
    cnpj: string;
    stateRegistration: string;
    municipalRegistration: string;
    address?: AddressDTO | null;
    billingDueDay?: number | null;
    contractDate?: string | null;
    status: boolean;
}

export interface ClientDetails extends ApiClient {
    createdAt: string;
    createdBy: string;
    updatedAt: string | null;
    updatedBy: string | null;
    contacts: ClientContact[];
    partner?: ClientPartnerInfo | null;
}

export interface CreateClientCommand {
    partnerId?: string;
    tradeName: string;
    legalName: string;
    cnpj: string;
    stateRegistration: string;
    municipalRegistration: string;
    address: AddressDTO;
    financialEmail: string;
    financialPhone: string;
    email: string;
    phone: string;
    billingDueDay?: number | null;
    contractDateInDays: number;
}

export interface UpdateClientCommand extends CreateClientCommand {
    status: boolean;
}

function buildAddressFromForm(data: ClienteFormData): AddressDTO {
    return {
        street: data.rua,
        number: data.numero ? Number(data.numero) : null,
        complement: data.complemento || null,
        neighborhood: data.bairro,
        city: data.cidade,
        state: data.estado.toUpperCase(),
        zipCode: cleanCEP(data.cep),
        lot: data.lote || null,
    };
}

function getBillingDueDayFromDate(dateStr: string | undefined): number | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.getDate();
}

export async function createClient(data: ClienteFormData) {
    const billingDueDay = getBillingDueDayFromDate(data.dataVencimento);
    const contractDays = Number(data.vencimentoContrato);

    const payload: CreateClientCommand = {
        partnerId: data.parceiroId,
        tradeName: data.nomeFantasia,
        legalName: data.razaoSocial,
        cnpj: cleanCNPJ(data.cnpj),
        stateRegistration: data.inscricaoEstadual || "ISENTO",
        municipalRegistration: data.inscricaoMunicipal,
        address: buildAddressFromForm(data),
        financialEmail: data.emailFinanceiro,
        financialPhone: cleanPhone(data.telefoneFinanceiro)!,
        email: data.emailResponsavel,
        phone: cleanPhone(data.telefoneResponsavel)!,
        billingDueDay: billingDueDay,
        contractDateInDays: contractDays,
    };

    const res = await http.post<any>("Clients", payload);

    if ("message" in res && !("headers" in res)) {
        throw res;
    }

    const client = res.data;
    const clientId: string = client.id;

    const contacts = buildContactsFromForm(data);

    if (contacts.length > 0) {
        try {
            await Promise.all(contacts.map((c) => addContactToClient(clientId, c)));
        } catch (error) {
            // Rollback: se falhar ao adicionar contatos, remove o cliente para garantir integridade
            // "Um cliente não pode ficar sem contato"
            await deleteClient(clientId);
            throw error;
        }
    }

    return client;
}

export async function updateClient(
    id: string,
    data: ClienteFormData,
    currentStatus?: boolean,
    existingContacts?: ClientContact[]
) {
    const newStatusBool = data.status === "ativo";
    const billingDueDay = getBillingDueDayFromDate(data.dataVencimento);
    const contractDays = data.vencimentoContrato
        ? Number(data.vencimentoContrato)
        : undefined;

    const payload: UpdateClientCommand = {
        partnerId: data.parceiroId,
        tradeName: data.nomeFantasia,
        legalName: data.razaoSocial,
        cnpj: cleanCNPJ(data.cnpj),
        stateRegistration: data.inscricaoEstadual || "ISENTO",
        municipalRegistration: data.inscricaoMunicipal,
        address: buildAddressFromForm(data),
        financialEmail: data.emailFinanceiro,
        financialPhone: cleanPhone(data.telefoneFinanceiro)!,
        email: data.emailResponsavel,
        phone: cleanPhone(data.telefoneResponsavel)!,
        billingDueDay,
        contractDateInDays: contractDays,
        status: newStatusBool,
    };

    const res = await http.put(`Clients/${id}`, payload);

    if ("message" in res && !("headers" in res)) {
        throw res;
    }

    if (typeof currentStatus === "boolean" && currentStatus !== newStatusBool) {
        if (newStatusBool) {
            await activateClient(id);
        } else {
            await deactivateClient(id);
        }
    }

    if (existingContacts && existingContacts.length > 0) {
        await Promise.all(
            existingContacts.map((c) => removeContactFromClient(id, c.id))
        );
    }

    const contacts = buildContactsFromForm(data);

    if (contacts.length) {
        await Promise.all(contacts.map((c) => addContactToClient(id, c)));
    }
}

export async function getClientById(id: string) {
    return http.get<ClientDetails>(`Clients/${id}`, {
        params: { includePartner: true }
    });
}

export async function getClients(params?: {
    partnerId?: string;
    status?: boolean;
    cnpj?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    includePartner?: boolean;
}) {
    const { partnerId, status, cnpj, search, page, pageSize, includePartner } =
        params || {};

    const res = await http.get<ClientDetails[] | { items: ClientDetails[] }>(
        "Clients",
        {
            params: {
                PartnerId: partnerId,
                Status: status,
                Cnpj: cnpj,
                Search: search,
                Page: page,
                PageSize: pageSize,
                IncludePartner: includePartner,
            },
        }
    );

    const raw = res.data;

    let items: ClientDetails[] = [];
    let totalCount = 0;

    if (Array.isArray(raw)) {
        items = raw;
        totalCount = raw.length;
    } else if ((raw as any)?.items) {
        items = (raw as any).items;
        totalCount = (raw as any).totalCount || (raw as any).total || 0;
    }

    if (totalCount === 0 && items.length > 0) {
        totalCount = items.length;
    }

    return { items, raw, totalCount };
}

export async function activateClient(id: string) {
    const res = await http.patch(`Clients/${id}/activate`);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
}

export async function deactivateClient(id: string) {
    const res = await http.patch(`Clients/${id}/deactivate`);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
}

export async function deleteClient(id: string) {
    const res = await http.delete(`Clients/${id}`);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
}
