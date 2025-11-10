import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Edit, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export type Parceiro = {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: string;
  emailFinanceiro: string;
  telefoneFinanceiro: string;
  emailResponsavel: string;
  telefoneResponsavel: string;
  status: "ativo" | "inativo";
  dataVencimento: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
};

export default function ListaParceiros() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadParceiros();
  }, []);

  const loadParceiros = () => {
    const stored = localStorage.getItem("parceiros");
    if (stored) {
      setParceiros(JSON.parse(stored));
    }
  };

  const handleDelete = (parceiroId: string) => {
    // Verificar se existem clientes vinculados
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]");
    const clientesVinculados = clientes.filter((c: any) => c.parceiroId === parceiroId);
    
    if (clientesVinculados.length > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Este parceiro possui ${clientesVinculados.length} cliente(s) vinculado(s). Remova os vínculos antes de excluir.`,
        variant: "destructive",
      });
      return;
    }

    const updatedParceiros = parceiros.filter(p => p.id !== parceiroId);
    localStorage.setItem("parceiros", JSON.stringify(updatedParceiros));
    setParceiros(updatedParceiros);
    toast({
      title: "Parceiro excluído",
      description: "O parceiro foi excluído com sucesso.",
    });
  };

  const filteredParceiros = parceiros.filter((parceiro) =>
    parceiro.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parceiro.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parceiro.cnpj.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <Button onClick={() => navigate("/home/cadastro-parceiros")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Parceiro
          </Button>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-3xl">Parceiros</CardTitle>
            <CardDescription>
              Gerencie seus parceiros cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, razão social ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {searchTerm && (
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <span>Filtro ativo:</span>
                  <span className="bg-secondary px-2 py-1 rounded">Busca: "{searchTerm}"</span>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-primary hover:underline ml-2"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>

            {filteredParceiros.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? "Nenhum parceiro encontrado." : "Nenhum parceiro cadastrado ainda."}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome Fantasia</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Email Financeiro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParceiros.map((parceiro) => (
                      <TableRow key={parceiro.id}>
                        <TableCell className="font-medium">{parceiro.nomeFantasia}</TableCell>
                        <TableCell>{parceiro.cnpj}</TableCell>
                        <TableCell>{parceiro.emailFinanceiro}</TableCell>
                        <TableCell>
                          <Badge variant={parceiro.status === "ativo" ? "default" : "secondary"}>
                            {parceiro.status === "ativo" ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(parceiro.dataVencimento).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/home/cadastro-parceiros/${parceiro.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o parceiro "{parceiro.nomeFantasia}"? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(parceiro.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
