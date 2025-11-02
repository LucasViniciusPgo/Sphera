import { useEffect } from "react";
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
import InputMask from "react-input-mask";

export interface Cliente {
  id: string;
  nomeCliente: string;
  cpfCliente: string;
  parceiroId: string;
}

const formSchema = z.object({
  nomeCliente: z.string().min(1, "Nome do cliente é obrigatório"),
  cpfCliente: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
  parceiroId: z.string().min(1, "Selecione um parceiro"),
});

const CadastroClientes = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCliente: "",
      cpfCliente: "",
      parceiroId: "",
    },
  });

  useEffect(() => {
    if (id) {
      const clientes = JSON.parse(localStorage.getItem("clientes") || "[]");
      const cliente = clientes.find((c: Cliente) => c.id === id);
      if (cliente) {
        form.reset({
          nomeCliente: cliente.nomeCliente,
          cpfCliente: cliente.cpfCliente,
          parceiroId: cliente.parceiroId,
        });
      }
    }
  }, [id, form]);

  const parceiros = JSON.parse(localStorage.getItem("parceiros") || "[]");

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]");
    
    if (id) {
      const index = clientes.findIndex((c: Cliente) => c.id === id);
      if (index !== -1) {
        clientes[index] = { ...values, id };
      }
      localStorage.setItem("clientes", JSON.stringify(clientes));
      toast({
        title: "Cliente atualizado!",
        description: "Os dados do cliente foram atualizados com sucesso.",
      });
    } else {
      const novoCliente: Cliente = {
        id: crypto.randomUUID(),
        nomeCliente: values.nomeCliente,
        cpfCliente: values.cpfCliente,
        parceiroId: values.parceiroId,
      };
      clientes.push(novoCliente);
      localStorage.setItem("clientes", JSON.stringify(clientes));
      toast({
        title: "Cliente cadastrado!",
        description: "O cliente foi cadastrado com sucesso.",
      });
    }
    
    navigate("/clientes");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{id ? "Editar Cliente" : "Cadastro de Clientes"}</CardTitle>
          <CardDescription>
            {id ? "Atualize os dados do cliente" : "Preencha os dados do novo cliente"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nomeCliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpfCliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do Cliente</FormLabel>
                    <FormControl>
                      <InputMask
                        mask="999.999.999-99"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        {/* @ts-ignore */}
                        {(inputProps) => (
                          <Input placeholder="000.000.000-00" {...inputProps} />
                        )}
                      </InputMask>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parceiroId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parceiro Vinculado *</FormLabel>
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

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  {id ? "Atualizar" : "Cadastrar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/clientes")}
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
