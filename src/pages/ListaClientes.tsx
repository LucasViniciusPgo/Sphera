import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, UserPlus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Cliente } from "./CadastroClientes";
import { getCurrentUser } from "@/hooks/useCurrentUser";

const ListaClientes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [parceiros, setParceiros] = useState<any[]>([]);

  useEffect(() => {
    const loadData = () => {
      const clientesData = JSON.parse(localStorage.getItem("clientes") || "[]");
      const parceirosData = JSON.parse(localStorage.getItem("parceiros") || "[]");
      setClientes(clientesData);
      setParceiros(parceirosData);
    };

    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  const getParceiro = (parceiroId: string) => {
    return parceiros.find((p) => p.id === parceiroId);
  };

  const handleDelete = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    const updatedClientes = clientes.filter(c => c.id !== clienteId);
    localStorage.setItem("clientes", JSON.stringify(updatedClientes));
    setClientes(updatedClientes);

    // Audit log delete
    if (cliente) {
      const timestamp = new Date().toISOString();
      const deleteLog = {
        id: `${clienteId}-delete-${timestamp}`,
        action: "delete",
        entityType: "cliente",
        entityName: cliente.nomeFantasia,
        entityId: clienteId,
        user: getCurrentUser(),
        timestamp,
      };
      const auditLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
      auditLogs.push(deleteLog);
      localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
    }

    toast({
      title: "Cliente excluído",
      description: "O cliente foi excluído com sucesso.",
    });
  };

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cnpj.includes(searchTerm) ||
    getParceiro(cliente.parceiroId)?.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>Gerencie os clientes cadastrados</CardDescription>
            </div>
            <Button onClick={() => navigate("/home/cadastro-clientes")}>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, razão social, CNPJ ou parceiro..."
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

          {filteredClientes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-md">
              {searchTerm ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Fantasia</TableHead>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Parceiro Vinculado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => {
                    const parceiro = getParceiro(cliente.parceiroId);
                    return (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">{cliente.nomeFantasia}</TableCell>
                        <TableCell>{cliente.razaoSocial}</TableCell>
                        <TableCell>{cliente.cnpj}</TableCell>
                        <TableCell>{parceiro?.nomeFantasia || "Parceiro não encontrado"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/home/cadastro-clientes/${cliente.id}`)}
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
                                    Tem certeza que deseja excluir o cliente "{cliente.nomeFantasia}"? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(cliente.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
  );
};

export default ListaClientes;
