import http from "@/lib/http";
import type { ParceiroFormData } from "@/pages/CadastroParceiros";
import { cleanPhone } from "@/utils/format.ts";

export enum EContactType {
    Email = 0,
    Phone = 1
}

export enum EContactRole {
    Personal = 0,
    Financial = 1,
    General = 2
}

export enum EPhoneType {
    Landline = 0,
    Mobile = 1,
    Backup = 2
}

export interface AddContactToPartnerCommand {
    type: EContactType;
    role: EContactRole;
    phoneType?: EPhoneType | null;
    value: string;
}

export interface PartnerContact {
    id: string;
    name: string | null;
    type: EContactType;
    role: EContactRole;
    phoneType?: EPhoneType | null;
    value: string;
    createdAt: string;
    createdBy: string;
    updatedAt: string | null;
    updatedBy: string | null;
}

export function buildContactsFromForm(data: ParceiroFormData): AddContactToPartnerCommand[] {
    const contacts: AddContactToPartnerCommand[] = [];

    // Financeiro - email
    if (data.emailFinanceiro) {
        contacts.push({
            type: EContactType.Email,
            role: EContactRole.Financial,
            phoneType: null,
            value: data.emailFinanceiro,
        });
    }

    // Financeiro - telefone
    if (data.telefoneFinanceiro) {
        contacts.push({
            type: EContactType.Phone,
            role: EContactRole.Financial,
            phoneType: EPhoneType.Landline,
            value: cleanPhone(data.telefoneFinanceiro)!,
        });
    }

    // Responsável - email
    if (data.emailResponsavel) {
        contacts.push({
            type: EContactType.Email,
            role: EContactRole.Personal,
            phoneType: null,
            value: data.emailResponsavel,
        });
    }

    // Responsável - telefone
    if (data.telefoneResponsavel) {
        contacts.push({
            type: EContactType.Phone,
            role: EContactRole.Personal,
            phoneType: EPhoneType.Mobile,
            value: cleanPhone(data.telefoneResponsavel)!,
        });
    }

    // Geral - telefone fixo
    if (data.telefoneFixo) {
        contacts.push({
            type: EContactType.Phone,
            role: EContactRole.General,
            phoneType: EPhoneType.Landline,
            value: cleanPhone(data.telefoneFixo)!,
        });
    }

    // Geral - celular
    if (data.celular) {
        contacts.push({
            type: EContactType.Phone,
            role: EContactRole.General,
            phoneType: EPhoneType.Mobile,
            value: cleanPhone(data.celular)!,
        });
    }

    // Geral - reserva
    if (data.telefoneReserva) {
        contacts.push({
            type: EContactType.Phone,
            role: EContactRole.General,
            phoneType: EPhoneType.Backup,
            value: cleanPhone(data.telefoneReserva)!,
        });
    }

    return contacts;
}

export async function addContactToPartner(
    partnerId: string,
    body: AddContactToPartnerCommand
) {
    return http.post(`Partners/${partnerId}/Contacts`, body);
}

export async function removeContactFromPartner(partnerId: string, contactId: string) {
    return http.delete(`Partners/${partnerId}/Contacts/${contactId}`);
}