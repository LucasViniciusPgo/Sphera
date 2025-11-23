import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail, UserPlus, Phone, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.tsx";
import * as z from "zod";
import { useForm } from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";

// Tela de cadastro simples: apenas nome de usuário e email conforme solicitado.
const NovoUsuario = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [telefoneFixo, setTelefoneFixo] = useState("");
    const [celular, setCelular] = useState("");
    const [telefoneReserva, setTelefoneReserva] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aqui futuramente poderia chamar uma API de criação de usuário.
        console.log("Novo usuário:", { username, email });
        // Após cadastrar, você pode redirecionar. Mantive volta para /home por enquanto.
        navigate("/");
    };

    const userSchema = z.object({
        username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres").max(100),
        email: z.string().email(),
        telefoneFixo: z.string().optional(),
        celular: z.string().min(14, "Celular é obrigatório").max(15),
        telefoneReserva: z.string().optional(),
    });

    type ParceiroFormData = z.infer<typeof userSchema>;

    const form = useForm<ParceiroFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username: '',
            email: '',
            telefoneFixo: '',
            celular: '',
            telefoneReserva: '',
        },
    });

    function formatPhone(value: string) {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        // Se não há dígitos, retorna string vazia para permitir apagar tudo
        if (!digits) return '';
        if (digits.length <= 2) return `(${digits}`; // Exibe parêntese só se houver algum dígito
        if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
        if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
        return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Elementos decorativos */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative z-10 bg-card/80 backdrop-blur-sm border-border shadow-2xl">
                <div className="p-8 space-y-6">
                    {/* Cabeçalho */}
                        <div className="text-center space-y-2">
                            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                                <UserPlus className="w-8 h-8 text-primary-foreground" />
                            </div>
                            <h1 className="text-3xl font-bold text-foreground">Cadastrar novo usuário</h1>
                        </div>

                        {/* Formulário */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-foreground">Nome de usuário</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Digite o nome de usuário"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="telefoneFixo" className="text-foreground">Telefone Fixo</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="telefoneFixo"
                                        type="text"
                                        placeholder="(00) 00000-0000"
                                        value={telefoneFixo}
                                        onChange={(e) => setTelefoneFixo(formatPhone(e.target.value))}
                                        className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="celular" className="text-foreground">Celular *</Label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="celular"
                                        type="text"
                                        placeholder="(00) 00000-0000"
                                        value={celular}
                                        onChange={(e) => setCelular(formatPhone(e.target.value))}
                                        className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="telefoneReserva" className="text-foreground">Telefone Reserva</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="telefoneReserva"
                                        type="text"
                                        placeholder="(00) 00000-0000"
                                        value={telefoneReserva}
                                        onChange={(e) => setTelefoneReserva(formatPhone(e.target.value))}
                                        className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                Cadastrar
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate(-1)}
                                className="w-full text-sm text-muted-foreground hover:text-foreground"
                            >
                                Voltar
                            </Button>
                        </form>
                </div>
            </Card>
        </div>
    );
};

export default NovoUsuario;
