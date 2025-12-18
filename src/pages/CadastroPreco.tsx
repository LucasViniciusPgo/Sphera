import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    createClientServicePrice,
    getClientServicePriceById,
} from "@/services/clientServicePricesService";
import { getClients, type ClientDetails } from "@/services/clientsService";
import { getServices } from "@/services/servicesService";
import { Servico } from "@/interfaces/Servico";

const precoSchema = z.object({
    clientId: z.string().min(1, "Cliente é obrigatório"),
    serviceId: z.string().min(1, "Serviço é obrigatório"),
    unitPrice: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                const num = typeof val === "number" ? val : parseFloat(val);
                return !isNaN(num) && num >= 1;
            },
            "Preço unitário deve ser maior ou igual a 1"
        )
        .transform((val) => (typeof val === "number" ? val : parseFloat(val))),
    startDate: z.string().min(1, "Data de início é obrigatória"),
});

export type PrecoFormData = z.infer<typeof precoSchema>;

export default function CadastroPreco() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { id } = useParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientes, setClientes] = useState<ClientDetails[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const isEditing = !!id;
    const location = useLocation();
    const readonly = new URLSearchParams(location.search).get("view") === "readonly";

    const form = useForm<PrecoFormData>({
        resolver: zodResolver(precoSchema),
        defaultValues: {
            clientId: "",
            serviceId: "",
            unitPrice: "" as any,
            startDate: "",
        },
    });

    useEffect(() => {
        async function loadData() {
            try {
                const [clientesRes, servicosRes] = await Promise.all([
                    getClients({ includePartner: false, pageSize: 1000 }),
                    getServices(),
                ]);

                setClientes(clientesRes.items);

                const params = new URLSearchParams(location.search);
                const preSelectedClientId = params.get("clientId");
                if (preSelectedClientId) {
                    form.setValue("clientId", preSelectedClientId);
                }

                const servicosItems = Array.isArray(servicosRes)
                    ? servicosRes
                    : Array.isArray((servicosRes as any)?.items)
                        ? (servicosRes as any).items
                        : [];
                setServicos(servicosItems);

                if (id) {
                    const preco = await getClientServicePriceById(id);

                    // Format date to YYYY-MM-DD for input[type="date"]
                    const startDate = preco.startDate ? new Date(preco.startDate).toISOString().split('T')[0] : "";

                    form.reset({
                        clientId: preco.clientId,
                        serviceId: preco.serviceId,
                        unitPrice: preco.unitPrice,
                        startDate: startDate,
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
    }, [id, toast, location.search, form]);

    const onSubmit = async (data: PrecoFormData) => {
        setIsSubmitting(true);
        try {
            if (isEditing && id) {
                // Note: The API spec doesn't show an update endpoint, so we'll only support creation for now
                toast({
                    title: "Funcionalidade não disponível",
                    description: "A edição de preços ainda não está disponível na API.",
                    variant: "destructive",
                });
            } else {
                await createClientServicePrice(data as any);
                toast({
                    title: "Preço criado",
                    description: "O preço foi cadastrado com sucesso.",
                });
                navigate("/home/precos");
            }
        } catch (err: any) {
            toast({
                title: "Erro ao salvar preço",
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
                onClick={() => navigate("/home/precos")}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-3xl">
                        {readonly
                            ? "Visualizar Preço"
                            : isEditing
                                ? "Editar Preço"
                                : "Cadastro de Preço"}
                    </CardTitle>
                    <CardDescription>
                        {readonly
                            ? "Visualize os dados do preço"
                            : isEditing
                                ? "Atualize os dados do preço"
                                : "Preencha os dados para cadastrar um novo preço"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={readonly ? undefined : form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Dados do Preço</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="clientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cliente *</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        key={field.value}
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
                                        name="unitPrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Preço Unitário (R$) *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="1"
                                                        placeholder="0.00"
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
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data de Início *</FormLabel>
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
                            </div>
                            {!readonly && (
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || isEditing}
                                        className="flex-1"
                                    >
                                        {isSubmitting
                                            ? "Cadastrando..."
                                            : isEditing
                                                ? "Edição não disponível"
                                                : "Cadastrar Preço"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/home/precos")}
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
