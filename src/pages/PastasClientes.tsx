import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder, FileText, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http } from "@/lib/http";

interface Client {
  id: string;
  legalName: string;
  partnerId: string;
  documents: any[];
}

export default function PastasClientes() {
  const navigate = useNavigate();
  const { partnerId } = useParams<{ partnerId: string }>();
  const [clients, setClients] = useState<Client[]>([]);
  const [documentsPerClient, setDocumentsPerClient] = useState<Record<string, number>>({});
  const [nomeParceiro, setNomeParceiro] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const clientsResponse = await http.get("/clients", { params: { partnerId, includePartner: true } });
      if (clientsResponse.status == 200)
      {
        setClients(clientsResponse.data);
        let legalName = "";
        if (clientsResponse.data.length > 0 && clientsResponse.data[0].partner) {
          legalName = clientsResponse.data[0].partner.legalName;
        } else {
          const partnerResponse = await http.get(`/partners/${partnerId}`);
          if (partnerResponse.status == 200) {
            legalName = partnerResponse.data.legalName;
          }
        }
        setNomeParceiro(legalName);
      }

      const documentsResponse = await http.get("/documents");
      if (documentsResponse.status == 200)
      {
        const count: Record<string, number> = {};
        clientsResponse.data.forEach((client: Client) => {
          count[client.id] = documentsResponse.data.filter(
            (document: any) => document.clientId === client.id
          ).length;
        });
        setDocumentsPerClient(count);
      }
    };

    fetchData()
    .then(() => {})
    .catch((err) => {
      console.error(err);
    });
    

      // if (storedArquivos) {
      //   const arquivosData = JSON.parse(storedArquivos);
      //   const contagem: Record<string, number> = {};

      //   clientesDoParceiro.forEach((cliente: Cliente) => {
      //     contagem[cliente.id] = arquivosData.filter(
      //       (arquivo: any) => arquivo.Cliente === cliente.id
      //     ).length;
      //   });

      //   setArquivosPorCliente(contagem);
      // }
    
  }, [ partnerId ]);

  const searchClients = useMemo(() => {
    return clients.filter((c) =>
      searchTerm === "" || c.legalName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);
  const handlePastaClick = (clientId: string) => {
    navigate(`/home/arquivos/${partnerId}/${clientId}`, { state: { partnerId, clientId } });
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
                  placeholder="Buscar cliente..."
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

      {clients.length === 0 ? (
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
          {clients.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handlePastaClick(client.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Folder className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{client.legalName}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <FileText className="h-3 w-3" />
                      {documentsPerClient[client.id] || 0} {(documentsPerClient[client.id] || 0) === 1 ? "documento" : "documentos"}
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
