import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/hooks/useCurrentUser";

export interface Cliente {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string;
  rua: string;
  bairro: string;
  numero: string;
  // Campo composto mantido para compatibilidade com registros antigos
  endereco: string;
  emailFinanceiro: string;
  telefoneFinanceiro: string;
  emailResponsavel: string;
  telefoneResponsavel: string;
  status: "ativo" | "inativo";
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
  inscricaoEstadual: z.string().min(1, "Inscrição Estadual/Municipal é obrigatória").max(50),
  rua: z.string().min(1, "Rua é obrigatória").max(120),
  bairro: z.string().min(1, "Bairro é obrigatório").max(80),
  numero: z.string().min(1, "Número é obrigatório").max(20),
  emailFinanceiro: z.string().email("Email inválido").max(255),
  telefoneFinanceiro: z.string().min(10, "Telefone inválido").max(20),
  emailResponsavel: z.string().email("Email inválido").max(255),
  telefoneResponsavel: z.string().min(10, "Telefone inválido").max(20),
  status: z.enum(["ativo", "inativo"]),
  dataVencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  parceiroId: z.string().min(1, "Selecione um parceiro"),
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
  if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
}

type ClienteFormData = z.infer<typeof clienteSchema>;

const CadastroClientes = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!id;

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nomeFantasia: "",
      razaoSocial: "",
      cnpj: "",
      inscricaoEstadual: "",
      rua: "",
      bairro: "",
      numero: "",
      emailFinanceiro: "",
      telefoneFinanceiro: "",
      emailResponsavel: "",
      telefoneResponsavel: "",
      status: "ativo",
      dataVencimento: "",
      parceiroId: "",
    },
  });

  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem("clientes");
      if (stored) {
        const clientes: Cliente[] = JSON.parse(stored);
        const cliente = clientes.find((c) => c.id === id);
        if (cliente) {
          const c: any = cliente;
          form.reset({
            nomeFantasia: c.nomeFantasia,
            razaoSocial: c.razaoSocial,
            cnpj: c.cnpj,
            inscricaoEstadual: c.inscricaoEstadual,
            rua: c.rua || "",
            bairro: c.bairro || "",
            numero: c.numero || "",
            emailFinanceiro: c.emailFinanceiro,
            telefoneFinanceiro: c.telefoneFinanceiro,
            emailResponsavel: c.emailResponsavel,
            telefoneResponsavel: c.telefoneResponsavel,
            status: c.status,
            dataVencimento: c.dataVencimento,
            parceiroId: c.parceiroId,
          });
        }
      }
    }
  }, [id, form]);

  const parceiros = JSON.parse(localStorage.getItem("parceiros") || "[]");

  const onSubmit = async (data: ClienteFormData) => {
    setIsSubmitting(true);
    try {
      const stored = localStorage.getItem("clientes");
      const clientes: Cliente[] = stored ? JSON.parse(stored) : [];

      if (isEditing && id) {
        const index = clientes.findIndex((c) => c.id === id);
        if (index !== -1) {
          const existing = clientes[index];
          const updatedAt = new Date().toISOString();
          const enderecoComposto = `${data.rua}, ${data.bairro}, ${data.numero}`;
          clientes[index] = {
            ...data,
            endereco: enderecoComposto,
            id,
            createdBy: existing.createdBy,
            createdAt: existing.createdAt,
            updatedBy: getCurrentUser(),
            updatedAt
          } as Cliente;

          // Audit log update
          const auditLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
          const updateLog = {
            id: `${id}-update-${updatedAt}`,
            action: "update",
            entityType: "cliente",
            entityName: data.nomeFantasia,
            entityId: id,
            user: getCurrentUser(),
            timestamp: updatedAt,
          };
          auditLogs.push(updateLog);
          localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
        }
        toast({
          title: "Cliente atualizado!",
          description: "O cliente foi atualizado com sucesso.",
        });
      } else {
        const createdAt = new Date().toISOString();
        const enderecoComposto = `${data.rua}, ${data.bairro}, ${data.numero}`;
        const newCliente: Cliente = {
          ...data,
          endereco: enderecoComposto,
          id: crypto.randomUUID(),
          createdBy: getCurrentUser(),
          createdAt,
          updatedBy: getCurrentUser(),
          updatedAt: createdAt
        } as Cliente;
        clientes.push(newCliente);

        // Audit log create
        const auditLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
        if (!auditLogs.find((l: any) => l.id === `${newCliente.id}-create`)) {
          const createLog = {
            id: `${newCliente.id}-create`,
            action: "create",
            entityType: "cliente",
            entityName: newCliente.nomeFantasia,
            entityId: newCliente.id,
            user: getCurrentUser(),
            timestamp: createdAt,
          };
          auditLogs.push(createLog);
          localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
        }
        toast({
          title: "Cliente cadastrado!",
          description: "O cliente foi cadastrado com sucesso.",
        });
      }

      localStorage.setItem("clientes", JSON.stringify(clientes));
      navigate("/home/clientes");
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o cliente. Tente novamente.",
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
              {isEditing ? "Editar Cliente" : "Cadastro de Clientes"}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? "Atualize os dados do cliente" 
                : "Preencha os dados do cliente para realizar o cadastro"
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
                      name="nomeFantasia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Fantasia *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="razaoSocial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razão Social *</FormLabel>
                          <FormControl>
                            <Input placeholder="Razão social completa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00.000.000/0000-00"
                              value={field.value}
                              maxLength={18}
                              onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="inscricaoEstadual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inscrição Estadual/Municipal *</FormLabel>
                          <FormControl>
                            <Input placeholder="Número da inscrição" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="rua"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rua *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da rua" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bairro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número *</FormLabel>
                          <FormControl>
                            <Input placeholder="Número" {...field} />
                          </FormControl>
                          <FormMessage />
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="financeiro@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefoneFinanceiro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 00000-0000"
                              value={field.value}
                              maxLength={15}
                              onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="responsavel@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefoneResponsavel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 00000-0000"
                              value={field.value}
                              maxLength={15}
                              onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
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

                    <FormField
                      control={form.control}
                      name="dataVencimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento da Fatura *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parceiro *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um parceiro" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {parceiros.map((parceiro: any) => (
                              <SelectItem key={parceiro.id} value={parceiro.id}>
                                {parceiro.nomeFantasia}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
              </form>
            </Form>
          </CardContent>
      </Card>
    </div>
  );
};

export default CadastroClientes;
