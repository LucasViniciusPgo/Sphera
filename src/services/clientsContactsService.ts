import http from "@/lib/http";
import type { ClienteFormData } from "@/pages/CadastroClientes";
import { cleanPhone } from "@/utils/format.ts";
import {
    EContactType,
    EContactRole,
} from "@/services/partnersContactsService"; // reaproveita os enums

export interface AddContactToClientCommand {
    name: string;
    type: EContactType;
    role: EContactRole;
    value: string;
}

export interface ClientContact {
    id: string;
    name: string;
    type: EContactType;
    role: EContactRole;
    value: string;
    createdAt: string;
    createdBy: string;
    updatedAt: string | null;
    updatedBy: string | null;
}

export function buildContactsFromForm(
    data: ClienteFormData
): AddContactToClientCommand[] {
    const contacts: AddContactToClientCommand[] = [];

    // Contato Financeiro - email
    if (data.emailFinanceiro) {
        contacts.push({
            name: data.nomeFinanceiro || "Financeiro",
            type: EContactType.Email,
            role: EContactRole.Financial,
            value: data.emailFinanceiro,
        });
    }

    // Contato Financeiro - telefone
    if (data.telefoneFinanceiro) {
        contacts.push({
            name: data.nomeFinanceiro || "Financeiro",
            type: EContactType.Phone,
            role: EContactRole.Financial,
            value: cleanPhone(data.telefoneFinanceiro)!,
        });
    }

    // Contato Responsável - email
    if (data.emailResponsavel) {
        contacts.push({
            name: data.nomeResponsavel || "Responsável",
            type: EContactType.Email,
            role: EContactRole.Personal,
            value: data.emailResponsavel,
        });
    }

    // Contato Responsável - telefone
    if (data.telefoneResponsavel) {
        contacts.push({
            name: data.nomeResponsavel || "Responsável",
            type: EContactType.Phone,
            role: EContactRole.Personal,
            value: cleanPhone(data.telefoneResponsavel)!,
        });
    }

    return contacts;
}

export async function addContactToClient(
    clientId: string,
    body: AddContactToClientCommand
) {
    const res = await http.post(`Clients/${clientId}/Contacts`, body);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
}

export async function removeContactFromClient(
    clientId: string,
    contactId: string
) {
    const res = await http.delete(`Clients/${clientId}/Contacts/${contactId}`);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
}

export async function patchContact(id: string, body: any) {
    const res = await http.patch(`Contact/${id}`, body);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
}
