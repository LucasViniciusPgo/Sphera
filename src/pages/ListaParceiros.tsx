import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Edit, Plus } from "lucide-react";

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
};

export default function ListaParceiros() {
  const navigate = useNavigate();
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

  const filteredParceiros = parceiros.filter((parceiro) =>
    parceiro.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parceiro.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parceiro.cnpj.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <Button onClick={() => navigate("/cadastro-parceiros")}>
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
            <div className="mb-6">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/cadastro-parceiros/${parceiro.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}
