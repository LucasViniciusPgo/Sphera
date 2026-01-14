import { http, setAuthToken } from "@/lib/http";
import type { ParceiroFormData } from "@/pages/CadastroParceiros";
import { cleanCEP, cleanCNPJ } from "@/utils/format.ts";
import {
    addContactToPartner,
    removeContactFromPartner,
    buildContactsFromForm,
    EContactRole,
    EContactType,
    EPhoneType,
    PartnerContact,
    patchContact
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
    notes?: string | null;
}

export interface PartnerDetails {
    id: string;
    legalName: string;
    cnpj: string | null;
    address?: AddressDTO | null;
    status: boolean;
    notes?: string | null;
    createdAt: string;
    createdBy: string;
    updatedAt: string | null;
    updatedBy: string | null;
    contacts: PartnerContact[];
    clients: any[];
    clientsCount?: number;
}

export interface CreatePartnerCommand {
    legalName: string;
    cnpj?: string | null;
    address?: AddressDTO | null;
    notes?: string | null;
    financialEmail?: string | null;
    financialPhone?: string | null;
    responsibleEmail?: string | null;
    responsiblePhone?: string | null;
    landLine?: string | null;
    phone: string;
    backupPhone?: string | null;
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
        notes: data.observacoes || null,
        financialEmail: data.emailFinanceiro || null,
        financialPhone: cleanPhone(data.telefoneFinanceiro) || null,
        responsibleEmail: data.emailResponsavel || null,
        responsiblePhone: cleanPhone(data.telefoneResponsavel) || null,
        landLine: cleanPhone(data.telefoneFixo) || null,
        phone: cleanPhone(data.celular)!,
        backupPhone: cleanPhone(data.telefoneReserva) || null,
    };

    const res = await http.post<any>("Partners", payload);

    if ("message" in res && !("headers" in res)) {
        throw res;
    }

    return res.data;
}

export async function updatePartner(
    id: string,
    data: ParceiroFormData,
    currentStatus?: boolean,
    existingContacts: PartnerContact[] = []
) {
    const newStatusBool = data.status === "ativo";

    const payload: UpdatePartnerCommand = {
        legalName: data.razaoSocial,
        cnpj: cleanCNPJ(data.cnpj),
        address: buildAddressFromForm(data),
        notes: data.observacoes || null,
        status: newStatusBool,
        // Contacts are handled separately below to support conditional PATCH/POST
        financialEmail: data.emailFinanceiro || null,
        financialPhone: cleanPhone(data.telefoneFinanceiro) || null,
        responsibleEmail: data.emailResponsavel || null,
        responsiblePhone: cleanPhone(data.telefoneResponsavel) || null,
        landLine: cleanPhone(data.telefoneFixo) || null,
        phone: cleanPhone(data.celular)!,
        backupPhone: cleanPhone(data.telefoneReserva) || null,
    };

    const res = await http.put(`Partners/${id}`, payload);

    if ("message" in res && !("headers" in res)) {
        throw res;
    }

    if (typeof currentStatus === "boolean" && currentStatus !== newStatusBool) {
        if (newStatusBool) {
            await activatePartner(id);
        } else {
            await deactivatePartner(id);
        }
    }

    // Helper to find existing contact ID by role and type
    const findContact = (role: EContactRole, type: EContactType, phoneType?: EPhoneType | null) => {
        return existingContacts.find(c =>
            c.role === role &&
            c.type === type &&
            (type === EContactType.Email || c.phoneType === phoneType)
        );
    };

    // Update contacts: PATCH if exists and changed, POST if new
    const contactPromises = [];

    // Financial Email
    if (data.emailFinanceiro) {
        const existing = findContact(EContactRole.Financial, EContactType.Email);
        if (existing) {
            if (existing.value !== data.emailFinanceiro) {
                contactPromises.push(patchContact(existing.id, {
                    value: data.emailFinanceiro,
                    type: EContactType.Email,
                    role: EContactRole.Financial
                }));
            }
        } else {
            contactPromises.push(addContactToPartner(id, {
                value: data.emailFinanceiro,
                type: EContactType.Email,
                role: EContactRole.Financial
            }));
        }
    }

    // Financial Phone
    if (data.telefoneFinanceiro) {
        const cleaned = cleanPhone(data.telefoneFinanceiro);
        const existing = findContact(EContactRole.Financial, EContactType.Phone, EPhoneType.Landline);
        if (existing) {
            if (existing.value !== cleaned) {
                contactPromises.push(patchContact(existing.id, {
                    value: cleaned,
                    type: EContactType.Phone,
                    role: EContactRole.Financial,
                    phoneType: EPhoneType.Landline
                }));
            }
        } else {
            contactPromises.push(addContactToPartner(id, {
                value: cleaned!,
                type: EContactType.Phone,
                role: EContactRole.Financial,
                phoneType: EPhoneType.Landline
            }));
        }
    }

    // Responsible Email
    if (data.emailResponsavel) {
        const existing = findContact(EContactRole.Personal, EContactType.Email);
        if (existing) {
            if (existing.value !== data.emailResponsavel) {
                contactPromises.push(patchContact(existing.id, {
                    value: data.emailResponsavel,
                    type: EContactType.Email,
                    role: EContactRole.Personal
                }));
            }
        } else {
            contactPromises.push(addContactToPartner(id, {
                value: data.emailResponsavel,
                type: EContactType.Email,
                role: EContactRole.Personal
            }));
        }
    }

    // Responsible Phone
    if (data.telefoneResponsavel) {
        const cleaned = cleanPhone(data.telefoneResponsavel);
        const existing = findContact(EContactRole.Personal, EContactType.Phone, EPhoneType.Mobile);
        if (existing) {
            if (existing.value !== cleaned) {
                contactPromises.push(patchContact(existing.id, {
                    value: cleaned,
                    type: EContactType.Phone,
                    role: EContactRole.Personal,
                    phoneType: EPhoneType.Mobile
                }));
            }
        } else {
            contactPromises.push(addContactToPartner(id, {
                value: cleaned!,
                type: EContactType.Phone,
                role: EContactRole.Personal,
                phoneType: EPhoneType.Mobile
            }));
        }
    }

    // Landline
    if (data.telefoneFixo) {
        const cleaned = cleanPhone(data.telefoneFixo);
        const existing = findContact(EContactRole.General, EContactType.Phone, EPhoneType.Landline);
        if (existing) {
            if (existing.value !== cleaned) {
                contactPromises.push(patchContact(existing.id, {
                    value: cleaned,
                    type: EContactType.Phone,
                    role: EContactRole.General,
                    phoneType: EPhoneType.Landline
                }));
            }
        } else {
            contactPromises.push(addContactToPartner(id, {
                value: cleaned!,
                type: EContactType.Phone,
                role: EContactRole.General,
                phoneType: EPhoneType.Landline
            }));
        }
    }

    // Mobile Phone (Main Phone)
    if (data.celular) {
        const cleaned = cleanPhone(data.celular);
        const existing = findContact(EContactRole.General, EContactType.Phone, EPhoneType.Mobile);
        if (existing) {
            if (existing.value !== cleaned) {
                contactPromises.push(patchContact(existing.id, {
                    value: cleaned,
                    type: EContactType.Phone,
                    role: EContactRole.General,
                    phoneType: EPhoneType.Mobile
                }));
            }
        } else {
            contactPromises.push(addContactToPartner(id, {
                value: cleaned!,
                type: EContactType.Phone,
                role: EContactRole.General,
                phoneType: EPhoneType.Mobile
            }));
        }
    }

    // Backup Phone
    if (data.telefoneReserva) {
        const cleaned = cleanPhone(data.telefoneReserva);
        const existing = findContact(EContactRole.General, EContactType.Phone, EPhoneType.Backup);
        if (existing) {
            if (existing.value !== cleaned) {
                contactPromises.push(patchContact(existing.id, {
                    value: cleaned,
                    type: EContactType.Phone,
                    role: EContactRole.General,
                    phoneType: EPhoneType.Backup
                }));
            }
        } else {
            contactPromises.push(addContactToPartner(id, {
                value: cleaned!,
                type: EContactType.Phone,
                role: EContactRole.General,
                phoneType: EPhoneType.Backup
            }));
        }
    }

    if (contactPromises.length > 0) {
        await Promise.all(contactPromises);
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

    let items: PartnerDetails[] = [];
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

export async function activatePartner(id: string) {
    const res = await http.patch(`Partners/${id}/activate`);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
}

export async function deactivatePartner(id: string) {
    const res = await http.patch(`Partners/${id}/deactivate`);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
}

export async function deletePartner(id: string) {
    const res = await http.delete(`Partners/${id}`);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
}
