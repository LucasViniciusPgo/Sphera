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

const parceiroSchema = z.object({
  nomeFantasia: z.string().min(1, "Nome Fantasia é obrigatório").max(100),
  razaoSocial: z.string().min(1, "Razão Social é obrigatória").max(100),
  cnpj: z.string().min(14, "CNPJ inválido").max(18),
  inscricaoEstadual: z.string().min(1, "Inscrição Estadual/Municipal é obrigatória").max(50),
  endereco: z.string().min(1, "Endereço é obrigatório").max(200),
  emailFinanceiro: z.string().email("Email inválido").max(255),
  telefoneFinanceiro: z.string().min(10, "Telefone inválido").max(20),
  emailResponsavel: z.string().email("Email inválido").max(255),
  telefoneResponsavel: z.string().min(10, "Telefone inválido").max(20),
  status: z.enum(["ativo", "inativo"]),
  dataVencimento: z.string().min(1, "Data de vencimento é obrigatória"),
});

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
      nomeFantasia: "",
      razaoSocial: "",
      cnpj: "",
      inscricaoEstadual: "",
      endereco: "",
      emailFinanceiro: "",
      telefoneFinanceiro: "",
      emailResponsavel: "",
      telefoneResponsavel: "",
      status: "ativo",
      dataVencimento: "",
    },
  });

  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem("parceiros");
      if (stored) {
        const parceiros: Parceiro[] = JSON.parse(stored);
        const parceiro = parceiros.find((p) => p.id === id);
        if (parceiro) {
          form.reset(parceiro);
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
          parceiros[index] = { ...data, id } as Parceiro;
        }
        toast({
          title: "Parceiro atualizado!",
          description: "O parceiro foi atualizado com sucesso.",
        });
      } else {
        const newParceiro: Parceiro = {
          ...data,
          id: crypto.randomUUID(),
        } as Parceiro;
        parceiros.push(newParceiro);
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
                      name="nomeFantasia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Fantasia *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do parceiro" {...field} />
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
                            <Input placeholder="00.000.000/0000-00" {...field} />
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

                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço *</FormLabel>
                        <FormControl>
                          <Input placeholder="Endereço completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            <Input placeholder="(00) 00000-0000" {...field} />
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
                            <Input placeholder="(00) 00000-0000" {...field} />
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
