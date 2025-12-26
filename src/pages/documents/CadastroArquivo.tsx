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
import { ArrowLeft, Upload, FileText } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Arquivo } from "@/interfaces/Arquivo";
import { createDocument, getDocumentById, updateDocument } from "@/services/documentsService";
import { getClients } from "@/services/clientsService";
import { getUsers } from "@/services/usersServices";
import { getServices } from "@/services/servicesService";
import { AsyncSelect } from "@/components/AsyncSelect";

const arquivoSchema = z.object({
  fileName: z.string().min(1, "Nome do Arquivo é obrigatório").max(100),
  clientId: z.string().min(1, "Cliente é obrigatório"),
  serviceId: z.string().min(1, "Serviço é obrigatório"),
  responsibleId: z.string().min(1, "Responsável é obrigatório"),
  issueDate: z.string().min(1, "Data de Emissão é obrigatória"),
  dueDate: z.string().min(1, "Data de Vencimento é obrigatória"),
  notes: z.string().max(500).optional()
});

// Helper para adicionar dias e retornar em formato YYYY-MM-DD
function addDaysISO(baseDate: string, days: number): string {
  if (!baseDate) return "";
  const d = new Date(baseDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export type ArquivoFormData = z.infer<typeof arquivoSchema>;

export default function CadastroArquivo() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [clients, setClients] = useState<any[]>([]); // Clients now via AsyncSelect
  // const [services, setServices] = useState<any[]>([]); // Services via AsyncSelect
  // const [users, setUsers] = useState<any[]>([]); // Users via AsyncSelect
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [editingDocument, setEditingDocument] = useState<Arquivo | null>(null);
  const [manualDue, setManualDue] = useState(false); // usuário editou manualmente DataVencimento
  // Removido vínculo automático entre serviço e data de vencimento
  const isEditing = !!id;
  const location = useLocation();
  const readonly = new URLSearchParams(location.search).get("view") === "readonly";

  const form = useForm<ArquivoFormData>({
    resolver: zodResolver(arquivoSchema),
    defaultValues: {
      fileName: "",
      clientId: "",
      serviceId: "",
      responsibleId: "",
      issueDate: "",
      dueDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    (async () => {
      // setClients((await getClients()).items); // Removido carregamento inicial de todos os clientes


      /*
      setServices((await getServices()).items);

      setUsers(await getUsers())
      */

      if (id) {
        const existingDocument = await getDocumentById(id);
        setEditingDocument({
          ...existingDocument,
          issueDate: existingDocument.issueDate.slice(0, 10),
          dueDate: existingDocument.dueDate.slice(0, 10),
        });

        // Se estiver editando, precisamos buscar os dados do serviço atual
        if (existingDocument.serviceId) {
          const svc = await getServices({ search: existingDocument.serviceName, pageSize: 1 });
          const found = svc.items.find(s => s.id === existingDocument.serviceId);
          if (found) setSelectedService(found);
        }
      }
    })();
  }, [id]);

  // Segundo efeito: somente reseta quando documento editado disponível
  useEffect(() => {
    if (editingDocument) {
      form.reset(editingDocument);
    }
  }, [editingDocument, form]);

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
      if (!form.getValues("fileName")) {
        form.setValue("fileName", file.name);
      }
    }
  };

  const onSubmit = async (data: ArquivoFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && id) {
        const { success, document } = await updateDocument(id, editingDocument!, data, selectedFile!)
        if (success) {
          toast({
            title: "Arquivo atualizado!",
            description: "O arquivo foi atualizado com sucesso.",
          });
          setTimeout(() => navigate("/home/arquivos"), 800);
        }
        else {
          toast({
            title: "Erro ao atualizar arquivo",
            description: "Ocorreu um erro ao atualizar o arquivo.",
            variant: "destructive",
          });
        }
      }
      else {
        const { success, document } = await createDocument(data, selectedFile!);
        if (success) {
          toast({
            title: "Arquivo cadastrado!",
            description: "O arquivo foi cadastrado com sucesso.",
          });
          setTimeout(() => navigate("/home/arquivos"), 800);
        } else {
          toast({
            title: "Erro ao cadastrar arquivo",
            description: "Ocorreu um erro ao cadastrar o arquivo.",
            variant: "destructive",
          });
        }
      }
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
        <ArrowLeft className="mr-2 h-4 w-4" />
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
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
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
                      <FileText className="h-4 w-4" />
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
                  name="fileName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Arquivo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome identificador do arquivo" {...field} readOnly={readonly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente *</FormLabel>
                        <FormControl>
                          <AsyncSelect
                            fetcher={async (search) => {
                              const res = await getClients({ search, pageSize: 20 });
                              return res.items;
                            }}
                            value={field.value}
                            onChange={field.onChange}
                            getLabel={(client: any) => client.legalName || client.tradeName || "Sem Nome"}
                            getValue={(client: any) => client.id}
                            initialLabel={editingDocument?.clientName || ""}
                            placeholder="Buscar cliente..."
                            disabled={readonly}
                          />
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
                          <AsyncSelect
                            fetcher={async (name) => {
                              const res = await getServices({ name, pageSize: 20 });
                              return res.items;
                            }}
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                            onSelectObject={(servicoSel: any) => {
                              setSelectedService(servicoSel); // Salva o serviço selecionado para cálculos futuros
                              const dias = servicoSel.defaultDueInDays || servicoSel.DefaultDueInDays || servicoSel.remainingDays || servicoSel.RemainingDays || servicoSel.vencimentoDoc;
                              const fixedDate = servicoSel.dueDate || servicoSel.DueDate;

                              const emissao = form.getValues('issueDate');
                              const base = emissao || new Date().toISOString().slice(0, 10);
                              if (!emissao) {
                                form.setValue('issueDate', base);
                              }

                              if (typeof dias === 'number' && dias > 0) {
                                const nova = addDaysISO(base, dias);
                                form.setValue('dueDate', nova);
                                setManualDue(false);
                              } else if (fixedDate && typeof fixedDate === 'string') {
                                // Se tiver data fixa (YYYY-MM-DD), usa ela direto
                                const nova = fixedDate.slice(0, 10);
                                form.setValue('dueDate', nova);
                                setManualDue(false);
                              }
                            }}
                            getLabel={(s: any) => s.name || s.Name || s.nomeServico || "Sem Nome"}
                            getValue={(s: any) => s.id || s.Id}
                            initialLabel={editingDocument?.serviceName || ""}
                            placeholder="Buscar serviço..."
                            disabled={readonly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="responsibleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável *</FormLabel>
                      <FormControl>
                        <AsyncSelect
                          fetcher={async (name) => {
                            const res = await getUsers({ name, pageSize: 20 });
                            return res.items;
                          }}
                          value={field.value}
                          onChange={field.onChange}
                          getLabel={(u: any) => u.name}
                          getValue={(u: any) => u.id}
                          initialLabel={editingDocument?.responsibleName || ""}
                          placeholder="Buscar responsável..."
                          disabled={readonly}
                        />
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
                        <FormLabel>Data de Emissão *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              // Recalcula vencimento se serviço com prazo e não manual
                              const dias = selectedService?.defaultDueInDays || selectedService?.DefaultDueInDays || selectedService?.remainingDays || selectedService?.RemainingDays || selectedService?.vencimentoDoc;
                              const fixedDate = selectedService?.dueDate || selectedService?.DueDate;

                              if (selectedService && !manualDue) {
                                if (typeof dias === 'number' && dias > 0) {
                                  const nova = addDaysISO(e.target.value, dias);
                                  form.setValue('dueDate', nova);
                                }
                              }
                            }}
                            readOnly={readonly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
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
                      <FormLabel>Observação</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais sobre o arquivo..."
                          className="min-h-[100px]"
                          {...field} readOnly={readonly}
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
                    onClick={() => navigate("/home/arquivos")}
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
