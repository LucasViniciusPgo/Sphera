import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Cliente {
  id: string;
  nomeFantasia: string;
  parceiroId: string;
}

export default function PastasClientes() {
  const navigate = useNavigate();
  const { parceiroId } = useParams<{ parceiroId: string }>();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [arquivosPorCliente, setArquivosPorCliente] = useState<Record<string, number>>({});
  const [nomeParceiro, setNomeParceiro] = useState<string>("");

  useEffect(() => {
    const storedClientes = localStorage.getItem("clientes");
    const storedArquivos = localStorage.getItem("arquivos");
    const storedParceiros = localStorage.getItem("parceiros");

    if (storedParceiros && parceiroId) {
      const parceirosData = JSON.parse(storedParceiros);
      const parceiro = parceirosData.find((p: any) => p.id === parceiroId);
      setNomeParceiro(parceiro?.nomeFantasia || "");
    }

    if (storedClientes) {
      const clientesData = JSON.parse(storedClientes);
      const clientesDoParceiro = clientesData.filter(
        (cliente: Cliente) => cliente.parceiroId === parceiroId
      );
      setClientes(clientesDoParceiro);

      if (storedArquivos) {
        const arquivosData = JSON.parse(storedArquivos);
        const contagem: Record<string, number> = {};
        
        clientesDoParceiro.forEach((cliente: Cliente) => {
          contagem[cliente.id] = arquivosData.filter(
            (arquivo: any) => arquivo.Cliente === cliente.id
          ).length;
        });
        
        setArquivosPorCliente(contagem);
      }
    }
  }, [parceiroId]);

  const handlePastaClick = (clienteId: string) => {
    navigate(`/home/arquivos/${parceiroId}/${clienteId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/home/arquivos")}
          title="Voltar para parceiros"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Clientes - {nomeParceiro}</h1>
          <p className="text-muted-foreground">Selecione um cliente para ver seus arquivos</p>
        </div>
      </div>

      {clientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground text-center">
              Este parceiro não possui clientes cadastrados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((cliente) => (
            <Card 
              key={cliente.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handlePastaClick(cliente.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Folder className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{cliente.nomeFantasia}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <FileText className="h-3 w-3" />
                      {arquivosPorCliente[cliente.id] || 0} {(arquivosPorCliente[cliente.id] || 0) === 1 ? "arquivo" : "arquivos"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
