import { useNavigate } from "react-router-dom";
import { setAuthToken } from "@/lib/http";

export const useLogout = () => {
    const navigate = useNavigate();

    const logout = () => {
        // Limpar tokens de autenticação
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");

        // Limpar dados do usuário
        localStorage.removeItem("currentUser");
        localStorage.removeItem("currentUserId");

        // Limpar token em memória
        setAuthToken(null);

        // Redirecionar para página inicial
        navigate("/");
    };

    return { logout };
};
