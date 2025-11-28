import {useState, useEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/hooks/use-toast";
import {ArrowLeft, Upload, FileText} from "lucide-react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {getCurrentUser} from "@/hooks/useCurrentUser";

export interface Arquivo {
    id: string;
    fileName: string;
    clientName: string;
    serviceName: string;
    Resposavel: string;
    DataEmissao: string;
    status: string;
    dueDate: string;
    Observacao?: string;
    arquivo?: File;
    parceiroId?: string;
    clienteId?: string;
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
}

const arquivoSchema = z.object({
    NomeArquivo: z.string().min(1, "Nome do Arquivo é obrigatório").max(100),
    Cliente: z.string().min(1, "Cliente é obrigatório"),
    Servico: z.string().min(1, "Serviço é obrigatório"),
    Resposavel: z.string().min(1, "Responsável é obrigatório").max(100),
    DataEmissao: z.string().min(1, "Data de Emissão é obrigatória"),
    DataVencimento: z.string().min(1, "Data de Vencimento é obrigatória"),
    Observacao: z.string().max(500).optional()
});

// Helper para adicionar dias e retornar em formato YYYY-MM-DD
function addDaysISO(baseDate: string, days: number): string {
    if (!baseDate) return "";
    const d = new Date(baseDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

type ArquivoFormData = z.infer<typeof arquivoSchema>;

export default function CadastroArquivo() {
    const {toast} = useToast();
    const navigate = useNavigate();
    const {id} = useParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [clientes, setClientes] = useState<any[]>([]);
    const [servicos, setServicos] = useState<any[]>([]);
    const [editingArquivo, setEditingArquivo] = useState<Arquivo | null>(null);
    const [manualDue, setManualDue] = useState(false); // usuário editou manualmente DataVencimento
    // Removido vínculo automático entre serviço e data de vencimento
    const isEditing = !!id;
    const location = useLocation();
    const readonly = new URLSearchParams(location.search).get("view") === "readonly";

    const form = useForm<ArquivoFormData>({
        resolver: zodResolver(arquivoSchema),
        defaultValues: {
            NomeArquivo: "",
            Cliente: "",
            Servico: "",
            Resposavel: "",
            DataEmissao: "",
            DataVencimento: "",
            Observacao: "",
        },
    });

    // Primeiro efeito: carrega listas e guarda arquivo bruto
    useEffect(() => {
        const clientesData = localStorage.getItem("clientes");
        const servicosData = localStorage.getItem("servicos");
        if (clientesData) setClientes(JSON.parse(clientesData));
        if (servicosData) {
            const parsed = JSON.parse(servicosData).map((s: any) => ({...s, vencimentoDoc: Number(s.vencimentoDoc)}));
            setServicos(parsed);
        }
        if (id) {
            const stored = localStorage.getItem("arquivos");
            if (stored) {
                const arquivos: Arquivo[] = JSON.parse(stored);
                const arquivo = arquivos.find((a) => a.id === id) || null;
                setEditingArquivo(arquivo);
            }
        }
    }, [id]);

    // Segundo efeito: somente reseta quando listas já carregadas para garantir selects preenchidos
    useEffect(() => {
        if (editingArquivo && clientes.length > 0 && servicos.length > 0) {
            form.reset(editingArquivo);
        }
    }, [editingArquivo, clientes, servicos, form]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar se é um arquivo PDF
            if (file.type !== "application/pdf") {
                toast({
                    title: "Formato inválido",
                    description: "Apenas arquivos PDF são aceitos.",
                    variant: "destructive",
                });
                // Limpar o input
                e.target.value = "";
                return;
            }

            setSelectedFile(file);
            // Auto-preencher o nome do arquivo se estiver vazio
            if (!form.getValues("NomeArquivo")) {
                form.setValue("NomeArquivo", file.name);
            }
        }
    };

    const onSubmit = async (data: ArquivoFormData) => {
        setIsSubmitting(true);
        try {
            const stored = localStorage.getItem("arquivos");
            const arquivos: Arquivo[] = stored ? JSON.parse(stored) : [];

            if (isEditing && id) {
                const index = arquivos.findIndex((a) => a.id === id);
                if (index !== -1) {
                    const existing = arquivos[index];
                    const updatedAt = new Date().toISOString();
                    arquivos[index] = {
                        ...data,
                        id,
                        createdBy: existing.createdBy,
                        createdAt: existing.createdAt,
                        updatedBy: getCurrentUser(),
                        updatedAt
                    } as Arquivo;

                    // Audit log update (upload semantics kept separate)
                    const auditLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
                    const updateLog = {
                        id: `${id}-update-${updatedAt}`,
                        action: "update",
                        entityType: "arquivo",
                        entityName: data.NomeArquivo,
                        entityId: id,
                        user: getCurrentUser(),
                        timestamp: updatedAt,
                    };
                    auditLogs.push(updateLog);
                    localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
                }
                toast({
                    title: "Arquivo atualizado!",
                    description: "O arquivo foi atualizado com sucesso.",
                });
            } else {
                const createdAt = new Date().toISOString();
                const newArquivo: Arquivo = {
                    id: crypto.randomUUID(),
                    NomeArquivo: data.NomeArquivo,
                    Cliente: data.Cliente,
                    Servico: data.Servico,
                    Resposavel: data.Resposavel,
                    DataEmissao: data.DataEmissao,
                    DataVencimento: data.DataVencimento,
                    Observacao: data.Observacao || "",
                    arquivo: selectedFile || undefined,
                    createdBy: getCurrentUser(),
                    createdAt,
                    updatedBy: getCurrentUser(),
                    updatedAt: createdAt
                };
                arquivos.push(newArquivo);

                // Audit log upload (treat as creation for arquivo)
                const auditLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
                if (!auditLogs.find((l: any) => l.id === `${newArquivo.id}-upload`)) {
                    const uploadLog = {
                        id: `${newArquivo.id}-upload`,
                        action: "upload",
                        entityType: "arquivo",
                        entityName: newArquivo.NomeArquivo,
                        entityId: newArquivo.id,
                        user: getCurrentUser(),
                        timestamp: createdAt,
                    };
                    auditLogs.push(uploadLog);
                    localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
                }
                toast({
                    title: "Arquivo cadastrado!",
                    description: "O arquivo foi cadastrado com sucesso.",
                });
            }

            localStorage.setItem("arquivos", JSON.stringify(arquivos));
            navigate("/home/arquivos");
        } catch (error) {
            toast({
                title: "Erro ao salvar",
                description: "Ocorreu um erro ao salvar o arquivo. Tente novamente.",
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
                onClick={() => navigate("/home/arquivos")}
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
                                ? "Visualizar Arquivo"
                                : isEditing
                                    ? "Editar Arquivo"
                                    : "Cadastro de Arquivos"
                        }
                    </CardTitle>
                    <CardDescription>
                        {
                            readonly
                                ? "Visualize os dados do arquivo"
                                : isEditing
                                    ? "Atualize os dados do arquivo"
                                    : "Preencha os dados do arquivo para realizar o cadastro"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={readonly ? undefined : form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Upload de Arquivo */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Upload do Arquivo</h3>

                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <Upload className="h-10 w-10 text-muted-foreground mb-4"/>
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <span className="text-sm font-medium text-primary hover:text-primary/80">
                                                Clique para selecionar um arquivo
                                            </span>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Apenas arquivos PDF
                                            </p>
                                        </label>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            className="hidden"
                                            accept=".pdf"
                                            onChange={readonly ? undefined : handleFileChange} 
                                        /> 
                                    </div>
                                    {selectedFile && (
                                        <div className="mt-4 p-3 bg-muted rounded-md flex items-center gap-2">
                                            <FileText className="h-4 w-4"/>
                                            <span className="text-sm">{selectedFile.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Informações do Arquivo */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Informações do Arquivo</h3>

                                <FormField
                                    control={form.control}
                                    name="NomeArquivo"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Nome do Arquivo *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome identificador do arquivo" {...field} readOnly={readonly} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="Cliente"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Cliente *</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={readonly}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione um cliente"/> 
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {clientes.map((cliente) => (
                                                            <SelectItem key={cliente.id} value={cliente.id}>
                                                                {cliente.nomeFantasia}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="Servico"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Serviço *</FormLabel>
                                                <Select
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        // ao selecionar serviço, se tiver prazo, recalcula vencimento
                                                        const servicoSel = servicos.find(s => s.id === value);
                                                        if (servicoSel && servicoSel.vencimentoDoc) {
                                                            const emissao = form.getValues('DataEmissao');
                                                            const base = emissao || new Date().toISOString().slice(0, 10);
                                                            if (!emissao) {
                                                                form.setValue('DataEmissao', base);
                                                            }
                                                            const nova = addDaysISO(base, servicoSel.vencimentoDoc);
                                                            form.setValue('DataVencimento', nova);
                                                            setManualDue(false);
                                                        }
                                                    }}
                                                    value={field.value}
                                                    disabled={readonly}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione um serviço"/>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {servicos.map((servico) => (
                                                            <SelectItem key={servico.id} value={servico.id}>
                                                                {servico.nomeServico}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="Resposavel"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Responsável *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome do responsável pelo arquivo" {...field} readOnly={readonly} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="DataEmissao"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Data de Emissão *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        value={field.value}
                                                        onChange={(e) => {
                                                            field.onChange(e.target.value);
                                                            // Recalcula vencimento se serviço com prazo e não manual
                                                            const servicoId = form.getValues('Servico');
                                                            const servicoSel = servicos.find(s => s.id === servicoId);
                                                            if (servicoSel && servicoSel.vencimentoDoc && !manualDue) {
                                                                const nova = addDaysISO(e.target.value, servicoSel.vencimentoDoc);
                                                                form.setValue('DataVencimento', nova);
                                                            }
                                                        }} 
                                                        readOnly={readonly}
                                                    /> 
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="DataVencimento"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Data de Vencimento *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        value={field.value}
                                                        onChange={(e) => {
                                                            setManualDue(true); // usuário quer controlar manualmente
                                                            field.onChange(e.target.value);
                                                        }}
                                                        readOnly={readonly}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="Observacao"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Observação</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Observações adicionais sobre o arquivo..."
                                                    className="min-h-[100px]"
                                                    {...field} readOnly={readonly}
                                                />
                                            </FormControl>
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
                                            : (isEditing ? "Atualizar Arquivo" : "Cadastrar Arquivo")
                                        }
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            form.reset();
                                            setSelectedFile(null);
                                        }}
                                        disabled={isSubmitting}
                                    >
                                        Limpar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/home")}
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
