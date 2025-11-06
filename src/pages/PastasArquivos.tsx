import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, FileText } from "lucide-react";

interface Servico {
  id: string;
  nomeServico: string;
}

export default function PastasArquivos() {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [arquivosPorServico, setArquivosPorServico] = useState<Record<string, number>>({});

  useEffect(() => {
    const storedServicos = localStorage.getItem("servicos");
    const storedArquivos = localStorage.getItem("arquivos");

    if (storedServicos) {
      setServicos(JSON.parse(storedServicos));
    }

    if (storedArquivos) {
      const arquivos = JSON.parse(storedArquivos);
      const contagem: Record<string, number> = {};
      
      arquivos.forEach((arquivo: any) => {
        contagem[arquivo.Servico] = (contagem[arquivo.Servico] || 0) + 1;
      });
      
      setArquivosPorServico(contagem);
    }
  }, []);

  const handlePastaClick = (servicoId: string) => {
    navigate(`/home/arquivos/${servicoId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Arquivos por Serviço</h1>
        <p className="text-muted-foreground">Selecione um serviço para visualizar seus arquivos</p>
      </div>

      {servicos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum serviço encontrado</h3>
              <p className="text-muted-foreground mt-2">
                Cadastre serviços para organizar seus arquivos.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicos.map((servico) => {
            const totalArquivos = arquivosPorServico[servico.id] || 0;
            
            return (
              <Card
                key={servico.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handlePastaClick(servico.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{servico.nomeServico}</CardTitle>
                  <Folder className="h-8 w-8 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">
                      {totalArquivos} {totalArquivos === 1 ? "arquivo" : "arquivos"}
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
