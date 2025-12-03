import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthRole } from "@/hooks/useAuthRole";

interface RequireRoleProps {
    allowed: string[];      // ["Administrador"] ou ["Administrador", "Financeiro"]
    children: ReactNode;
}

export function RequireRole({ allowed, children }: RequireRoleProps) {
    const { loading, hasAnyRole } = useAuthRole();

    if (loading) {
        return null; // ou um spinner, se quiser
    }

    if (!hasAnyRole(allowed)) {
        return <Navigate to="/home" replace />;
    }

    return <>{children}</>;
}