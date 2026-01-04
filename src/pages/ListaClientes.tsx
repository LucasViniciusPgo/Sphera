import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, UserPlus, Trash2, Eye } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { getClients, deleteClient, getClientById, type ClientDetails } from "@/services/clientsService.ts";
import { removeContactFromClient, addContactToClient } from "@/services/clientsContactsService.ts";
import { formatCNPJ } from "@/utils/format.ts";
import { EExpirationStatus } from "@/interfaces/Arquivo";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";


const ListaClientes = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroStatus, setFiltroStatus] = useState<string>("todos");
    const [dueDateFrom, setDueDateFrom] = useState<string>("");
    const [dueDateTo, setDueDateTo] = useState<string>("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const mounted = useRef(false);

    const [clientes, setClientes] = useState<ClientDetails[]>([]);
    const getStatusLabelAndClass = (status: EExpirationStatus | string) => {
        if (status === EExpirationStatus.Expired || status === "vencido") {
            return { label: "Vencido", className: "bg-red-500 hover:bg-red-600 text-white" };
        }
        if (status === EExpirationStatus.AboutToExpire || status === "a-vencer") {
            return { label: "A Vencer", className: "bg-orange-500 hover:bg-orange-600 text-white" };
        }
        if (status === EExpirationStatus.WithinDeadline || status === "dentro-prazo") {
            return { label: "Dentro do Prazo", className: "bg-green-500 hover:bg-green-600 text-white" };
        }
        return { label: "Desconhecido", className: "bg-gray-500 text-white" };
    };

    // Debounce search to avoid too many requests
    useEffect(() => {
        if (!mounted.current) return;

        const timer = setTimeout(() => {
            if (page === 1) {
                loadClientes(1, searchTerm, filtroStatus, dueDateFrom, dueDateTo);
            } else {
                setPage(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset to page 1 when status or date filter changes
    useEffect(() => {
        if (!mounted.current) return;

        if (page === 1) {
            loadClientes(1, searchTerm, filtroStatus, dueDateFrom, dueDateTo);
        } else {
            setPage(1);
        }
    }, [filtroStatus, dueDateFrom, dueDateTo]);

    const loadClientes = useCallback(async (pageParam: number, searchParam: string, statusParam: string, fromParam?: string, toParam?: string) => {
        const effectivePageSize = statusParam !== "todos" ? 1000 : 10;
        try {
            let expirationStatus: number | undefined = undefined;
            if (statusParam === "vencido") expirationStatus = EExpirationStatus.Expired;
            else if (statusParam === "a-vencer") expirationStatus = EExpirationStatus.AboutToExpire;
            else if (statusParam === "dentro-prazo") expirationStatus = EExpirationStatus.WithinDeadline;

            const { items, totalCount: total } = await getClients({
                includePartner: true,
                page: pageParam,
                pageSize: effectivePageSize,
                search: searchParam || undefined,
                expirationStatus: expirationStatus,
                dueDateFrom: fromParam || undefined,
                dueDateTo: toParam || undefined
            });

            if (pageParam > 1 && items.length === 0) {
                toast({
                    title: "Fim da lista",
                    description: "Não existem mais registros para exibir.",
                });
                setHasMore(false);
                setPage(prev => prev - 1);
                return;
            }

            setClientes(items);

            setHasMore(items.length >= effectivePageSize);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao carregar clientes",
                description:
                    error?.data?.message ||
                    error?.message ||
                    "Não foi possível carregar a lista de clientes.",
                variant: "destructive",
            });
        }
    }, [toast]);

    useEffect(() => {
        loadClientes(page, searchTerm, filtroStatus, dueDateFrom, dueDateTo);
    }, [page, loadClientes]);

    // Set mounted flag
    useEffect(() => {
        mounted.current = true;
    }, []);

    const handleDelete = async (clienteId: string) => {
        let contactsToRestore: any[] = [];
        try {
            const { data: clientDetails } = await getClientById(clienteId);
            contactsToRestore = clientDetails.contacts || [];

            if (contactsToRestore.length > 0) {
                await Promise.all(
                    contactsToRestore.map((c) => removeContactFromClient(clienteId, c.id))
                );
            }

            await deleteClient(clienteId);
            // Reload current page
            loadClientes(page, searchTerm, filtroStatus, dueDateFrom, dueDateTo);
            toast({
                title: "Cliente excluído",
                description: "O cliente foi excluído com sucesso.",
            });
        } catch (error: any) {
            console.error(error);
            let description = "Não foi possível excluir o cliente.";

            // Rollback: Restaurar contatos
            if (contactsToRestore.length > 0) {
                try {
                    await Promise.all(
                        contactsToRestore.map((c) => addContactToClient(clienteId, {
                            name: c.name,
                            type: c.type,
                            role: c.role,
                            value: c.value
                        }))
                    );
                    description += " Os contatos foram restaurados.";
                } catch (restoreError) {
                    console.error("Erro ao restaurar contatos:", restoreError);
                    description += " Falha ao restaurar contatos.";
                }
            }

            if (error?.data?.errors) {
                const errors = error.data.errors;
                const firstErrorKey = Object.keys(errors)[0];
                if (firstErrorKey && errors[firstErrorKey]?.length > 0) {
                    description = errors[firstErrorKey][0];
                }
            } else if (error?.data?.message) {
                description = error.data.message;
            } else if (error?.message) {
                description = error.message;
            }

            toast({
                title: "Erro ao excluir",
                description,
                variant: "destructive",
            });
        }
    };

    const filteredClientes = clientes;

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return "-";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("pt-BR");
        } catch (e) {
            return "-";
        }
    };

    return (
        <Card className="max-w-7xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Lista de Clientes</CardTitle>
                        <CardDescription>Gerencie os clientes cadastrados</CardDescription>
                    </div>
                    <Button onClick={() => navigate("/home/cadastro-clientes")}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Novo Cliente
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative md:col-span-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status Vencimento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os Status</SelectItem>
                                <SelectItem value="vencido">Vencido</SelectItem>
                                <SelectItem value="a-vencer">A Vencer</SelectItem>
                                <SelectItem value="dentro-prazo">Dentro do Prazo</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex flex-col space-y-1">
                            <Input
                                type="date"
                                value={dueDateFrom}
                                onChange={(e) => setDueDateFrom(e.target.value)}
                                title="Vencimento e-CAC De"
                            />
                        </div>
                        <div className="flex flex-col space-y-1">
                            <Input
                                type="date"
                                value={dueDateTo}
                                onChange={(e) => setDueDateTo(e.target.value)}
                                title="Vencimento e-CAC Até"
                            />
                        </div>
                    </div>
                    {(searchTerm || filtroStatus !== "todos" || dueDateFrom || dueDateTo) && (
                        <div className="flex gap-2 text-sm text-muted-foreground items-center flex-wrap">
                            <span>Filtros ativos:</span>
                            {searchTerm && (
                                <span className="bg-secondary px-2 py-1 rounded">Busca: "{searchTerm}"</span>
                            )}
                            {filtroStatus !== "todos" && (
                                <span className="bg-secondary px-2 py-1 rounded">
                                    Status: {getStatusLabelAndClass(filtroStatus)?.label}
                                </span>
                            )}
                            {dueDateFrom && (
                                <span className="bg-secondary px-2 py-1 rounded">De: {new Date(dueDateFrom).toLocaleDateString()}</span>
                            )}
                            {dueDateTo && (
                                <span className="bg-secondary px-2 py-1 rounded">Até: {new Date(dueDateTo).toLocaleDateString()}</span>
                            )}
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setFiltroStatus("todos");
                                    setDueDateFrom("");
                                    setDueDateTo("");
                                }}
                                className="text-primary hover:underline ml-2"
                            >
                                Limpar Tudo
                            </button>
                        </div>
                    )}
                </div>

                {filteredClientes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-md">
                        {searchTerm ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome Fantasia</TableHead>
                                    <TableHead>Razão Social</TableHead>
                                    <TableHead>CNPJ</TableHead>
                                    <TableHead>Parceiro Vinculado</TableHead>
                                    <TableHead>Venc. e-CAC</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClientes.map((cliente) => {
                                    return (
                                        <TableRow key={cliente.id}>
                                            <TableCell className="font-medium">{cliente.tradeName}</TableCell>
                                            <TableCell>{cliente.legalName}</TableCell>
                                            <TableCell>{formatCNPJ(cliente.cnpj)}</TableCell>
                                            <TableCell>{cliente?.partner?.legalName || "Parceiro não encontrado"}</TableCell>
                                            <TableCell>{formatDate(cliente.ecacExpirationDate)}</TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const statusConfig = getStatusLabelAndClass(cliente.expirationStatus);
                                                    return (
                                                        <Badge className={statusConfig.className}>
                                                            {statusConfig.label}
                                                        </Badge>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/home/cadastro-clientes/${cliente.id}?view=readonly`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/home/cadastro-clientes/${cliente.id}`)}
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
                                                                    Tem certeza que deseja excluir o cliente
                                                                    "{cliente.tradeName}"? Esta ação não pode ser
                                                                    desfeita.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(cliente.id)}>
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
                )}


                <div className="mt-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            <PaginationItem>
                                <PaginationLink isActive>{page}</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setPage(p => p + 1)}
                                    className={!hasMore ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </CardContent>
        </Card>
    );
};

export default ListaClientes;
