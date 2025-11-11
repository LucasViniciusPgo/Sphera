import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Edit, ArrowLeft, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Arquivo } from "./CadastroArquivo";
import { getCurrentUser } from "@/hooks/useCurrentUser";

type StatusType = "vencido" | "a-vencer" | "dentro-prazo";

interface ArquivoComDetalhes extends Arquivo {
  nomeCliente: string;
  nomeParceiro: string;
  nomeServico: string;
  status: StatusType;
}

export default function ListaArquivos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { parceiroId, clienteId } = useParams<{ parceiroId: string; clienteId: string }>();

  // Filtros solicitados pelo usuário: apenas busca, serviço e status
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroServico, setFiltroServico] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const [arquivos, setArquivos] = useState<ArquivoComDetalhes[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [nomeCliente, setNomeCliente] = useState<string>("");
  const [nomeParceiro, setNomeParceiro] = useState<string>("");

  const calcularStatus = (dataVencimento: string): StatusType => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "vencido";
    if (diffDays <= 7) return "a-vencer";
    return "dentro-prazo";
  };

  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case "vencido":
        return { label: "Vencido", className: "bg-red-500 hover:bg-red-600 text-white" };
      case "a-vencer":
        return { label: "A Vencer", className: "bg-orange-500 hover:bg-orange-600 text-white" };
      case "dentro-prazo":
        return { label: "Dentro do Prazo", className: "bg-green-500 hover:bg-green-600 text-white" };
    }
  };

  useEffect(() => {
    const storedArquivos = localStorage.getItem("arquivos");
    const storedClientes = localStorage.getItem("clientes");
    const storedParceiros = localStorage.getItem("parceiros");
    const storedServicos = localStorage.getItem("servicos");

    const clientesData = storedClientes ? JSON.parse(storedClientes) : [];
    const parceirosData = storedParceiros ? JSON.parse(storedParceiros) : [];
    const servicosData = storedServicos ? JSON.parse(storedServicos) : [];
    const arquivosData: Arquivo[] = storedArquivos ? JSON.parse(storedArquivos) : [];

    setClientes(clientesData);
    setParceiros(parceirosData);
    setServicos(servicosData);

    if (clienteId) {
      const cliente = clientesData.find((c: any) => c.id === clienteId);
      setNomeCliente(cliente?.nomeFantasia || "");
      if (cliente && parceiroId) {
        const parceiro = parceirosData.find((p: any) => p.id === parceiroId);
        setNomeParceiro(parceiro?.nomeFantasia || "");
      }
    }

    const arquivosComDetalhes: ArquivoComDetalhes[] = arquivosData.map((arquivo) => {
      const cliente = clientesData.find((c: any) => c.id === arquivo.Cliente);
      const parceiro = cliente ? parceirosData.find((p: any) => p.id === cliente.parceiroId) : null;
      const servico = servicosData.find((s: any) => s.id === arquivo.Servico);
      const status = calcularStatus(arquivo.DataVencimento);
      return {
        ...arquivo,
        nomeCliente: cliente?.nomeFantasia || "Cliente não encontrado",
        nomeParceiro: parceiro?.nomeFantasia || "Parceiro não encontrado",
        nomeServico: servico?.nomeServico || "Serviço não encontrado",
        status,
      };
    });
    setArquivos(arquivosComDetalhes);
  }, [clienteId, parceiroId]);

  const arquivosFiltrados = useMemo(() => {
    return arquivos.filter((arquivo) => {
      const matchSearch =
        searchTerm === "" ||
        arquivo.NomeArquivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        arquivo.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        arquivo.nomeParceiro.toLowerCase().includes(searchTerm.toLowerCase()) ||
        arquivo.nomeServico.toLowerCase().includes(searchTerm.toLowerCase()) ||
        arquivo.Resposavel.toLowerCase().includes(searchTerm.toLowerCase());
      const matchServico = filtroServico === "todos" || arquivo.Servico === filtroServico;
      const matchStatus = filtroStatus === "todos" || arquivo.status === filtroStatus;
      return matchSearch && matchServico && matchStatus;
    });
  }, [arquivos, searchTerm, filtroServico, filtroStatus]);

  const handleEdit = (id: string) => {
    navigate(`/home/cadastro-arquivos/${id}`);
  };

  const handleDelete = (arquivoId: string) => {
    const arquivo = arquivos.find(a => a.id === arquivoId);
    const updatedArquivos = arquivos.filter((a) => a.id !== arquivoId);
    const storedArquivos = JSON.parse(localStorage.getItem("arquivos") || "[]");
    const filteredStored = storedArquivos.filter((a: any) => a.id !== arquivoId);
    localStorage.setItem("arquivos", JSON.stringify(filteredStored));
    setArquivos(updatedArquivos);

    if (arquivo) {
      const timestamp = new Date().toISOString();
      const deleteLog = {
        id: `${arquivoId}-delete-${timestamp}`,
        action: "delete",
        entityType: "arquivo",
        entityName: arquivo.NomeArquivo,
        entityId: arquivoId,
        user: getCurrentUser(),
        timestamp,
      };
      const auditLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
      auditLogs.push(deleteLog);
      localStorage.setItem("auditLogs", JSON.stringify(auditLogs));
    }

    toast({
      title: "Arquivo excluído",
      description: "O arquivo foi excluído com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {clienteId && parceiroId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/home/arquivos/${parceiroId}`)}
              title="Voltar para clientes"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">
              {clienteId ? `Arquivos - ${nomeCliente}` : "Arquivos"}
            </h1>
            <p className="text-muted-foreground">
              {clienteId && nomeParceiro ? `Parceiro: ${nomeParceiro}` : "Lista completa de arquivos"}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/home/cadastro-arquivos")}> 
          <FileText className="mr-2 h-4 w-4" />
          Novo Arquivo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque e filtre por serviço ou status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, cliente, parceiro, serviço ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filtroServico} onValueChange={setFiltroServico}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Serviços" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Serviços</SelectItem>
                  {servicos.map((servico) => (
                    <SelectItem key={servico.id} value={servico.id}>
                      {servico.nomeServico}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="a-vencer">A Vencer</SelectItem>
                  <SelectItem value="dentro-prazo">Dentro do Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || filtroServico !== 'todos' || filtroStatus !== 'todos') && (
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground items-center">
                <span>Filtro ativo:</span>
                {searchTerm && (
                  <span className="bg-secondary px-2 py-1 rounded">Busca: "{searchTerm}"</span>
                )}
                {filtroServico !== 'todos' && (
                  <span className="bg-secondary px-2 py-1 rounded">Serviço: {servicos.find(s => s.id === filtroServico)?.nomeServico || filtroServico}</span>
                )}
                {filtroStatus !== 'todos' && (
                  <span className="bg-secondary px-2 py-1 rounded">Status: {getStatusConfig(filtroStatus as StatusType)?.label}</span>
                )}
                <button
                  onClick={() => { setSearchTerm(''); setFiltroServico('todos'); setFiltroStatus('todos'); }}
                  className="text-primary hover:underline ml-2"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arquivos Cadastrados</CardTitle>
          <CardDescription>Lista de arquivos armazenados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arquivosFiltrados.map((arquivo) => {
                  const statusConfig = getStatusConfig(arquivo.status);
                  return (
                    <TableRow key={arquivo.id}>
                      <TableCell className="font-medium">{arquivo.NomeArquivo}</TableCell>
                      <TableCell>{arquivo.nomeParceiro}</TableCell>
                      <TableCell>{arquivo.nomeCliente}</TableCell>
                      <TableCell>{arquivo.nomeServico}</TableCell>
                      <TableCell>{arquivo.Resposavel}</TableCell>
                      <TableCell>{new Date(arquivo.DataVencimento).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(arquivo.id)}
                            title="Editar arquivo"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Excluir arquivo">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o arquivo "{arquivo.NomeArquivo}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(arquivo.id)}>
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
        </CardContent>
      </Card>
    </div>
  );
}
