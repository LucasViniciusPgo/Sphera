import { Users, List, UserPlus, Briefcase, ArchiveX, Archive, TrendingUp, CalendarDays, LogOut } from "lucide-react";
import { NavLink, useMatch } from "react-router-dom";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    useSidebar,
} from "@/components/ui/sidebar";
import { useAuthRole } from "@/hooks/useAuthRole";
import { useLogout } from "@/hooks/useLogout";
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

const parceirosItems = [
    { title: "Cadastrar Parceiros", url: "/cadastro-parceiros", icon: Users },
    { title: "Listar Parceiros", url: "/parceiros", icon: List },
];

const clientesItems = [
    { title: "Cadastrar Clientes", url: "/cadastro-clientes", icon: UserPlus },
    { title: "Listar Clientes", url: "/clientes", icon: List },
];

const serviceItems = [
    { title: "Cadastrar Serviços", url: "/cadastro-servicos", icon: Briefcase },
    { title: "Listar Serviços", url: "/servicos", icon: Briefcase },
];

const cadastroArquivosItems = [
    { title: "Cadastrar Arquivos", url: "/cadastro-arquivos", icon: Archive },
    { title: "Listar Arquivos", url: "/arquivos", icon: ArchiveX },
];

const dashboardItem = [
    { title: "Dashboard", url: "/home", icon: TrendingUp },
];

const agendaItems = [
    { title: "Agenda Global", url: "/agenda", icon: CalendarDays },
    { title: "Agenda Particular", url: "/agenda-particular", icon: CalendarDays },
];

const usuarioAdminItemsBase = [
    { title: "Cadastrar Usuários", url: "/novo-usuario", icon: UserPlus },
    { title: "Listar Usuários", url: "/usuarios", icon: Users },
];

export function AppSidebar() {
    const { state } = useSidebar();
    const collapsed = state === "collapsed";

    const { hasAnyRole } = useAuthRole();
    const { logout } = useLogout();

    const canSeeUsuarios = hasAnyRole(["Administrador"]);

    function SideBarItem({ item, collapsed }: { item: any; collapsed: boolean }) {
        const match = useMatch({ path: item.url, end: true });
        const isActive = !!match;

        const classes = [
            "relative w-full flex items-center gap-3 px-4 py-2 rounded-md text-[18px] font-medium transition-colors duration-150 ease-out group/navItem hover:bg-primary/30 group",
            isActive
                ? "bg-primary/50 text-white shadow-inner after:absolute after:left-0 after:top-0 after:h-full after:w-1 after:bg-white/80 rounded-l-none"
                : "text-white/80 hover:text-white",
        ].join(" ");

        return (
            <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={classes}>
                        <item.icon className="h-5 w-5 text-white/80 group-hover/navItem:text-white transition-transform group-hover/navItem:scale-110" />
                        {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }


    return (
        <Sidebar
            className={
                (collapsed ? "w-14" : "w-64") +
                " bg-gradient-to-b from-background to-muted/30 border-r border-border/60"
            }
            collapsible="icon"
        >
            {/* Dashboard separado no topo */}
            <SidebarGroup>
                <SidebarGroupLabel
                    className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/80 px-3">
                    Dashboard
                </SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {dashboardItem.map((item) => <SideBarItem key={item.title} item={item} collapsed={collapsed} />)}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            <SidebarContent className="pt-2">
                {canSeeUsuarios && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/80 px-3">Usuários</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {usuarioAdminItemsBase.map((item) => <SideBarItem key={item.title} item={item} collapsed={collapsed} />)}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                <SidebarGroup>
                    <SidebarGroupLabel
                        className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/80 px-3">
                        Parceiros
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {parceirosItems.map((item) => <SideBarItem key={item.title} item={item} collapsed={collapsed} />)}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel
                        className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/80 px-3">
                        Clientes
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {clientesItems.map((item) => <SideBarItem key={item.title} item={item} collapsed={collapsed} />)}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel
                        className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/80 px-3">
                        Serviços
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {serviceItems.map((item) => <SideBarItem key={item.title} item={item} collapsed={collapsed} />)}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel
                        className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/80 px-3">
                        Arquivos
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {cadastroArquivosItems.map((item) => <SideBarItem key={item.title} item={item} collapsed={collapsed} />)}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/80 px-3">
                        Agenda
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {agendaItems.map((item) => <SideBarItem key={item.title} item={item} collapsed={collapsed} />)}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Logout Section */}
                <SidebarGroup className="mt-auto">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <SidebarMenuButton asChild>
                                            <button
                                                className="relative w-full flex items-center gap-3 px-4 py-2 rounded-md text-[18px] font-medium transition-colors duration-150 ease-out group/navItem hover:bg-destructive/30 text-white/80 hover:text-white"
                                            >
                                                <LogOut className="h-5 w-5 text-white/80 group-hover/navItem:text-white transition-transform group-hover/navItem:scale-110" />
                                                {!collapsed && <span>Sair</span>}
                                            </button>
                                        </SidebarMenuButton>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar saída</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Você realmente deseja sair do sistema?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={logout}>
                                                Sair
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

            </SidebarContent>
        </Sidebar>
    );
}