import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Plus, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getClientServicePrices, type ClientServicePrice } from "@/services/clientServicePricesService";
import { getClients, type ClientDetails } from "@/services/clientsService";
import { getServices } from "@/services/servicesService";
import { Servico } from "@/interfaces/Servico";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ListaPrecos = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [precos, setPrecos] = useState<ClientServicePrice[]>([]);
    const [clientes, setClientes] = useState<ClientDetails[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [filterClientId, setFilterClientId] = useState<string>("all");
    const [filterServiceId, setFilterServiceId] = useState<string>("all");
    const [filterOnlyActive, setFilterOnlyActive] = useState<string>("all");

    const loadData = useCallback(async () => {
        try {
            const [precosRes, clientesRes, servicosRes] = await Promise.all([
                getClientServicePrices({
                    ClientId: filterClientId !== "all" ? filterClientId : undefined,
                    ServiceId: filterServiceId !== "all" ? filterServiceId : undefined,
                    OnlyActive: filterOnlyActive === "active" ? true : undefined,
                }),
                getClients({ includePartner: false }),
                getServices(),
            ]);

            setPrecos(precosRes.items);
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
                description:
                    error?.data?.message ||
                    error?.message ||
                    "Não foi possível carregar os dados.",
                variant: "destructive",
            });
        }
    }, [toast, filterClientId, filterServiceId, filterOnlyActive]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getClientName = (clientId: string) => {
        const client = clientes.find((c) => c.id === clientId);
        return client?.tradeName || "Cliente não encontrado";
    };

    const getServiceName = (serviceId: string) => {
        const service = servicos.find((s) => s.id === serviceId);
        return service?.name || "Serviço não encontrado";
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("pt-BR");
    };

    const filteredPrecos = precos.filter((preco) => {
        const term = searchTerm.toLowerCase();
        const clientName = getClientName(preco.clientId).toLowerCase();
        const serviceName = getServiceName(preco.serviceId).toLowerCase();
        return clientName.includes(term) || serviceName.includes(term);
    });

    return (
        <Card className="max-w-6xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Preços de Serviços por Cliente</CardTitle>
                        <CardDescription>Gerencie os preços de serviços cadastrados</CardDescription>
                    </div>
                    <Button onClick={() => navigate("/home/cadastro-precos")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Preço
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por cliente ou serviço..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterClientId} onValueChange={setFilterClientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos os clientes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os clientes</SelectItem>
                                {clientes.map((cliente) => (
                                    <SelectItem key={cliente.id} value={cliente.id}>
                                        {cliente.tradeName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterServiceId} onValueChange={setFilterServiceId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos os serviços" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os serviços</SelectItem>
                                {servicos.map((servico) => (
                                    <SelectItem key={servico.id} value={servico.id}>
                                        {servico.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterOnlyActive} onValueChange={setFilterOnlyActive}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Apenas Ativos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {(searchTerm || filterClientId !== "all" || filterServiceId !== "all" || filterOnlyActive !== "all") && (
                        <div className="flex gap-2 text-sm text-muted-foreground flex-wrap">
                            <span>Filtros ativos:</span>
                            {searchTerm && (
                                <span className="bg-secondary px-2 py-1 rounded">Busca: "{searchTerm}"</span>
                            )}
                            {filterClientId !== "all" && (
                                <span className="bg-secondary px-2 py-1 rounded">
                                    Cliente: {getClientName(filterClientId)}
                                </span>
                            )}
                            {filterServiceId !== "all" && (
                                <span className="bg-secondary px-2 py-1 rounded">
                                    Serviço: {getServiceName(filterServiceId)}
                                </span>
                            )}
                            {filterOnlyActive === "active" && (
                                <span className="bg-secondary px-2 py-1 rounded">Apenas Ativos</span>
                            )}
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterClientId("all");
                                    setFilterServiceId("all");
                                    setFilterOnlyActive("all");
                                }}
                                className="text-primary hover:underline ml-2"
                            >
                                Limpar todos
                            </button>
                        </div>
                    )}
                </div>

                {filteredPrecos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-md">
                        {searchTerm || filterClientId !== "all" || filterServiceId !== "all" || filterOnlyActive !== "all"
                            ? "Nenhum preço encontrado com os filtros aplicados."
                            : "Nenhum preço cadastrado ainda."}
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Serviço</TableHead>
                                    <TableHead>Preço Unitário</TableHead>
                                    <TableHead>Data Início</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPrecos.map((preco) => (
                                    <TableRow key={preco.id}>
                                        <TableCell className="font-medium">
                                            {getClientName(preco.clientId)}
                                        </TableCell>
                                        <TableCell>{getServiceName(preco.serviceId)}</TableCell>
                                        <TableCell>{formatCurrency(preco.unitPrice)}</TableCell>
                                        <TableCell>{formatDate(preco.startDate)}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${preco.isActive
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {preco.isActive ? "Ativo" : "Inativo"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        navigate(`/home/cadastro-precos/${preco.id}?view=readonly`)
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
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
    );
};

export default ListaPrecos;
