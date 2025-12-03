import {Users, List, UserPlus, Briefcase, ArchiveX, Archive, TrendingUp, CalendarDays} from "lucide-react";
import {NavLink} from "react-router-dom";
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

const parceirosItems = [
    {title: "Cadastrar Parceiros", url: "/home/cadastro-parceiros", icon: Users},
    {title: "Listar Parceiros", url: "/home/parceiros", icon: List},
];

const clientesItems = [
    {title: "Cadastrar Clientes", url: "/home/cadastro-clientes", icon: UserPlus},
    {title: "Listar Clientes", url: "/home/clientes", icon: List},
];

const serviceItems = [
    {title: "Cadastrar Serviços", url: "/home/cadastro-servicos", icon: Briefcase},
    {title: "Listar Serviços", url: "/home/servicos", icon: Briefcase},
];

const cadastroArquivosItems = [
    {title: "Cadastrar Arquivos", url: "/home/cadastro-arquivos", icon: Archive},
    {title: "Listar Arquivos", url: "/home/arquivos", icon: ArchiveX},
];

const dashboardItem = [
    {title: "Dashboard", url: "/home", icon: TrendingUp},
];

const agendaItems = [
    {title: "Agenda", url: "/home/agenda", icon: CalendarDays},
];

const usuarioAdminItemsBase = [
    { title: "Cadastro de Usuário", url: "/home/novo-usuario", icon: UserPlus },
    { title: "Lista de Usuários", url: "/home/usuarios", icon: Users },
];

export function AppSidebar() {
    const {state} = useSidebar();
    const collapsed = state === "collapsed";

    const { hasAnyRole } = useAuthRole();

    const canSeeUsuarios = hasAnyRole(["Administrador"]);

    // Classes base para NavLink + variação ativa/inativa
    const getNavCls = ({isActive}: { isActive: boolean }) => {
        const base = [
            // layout
            "relative w-full flex items-center gap-3 px-4 py-2",
            // shape & typography (slightly bigger font)
            "rounded-md text-[18px] font-medium",
            // transitions & group for icon scaling
            "transition-colors duration-150 ease-out group"
        ].join(" ");

        const hoverFill = "hover:bg-primary/30"; // fill background on hover
        const inactiveText = "text-white/80 hover:text-white";
        const activeStyles = [
            "bg-primary/50 text-white shadow-inner",
            "after:absolute after:left-0 after:top-0 after:h-full after:w-1 after:bg-white/80",
            "rounded-l-none"
        ].join(" ");

        return [base, hoverFill, isActive ? activeStyles : inactiveText].join(" ");
    };

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
                        {dashboardItem.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                    <NavLink to={item.url} end className={getNavCls}>
                                        <item.icon
                                            className="h-5 w-5 text-white/80 group-hover:text-white transition-transform group-hover:scale-110"/>
                                        {!collapsed && <span>{item.title}</span>}
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            <SidebarContent className="pt-2">
                {canSeeUsuarios && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/80 px-3">Usuários</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {usuarioAdminItemsBase.map((item) => (
                                    <SidebarMenuItem key={item.url}>
                                        <SidebarMenuButton asChild>
                                            <NavLink to={item.url} /* ... */>
                                                <item.icon className="h-5 w-5 text-white/80 group-hover:text-white transition-transform group-hover:scale-110"/>
                                                {!collapsed && <span>{item.title}</span>}
                                            </NavLink>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
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
                            {parceirosItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink to={item.url} end className={getNavCls}>
                                            <item.icon
                                                className="h-5 w-5 text-white/80 group-hover:text-white transition-transform group-hover:scale-110"/>
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
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
                            {clientesItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink to={item.url} end className={getNavCls}>
                                            <item.icon
                                                className="h-5 w-5 text-white/80 group-hover:text-white transition-transform group-hover:scale-110"/>
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
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
                            {serviceItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink to={item.url} end className={getNavCls}>
                                            <item.icon
                                                className="h-5 w-5 text-white/80 group-hover:text-white transition-transform group-hover:scale-110"/>
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
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
                            {cadastroArquivosItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink to={item.url} end className={getNavCls}>
                                            <item.icon
                                                className="h-5 w-5 text-white/80 group-hover:text-white transition-transform group-hover:scale-110"/>
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/80 px-3">
                        Agenda
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {agendaItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink to={item.url} end className={getNavCls}>
                                            <item.icon className="h-5 w-5 text-white/80 group-hover:text-white transition-transform group-hover:scale-110" />
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

            </SidebarContent>
        </Sidebar>
    );
}