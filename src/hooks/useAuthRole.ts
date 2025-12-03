import { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/http";

function decodeJwtPayload(token: string): any | null {
    try {
        const [_, payload] = token.split(".");
        if (!payload) return null;

        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "="
        );
        const json = atob(padded);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function extractRoleFromPayload(payload: any | null): string | null {
    if (!payload) return null;

    const dotnetRoleClaim =
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];

    if (typeof dotnetRoleClaim === "string") return dotnetRoleClaim;

    if (typeof payload.role === "string") return payload.role;

    return null;
}

export const useAuthRole = () => {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const inMemoryToken = getAuthToken();
        const storedToken = localStorage.getItem("authToken");
        const token = inMemoryToken || storedToken;

        if (!token) {
            setRole(null);
            setLoading(false);
            return;
        }

        const payload = decodeJwtPayload(token);
        const roleName = extractRoleFromPayload(payload);

        setRole(roleName);
        setLoading(false);
    }, []);

    const hasRole = (required: string) => role === required;

    const hasAnyRole = (requiredList: string[]) =>
        !!role && requiredList.includes(role);

    return {
        role,
        loading,
        isAdmin: role === "Administrador",
        isFinanceiro: role === "Financeiro",
        hasRole,
        hasAnyRole,
    };
};