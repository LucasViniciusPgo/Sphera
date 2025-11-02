import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, UserPlus } from "lucide-react";
import type { Cliente } from "./CadastroClientes";

const ListaClientes = () => {
  const navigate = useNavigate();
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

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cpfCliente.includes(searchTerm) ||
    getParceiro(cliente.parceiroId)?.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>Gerencie os clientes cadastrados</CardDescription>
            </div>
            <Button onClick={() => navigate("/cadastro-clientes")}>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, CPF ou parceiro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Cliente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Parceiro Vinculado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => {
                    const parceiro = getParceiro(cliente.parceiroId);
                    return (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">{cliente.nomeCliente}</TableCell>
                        <TableCell>{cliente.cpfCliente}</TableCell>
                        <TableCell>{parceiro?.nomeFantasia || "Parceiro não encontrado"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/cadastro-clientes/${cliente.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ListaClientes;
