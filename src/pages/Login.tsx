import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card} from "@/components/ui/card";
import {Lock, Mail} from "lucide-react";
import {useLocation, useNavigate} from "react-router-dom";
import {http, setAuthToken} from "@/lib/http";

interface NovoUsuario {
    email: string;
    password: string;
    createdAt: string;
}

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const stateEmail = (location.state as any)?.email;
        if (stateEmail) {
            setEmail(stateEmail);
            return;
        }
        const params = new URLSearchParams(location.search);
        const queryEmail = params.get("email");
        if (queryEmail) {
            setEmail(queryEmail);
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!email) {
            setError("Email não informado.");
            return;
        }

        const res = await http.post(`auths/login`, {email, password});
        
        if (res.status != 200) {
            setError("Erro ao realizar login. Verifique suas credenciais.");
            return;
        }

        setSuccess("Login realizado com sucesso!");
        if (res.data.token) {
            localStorage.setItem("authToken", res.data.token);
            setAuthToken(res.data.token);
        }
        if (res.data.refreshToken) {
            localStorage.setItem("refreshToken", res.data.refreshToken);
        }

        // Persistir usuário
        // Redirecionar após curto delay para feedback
        setTimeout(() => navigate("/home"), 800);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"/>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"/>
            </div>

            <Card className="w-full max-w-md relative z-10 bg-card/80 backdrop-blur-sm border-border shadow-2xl">
                <div className="p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div
                            className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                            <Lock className="w-8 h-8 text-primary-foreground"/>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">Login</h1>
                        <p className="text-muted-foreground">Insira suas credenciais de acesso para continuar</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground">Email</Label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"/>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    readOnly
                                    className="pl-10 bg-muted/40 border-border text-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Digite sua senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}
                        {success && <p className="text-sm text-green-600">{success}</p>}

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Entrar
                        </Button>
                    </form>


                    <div className="text-center text-xs text-muted-foreground">Seu email foi capturado no passo
                        anterior.
                    </div>
                </div>
            </Card>
        </div>
    );
};
export default Login;
