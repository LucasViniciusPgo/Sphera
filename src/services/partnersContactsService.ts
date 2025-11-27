import http from "@/lib/http";

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

export async function addContactToPartner(
    partnerId: string,
    body: AddContactToPartnerCommand
) {
    return http.post(`/api/v1/Partners/${partnerId}/Contacts`, body);
}