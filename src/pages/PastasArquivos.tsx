import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Parceiro {
  id: string;
  nomeFantasia: string;
}

export default function PastasArquivos() {
  const navigate = useNavigate();
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  // Quantidade de clientes por parceiro
  const [clientesPorParceiro, setClientesPorParceiro] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const storedParceiros = localStorage.getItem("parceiros");
    const storedClientes = localStorage.getItem("clientes");
  // Não precisamos mais dos arquivos para esta tela, apenas parceiros e clientes

    if (!storedParceiros) return;
    const parceirosData: Parceiro[] = JSON.parse(storedParceiros);
    setParceiros(parceirosData);

    if (storedClientes) {
      const clientesData = JSON.parse(storedClientes);
      const contagem: Record<string, number> = {};

      parceirosData.forEach((parceiro: Parceiro) => {
        contagem[parceiro.id] = clientesData.filter(
          (cliente: any) => cliente.parceiroId === parceiro.id
        ).length;
      });
      setClientesPorParceiro(contagem);
    }
  }, []);

  const parceirosFiltrados = useMemo(() => {
    return parceiros.filter((p) =>
      searchTerm === "" || p.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [parceiros, searchTerm]);

  const handlePastaClick = (parceiroId: string) => {
    navigate(`/home/arquivos/${parceiroId}`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Arquivos</h1>
        <p className="text-muted-foreground">Arquivos organizados por parceiro</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Busca</CardTitle>
          <CardDescription>Localize parceiros pelo nome</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar parceiro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {searchTerm && (
              <div className="flex gap-2 text-sm text-muted-foreground items-center">
                <span>Filtro ativo:</span>
                <span className="bg-secondary px-2 py-1 rounded">Busca: "{searchTerm}"</span>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-primary hover:underline ml-2"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {parceiros.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum parceiro encontrado</h3>
              <p className="text-muted-foreground mt-2">
                Cadastre parceiros para organizar seus arquivos.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parceirosFiltrados.map((parceiro) => {
            const totalClientes = clientesPorParceiro[parceiro.id] || 0;
            
            return (
              <Card
                key={parceiro.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handlePastaClick(parceiro.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{parceiro.nomeFantasia}</CardTitle>
                  <Folder className="h-8 w-8 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {totalClientes} {totalClientes === 1 ? "cliente" : "clientes"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
