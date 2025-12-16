import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    createInvoice,
    updateInvoice,
    getInvoiceById,
} from "@/services/invoicesService";
import { getClients, type ClientDetails } from "@/services/clientsService";
import { InvoiceStatus } from "@/interfaces/Invoice";

const faturaSchema = z.object({
    clientId: z.string().min(1, "Cliente é obrigatório"),
    issueDate: z.string().min(1, "Data de emissão da fatura é obrigatória"),
    dueDate: z.string().optional(),
    notes: z.string().max(500, "Observações não podem ter mais de 500 caracteres").optional(),
    status: z.string().optional(),
});

export type FaturaFormData = z.infer<typeof faturaSchema>;

export default function CadastroFatura() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { id } = useParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientes, setClientes] = useState<ClientDetails[]>([]);
    const isEditing = !!id;
    const location = useLocation();
    const readonly = new URLSearchParams(location.search).get("view") === "readonly";

    const form = useForm<FaturaFormData>({
        resolver: zodResolver(faturaSchema),
        defaultValues: {
            clientId: "",
            issueDate: "",
            dueDate: "",
            notes: "",
            status: InvoiceStatus.Draft,
        },
    });

    useEffect(() => {
        async function loadData() {
            try {
                const clientesRes = await getClients({ includePartner: false });
                setClientes(clientesRes.items);

                if (id) {
                    const fatura = await getInvoiceById(id);

                    const issueDate = fatura.issueDate
                        ? new Date(fatura.issueDate).toISOString().split('T')[0]
                        : "";
                    const dueDate = fatura.dueDate
                        ? new Date(fatura.dueDate).toISOString().split('T')[0]
                        : "";

                    form.reset({
                        clientId: fatura.clientId,
                        issueDate: issueDate,
                        dueDate: dueDate,
                        notes: fatura.notes || "",
                        status: fatura.status,
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

    const onSubmit = async (data: FaturaFormData) => {
        setIsSubmitting(true);
        try {
            if (isEditing && id) {
                await updateInvoice(id, {
                    status: data.status,
                    dueDate: data.dueDate || null,
                    notes: data.notes || null,
                });
                toast({
                    title: "Fatura atualizada",
                    description: "A fatura foi atualizada com sucesso.",
                });
            } else {
                await createInvoice({
                    clientId: data.clientId,
                    issueDate: data.issueDate,
                    dueDate: data.dueDate || null,
                    notes: data.notes || null,
                    items: [],
                });
                toast({
                    title: "Fatura criada",
                    description: "A fatura foi cadastrada com sucesso.",
                });
            }
            navigate("/home/faturas");
        } catch (err: any) {
            toast({
                title: "Erro ao salvar fatura",
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
                onClick={() => navigate("/home/faturas")}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-3xl">
                        {readonly
                            ? "Visualizar Fatura"
                            : isEditing
                                ? "Editar Fatura"
                                : "Cadastro de Fatura"}
                    </CardTitle>
                    <CardDescription>
                        {readonly
                            ? "Visualize os dados da fatura"
                            : isEditing
                                ? "Atualize os dados da fatura"
                                : "Preencha os dados para cadastrar uma nova fatura"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={readonly ? undefined : form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Dados da Fatura</h3>

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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="issueDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data de emissão *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        {...field}
                                                        readOnly={readonly || isEditing}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="dueDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data de Vencimento</FormLabel>
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

                                {isEditing && (
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        disabled={readonly}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione o status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value={InvoiceStatus.Draft}>Rascunho</SelectItem>
                                                            <SelectItem value={InvoiceStatus.Open}>Aberta</SelectItem>
                                                            <SelectItem value={InvoiceStatus.Closed}>Fechada</SelectItem>
                                                            <SelectItem value={InvoiceStatus.Cancelled}>Cancelada</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observações</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Observações sobre a fatura..."
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
                                            : (isEditing ? "Atualizar Fatura" : "Cadastrar Fatura")}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/home/faturas")}
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
