import {useState, useEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {Button} from "@/components/ui/button";
import {Select, SelectTrigger, SelectContent, SelectItem, SelectValue} from "@/components/ui/select";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {useToast} from "@/hooks/use-toast";
import {ArrowLeft} from "lucide-react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import type {Parceiro} from "./ListaParceiros";
import {getCurrentUser} from "@/hooks/useCurrentUser";
import {createPartner, updatePartner, getPartnerById} from "@/services/PartnersService.ts";

const emptyToUndefined = (val: unknown) =>
    typeof val === "string" && val.trim() === "" ? undefined : val;

const parceiroSchema = z.object({
    razaoSocial: z.string().min(1, "Razão Social é obrigatória").max(100),
    cnpj: z.preprocess(emptyToUndefined, z.string().min(14, "CNPJ inválido").max(18).optional()),
    rua: z.string().max(120).optional(),
    bairro: z.string().max(80).optional(),
    numero: z.string().max(20).optional(),
    cidade: z.string().max(80).optional(),
    estado: z.string().max(2).optional(),
    cep: z.string().max(20).optional(),
    complemento: z.string().max(100).optional(),
    lote: z.string().max(50).optional(),
    emailFinanceiro: z.preprocess(
        emptyToUndefined,
        z.string().email("Email inválido").max(255).optional()
    ),
    telefoneFinanceiro: z.preprocess(
        emptyToUndefined,
        z.string().min(10, "Telefone inválido").max(20).optional()
    ),
    emailResponsavel: z.preprocess(
        emptyToUndefined,
        z.string().email("Email inválido").max(255).optional()
    ),
    telefoneResponsavel: z.preprocess(
        emptyToUndefined,
        z.string().min(10, "Telefone inválido").max(20).optional()
    ),
    telefoneFixo: z.preprocess(
        emptyToUndefined,
        z.string().min(10, "Telefone inválido").max(20).optional()
    ),
    celular: z.string().min(10, "Telefone inválido").max(20),
    telefoneReserva: z.preprocess(
        emptyToUndefined,
        z.string().min(10, "Telefone inválido").max(20).optional()
    ),
    status: z.enum(["ativo", "inativo"]),
});

// Helpers de formatação (máscaras simples baseadas em regex)
function formatCNPJ(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    // Aplica: XX.XXX.XXX/XXXX-XX
    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
}

function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    // Se não há dígitos, retorna string vazia para permitir apagar tudo
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`; // Exibe parêntese só se houver algum dígito
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function formatCEP(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return digits.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

export type ParceiroFormData = z.infer<typeof parceiroSchema>;

export default function CadastroParceiros() {
    const {toast} = useToast();
    const navigate = useNavigate();
    const {id} = useParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!id;
    const location = useLocation();
    const readonly = new URLSearchParams(location.search).get("view") === "readonly";
    const [originalStatus, setOriginalStatus] = useState<boolean | undefined>(undefined);

    const form = useForm<ParceiroFormData>({
        resolver: zodResolver(parceiroSchema),
        defaultValues: {
            razaoSocial: "",
            cnpj: "",
            rua: "",
            bairro: "",
            numero: "",
            cidade: "",
            estado: "",
            cep: "",
            complemento: "",
            lote: "",
            emailFinanceiro: "",
            telefoneFinanceiro: "",
            emailResponsavel: "",
            telefoneResponsavel: "",
            telefoneFixo: "",
            celular: "",
            telefoneReserva: "",
            status: "ativo",
        },
    });

    useEffect(() => {
        if (!id) return;

        (async () => {
            try {
                const {data: parceiroApi} = await getPartnerById(id);

                const statusBool: boolean = parceiroApi.status;

                const addr = parceiroApi.address || {};

                form.reset({
                    razaoSocial: parceiroApi.legalName || "",
                    cnpj: parceiroApi.cnpj || "",
                    rua: addr.street || "",
                    bairro: addr.neighborhood || "",
                    numero: addr.number?.toString?.() || "",
                    cidade: addr.city || "",
                    estado: addr.state || "",
                    cep: addr.zipCode || "",
                    complemento: addr.complement || "",
                    lote: addr.lot || "",
                    emailFinanceiro: "",      // API de Partner não tem isso ainda
                    telefoneFinanceiro: "",
                    emailResponsavel: "",
                    telefoneResponsavel: "",
                    telefoneFixo: "",
                    celular: "",
                    telefoneReserva: "",
                    status: statusBool ? "ativo" : "inativo",          // mapeando status booleano pra string
                });

                setOriginalStatus(statusBool);
            } catch (e) {
                console.error(e);
                toast({
                    title: "Erro ao carregar parceiro",
                    description: "Não foi possível carregar os dados do parceiro.",
                    variant: "destructive",
                });
                navigate("/home/parceiros");
            }
        })();
    }, [id, form, navigate, toast]);

    const onSubmit = async (data: ParceiroFormData) => {
        setIsSubmitting(true);
        try {
            if (isEditing && id) {
                await updatePartner(id, data, originalStatus);
                toast({
                    title: "Parceiro atualizado!",
                    description: "O parceiro foi atualizado com sucesso.",
                });
            } else {
                await createPartner(data);
                toast({
                    title: "Parceiro cadastrado!",
                    description: "O parceiro foi cadastrado com sucesso.",
                });
            }

            navigate("/home/parceiros");
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao salvar",
                description:
                    error?.data?.message ||
                    error?.message ||
                    "Ocorreu um erro ao salvar o parceiro. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Button
                variant="ghost"
                onClick={() => navigate("/home/parceiros")}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Voltar
            </Button>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-3xl">
                        {readonly
                            ? "Visualizar Parceiro"
                            : isEditing
                                ? "Editar Parceiro"
                                : "Cadastro de Parceiros"}
                    </CardTitle>
                    <CardDescription>
                        {readonly
                            ? "Visualize os dados do parceiro"
                            : isEditing
                                ? "Atualize os dados do parceiro"
                                : "Preencha os dados do parceiro para realizar o cadastro"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={readonly ? undefined : form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Dados da Empresa */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Dados da Empresa</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="razaoSocial"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Razão Social *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Razão social completa" {...field}
                                                           readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="cnpj"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>CNPJ </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="00.000.000/0000-00"
                                                        value={field.value}
                                                        maxLength={18}
                                                        onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                                                        readOnly={readonly}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="rua"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Rua </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nome da rua" {...field} readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bairro"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Bairro </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nome do bairro" {...field} readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="numero"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Número </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Número" {...field} readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />


                                    <FormField
                                        control={form.control}
                                        name="cidade"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Cidade </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nome da cidade" {...field} readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="estado"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>UF </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="UF" {...field} readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="cep"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>CEP </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="00000-000"
                                                        maxLength={9}
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(formatCEP(e.target.value))}
                                                        readOnly={readonly}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="complemento"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Complemento </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Complemento" {...field} readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="lote"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Lote </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Lote" {...field} readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Contato Financeiro */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Contato Financeiro</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="emailFinanceiro"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Email </FormLabel>
                                                <FormControl>
                                                    <Input type="email"
                                                           placeholder="financeiro@empresa.com" {...field} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="telefoneFinanceiro"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Telefone </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="(00) 00000-0000"
                                                        value={field.value}
                                                        maxLength={15}
                                                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Contato Responsável */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Contato do Responsável</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="emailResponsavel"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Email </FormLabel>
                                                <FormControl>
                                                    <Input type="email"
                                                           placeholder="responsavel@empresa.com" {...field} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="telefoneResponsavel"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Telefone </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="(00) 00000-0000"
                                                        value={field.value}
                                                        maxLength={15}
                                                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Contato */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Contato</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <FormField
                                        control={form.control}
                                        name="telefoneFixo"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Telefone Fixo</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="(00) 00000-0000"
                                                        value={field.value}
                                                        maxLength={15}
                                                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="celular"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Celular *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="(00) 00000-0000"
                                                        value={field.value}
                                                        maxLength={15}
                                                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="telefoneReserva"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Telefone Reserva </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="(00) 00000-0000"
                                                        value={field.value}
                                                        maxLength={15}
                                                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                </div>
                            </div>

                            {/* Status e Vencimento */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Configurações</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Status </FormLabel>
                                                <FormControl>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger disabled={readonly || !isEditing}>
                                                            <SelectValue placeholder="Selecione o status"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ativo">Ativo</SelectItem>
                                                            <SelectItem value="inativo">Inativo</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {!readonly && (
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1"
                                    >
                                        {isSubmitting
                                            ? (isEditing ? "Atualizando..." : "Cadastrando...")
                                            : (isEditing ? "Atualizar Parceiro" : "Cadastrar Parceiro")
                                        }
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/home/parceiros")}
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            )}
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
