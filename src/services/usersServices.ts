// src/services/usersServices.ts
import { Usuario } from "@/interfaces/Usuario";
import { http } from "@/lib/http";
import type { UsuarioFormData } from "@/pages/NovoUsuario";
import {
    buildContactsFromUserForm,
    addContactToUser,
} from "./usersContactsService.ts";
import {PartnerDetails} from "@/services/partnersService.ts";


export async function getUsers(params?: {
    email?: string;
    isActive?: boolean;
    roleId?: number;
    page?: number;
    pageSize?: number;
}) {
    const { email, isActive, roleId, page, pageSize } = params || {};
    const actualParams: Record<string, any> = {};

    if (email) actualParams.Email = email;
    if (typeof isActive === "boolean") actualParams.IsActive = isActive;
    if (roleId !== undefined) actualParams.RoleId = roleId;
    if (page !== undefined) actualParams.Page = page;
    if (pageSize !== undefined) actualParams.PageSize = pageSize;

    const response = await http.get<Usuario[] | { items: Usuario[] }>("users", {
        params: actualParams,
    });

    const raw = response.data;
    const items = Array.isArray(raw) ? raw : Array.isArray((raw as any).items) ? (raw as any).items : [];

    return items;
}

export async function getUserById(id: string) {
    return http.get<PartnerDetails>(`users/${id}`);
}


interface CreateUserCommand {
    name: string;
    email: string;
    roleId: number;
}


export async function createUser(data: UsuarioFormData) {
    const payload: CreateUserCommand = {
        name: data.username,
        email: data.email,
        roleId: Number(data.roleId),
    };

    const res = await http.post<Usuario>("users", payload);
    const user = res.data;
    const userId = user.id;

    const contacts = buildContactsFromUserForm(data);

    if (contacts.length > 0) {
        await Promise.all(contacts.map((c) => addContactToUser(userId, c)));
    }

    return user;
}

export async function updateUser(id: string, payload: {
    name: string;
    roleId?: number | null;
}) {
    const body = {
        id,
        name: payload.name,
        roleId: payload.roleId ?? null,
    };

    const res = await http.put(`users/${id}`, body);
    return res.data;
}

export async function deleteUser(id: string) {
    return http.delete(`users/${id}`);
}

export async function activateUser(id: string) {
    return http.patch(`users/${id}/activate`);
}

export async function deactivateUser(id: string) {
    return http.patch(`users/${id}/deactivate`);
}