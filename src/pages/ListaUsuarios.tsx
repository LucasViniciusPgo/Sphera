import {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";

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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {useToast} from "@/hooks/use-toast";

import type {Usuario} from "@/interfaces/Usuario";
import {getUsers, deleteUser, getUserById} from "@/services/usersServices";
import {getRoles} from "@/services/rolesService";
import {removeContactFromUser} from "@/services/usersContactsService.ts";

interface Role {
    id: number;
    name: string;
}

export default function ListaUsuarios() {
    const navigate = useNavigate();
    const {toast} = useToast();

    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const roleNameById = useMemo(() => {
        const map = new Map<number, string>();
        roles.forEach((r) => map.set(r.id, r.name));
        return map;
    }, [roles]);

    const loadUsuarios = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getUsers({page: 1, pageSize: 100});
            setUsuarios(data);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao carregar usuários",
                description:
                    error?.response?.data?.message ||
                    "Não foi possível carregar a lista de usuários. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const loadRoles = useCallback(async () => {
        try {
            const data = await getRoles(1, 50);
            setRoles(data);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        loadUsuarios();
        loadRoles();
    }, [loadUsuarios, loadRoles]);

    const handleDelete = async (id: string) => {
        try {
            const response = await getUserById(id);
            const userToDelete = response.data;
            const contacts = userToDelete.contacts || [];
            if (contacts.length > 0) {
                await Promise.all(contacts.map((c) => removeContactFromUser(id, c.id)));
            }

            await deleteUser(id);
            toast({
                title: "Usuário excluído com sucesso!",
            });
            await loadUsuarios();
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao excluir usuário",
                description:
                    error?.response?.data?.message ||
                    "Não foi possível excluir o usuário. Tente novamente.",
                variant: "destructive",
            });
        }
    };

    const filteredUsuarios = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return usuarios;

        return usuarios.filter((u) => {
            const roleName = roleNameById.get(u.roleId) ?? "";
            return (
                u.name?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term) ||
                roleName.toLowerCase().includes(term)
            );
        });
    }, [usuarios, searchTerm, roleNameById]);

    return (
        <div className="max-w-6xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Usuários</CardTitle>
                            <CardDescription>
                                Gerencie os usuários do sistema. Você pode visualizar, editar e excluir.
                            </CardDescription>
                        </div>
                        <Button onClick={() => navigate("/home/novo-usuario")}>
                            <UserPlus className="mr-2 h-4 w-4"/>
                            Novo Usuário
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="mb-6 space-y-4">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Buscar por nome, e-mail ou perfil..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>E-mail</TableHead>
                                    <TableHead>Perfil</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6">
                                            Carregando usuários...
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading && filteredUsuarios.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6">
                                            Nenhum usuário encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading &&
                                    filteredUsuarios.map((usuario) => (
                                        <TableRow key={usuario.id}>
                                            <TableCell className="font-medium">{usuario.name}</TableCell>
                                            <TableCell>{usuario.email}</TableCell>
                                            <TableCell>{roleNameById.get(usuario.roleId) ?? `Perfil #${usuario.roleId}`}</TableCell>
                                            <TableCell>
                                                <Badge variant={usuario.active ? "default" : "secondary"}>
                                                    {usuario.active ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    {/* Visualizar (readonly) */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            navigate(`/home/novo-usuario/${usuario.id}?view=readonly`, {
                                                                state: {usuario},
                                                            })
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4"/>
                                                    </Button>

                                                    {/* Editar */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            navigate(`/home/novo-usuario/${usuario.id}`, {
                                                                state: {usuario},
                                                            })
                                                        }
                                                    >
                                                        <Edit className="h-4 w-4"/>
                                                    </Button>

                                                    {/* Excluir */}
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
                                                                    Tem certeza que deseja excluir o usuário
                                                                    "{usuario.name}"?
                                                                    Esta ação não pode ser desfeita.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(usuario.id)}>
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
                </CardContent>
            </Card>
        </div>
    );
}
