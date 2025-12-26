// src/services/usersServices.ts
import { Usuario } from "@/interfaces/Usuario";
import { http } from "@/lib/http";
import type { UsuarioFormData } from "@/pages/NovoUsuario";
import {
    buildContactsFromUserForm,
    addContactToUser,
} from "./usersContactsService.ts";


export async function getUsers(params?: {
    name?: string;
    email?: string;
    isActive?: boolean;
    roleId?: number;
    page?: number;
    pageSize?: number;
    search?: string;
}) {
    const { name, email, isActive, roleId, page, pageSize, search } = params || {};
    const actualParams: Record<string, any> = {};

    if (name) actualParams.Name = name;
    if (email) actualParams.Email = email;
    if (typeof isActive === "boolean") actualParams.IsActive = isActive;
    if (roleId !== undefined) actualParams.RoleId = roleId;
    if (page !== undefined) actualParams.Page = page;
    if (pageSize !== undefined) actualParams.PageSize = pageSize;
    if (search) actualParams.Search = search;

    const response = await http.get<Usuario[] | { items: Usuario[] }>("users", {
        params: actualParams,
    });

    const raw = response.data;
    let items: Usuario[] = [];
    let totalCount = 0;

    if (Array.isArray(raw)) {
        items = raw;
        totalCount = raw.length;
    } else {
        items = (raw as any).items || [];
        totalCount = (raw as any).totalCount || (raw as any).total || 0;
    }

    return { items, totalCount };
}

export async function getUserById(id: string) {
    const res = await http.get<Usuario>(`users/${id}`);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
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

    if ("message" in res && !("headers" in res)) {
        throw res;
    }

    const user = res.data;
    const userId = user.id;

    const contacts = buildContactsFromUserForm(data);

    if (contacts.length > 0) {
        try {
            await Promise.all(contacts.map((c) => addContactToUser(userId, c)));
        } catch (error) {
            // Rollback: remove usuário incompleto
            await deleteUser(userId);
            throw error;
        }
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
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res.data;
}

export async function deleteUser(id: string) {
    const res = await http.delete(`users/${id}`);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
}

export async function activateUser(id: string) {
    const res = await http.patch(`users/${id}/activate`);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
}

export async function deactivateUser(id: string) {
    const res = await http.patch(`users/${id}/deactivate`);
    if ("message" in res && !("headers" in res)) {
        throw res;
    }
    return res;
}