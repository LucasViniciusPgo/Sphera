import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Edit, ArrowLeft } from "lucide-react";
import { Arquivo } from "./CadastroArquivo";

type StatusType = "vencido" | "a-vencer" | "dentro-prazo";

interface ArquivoComDetalhes extends Arquivo {
  nomeCliente: string;
  nomeParceiro: string;
  nomeServico: string;
  status: StatusType;
}

export default function ListaArquivos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCliente, setFiltroCliente] = useState<string>("todos");
  const [filtroParceiro, setFiltroParceiro] = useState<string>("todos");
  const [filtroServico, setFiltroServico] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [arquivos, setArquivos] = useState<ArquivoComDetalhes[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);

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

    setClientes(clientesData);
    setParceiros(parceirosData);
    setServicos(servicosData);

    if (storedArquivos) {
      const arquivosData: Arquivo[] = JSON.parse(storedArquivos);
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
    }
  }, []);

  const arquivosFiltrados = useMemo(() => {
    return arquivos.filter((arquivo) => {
      const matchSearch =
        searchTerm === "" ||
        arquivo.NomeArquivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        arquivo.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        arquivo.nomeParceiro.toLowerCase().includes(searchTerm.toLowerCase()) ||
        arquivo.nomeServico.toLowerCase().includes(searchTerm.toLowerCase()) ||
        arquivo.Resposavel.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCliente = filtroCliente === "todos" || arquivo.Cliente === filtroCliente;
      const matchParceiro = filtroParceiro === "todos" || 
        clientes.find(c => c.id === arquivo.Cliente)?.parceiroId === filtroParceiro;
      const matchServico = filtroServico === "todos" || arquivo.Servico === filtroServico;
      const matchStatus = filtroStatus === "todos" || arquivo.status === filtroStatus;

      return matchSearch && matchCliente && matchParceiro && matchServico && matchStatus;
    });
  }, [arquivos, searchTerm, filtroCliente, filtroParceiro, filtroServico, filtroStatus, clientes]);

  const handleEdit = (id: string) => {
    navigate(`/home/cadastro-arquivos/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Arquivos</h1>
          <p className="text-muted-foreground">Gerencie todos os arquivos cadastrados</p>
        </div>
        <Button onClick={() => navigate("/home/cadastro-arquivos")}>
          <FileText className="mr-2 h-4 w-4" />
          Novo Arquivo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre os arquivos por diferentes critérios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filtroParceiro} onValueChange={setFiltroParceiro}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Parceiros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Parceiros</SelectItem>
                {parceiros.map((parceiro) => (
                  <SelectItem key={parceiro.id} value={parceiro.id}>
                    {parceiro.nomeFantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroCliente} onValueChange={setFiltroCliente}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Clientes</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nomeFantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Arquivos
            <span className="ml-2 text-muted-foreground font-normal text-base">
              ({arquivosFiltrados.length} {arquivosFiltrados.length === 1 ? "arquivo" : "arquivos"})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {arquivosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum arquivo encontrado</h3>
              <p className="text-muted-foreground mt-2">
                {arquivos.length === 0
                  ? "Comece cadastrando seu primeiro arquivo."
                  : "Tente ajustar os filtros de busca."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Arquivo</TableHead>
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
                        <TableCell>
                          {new Date(arquivo.DataVencimento).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(arquivo.id)}
                            title="Editar arquivo"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}
