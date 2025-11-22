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
import type { Parceiro } from "./ListaParceiros";
import { getCurrentUser } from "@/hooks/useCurrentUser";

const parceiroSchema = z.object({
  razaoSocial: z.string().min(1, "Razão Social é obrigatória").max(100),
  cnpj: z.string().min(14, "CNPJ inválido").max(18).optional(),
  rua: z.string().max(120).optional(),
  bairro: z.string().max(80).optional(),
  numero: z.string().max(20).optional(),
  cidade: z.string().max(80).optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().max(20).optional(),
  complemento: z.string().max(100).optional(),
  lote: z.string().max(50).optional(),
  emailFinanceiro: z.string().email("Email inválido").max(255),
  telefoneFinanceiro: z.string().min(10, "Telefone inválido").max(20),
  emailResponsavel: z.string().email("Email inválido").max(255),
  telefoneResponsavel: z.string().min(10, "Telefone inválido").max(20),
  status: z.literal("ativo"),
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

function formatCEP(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return digits.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

type ParceiroFormData = z.infer<typeof parceiroSchema>;

export default function CadastroParceiros() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!id;

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
      status: "ativo",
    },
  });

  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem("parceiros");
      if (stored) {
        const parceiros: Parceiro[] = JSON.parse(stored);
        const parceiro = parceiros.find((p) => p.id === id);
        if (parceiro) {
          const p: any = parceiro;
          form.reset({
            razaoSocial: p.razaoSocial,
            cnpj: p.cnpj,
            rua: p.rua || "",
            bairro: p.bairro || "",
            numero: p.numero || "",
            cidade: p.cidade || "",
            estado: p.estado || "",
            cep: p.cep || "",
            complemento: p.complemento || "",
            lote: p.lote || "",
            emailFinanceiro: p.emailFinanceiro,
            telefoneFinanceiro: p.telefoneFinanceiro,
            emailResponsavel: p.emailResponsavel,
            telefoneResponsavel: p.telefoneResponsavel,
            status: p.status,
          });
        }
      }
    }
  }, [id, form]);

  const onSubmit = async (data: ParceiroFormData) => {
    setIsSubmitting(true);
    try {
      const stored = localStorage.getItem("parceiros");
      const parceiros: Parceiro[] = stored ? JSON.parse(stored) : [];

      if (isEditing && id) {
        const index = parceiros.findIndex((p) => p.id === id);
        if (index !== -1) {
          const existing = parceiros[index];
          const updatedAt = new Date().toISOString();
          const enderecoComposto = `${(data as any).rua}, ${(data as any).bairro}, ${(data as any).numero}`;
          parceiros[index] = {
            ...data,
            endereco: enderecoComposto,
            id,
            createdBy: existing.createdBy,
            createdAt: existing.createdAt,
            updatedBy: getCurrentUser(),
            updatedAt
          } as Parceiro;

          // Registrar log de atualização
          const auditLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
          const updateLog = {
            id: `${id}-update-${updatedAt}`,
            action: "update",
            entityType: "parceiro",
            entityName: data.razaoSocial,
            entityId: id,
            user: getCurrentUser(),
            timestamp: updatedAt,
          };
          auditLogs.push(updateLog);
          localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
        }
        toast({
          title: "Parceiro atualizado!",
          description: "O parceiro foi atualizado com sucesso.",
        });
      } else {
        const createdAt = new Date().toISOString();
        const enderecoComposto = `${(data as any).rua}, ${(data as any).bairro}, ${(data as any).numero}`;
        const newParceiro: Parceiro = {
          ...data,
          endereco: enderecoComposto,
          id: crypto.randomUUID(),
          createdBy: getCurrentUser(),
          createdAt,
          updatedBy: getCurrentUser(),
          updatedAt: createdAt
        } as Parceiro;
        parceiros.push(newParceiro);

        // Registrar log de criação (persistente)
        const auditLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
        // Evitar duplicar se id já existir (caso de regravação manual)
        if (!auditLogs.find((l: any) => l.id === `${newParceiro.id}-create`)) {
          const createLog = {
            id: `${newParceiro.id}-create`,
            action: "create",
            entityType: "parceiro",
            entityName: newParceiro.nomeFantasia,
            entityId: newParceiro.id,
            user: getCurrentUser(),
            timestamp: createdAt,
          };
          auditLogs.push(createLog);
          localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
        }
        toast({
          title: "Parceiro cadastrado!",
          description: "O parceiro foi cadastrado com sucesso.",
        });
      }

      localStorage.setItem("parceiros", JSON.stringify(parceiros));
      navigate("/home/parceiros");
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o parceiro. Tente novamente.",
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
            {isEditing ? "Editar Parceiro" : "Cadastro de Parceiros"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Atualize os dados do parceiro"
              : "Preencha os dados do parceiro para realizar o cadastro"
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


                    <FormField
                        control={form.control}
                        name="cidade"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cidade *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome da cidade" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="estado"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>UF *</FormLabel>
                                <FormControl>
                                    <Input placeholder="UF" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>CEP *</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="00000-000"
                                        maxLength={9}
                                        value={field.value}
                                        onChange={(e) => field.onChange(formatCEP(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="complemento"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Complemento </FormLabel>
                                <FormControl>
                                    <Input placeholder="Complemento" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="lote"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lote </FormLabel>
                                <FormControl>
                                    <Input placeholder="Lote" {...field} />
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
                                <FormLabel>Status </FormLabel>
                                <FormControl>
                                    <Input value="Ativo" disabled />
                                </FormControl>
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
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
