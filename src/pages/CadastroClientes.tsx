import {useState, useEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useToast} from "@/hooks/use-toast";
import {ArrowLeft} from "lucide-react";
import {
    createClient,
    updateClient,
    getClientById,
    type ClientPartnerInfo,
} from "@/services/clientsService.ts";
import {
    EContactRole,
    EContactType, type PartnerContact,
} from "@/services/partnersContactsService.ts";
import type {ClientContact} from "@/services/clientsContactsService.ts";
import {getPartners, type ApiPartner, type AddressDTO} from "@/services/partnersService.ts";
import {formatCNPJ, formatPhone, formatCEP} from "@/utils/format.ts";

export interface Cliente {
    id: string;
    nomeFantasia: string;
    razaoSocial: string;
    cnpj: string;
    inscricaoEstadual?: string;
    inscricaoMunicipal: string;
    rua: string;
    bairro: string;
    numero: string;
    cidade: string;
    estado: string;
    cep: string;
    complemento?: string;
    lote?: string;
    nomeFinanceiro: string;
    emailFinanceiro: string;
    telefoneFinanceiro: string;
    nomeResponsavel: string;
    emailResponsavel: string;
    telefoneResponsavel: string;
    status: "ativo" | "inativo";
    vencimentoContrato: string;
    dataVencimento: string;
    parceiroId: string;
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
}

const clienteSchema = z.object({
    nomeFantasia: z.string().min(1, "Nome Fantasia é obrigatório").max(100),
    razaoSocial: z.string().min(1, "Razão Social é obrigatória").max(100),
    cnpj: z.string().min(14, "CNPJ inválido").max(18),
    inscricaoEstadual: z.string().max(50).optional(),
    inscricaoMunicipal: z.string().min(1, "Inscrição Municipal é obrigatória").max(50),
    rua: z.string().min(1, "Rua é obrigatória").max(120),
    bairro: z.string().min(1, "Bairro é obrigatório").max(80),
    numero: z.string().min(1, "Número é obrigatório").max(20),
    cidade: z.string().min(1, "Cidade é obrigatório").max(80),
    estado: z.string().min(1, "UF é obrigatório").max(2),
    cep: z.string().min(1, "CEP é obrigatório").max(20),
    complemento: z.string().max(100).optional(),
    lote: z.string().max(50).optional(),
    nomeFinanceiro: z.string().min(1, "Nome do contato financeiro é obrigatório").max(100),
    emailFinanceiro: z.string().email("Email inválido").max(255),
    telefoneFinanceiro: z.string().min(10, "Telefone inválido").max(20),
    nomeResponsavel: z.string().min(1, "Nome do responsável é obrigatório").max(100),
    emailResponsavel: z.string().email("Email inválido").max(255),
    telefoneResponsavel: z.string().min(10, "Telefone inválido").max(20),
    status: z.enum(["ativo", "inativo"]),
    vencimentoContrato: z.string().min(1, "Data de vencimento do contrato é obrigatória"),
    dataVencimento: z.string().min(1, "Data de vencimento é obrigatória"),
    parceiroId: z.string().min(1, "Selecione um parceiro"),
});

function buildDateFromDueDay(dueDay: number | null | undefined): string {
    if (!dueDay) return "";
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = Math.min(dueDay, 28); // evita datas inválidas (fev, etc)
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
    )}`;
}

function daysSinceContract(contractDate: string | Date): string {
    const contractDateObj = new Date(contractDate);
    const today = new Date();
    const diffMs = today.getTime() - contractDateObj.getTime();
    return Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24))).toString();
}

export type ClienteFormData = z.infer<typeof clienteSchema>;

const CadastroClientes = () => {
    const {toast} = useToast();
    const navigate = useNavigate();
    const {id} = useParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!id;
    const location = useLocation();
    const readonly = new URLSearchParams(location.search).get("view") === "readonly";

    const [originalStatus, setOriginalStatus] = useState<boolean | undefined>();
    const [existingContacts, setExistingContacts] = useState<ClientContact[]>([]);
    const [parceiros, setParceiros] = useState<ApiPartner[]>([]);

    const form = useForm<ClienteFormData>({
        resolver: zodResolver(clienteSchema),
        defaultValues: {
            nomeFantasia: "",
            razaoSocial: "",
            cnpj: "",
            inscricaoEstadual: "",
            inscricaoMunicipal: "",
            rua: "",
            bairro: "",
            numero: "",
            cidade: "",
            estado: "",
            cep: "",
            complemento: "",
            lote: "",
            nomeFinanceiro: "",
            emailFinanceiro: "",
            telefoneFinanceiro: "",
            nomeResponsavel: "",
            emailResponsavel: "",
            telefoneResponsavel: "",
            status: "ativo",
            vencimentoContrato: "",
            dataVencimento: "",
            parceiroId: "",
        },
    });

    useEffect(() => {
        (async () => {
            try {
                const {items} = await getPartners();
                setParceiros(items);
            } catch (error: any) {
                console.error(error);
                toast({
                    title: "Erro ao carregar parceiros",
                    description:
                        error?.data?.message ||
                        error?.message ||
                        "Não foi possível carregar a lista de parceiros.",
                    variant: "destructive",
                });
            }
        })();
    }, [toast]);

    useEffect(() => {
        if (!id) return;

        (async () => {
            try {
                const {data: clienteApi} = await getClientById(id);
                const statusBool = clienteApi.status;
                const addr : AddressDTO = clienteApi.address || {} as AddressDTO;
                const contacts: PartnerContact[] = clienteApi.contacts || [];
                const partner: ApiPartner = clienteApi.partner || {} as ApiPartner;
                const partners: ApiPartner[] = partner ? [partner] : [];

                setExistingContacts(contacts);
                setOriginalStatus(statusBool);
                setParceiros(partners);

                let nomeFinanceiro = "";
                let emailFinanceiro = "";
                let telefoneFinanceiro = "";

                let nomeResponsavel = "";
                let emailResponsavel = "";
                let telefoneResponsavel = "";

                for (const c of contacts) {
                    if (c.role === EContactRole.Financial) {
                        if (!nomeFinanceiro && c.name) nomeFinanceiro = c.name;
                        if (c.type === EContactType.Email && !emailFinanceiro) {
                            emailFinanceiro = c.value;
                        }
                        if (c.type === EContactType.Phone && !telefoneFinanceiro) {
                            telefoneFinanceiro = formatPhone(c.value);
                        }
                    }

                    if (c.role === EContactRole.Personal) {
                        if (!nomeResponsavel && c.name) nomeResponsavel = c.name;
                        if (c.type === EContactType.Email && !emailResponsavel) {
                            emailResponsavel = c.value;
                        }
                        if (c.type === EContactType.Phone && !telefoneResponsavel) {
                            telefoneResponsavel = formatPhone(c.value);
                        }
                    }
                }

                form.reset({
                    nomeFantasia: clienteApi.tradeName || "",
                    razaoSocial: clienteApi.legalName || "",
                    cnpj: formatCNPJ(clienteApi.cnpj || ""),
                    inscricaoEstadual: clienteApi.stateRegistration || "",
                    inscricaoMunicipal: clienteApi.municipalRegistration || "",
                    rua: addr.street || "",
                    bairro: addr.neighborhood || "",
                    numero: addr.number?.toString?.() || "",
                    cidade: addr.city || "",
                    estado: addr.state || "",
                    cep: addr.zipCode || "",
                    complemento: addr.complement || "",
                    lote: addr.lot || "",
                    nomeFinanceiro,
                    emailFinanceiro,
                    telefoneFinanceiro,
                    nomeResponsavel,
                    emailResponsavel,
                    telefoneResponsavel,
                    status: statusBool ? "ativo" : "inativo",
                    vencimentoContrato: clienteApi.contractDate
                        ? daysSinceContract(clienteApi.contractDate)
                        : "",
                    dataVencimento: buildDateFromDueDay(clienteApi.billingDueDay),
                    parceiroId: partner?.id || "",
                });
            } catch (error: any) {
                console.error(error);
                toast({
                    title: "Erro ao carregar cliente",
                    description:
                        error?.data?.message ||
                        error?.message ||
                        "Não foi possível carregar os dados do cliente.",
                    variant: "destructive",
                });
                navigate("/home/clientes");
            }
        })();
    }, [id, form, toast, navigate]);

    const onSubmit = async (data: ClienteFormData) => {
        setIsSubmitting(true);
        try {
            if (isEditing && id) {
                await updateClient(id, data, originalStatus, existingContacts);
                toast({
                    title: "Cliente atualizado!",
                    description: "O cliente foi atualizado com sucesso.",
                });
            } else {
                await createClient(data);
                toast({
                    title: "Cliente cadastrado!",
                    description: "O cliente foi cadastrado com sucesso.",
                });
            }

            navigate("/home/clientes");
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao salvar",
                description:
                    error?.data?.message ||
                    error?.message ||
                    "Ocorreu um erro ao salvar o cliente. Tente novamente.",
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
                onClick={() => navigate("/home/clientes")}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Voltar
            </Button>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-3xl">
                        {
                            readonly
                                ? "Visualizar Cliente"
                                : isEditing
                                    ? "Editar Cliente"
                                    : "Cadastro de Clientes"
                        }
                    </CardTitle>
                    <CardDescription>
                        {
                            readonly ? "Visualize os dados do cliente"
                                : isEditing
                                    ? "Atualize os dados do cliente"
                                    : "Preencha os dados do cliente para realizar o cadastro"
                        }
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
                                        name="nomeFantasia"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Nome Fantasia *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nome do cliente" {...field}
                                                           readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

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
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="cnpj"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>CNPJ *</FormLabel>
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
                                        name="inscricaoEstadual"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Inscrição Estadual</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Número da inscrição" {...field}
                                                           readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="inscricaoMunicipal"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Inscrição Municipal *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Número da inscrição" {...field}
                                                           readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Dados de localização */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Dados de localização</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="rua"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Rua *</FormLabel>
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
                                                <FormLabel>Bairro *</FormLabel>
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
                                                <FormLabel>Número *</FormLabel>
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
                                                <FormLabel>Cidade *</FormLabel>
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
                                                <FormLabel>UF *</FormLabel>
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
                                                <FormLabel>CEP *</FormLabel>
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
                                        name="nomeFinanceiro"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Nome *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nome" {...field} readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="emailFinanceiro"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Email *</FormLabel>
                                                <FormControl>
                                                    <Input type="email"
                                                           placeholder="financeiro@empresa.com" {...field}
                                                           readOnly={readonly}/>
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
                                                <FormLabel>Telefone *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="(00) 00000-0000"
                                                        value={field.value}
                                                        maxLength={15}
                                                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                                        readOnly={readonly}
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
                                        name="nomeResponsavel"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Nome *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nome" {...field} readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="emailResponsavel"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Email *</FormLabel>
                                                <FormControl>
                                                    <Input type="email"
                                                           placeholder="responsavel@empresa.com" {...field}
                                                           readOnly={readonly}/>
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
                                                <FormLabel>Telefone *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="(00) 00000-0000"
                                                        value={field.value}
                                                        maxLength={15}
                                                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                                        readOnly={readonly}
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

                                    <FormField
                                        control={form.control}
                                        name="dataVencimento"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Data de Vencimento da Fatura *</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} readOnly={readonly}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="vencimentoContrato"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Prazo de Vencimento do Contrato (dias) *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Número de dias"
                                                        min={1}
                                                        {...field}
                                                        readOnly={readonly}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Parceiro Vinculado */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Parceiro Vinculado</h3>

                                <FormField
                                    control={form.control}
                                    name="parceiroId"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Parceiro *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger disabled={readonly}>
                                                        <SelectValue placeholder="Selecione um parceiro"/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {parceiros.map((parceiro: any) => (
                                                        <SelectItem key={parceiro.id} value={parceiro.id}>
                                                            {parceiro.legalName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
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
                                            : (isEditing ? "Atualizar Cliente" : "Cadastrar Cliente")
                                        }
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/home/clientes")}
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
};

export default CadastroClientes;
