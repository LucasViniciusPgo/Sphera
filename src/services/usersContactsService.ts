import http from "@/lib/http";
import type { UsuarioFormData } from "@/pages/NovoUsuario";
import { cleanPhone } from "@/utils/format.ts";
import {
    EContactType,
    EContactRole,
    EPhoneType,
} from "@/services/partnersContactsService.ts";

export interface AddContactToUserCommand {
    type: EContactType;
    role: EContactRole;
    phoneType?: EPhoneType | null;
    value: string;
}

export interface UserContact {
    id: string;
    type: EContactType;
    role: EContactRole;
    phoneType?: EPhoneType | null;
    value: string;
    createdAt: string;
    createdBy: string;
    updatedAt: string | null;
    updatedBy: string | null;
}


export function buildContactsFromUserForm(
    data: UsuarioFormData
): AddContactToUserCommand[] {
    const contacts: AddContactToUserCommand[] = [];

    // Telefone fixo -> Geral / Landline
    if (data.telefoneFixo) {
        contacts.push({
            type: EContactType.Phone,
            role: EContactRole.General,
            phoneType: EPhoneType.Landline,
            value: cleanPhone(data.telefoneFixo)!,
        });
    }

    // Celular -> Geral / Mobile
    if (data.celular) {
        contacts.push({
            type: EContactType.Phone,
            role: EContactRole.General,
            phoneType: EPhoneType.Mobile,
            value: cleanPhone(data.celular)!,
        });
    }

    // Telefone reserva -> Geral / Backup
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

export async function addContactToUser(
    userId: string,
    body: AddContactToUserCommand
) {
    return http.post(`Users/${userId}/Contacts`, body);
}

export async function removeContactFromUser(
    userId: string,
    contactId: string
) {
    return http.delete(`Users/${userId}/Contacts/${contactId}`);
}
