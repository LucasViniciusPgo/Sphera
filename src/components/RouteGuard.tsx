import { useAuthRole } from "@/hooks/useAuthRole";
import { Navigate, Outlet } from "react-router-dom";

interface RouteGuardProps {
    requiresAuthentication: boolean;
}

export function RouteGuard(props: RouteGuardProps) {
    let { role } = useAuthRole(); // Reutilizando o hook useAuthRole para verificar se o usuário está autenticado

    if (props.requiresAuthentication && role === null) {
        return <Navigate to="/" replace />;
    }
    if (!props.requiresAuthentication && role !== null) {
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
}