import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    createBillingEntry,
    updateBillingEntry,
    getBillingEntryById,
} from "@/services/billingEntriesService";
import { getClients, type ClientDetails } from "@/services/clientsService";
import { getServices } from "@/services/servicesService";
import { Servico } from "@/interfaces/Servico";

const lancamentoSchema = z.object({
    clientId: z.string().min(1, "Cliente é obrigatório"),
    serviceId: z.string().min(1, "Serviço é obrigatório"),
    quantity: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                const num = typeof val === "number" ? val : parseFloat(val);
                return !isNaN(num) && num >= 1;
            },
            "Quantidade deve ser maior ou igual a 1"
        )
        .transform((val) => (typeof val === "number" ? val : parseFloat(val))),
    serviceDate: z.string().min(1, "Data do serviço é obrigatória"),
    notes: z.string().max(500, "Observações não podem ter mais de 500 caracteres").optional(),
    isBillable: z.boolean().optional(),
});

export type LancamentoFormData = z.infer<typeof lancamentoSchema>;

export default function CadastroLancamento() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { id } = useParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientes, setClientes] = useState<ClientDetails[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const isEditing = !!id;
    const location = useLocation();
    const readonly = new URLSearchParams(location.search).get("view") === "readonly";

    const form = useForm<LancamentoFormData>({
        resolver: zodResolver(lancamentoSchema),
        defaultValues: {
            clientId: "",
            serviceId: "",
            quantity: "" as any,
            serviceDate: "",
            notes: "",
            isBillable: true,
        },
    });

    useEffect(() => {
        async function loadData() {
            try {
                const [clientesRes, servicosRes] = await Promise.all([
                    getClients({ includePartner: false }),
                    getServices(),
                ]);

                setClientes(clientesRes.items);

                const servicosItems = Array.isArray(servicosRes)
                    ? servicosRes
                    : Array.isArray((servicosRes as any)?.items)
                        ? (servicosRes as any).items
                        : [];
                setServicos(servicosItems);

                if (id) {
                    const lancamento = await getBillingEntryById(id);

                    // Format date to YYYY-MM-DD for input[type="date"]
                    const serviceDate = lancamento.serviceDate
                        ? new Date(lancamento.serviceDate).toISOString().split('T')[0]
                        : "";

                    form.reset({
                        clientId: lancamento.clientId,
                        serviceId: lancamento.serviceId,
                        quantity: lancamento.quantity,
                        serviceDate: serviceDate,
                        notes: lancamento.notes || "",
                        isBillable: lancamento.isBillable,
                    });
                }
            } catch (e) {
                toast({
                    title: "Erro ao carregar dados",
                    description: "Não foi possível buscar os dados necessários.",
                    variant: "destructive",
                });
            }
        }

        loadData();
    }, [id, toast]);

    const onSubmit = async (data: LancamentoFormData) => {
        setIsSubmitting(true);
        try {
            if (isEditing && id) {
                await updateBillingEntry(id, data as any);
                toast({
                    title: "Lançamento atualizado",
                    description: "O lançamento foi atualizado com sucesso.",
                });
            } else {
                await createBillingEntry(data as any);
                toast({
                    title: "Lançamento criado",
                    description: "O lançamento foi cadastrado com sucesso.",
                });
            }
            navigate("/home/lancamentos");
        } catch (err: any) {
            toast({
                title: "Erro ao salvar lançamento",
                description:
                    err?.data?.message ||
                    err?.message ||
                    "Verifique os dados e tente novamente.",
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
                onClick={() => navigate("/home/lancamentos")}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-3xl">
                        {readonly
                            ? "Visualizar Lançamento"
                            : isEditing
                                ? "Editar Lançamento"
                                : "Cadastro de Lançamento"}
                    </CardTitle>
                    <CardDescription>
                        {readonly
                            ? "Visualize os dados do lançamento"
                            : isEditing
                                ? "Atualize os dados do lançamento"
                                : "Preencha os dados para cadastrar um novo lançamento"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={readonly ? undefined : form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Dados do Lançamento</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="clientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cliente *</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        disabled={readonly || isEditing}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione um cliente" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {clientes.map((cliente) => (
                                                                <SelectItem key={cliente.id} value={cliente.id}>
                                                                    {cliente.tradeName}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="serviceId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Serviço *</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        disabled={readonly || isEditing}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione um serviço" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {servicos.map((servico) => (
                                                                <SelectItem key={servico.id} value={servico.id}>
                                                                    {servico.name}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantidade *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="1"
                                                        placeholder="1"
                                                        {...field}
                                                        readOnly={readonly}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="serviceDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data do Serviço *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        {...field}
                                                        readOnly={readonly}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observações</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Observações sobre o lançamento..."
                                                    className="resize-none"
                                                    rows={4}
                                                    {...field}
                                                    readOnly={readonly}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {isEditing && (
                                    <FormField
                                        control={form.control}
                                        name="isBillable"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        disabled={readonly}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        Faturável
                                                    </FormLabel>
                                                    <p className="text-sm text-muted-foreground">
                                                        Marque se este lançamento deve ser incluído no faturamento
                                                    </p>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                )}
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
                                            : (isEditing ? "Atualizar Lançamento" : "Cadastrar Lançamento")}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/home/lancamentos")}
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
