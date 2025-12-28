import { Navigate, Outlet } from "react-router-dom";

interface RouteGuardProps {
    requiresAuthentication: boolean;
}

export function RouteGuard(props: RouteGuardProps) {
    const token = localStorage.getItem("authToken")

    if (props.requiresAuthentication && token === null) {
        return <Navigate to="/" replace />;
    }
    if (!props.requiresAuthentication && token !== null) {
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
}