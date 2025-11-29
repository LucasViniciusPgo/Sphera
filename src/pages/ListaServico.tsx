import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {ArrowLeft, Search, Edit, Plus, Trash2, Eye} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getServices, deleteService, mapServiceToViewModel } from "@/services/servicesService";
import {ApiError, ApiResponse} from "@/lib/http.ts";

export type Servico = {
    id: string;
    nomeServico: string;
    codigo: string;
    vencimentoDoc: number | string | null;
    status: string;
    dueDate: string | null;
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
};

export default function ListaServicos() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadServicos();
    }, []);

    const loadServicos = async () => {
        try {
            const { items } = await getServices();
            const viewItems: Servico[] = items.map(mapServiceToViewModel);
            setServicos(viewItems);
        } catch (e) {
            toast({
                title: "Erro ao carregar serviços",
                description: "Não foi possível carregar a lista de serviços.",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        loadServicos();
    }, []);


    const handleDelete = async (servicoId: string) => {
        try {
            const res = await deleteService(servicoId);
            const status = (res as ApiResponse<any> | ApiError).status;

            if (!status || status < 200 || status >= 300) {
                const err = res as ApiError;
                const msgApi =
                    (err.data as any)?.message ||
                    (err.data as any)?.title ||
                    err.message ||
                    "Não foi possível excluir o serviço.";

                toast({
                    title: "Erro ao excluir serviço",
                    description: msgApi,
                    variant: "destructive",
                });
                return;
            }

            setServicos((prev) => prev.filter((s) => s.id !== servicoId));

            toast({
                title: "Serviço excluído",
                description: "O serviço foi excluído com sucesso.",
            });
        } catch (e) {
            toast({
                title: "Erro inesperado ao excluir",
                description: "Não foi possível excluir o serviço.",
                variant: "destructive",
            });
        }
    };


    const filteredServicos = servicos.filter((servico) => {
        const term = searchTerm.trim().toLowerCase();
        if (term === "") return true;
        const nomeMatch = servico.nomeServico.toLowerCase().includes(term);
        const codigoMatch = servico.codigo.toLowerCase().includes(term);
        let prazoMatch = false;
        if (typeof servico.vencimentoDoc === 'number') {
            prazoMatch = String(servico.vencimentoDoc).includes(term);
        } else if (servico.vencimentoDoc === null) {
            prazoMatch = 'sem prazo'.includes(term);
        } else {
            const dateObj = new Date(servico.vencimentoDoc);
            if (!isNaN(dateObj.getTime())) {
                const iso = dateObj.toISOString().split('T')[0];
                const locale = dateObj.toLocaleDateString('pt-BR');
                prazoMatch = iso.includes(term) || locale.toLowerCase().includes(term);
            }
        }
        return nomeMatch || codigoMatch || prazoMatch;
    });

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/home")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                <Button onClick={() => navigate("/home/cadastro-servicos")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Serviço
                </Button>
            </div>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-3xl">Serviços</CardTitle>
                    <CardDescription>
                        Gerencie seus serviços cadastrados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome, código ou dias..."
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

                    {filteredServicos.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {searchTerm ? "Nenhum serviço encontrado." : "Nenhum serviço cadastrado ainda."}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome do Serviço</TableHead>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Vencimento / Prazo</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredServicos.map((servico) => (
                                        <TableRow key={servico.id}>
                                            <TableCell className="font-medium">{servico.nomeServico}</TableCell>
                                            <TableCell>{servico.codigo}</TableCell>
                                            <TableCell>
                                                {servico.vencimentoDoc === null
                                                    ? 'Sem prazo'
                                                    : typeof servico.vencimentoDoc === 'number'
                                                        ? `${servico.vencimentoDoc} dia${servico.vencimentoDoc === 1 ? '' : 's'}`
                                                        : new Date(servico.vencimentoDoc).toLocaleDateString("pt-BR")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={servico.status === "ativo" ? "default" : "secondary"}>
                                                    {servico.status === "ativo" ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/home/cadastro-servicos/${servico.id}?view=readonly`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/home/cadastro-servicos/${servico.id}`)}
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
                                                                    Tem certeza que deseja excluir o serviço "{servico.nomeServico}"? Esta ação não pode ser desfeita.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(servico.id)}>
                                                                    Excluir
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
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
    );
}

