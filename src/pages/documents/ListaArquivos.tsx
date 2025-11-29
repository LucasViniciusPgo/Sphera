import {useState, useEffect, useMemo} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {FileText, Search, Edit, ArrowLeft, Trash2, Eye} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {useToast} from "@/hooks/use-toast";
import {getCurrentUser} from "@/hooks/useCurrentUser";
import { http } from "@/lib/http";
import { Arquivo, StatusType } from "@/interfaces/Arquivo";

export default function ListaArquivos() {
    const navigate = useNavigate();
    const {toast} = useToast();
    const {partnerId, clientId} = useParams<{ partnerId: string; clientId: string }>();

    // Filtros solicitados pelo usuário: apenas busca, serviço e status
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroServico, setFiltroServico] = useState<string>("todos");
    const [filtroStatus, setFiltroStatus] = useState<string>("todos");

    const [arquivos, setArquivos] = useState<Arquivo[]>([]);
    const [servicos, setServicos] = useState<any[]>([]);
    const [nomeCliente, setNomeCliente] = useState<string>("");
    const [nomeParceiro, setNomeParceiro] = useState<string>("");

    const calcularStatus = (dueDate: string): StatusType => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const vencimento = new Date(dueDate);
        vencimento.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return "vencido";
        if (diffDays <= 7) return "a-vencer";
        return "dentro-prazo";
    };

    const getStatusConfig = (status: StatusType) => {
        switch (status) {
            case "vencido":
                return {label: "Vencido", className: "bg-red-500 hover:bg-red-600 text-white"};
            case "a-vencer":
                return {label: "A Vencer", className: "bg-orange-500 hover:bg-orange-600 text-white"};
            case "dentro-prazo":
                return {label: "Dentro do Prazo", className: "bg-green-500 hover:bg-green-600 text-white"};
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            let arquivosData: Arquivo[] = [];
            const documentsResponse = await http.get("/documents", { params: { clientId: clientId } });
            if (documentsResponse.status == 200)
            {
                arquivosData = documentsResponse.data;
            }
            const servicesResponse = await http.get("/services");
            if (servicesResponse.status == 200)
            {
                setServicos(servicesResponse.data);
            }

            if (clientId) {
                if (arquivosData.length > 0) {
                    setNomeCliente(arquivosData[0].clientName || "");
                    setNomeParceiro(arquivosData[0].partnerName || "");
                }
                
            }
            
            arquivosData.forEach((arquivo) => {
                const status = calcularStatus(arquivo.dueDate);
                arquivo.status = status;
            });
            setArquivos(arquivosData);
        }

        fetchData()
        .then(() => {})
        .catch((err) => {
        console.error(err);
        });
    }, [clientId, partnerId]);

    const arquivosFiltrados = useMemo(() => {
        return arquivos.filter((arquivo) => {
            const matchSearch =
                searchTerm === "" ||
                arquivo.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                arquivo.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                arquivo.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                arquivo.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                arquivo.responsibleName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchServico = filtroServico === "todos" || arquivo.serviceName === filtroServico;
            const matchStatus = filtroStatus === "todos" || arquivo.status === filtroStatus;
            return matchSearch && matchServico && matchStatus;
        });
    }, [arquivos, searchTerm, filtroServico, filtroStatus]);

    const handleEdit = (id: string) => {
        navigate(`/home/cadastro-arquivos/${id}`);
    };

    const handleDelete = (arquivoId: string) => {
        const updatedArquivos = arquivos.filter((a) => a.id !== arquivoId);
        setArquivos(updatedArquivos);

        http.delete(`/documents/${arquivoId}`)
        .then((response) => {
            if (response.status != 204) {
                toast({
                    title: "Erro ao excluir",
                    description: "Não foi possível excluir o arquivo. Tente novamente.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Arquivo excluído",
                    description: "O arquivo foi excluído com sucesso.",
                });
            }
        })
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {clientId && partnerId && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/home/arquivos/${partnerId}`)}
                            title="Voltar para clientes"
                        >
                            <ArrowLeft className="h-4 w-4"/>
                        </Button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold">
                            {clientId ? `Arquivos - ${nomeCliente}` : "Arquivos"}
                        </h1>
                        <p className="text-muted-foreground">
                            {partnerId && nomeParceiro ? `Parceiro: ${nomeParceiro}` : "Lista completa de arquivos"}
                        </p>
                    </div>
                </div>
                <Button onClick={() => navigate("/home/cadastro-arquivos")}>
                    <FileText className="mr-2 h-4 w-4"/>
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
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    placeholder="Buscar por nome, cliente, parceiro, serviço ou responsável..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={filtroServico} onValueChange={setFiltroServico}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos os Serviços"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos os Serviços</SelectItem>
                                    {servicos.map((servico) => (
                                        <SelectItem key={servico.id} value={servico.id}>
                                            {servico.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos os Status"/>
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
                                    <span
                                        className="bg-secondary px-2 py-1 rounded">Serviço: {servicos.find(s => s.id === filtroServico)?.name || filtroServico}</span>
                                )}
                                {filtroStatus !== 'todos' && (
                                    <span
                                        className="bg-secondary px-2 py-1 rounded">Status: {getStatusConfig(filtroStatus as StatusType)?.label}</span>
                                )}
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFiltroServico('todos');
                                        setFiltroStatus('todos');
                                    }}
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
                                            <TableCell className="font-medium">{arquivo.fileName}</TableCell>
                                            <TableCell>{arquivo.partnerName}</TableCell>
                                            <TableCell>{arquivo.clientName}</TableCell>
                                            <TableCell>{arquivo.serviceName}</TableCell>
                                            <TableCell>{arquivo.responsibleName}</TableCell>
                                            <TableCell>{new Date(arquivo.dueDate).toLocaleDateString("pt-BR")}</TableCell>
                                            <TableCell>
                                                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/home/cadastro-arquivos/${arquivo.id}?view=readonly`)}
                                                    >
                                                        <Eye className="h-4 w-4"/>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(arquivo.id)}
                                                        title="Editar arquivo"
                                                    >
                                                        <Edit className="h-4 w-4"/>
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" title="Excluir arquivo">
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Tem certeza que deseja excluir o arquivo
                                                                    "{arquivo.fileName}"? Esta ação não pode ser
                                                                    desfeita.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(arquivo.id)}>
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
