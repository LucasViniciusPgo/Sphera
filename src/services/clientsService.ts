import { http } from "@/lib/http";
import { EExpirationStatus } from "@/interfaces/Arquivo";
import type { ClienteFormData } from "@/pages/CadastroClientes";
import { cleanCNPJ, cleanPhone, cleanCEP } from "@/utils/format.ts";
import {
    patchContact,
    type ClientContact,
} from "./clientsContactsService.ts";
import { EContactRole, EContactType } from "./partnersContactsService.ts";

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
    expirationStatus: EExpirationStatus;
    ecacExpirationDate?: string | null;
    notes?: string | null;
    documentsCount?: number;
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
    stateRegistration: string | null;
    municipalRegistration: string | null;
    address: AddressDTO;
    financialContactName: string;
    financialEmail: string;
    financialPhone: string;
    contactName: string;
    email: string;
    phone: string;
    billingDueDay?: number | null;
    contractDateInDays: number;
    ecacExpirationDate?: string;
    notes?: string | null;
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
    return d.getUTCDate();
}

export async function createClient(data: ClienteFormData) {
    const billingDueDay = getBillingDueDayFromDate(data.dataVencimento);
    const contractDays = Number(data.vencimentoContrato);

    const payload: CreateClientCommand = {
        partnerId: data.parceiroId,
        tradeName: data.nomeFantasia,
        legalName: data.razaoSocial,
        cnpj: cleanCNPJ(data.cnpj),
        stateRegistration: data.inscricaoEstadual || null,
        municipalRegistration: data.inscricaoMunicipal || null,
        address: buildAddressFromForm(data),
        financialContactName: data.nomeFinanceiro,
        financialEmail: data.emailFinanceiro,
        financialPhone: cleanPhone(data.telefoneFinanceiro)!,
        contactName: data.nomeResponsavel,
        email: data.emailResponsavel,
        phone: cleanPhone(data.telefoneResponsavel)!,
        billingDueDay: billingDueDay,
        contractDateInDays: contractDays,
        ecacExpirationDate: data.dataVencimentoEcac || undefined,
        notes: data.observacoes || null,
    };

    const res = await http.post<any>("Clients", payload);

    if ("message" in res && !("headers" in res)) {
        throw res;
    }

    return res.data;
}

export async function updateClient(
    id: string,
    data: ClienteFormData,
    existingContacts: ClientContact[]
) {
    const newStatusBool = data.status === "ativo";
    const billingDueDay = getBillingDueDayFromDate(data.dataVencimento);
    const contractDays = data.vencimentoContrato
        ? Number(data.vencimentoContrato)
        : 0;

    const payload: UpdateClientCommand = {
        partnerId: data.parceiroId,
        tradeName: data.nomeFantasia,
        legalName: data.razaoSocial,
        cnpj: cleanCNPJ(data.cnpj),
        stateRegistration: data.inscricaoEstadual || null,
        municipalRegistration: data.inscricaoMunicipal || null,
        address: buildAddressFromForm(data),
        financialContactName: data.nomeFinanceiro,
        financialEmail: data.emailFinanceiro,
        financialPhone: cleanPhone(data.telefoneFinanceiro)!,
        contactName: data.nomeResponsavel,
        email: data.emailResponsavel,
        phone: cleanPhone(data.telefoneResponsavel)!,
        billingDueDay,
        contractDateInDays: contractDays,
        ecacExpirationDate: data.dataVencimentoEcac || undefined,
        notes: data.observacoes || null,
        status: newStatusBool,
    };

    // Update main client data
    const res = await http.put(`Clients/${id}`, payload);

    if ("message" in res && !("headers" in res)) {
        throw res;
    }

    // Helper to find existing contact ID by role and type
    const findContact = (role: EContactRole, type: EContactType) => {
        return existingContacts.find(c =>
            c.role === role &&
            c.type === type
        );
    };

    // Update contacts via PATCH only if changed
    const contactPromises = [];

    // Financial Email
    const existingFinEmail = findContact(EContactRole.Financial, EContactType.Email);
    if (existingFinEmail && (existingFinEmail.value !== data.emailFinanceiro || existingFinEmail.name !== data.nomeFinanceiro)) {
        contactPromises.push(patchContact(existingFinEmail.id, {
            name: data.nomeFinanceiro,
            value: data.emailFinanceiro,
            type: EContactType.Email,
            role: EContactRole.Financial,
            phoneType: null
        }));
    }

    // Financial Phone
    const existingFinPhone = findContact(EContactRole.Financial, EContactType.Phone);
    const cleanedFinPhone = cleanPhone(data.telefoneFinanceiro);
    if (existingFinPhone && (existingFinPhone.value !== cleanedFinPhone || existingFinPhone.name !== data.nomeFinanceiro)) {
        contactPromises.push(patchContact(existingFinPhone.id, {
            name: data.nomeFinanceiro,
            value: cleanedFinPhone,
            type: EContactType.Phone,
            role: EContactRole.Financial,
            phoneType: 0 // Landline
        }));
    }

    // Responsible Email
    const existingResEmail = findContact(EContactRole.Personal, EContactType.Email);
    if (existingResEmail && (existingResEmail.value !== data.emailResponsavel || existingResEmail.name !== data.nomeResponsavel)) {
        contactPromises.push(patchContact(existingResEmail.id, {
            name: data.nomeResponsavel,
            value: data.emailResponsavel,
            type: EContactType.Email,
            role: EContactRole.Personal,
            phoneType: null
        }));
    }

    // Responsible Phone
    const existingResPhone = findContact(EContactRole.Personal, EContactType.Phone);
    const cleanedResPhone = cleanPhone(data.telefoneResponsavel);
    if (existingResPhone && (existingResPhone.value !== cleanedResPhone || existingResPhone.name !== data.nomeResponsavel)) {
        contactPromises.push(patchContact(existingResPhone.id, {
            name: data.nomeResponsavel,
            value: cleanedResPhone,
            type: EContactType.Phone,
            role: EContactRole.Personal,
            phoneType: 1 // Mobile
        }));
    }

    if (contactPromises.length > 0) {
        await Promise.all(contactPromises);
    }

    return res.data;
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
    expirationStatus?: number;
    dueDateFrom?: string;
    dueDateTo?: string;
}) {
    const { partnerId, status, cnpj, search, page, pageSize, includePartner, expirationStatus, dueDateFrom, dueDateTo } =
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
                ExpirationStatus: expirationStatus,
                DueDateFrom: dueDateFrom,
                DueDateTo: dueDateTo,
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
