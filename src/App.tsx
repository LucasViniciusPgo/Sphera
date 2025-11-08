import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CadastroParceiros from "./pages/CadastroParceiros";
import ListaParceiros from "./pages/ListaParceiros";
import CadastroClientes from "./pages/CadastroClientes";
import ListaClientes from "./pages/ListaClientes";
import CadastroServico from "./pages/CadastroServico";
import ListaServico from "./pages/ListaServico";
import NotFound from "./pages/NotFound";
import CadastroArquivos from "./pages/CadastroArquivo";
import ListaArquivos from "./pages/ListaArquivos";
import PastasArquivos from "./pages/PastasArquivos";
import PastasClientes from "./pages/PastasClientes";

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
            <Route path="arquivos/:parceiroId" element={<PastasClientes />} />
            <Route path="arquivos/:parceiroId/:clienteId" element={<ListaArquivos />} />
          </Route>
          {/* Redirects for backwards compatibility */}
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
          <Route path="/cadastro-arquivos/:id" element={<CadastroArquivos />} />
          <Route path="/arquivos" element={<ListaArquivos />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
