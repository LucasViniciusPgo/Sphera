// src/pages/NovoUsuario.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { ArrowLeft, Phone, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createUser, updateUser, getUserById } from "@/services/usersServices";
import { getRoles, Role } from "@/services/rolesService";
import { formatPhone } from "@/utils/format.ts";
import { Usuario } from "@/interfaces/Usuario.ts";
import { EContactRole, EContactType, EPhoneType } from "@/services/partnersContactsService.ts";

const userSchema = z.object({
    username: z
        .string()
        .min(3, "Nome de usuário deve ter no mínimo 3 caracteres")
        .max(100),
    email: z.string().email("E-mail inválido"),
    roleId: z.string().min(1, "Selecione um perfil"),
    telefoneFixo: z
        .string()
        .min(10, "Telefone inválido")
        .max(20)
        .optional()
        .or(z.literal("")),
    celular: z.string().min(10, "Celular é obrigatório").max(20),
    telefoneReserva: z
        .string()
        .min(10, "Telefone inválido")
        .max(20)
        .optional()
        .or(z.literal("")),
});

export type UsuarioFormData = z.infer<typeof userSchema>;

const NovoUsuario = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();

    const readonly =
        new URLSearchParams(location.search).get("view") === "readonly";
    const isEditing = !!id;

    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [originalStatus, setOriginalStatus] = useState<boolean | undefined>(undefined);

    const form = useForm<UsuarioFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username: "",
            email: "",
            roleId: "",
            telefoneFixo: "",
            celular: "",
            telefoneReserva: "",
        },
    });

    useEffect(() => {
        const loadRoles = async () => {
            try {
                setLoadingRoles(true);
                const data = await getRoles();
                setRoles(data);
            } catch (error) {
                toast({
                    title: "Erro ao carregar perfis",
                    description:
                        "Não foi possível carregar a lista de perfis. Tente novamente mais tarde.",
                    variant: "destructive",
                });
            } finally {
                setLoadingRoles(false);
            }
        };

        loadRoles();
    }, [toast]);

    useEffect(() => {
        if (!id) return;

        (async () => {
            try {
                const response = await getUserById(id);
                const userData = response.data;
                console.log("DEBUG UserData:", JSON.stringify(userData, null, 2)); // Debug log
                const contacts = userData.contacts;

                let telefoneFixo = "";
                let celular = "";
                let telefoneReserva = "";

                for (const c of contacts) {
                    // TELEFONE FIXO (geral + fixo)
                    if (
                        c.type === EContactType.Phone &&
                        c.role === EContactRole.General &&
                        c.phoneType === EPhoneType.Landline &&
                        !telefoneFixo
                    ) {
                        telefoneFixo = formatPhone(c.value);
                    }

                    // CELULAR (geral + mobile)
                    if (
                        c.type === EContactType.Phone &&
                        c.role === EContactRole.General &&
                        c.phoneType === EPhoneType.Mobile &&
                        !celular
                    ) {
                        celular = formatPhone(c.value);
                    }

                    // TELEFONE RESERVA (geral + reserva)
                    if (
                        c.type === EContactType.Phone &&
                        c.role === EContactRole.General &&
                        c.phoneType === EPhoneType.Backup &&
                        !telefoneReserva
                    ) {
                        telefoneReserva = formatPhone(c.value);
                    }
                }

                form.reset({
                    username: userData.name,
                    email: userData.email,
                    // Check for roleId (camel), RoleId (Pascal), or nested role object
                    roleId: String(
                        userData.roleId ??
                        (userData as any).RoleId ??
                        (userData as any).role?.id ??
                        (userData as any).Role?.id ??
                        (userData as any).Role?.Id ??
                        ""
                    ),
                    telefoneFixo: telefoneFixo,
                    celular: celular,
                    telefoneReserva: telefoneReserva,
                });
            } catch (e) {
                console.error(e);
                toast({
                    title: "Erro ao carregar usuário",
                    description:
                        "Não foi possível carregar os dados do usuário. Tente novamente.",
                    variant: "destructive",
                });
                navigate("/home/usuarios");
            }
        })();

    }, [id, form, navigate, toast]);

    const handleSubmit = async (values: UsuarioFormData) => {
        try {
            setIsSubmitting(true);

            if (isEditing && id) {
                await updateUser(id, {
                    name: values.username.trim(),
                    roleId: Number(values.roleId),
                });

                toast({
                    title: "Usuário atualizado com sucesso!",
                });
            } else {
                await createUser({
                    username: values.username.trim(),
                    email: values.email.trim(),
                    roleId: values.roleId,
                    telefoneFixo: values.telefoneFixo,
                    celular: values.celular,
                    telefoneReserva: values.telefoneReserva,
                });

                toast({
                    title: "Usuário criado com sucesso!",
                });
            }

            navigate("/home/usuarios");
        } catch (error: any) {
            console.error(error);
            let description = "Não foi possível salvar o usuário. Tente novamente.";

            if (error?.data?.errors) {
                const errors = error.data.errors;
                const firstErrorKey = Object.keys(errors)[0];
                if (firstErrorKey && errors[firstErrorKey]?.length > 0) {
                    description = errors[firstErrorKey][0];
                }
            } else if (error?.data?.message) {
                description = error.data.message;
            } else if (error?.message) {
                description = error.message;
            }

            toast({
                title: isEditing ? "Erro ao atualizar usuário" : "Erro ao criar usuário",
                description,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const titulo = readonly
        ? "Visualizar Usuário"
        : isEditing
            ? "Editar Usuário"
            : "Cadastrar Usuário";

    const descricao = readonly
        ? "Detalhes do usuário."
        : isEditing
            ? "Atualize as informações do usuário."
            : "Informe os dados do novo usuário.";

    return (
        <div className="max-w-4xl mx-auto">
            <Button
                variant="ghost"
                className="mb-6"
                onClick={() => navigate("/home/usuarios")}
                type="button"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>{titulo}</CardTitle>
                    <CardDescription>{descricao}</CardDescription>
                </CardHeader>

                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

                            {/* Dados do Usuário */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Dados do Usuário</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nome do usuário" {...field}
                                                        readOnly={readonly} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>E-mail *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="email@empresa.com.br" {...field}
                                                        readOnly={readonly} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="roleId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Perfil *</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        disabled={loadingRoles || readonly}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder={
                                                                    loadingRoles ? "Carregando perfis..." : "Selecione um perfil"
                                                                }
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {roles.map((role) => (
                                                                <SelectItem key={role.id} value={String(role.id)}>
                                                                    {role.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Contato */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Contato</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Telefone fixo */}
                                    <FormField
                                        control={form.control}
                                        name="telefoneFixo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telefone fixo</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Phone
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="(00) 0000-0000"
                                                            className="pl-9"
                                                            value={field.value || ""}
                                                            readOnly={readonly}
                                                            onChange={(e) =>
                                                                field.onChange(formatPhone(e.target.value))
                                                            }
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Celular (obrigatório) */}
                                    <FormField
                                        control={form.control}
                                        name="celular"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Celular *</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Smartphone
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="(00) 00000-0000"
                                                            className="pl-9"
                                                            value={field.value || ""}
                                                            readOnly={readonly}
                                                            onChange={(e) =>
                                                                field.onChange(formatPhone(e.target.value))
                                                            }
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Telefone reserva */}
                                    <FormField
                                        control={form.control}
                                        name="telefoneReserva"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telefone reserva</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Phone
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="(00) 00000-0000"
                                                            className="pl-9"
                                                            value={field.value || ""}
                                                            readOnly={readonly}
                                                            onChange={(e) =>
                                                                field.onChange(formatPhone(e.target.value))
                                                            }
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {!readonly && (
                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/home/usuarios")}
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting || loadingRoles}>
                                        {isSubmitting
                                            ? isEditing
                                                ? "Atualizando..."
                                                : "Salvando..."
                                            : isEditing
                                                ? "Atualizar Usuário"
                                                : "Salvar Usuário"}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default NovoUsuario;