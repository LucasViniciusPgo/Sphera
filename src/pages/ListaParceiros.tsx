import {useState, useEffect, useCallback} from "react";
import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {ArrowLeft, Search, Edit, Plus, Trash2, Eye} from "lucide-react";
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
import {
    getPartners,
    deletePartner,
    type PartnerDetails,
} from "@/services/partnersService.ts";
import {formatCNPJ, formatPhone} from "@/utils/format.ts";

import {
    EContactRole,
    EContactType,
    EPhoneType,
    type PartnerContact,
} from "@/services/partnersContactsService.ts";

export type Parceiro = {
    id: string;
    razaoSocial: string;
    cnpj?: string | null;
    endereco: string;
    emailFinanceiro: string;
    telefoneFinanceiro: string;
    emailResponsavel: string;
    telefoneResponsavel: string;
    telefoneFixo: string;
    celular: string;
    telefoneReserva: string;
    status: "ativo" | "inativo";
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
};

function buildEndereco(address?: PartnerDetails["address"]): string {
    if (!address) return "";
    const partes = [
        address.street,
        address.number != null ? address.number.toString() : "",
        address.neighborhood,
        address.city,
        address.state,
    ].filter(Boolean);
    return partes.join(", ");
}

function getPhonesAndEmailsFromContacts(contacts: PartnerContact[] | undefined) {
    let emailFinanceiro = "";
    let telefoneFinanceiro = "";
    let emailResponsavel = "";
    let telefoneResponsavel = "";
    let telefoneFixo = "";
    let celular = "";
    let telefoneReserva = "";

    if (!contacts || contacts.length === 0) {
        return {
            emailFinanceiro,
            telefoneFinanceiro,
            emailResponsavel,
            telefoneResponsavel,
            telefoneFixo,
            celular,
            telefoneReserva,
        };
    }

    for (const c of contacts) {
        // EMAIL FINANCEIRO (role 0)
        if (
            c.type === EContactType.Email &&
            c.role === EContactRole.Financial &&
            !emailFinanceiro
        ) {
            emailFinanceiro = c.value;
        }

        // EMAIL RESPONSÁVEL (role 1)
        if (
            c.type === EContactType.Email &&
            c.role === EContactRole.Personal &&
            !emailResponsavel
        ) {
            emailResponsavel = c.value;
        }

        // TELEFONE FINANCEIRO
        if (
            c.type === EContactType.Phone &&
            c.role === EContactRole.Financial &&
            !telefoneFinanceiro
        ) {
            telefoneFinanceiro = formatPhone(c.value);
        }

        // TELEFONE RESPONSÁVEL
        if (
            c.type === EContactType.Phone &&
            c.role === EContactRole.Personal &&
            !telefoneResponsavel
        ) {
            telefoneResponsavel = formatPhone(c.value);
        }

        // FIXO (geral + Landline)
        if (
            c.type === EContactType.Phone &&
            c.role === EContactRole.General &&
            c.phoneType === EPhoneType.Landline &&
            !telefoneFixo
        ) {
            telefoneFixo = formatPhone(c.value);
        }

        // CELULAR (geral + Mobile)
        if (
            c.type === EContactType.Phone &&
            c.role === EContactRole.General &&
            c.phoneType === EPhoneType.Mobile &&
            !celular
        ) {
            celular = formatPhone(c.value);
        }

        // RESERVA (geral + Reserve)
        if (
            c.type === EContactType.Phone &&
            c.role === EContactRole.General &&
            c.phoneType === EPhoneType.Backup &&
            !telefoneReserva
        ) {
            telefoneReserva = formatPhone(c.value);
        }
    }

    return {
        emailFinanceiro,
        telefoneFinanceiro,
        emailResponsavel,
        telefoneResponsavel,
        telefoneFixo,
        celular,
        telefoneReserva,
    };
}

function mapApiPartnerToParceiro(api: PartnerDetails): Parceiro {
    const {
        emailFinanceiro,
        telefoneFinanceiro,
        emailResponsavel,
        telefoneResponsavel,
        telefoneFixo,
        celular,
        telefoneReserva,
    } = getPhonesAndEmailsFromContacts(api.contacts);

    return {
        id: api.id,
        razaoSocial: api.legalName,
        cnpj: api.cnpj ?? null,
        endereco: buildEndereco(api.address),
        emailFinanceiro,
        telefoneFinanceiro,
        emailResponsavel,
        telefoneResponsavel,
        telefoneFixo,
        celular,
        telefoneReserva,
        status: api.status ? "ativo" : "inativo",
        createdBy: "",
        createdAt: "",
        updatedBy: "",
        updatedAt: "",
    };
}

export default function ListaParceiros() {
    const navigate = useNavigate();
    const {toast} = useToast();
    const [parceiros, setParceiros] = useState<Parceiro[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);


    const loadParceiros = useCallback(async () => {
        setIsLoading(true);
        try {
            const {items} = await getPartners();
            const mapped = items.map(mapApiPartnerToParceiro);
            setParceiros(mapped);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao carregar parceiros",
                description:
                    error?.data?.message ||
                    error?.message ||
                    "Não foi possível carregar a lista de parceiros.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadParceiros();
    }, []);


    const handleDelete = async (parceiroId: string) => {
        try {
            // Se quiser manter a regra de clientes vinculados, deixa este bloco.
            // Se não quiser mais, pode remover tudo isso e ir direto pro delete.
            // const {items: clientesVinculados} = await getClientsByPartner(parceiroId);
            // if (clientesVinculados.length > 0) {
            //     toast({
            //         title: "Não é possível excluir",
            //         description: `Este parceiro possui ${clientesVinculados.length} cliente(s) vinculado(s). Remova os vínculos antes de excluir.`,
            //         variant: "destructive",
            //     });
            //     return;
            // }

            await deletePartner(parceiroId);
            setParceiros((prev) => prev.filter((p) => p.id !== parceiroId));

            toast({
                title: "Parceiro excluído",
                description: "O parceiro foi excluído com sucesso.",
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao excluir",
                description:
                    error?.data?.message ||
                    error?.message ||
                    "Não foi possível excluir o parceiro.",
                variant: "destructive",
            });
        }
    };

    const filteredParceiros = parceiros.filter((parceiro) => {
        const term = searchTerm.toLowerCase();
        const razao = parceiro.razaoSocial.toLowerCase();
        const cnpj = (parceiro.cnpj ?? "").toLowerCase();

        return razao.includes(term) || cnpj.includes(term);
    });

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/home")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Voltar
                </Button>

                <Button onClick={() => navigate("/home/cadastro-parceiros")}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Novo Parceiro
                </Button>
            </div>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-3xl">Parceiros</CardTitle>
                    <CardDescription>
                        Gerencie seus parceiros cadastrados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    placeholder="Buscar por nome, razão social ou CNPJ..."
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

                    {filteredParceiros.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {searchTerm ? "Nenhum parceiro encontrado." : "Nenhum parceiro cadastrado ainda."}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Razão Social</TableHead>
                                        <TableHead>CNPJ</TableHead>
                                        <TableHead>Celular</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredParceiros.map((parceiro) => (
                                        <TableRow key={parceiro.id}>
                                            <TableCell className="font-medium">{parceiro.razaoSocial}</TableCell>
                                            <TableCell>{formatCNPJ(parceiro.cnpj)}</TableCell>
                                            <TableCell>{parceiro.celular}</TableCell>
                                            <TableCell>
                                                <Badge variant={parceiro.status === "ativo" ? "default" : "secondary"}>
                                                    {parceiro.status === "ativo" ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/home/cadastro-parceiros/${parceiro.id}?view=readonly`)}
                                                    >
                                                        <Eye className="h-4 w-4"/>
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/home/cadastro-parceiros/${parceiro.id}`)}
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
                                                                    Tem certeza que deseja excluir o parceiro
                                                                    "{parceiro.razaoSocial}"? Esta ação não pode ser
                                                                    desfeita.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(parceiro.id)}>
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
