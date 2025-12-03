// src/services/rolesService.ts
import { http } from "@/lib/http";

export interface Role {
    id: number;
    name: string;
}

export async function getRoles(page = 1, pageSize = 50): Promise<Role[]> {
    const response = await http.get<Role[]>("Roles", {
        params: {
            page,
            pageSize,
        },
    });

    return response.data;
}
