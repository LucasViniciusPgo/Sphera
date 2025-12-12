import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PrimeiroAcesso from "./pages/PrimeiroAcesso";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CadastroParceiros from "./pages/CadastroParceiros";
import ListaParceiros from "./pages/ListaParceiros";
import CadastroClientes from "./pages/CadastroClientes";
import ListaClientes from "./pages/ListaClientes";
import CadastroServico from "./pages/CadastroServico";
import ListaServico from "./pages/ListaServico";
import CadastroArquivos from "./pages/documents/CadastroArquivo";
import NovoUsuario from "./pages/NovoUsuario";
import ListaArquivos from "./pages/documents/ListaArquivos";
import PastasArquivos from "./pages/documents/PastasArquivos";
import PastasClientes from "./pages/documents/PastasClientes";
import Agenda from "./pages/Agenda";
import { RequireRole } from "./components/RequireRole";
import ListaUsuarios from "./pages/ListaUsuarios";
import ListaPrecos from "./pages/ListaPrecos";
import CadastroPreco from "./pages/CadastroPreco";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/home" element={<Home />}>
                        <Route index element={<Dashboard />} />
                        <Route
                            path="novo-usuario"
                            element={
                                <RequireRole allowed={["Administrador"]}>
                                    <NovoUsuario />
                                </RequireRole>
                            }
                        />
                        <Route
                            path="novo-usuario/:id"
                            element={
                                <RequireRole allowed={["Administrador"]}>
                                    <NovoUsuario />
                                </RequireRole>
                            }
                        />
                        <Route
                            path="usuarios"
                            element={
                                <RequireRole allowed={["Administrador"]}>
                                    <ListaUsuarios />
                                </RequireRole>
                            }
                        />
                        <Route path="cadastro-parceiros" element={<CadastroParceiros />} />
                        <Route path="cadastro-parceiros/:id" element={<CadastroParceiros />} />
                        <Route path="parceiros" element={<ListaParceiros />} />
                        <Route path="cadastro-clientes" element={<CadastroClientes />} />
                        <Route path="cadastro-clientes/:id" element={<CadastroClientes />} />
                        <Route path="clientes" element={<ListaClientes />} />
                        <Route path="cadastro-servicos" element={<CadastroServico />} />
                        <Route path="cadastro-servicos/:id" element={<CadastroServico />} />
                        <Route path="servicos" element={<ListaServico />} />
                        <Route path="cadastro-arquivos" element={<CadastroArquivos />} />
                        <Route path="cadastro-arquivos/:id" element={<CadastroArquivos />} />
                        <Route path="arquivos" element={<PastasArquivos />} />
                        <Route path="arquivos/:partnerId" element={<PastasClientes />} />
                        <Route path="arquivos/:partnerId/:clientId" element={<ListaArquivos />} />
                        <Route path="agenda" element={<Agenda />} />
                        <Route path="precos" element={<ListaPrecos />} />
                        <Route path="cadastro-precos" element={<CadastroPreco />} />
                        <Route path="cadastro-precos/:id" element={<CadastroPreco />} />
                    </Route>
                    {/* Redirects for backwards compatibility */}
                    <Route path="/agenda" element={<Agenda />} />
                    <Route path="/cadastro-parceiros" element={<CadastroParceiros />} />
                    <Route path="/cadastro-parceiros/:id" element={<CadastroParceiros />} />
                    <Route path="/parceiros" element={<ListaParceiros />} />
                    <Route path="/cadastro-clientes" element={<CadastroClientes />} />
                    <Route path="/cadastro-clientes/:id" element={<CadastroClientes />} />
                    <Route path="/clientes" element={<ListaClientes />} />
                    <Route path="/cadastro-servicos" element={<CadastroServico />} />
                    <Route path="/cadastro-servicos/:id" element={<CadastroServico />} />
                    <Route path="/servicos" element={<ListaServico />} />
                    <Route path="/cadastro-arquivos" element={<CadastroArquivos />} />
                    <Route
                        path="/novo-usuario"
                        element={
                            <RequireRole allowed={["Administrador"]}>
                                <NovoUsuario />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/novo-usuario/:id"
                        element={
                            <RequireRole allowed={["Administrador"]}>
                                <NovoUsuario />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/usuarios"
                        element={
                            <RequireRole allowed={["Administrador"]}>
                                <ListaUsuarios />
                            </RequireRole>
                        }
                    />
                    <Route path="/cadastro-arquivos/:id" element={<CadastroArquivos />} />
                    <Route path="/arquivos" element={<ListaArquivos />} />
                    <Route path="/precos" element={<ListaPrecos />} />
                    <Route path="/cadastro-precos" element={<CadastroPreco />} />
                    <Route path="/cadastro-precos/:id" element={<CadastroPreco />} />
                    <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
                    <Route path="/login" element={<Login />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
