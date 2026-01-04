import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "@/hooks/useCurrentUser";
import {
    createService,
    updateService,
    getServiceById,
    activateService,
    deactivateService,
    mapServiceToViewModel,
} from "@/services/servicesService";

export interface Servico {
    id: string;
    nomeServico: string;
    codigo: string;
    vencimentoDoc: number | null;
    status: "ativo" | "inativo";
    observacoes: string | null;
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
}

const servicoSchema = z.object({
    nomeServico: z.string().min(1, "Nome do Serviço é obrigatório").max(100),
    codigo: z.string().min(1, "Código do Serviço é obrigatório").max(100),
    vencimentoDoc: z
        .union([z.string(), z.number(), z.null()])
        .optional()
        .refine(
            (val) => {
                if (val === undefined || val === null || val === "") return true;

                const num = typeof val === "number" ? val : Number(val);
                return !isNaN(num) && num > 0;
            },
            "Informe dias > 0 ou deixe em branco"
        )
        .transform((val) => {
            // saída do schema: number | null
            if (val === undefined || val === null || val === "") return null;
            return typeof val === "number" ? val : Number(val);
        }),
    status: z.enum(["ativo", "inativo"]),
    observacoes: z.string().max(500, "A observação deve ter no máximo 500 caracteres").optional(),
});

export type ServicoFormData = z.infer<typeof servicoSchema>;

export default function CadastroServico() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { id } = useParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!id;
    const location = useLocation();
    const readonly = new URLSearchParams(location.search).get("view") === "readonly";

    const form = useForm<ServicoFormData>({
        resolver: zodResolver(servicoSchema),
        defaultValues: {
            nomeServico: "",
            codigo: "",
            vencimentoDoc: null,
            status: "ativo",
            observacoes: "",
        },
    });

    useEffect(() => {
        async function load() {
            if (!id) return;
            try {
                const apiService = await getServiceById(id);
                const servicoView = mapServiceToViewModel(apiService);

                form.reset({
                    nomeServico: servicoView.nomeServico,
                    codigo: servicoView.codigo,
                    vencimentoDoc: servicoView.vencimentoDoc,
                    status: servicoView.status === "ativo" ? "ativo" : "inativo",
                    observacoes: servicoView.observacoes || "",
                });
            } catch (e) {
                toast({
                    title: "Erro ao carregar serviço",
                    description: "Não foi possível buscar os dados do serviço.",
                    variant: "destructive",
                });
            }
        }

        load();
    }, [id]);


    const onSubmit = async (data: ServicoFormData) => {
        setIsSubmitting(true);
        try {
            if (isEditing && id) {
                const updated = await updateService(id, data);

                const isActiveForm = data.status === "ativo";
                if (typeof updated.isActive === "boolean" && updated.isActive !== isActiveForm) {
                    if (isActiveForm) {
                        await activateService(id);
                    } else {
                        await deactivateService(id);
                    }
                }

                toast({
                    title: "Serviço atualizado",
                    description: "Os dados do serviço foram salvos com sucesso.",
                });
            } else {
                await createService(data);
                toast({
                    title: "Serviço criado",
                    description: "O serviço foi cadastrado com sucesso.",
                });
            }

            navigate("/home/servicos");
        } catch (err) {
            toast({
                title: "Erro ao salvar serviço",
                description: "Verifique os dados e tente novamente.",
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
                onClick={() => navigate("/home/servicos")}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-3xl">
                        {
                            readonly
                                ? "Visualizar Serviço"
                                : isEditing
                                    ? "Editar Serviço"
                                    : "Cadastro de Serviços"
                        }
                    </CardTitle>
                    <CardDescription>
                        {
                            readonly ? "Visualize os dados do serviço"
                                : isEditing
                                    ? "Atualize os dados do serviço"
                                    : "Preencha os dados do serviço para realizar o cadastro"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={readonly ? undefined : form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Dados de Serviço */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Dados da Empresa</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="nomeServico"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Serviço *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nome do serviço" {...field}
                                                        readOnly={readonly} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="codigo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Código do Serviço *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Código do serviço" {...field}
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
                                        name="vencimentoDoc"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Prazo de Vencimento (dias) (opcional)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Deixe em branco se não houver prazo"
                                                        min={1}
                                                        value={field.value === null ? '' : field.value}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            field.onChange(val === '' ? '' : val);
                                                        }} readOnly={readonly}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status </FormLabel>
                                                <FormControl>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger disabled={readonly || !isEditing}>
                                                            <SelectValue placeholder="Selecione o status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ativo">Ativo</SelectItem>
                                                            <SelectItem value="inativo">Inativo</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                </div>

                                <FormField
                                    control={form.control}
                                    name="observacoes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observação</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Digite observações relevantes sobre o serviço..."
                                                    className="min-h-[120px] resize-y"
                                                    {...field}
                                                    value={field.value || ''}
                                                    maxLength={500}
                                                    readOnly={readonly}
                                                />
                                            </FormControl>
                                            <FormMessage />
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
                                            : (isEditing ? "Atualizar Serviço" : "Cadastrar Serviço")
                                        }
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/home/servicos")}
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
