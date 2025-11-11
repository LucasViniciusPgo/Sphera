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
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "@/hooks/useCurrentUser";

export interface Servico {
  id: string;
  nomeServico: string;
  codigo: string;
  // Número de dias de validade do documento (agora opcional). Null indica sem prazo definido.
  vencimentoDoc: number | null; // dias ou null
  status: "ativo" | "inativo";
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

// Campo vencimentoDoc agora opcional. Pode ser deixado em branco para "sem prazo".
const servicoSchema = z.object({
  nomeServico: z.string().min(1, "Nome do Serviço é obrigatório").max(100),
  codigo: z.string().min(1, "Código do Serviço é obrigatório").max(100),
  vencimentoDoc: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || val === "" || (!isNaN(Number(val)) && Number(val) > 0),
      "Informe dias > 0 ou deixe em branco"
    )
    .transform((val) => (val === undefined || val === "" ? null : Number(val))),
  status: z.enum(["ativo", "inativo"])
});

type ServicoFormData = z.infer<typeof servicoSchema>;

export default function CadastroServico() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!id;

  const form = useForm<ServicoFormData>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      nomeServico: "",
      codigo: "",
      vencimentoDoc: null,
      status: "ativo",
    },
  });

  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem("servicos");
      if (stored) {
        const servicosRaw = JSON.parse(stored);
        const servicos: Servico[] = servicosRaw.map((s: any) => {
          const raw = s.vencimentoDoc;
          let venc: number | null;
          if (raw === null || raw === undefined || raw === "") {
            venc = null;
          } else {
            const num = Number(raw);
            venc = isNaN(num) ? null : num;
          }
          return { ...s, vencimentoDoc: venc };
        });
        const servico = servicos.find((p) => p.id === id);
        if (servico) {
          form.reset(servico);
        }
      }
    }
  }, [id, form]);

  const onSubmit = async (data: ServicoFormData) => {
    setIsSubmitting(true);
    try {
      const stored = localStorage.getItem("servicos");
      const servicos: Servico[] = stored ? JSON.parse(stored) : [];

      if (isEditing && id) {
        const index = servicos.findIndex((p) => p.id === id);
        if (index !== -1) {
          const existing = servicos[index];
          const updatedAt = new Date().toISOString();
          servicos[index] = { 
            ...data, 
            id,
            createdBy: existing.createdBy,
            createdAt: existing.createdAt,
            updatedBy: getCurrentUser(),
            updatedAt
          } as Servico;

          // Audit log update
          const auditLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
          const updateLog = {
            id: `${id}-update-${updatedAt}`,
            action: "update",
            entityType: "servico",
            entityName: data.nomeServico,
            entityId: id,
            user: getCurrentUser(),
            timestamp: updatedAt,
          };
          auditLogs.push(updateLog);
          localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
        }
        toast({
          title: "Serviço atualizado!",
          description: "O serviço foi atualizado com sucesso.",
        });
      } else {
        const createdAt = new Date().toISOString();
        const newServico: Servico = {
          ...data,
          vencimentoDoc: data.vencimentoDoc === null ? null : Number(data.vencimentoDoc),
          id: crypto.randomUUID(),
          createdBy: getCurrentUser(),
          createdAt,
          updatedBy: getCurrentUser(),
          updatedAt: createdAt
        } as Servico;
        servicos.push(newServico);

        // Audit log create
        const auditLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
        if (!auditLogs.find((l: any) => l.id === `${newServico.id}-create`)) {
          const createLog = {
            id: `${newServico.id}-create`,
            action: "create",
            entityType: "servico",
            entityName: newServico.nomeServico,
            entityId: newServico.id,
            user: getCurrentUser(),
            timestamp: createdAt,
          };
          auditLogs.push(createLog);
          localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
        }
        toast({
          title: "Serviço cadastrado!",
          description: "O serviço foi cadastrado com sucesso.",
        });
      }

      localStorage.setItem("servicos", JSON.stringify(servicos));
      navigate("/home/servicos");
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o serviço. Tente novamente.",
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
        onClick={() => navigate("/home")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-3xl">
            {isEditing ? "Editar Serviço" : "Cadastro de Serviços"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Atualize os dados do serviço"
              : "Preencha os dados do serviço para realizar o cadastro"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados da Empresa */}
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
                          <Input placeholder="Nome do serviço" {...field} />
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
                          <Input placeholder="Código do serviço" {...field} />
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
                            }}
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
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>
              </div>
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
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
