import {useState, useEffect, useCallback} from "react";
import {useNavigate} from "react-router-dom";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Search, Edit, UserPlus, Trash2, Eye} from "lucide-react";
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
import {getClients, deleteClient, getClientById, type ClientDetails} from "@/services/clientsService.ts";
import {removeContactFromClient, addContactToClient} from "@/services/clientsContactsService.ts";
import {formatCNPJ} from "@/utils/format.ts";
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
    const {toast} = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 10;

    const [clientes, setClientes] = useState<ClientDetails[]>([]);

    // Debounce search to avoid too many requests
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) {
                loadClientes(1, searchTerm);
            } else {
                setPage(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const loadClientes = useCallback(async (pageParam: number, searchParam: string) => {
        try {
            const {items, totalCount: total} = await getClients({
                includePartner: true,
                page: pageParam,
                pageSize,
                search: searchParam || undefined
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

            setHasMore(items.length >= pageSize);
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
        loadClientes(page, searchTerm);
    }, [page, loadClientes]);

    const handleDelete = async (clienteId: string) => {
        let contactsToRestore: any[] = [];
        try {
            const {data: clientDetails} = await getClientById(clienteId);
            contactsToRestore = clientDetails.contacts || [];

            if (contactsToRestore.length > 0) {
                await Promise.all(
                    contactsToRestore.map((c) => removeContactFromClient(clienteId, c.id))
                );
            }

            await deleteClient(clienteId);
            // Reload current page
            loadClientes(page, searchTerm);
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

    // Remove client-side filtering
    const filteredClientes = clientes;

    return (
        <Card className="max-w-6xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Lista de Clientes</CardTitle>
                        <CardDescription>Gerencie os clientes cadastrados</CardDescription>
                    </div>
                    <Button onClick={() => navigate("/home/cadastro-clientes")}>
                        <UserPlus className="mr-2 h-4 w-4"/>
                        Novo Cliente
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Buscar por nome ou razão social..."
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
                                            <TableCell>{cliente?.partner.legalName || "Parceiro não encontrado"}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/home/cadastro-clientes/${cliente.id}?view=readonly`)}
                                                    >
                                                        <Eye className="h-4 w-4"/>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/home/cadastro-clientes/${cliente.id}`)}
                                                    >
                                                        <Edit className="h-4 w-4"/>
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <Trash2 className="h-4 w-4"/>
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
