import { useState, useEffect, useCallback, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Plus, Eye, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getClientServicePrices, type ClientServicePrice } from "@/services/clientServicePricesService";
import { getClients, type ClientDetails } from "@/services/clientsService";
import { getServices } from "@/services/servicesService";
import { Servico } from "@/interfaces/Servico";
import { formatCNPJ } from "@/utils/format";
import { cn } from "@/lib/utils";

const ClientPricesRow = ({
    client,
    isExpanded,
    onToggle,
    servicos
}: {
    client: ClientDetails,
    isExpanded: boolean,
    onToggle: () => void,
    servicos: Servico[]
}) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [prices, setPrices] = useState<ClientServicePrice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        if (isExpanded && !hasLoaded) {
            loadPrices();
        }
    }, [isExpanded, hasLoaded]);

    const loadPrices = async () => {
        setIsLoading(true);
        try {
            const res = await getClientServicePrices({ ClientId: client.id });
            setPrices(res.items);
            setHasLoaded(true);
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro ao buscar preços",
                description: "Não foi possível carregar os preços deste cliente.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getServiceName = (serviceId: string) => {
        return servicos.find(s => s.id === serviceId)?.name || "Serviço não encontrado";
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("pt-BR");
    };

    return (
        <Fragment>
            <TableRow
                className={cn("cursor-pointer hover:bg-muted/50", isExpanded && "bg-muted/50 border-b-0")}
                onClick={onToggle}
            >
                <TableCell>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </TableCell>
                <TableCell className="font-medium">{client.legalName}</TableCell>
                <TableCell>{formatCNPJ(client.cnpj)}</TableCell>
                <TableCell className="text-right">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                    >
                        {isExpanded ? "Ocultar Preços" : "Ver Preços"}
                    </Button>
                </TableCell>
            </TableRow>
            {isExpanded && (
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={6} className="p-4 pt-0">
                        <Card className="shadow-none border-t border-x-0 border-b-0 rounded-none bg-background">
                            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-base">Tabela de Preços - {client.tradeName}</CardTitle>
                                <Button
                                    size="sm"
                                    onClick={() => navigate(`/home/cadastro-precos?clientId=${client.id}`)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Novo Preço
                                </Button>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Carregando preços...
                                    </div>
                                ) : prices.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-md bg-muted/20">
                                        Nenhum preço cadastrado para este cliente.
                                    </div>
                                ) : (
                                    <div className="rounded-md border bg-background">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Serviço</TableHead>
                                                    <TableHead>Preço Unitário</TableHead>
                                                    <TableHead>Data Início</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {prices.map((preco) => (
                                                    <TableRow key={preco.id}>
                                                        <TableCell className="font-medium">{getServiceName(preco.serviceId)}</TableCell>
                                                        <TableCell>{formatCurrency(preco.unitPrice)}</TableCell>
                                                        <TableCell>{formatDate(preco.startDate)}</TableCell>
                                                        <TableCell>
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                                                preco.isActive
                                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                                            )}>
                                                                {preco.isActive ? "Ativo" : "Inativo"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-1 justify-end">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => navigate(`/home/cadastro-precos/${preco.id}?view=readonly`)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => navigate(`/home/cadastro-precos/${preco.id}`)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
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
                    </TableCell>
                </TableRow>
            )}
        </Fragment>
    );
};

const ListaPrecos = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [clientes, setClientes] = useState<ClientDetails[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [clientesRes, servicosRes] = await Promise.all([
                getClients({ includePartner: false }),
                getServices(),
            ]);

            setClientes(clientesRes.items);

            const servicosItems = Array.isArray(servicosRes)
                ? servicosRes
                : Array.isArray((servicosRes as any)?.items)
                    ? (servicosRes as any).items
                    : [];
            setServicos(servicosItems);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao carregar dados",
                description: "Não foi possível carregar a lista de empresas.",
                variant: "destructive",
            });
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredClientes = clientes.filter((cliente) => {
        const term = searchTerm.toLowerCase();
        return (
            cliente.tradeName.toLowerCase().includes(term) ||
            cliente.legalName.toLowerCase().includes(term) ||
            (cliente.cnpj ?? "").includes(term)
        );
    });

    const toggleExpand = (clientId: string) => {
        setExpandedClientId(prev => prev === clientId ? null : clientId);
    };

    return (
        <Card className="max-w-6xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Preços de Serviços por Empresa</CardTitle>
                        <CardDescription>Gerencie os preços cadastrados organizados por empresa.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar empresa por nome, razão social ou CNPJ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {filteredClientes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-md">
                        {searchTerm ? "Nenhuma empresa encontrada." : "Nenhuma empresa cadastrada."}
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Razão Social</TableHead>
                                    <TableHead>CNPJ</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClientes.map((cliente) => (
                                    <ClientPricesRow
                                        key={cliente.id}
                                        client={cliente}
                                        isExpanded={expandedClientId === cliente.id}
                                        onToggle={() => toggleExpand(cliente.id)}
                                        servicos={servicos}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ListaPrecos;
