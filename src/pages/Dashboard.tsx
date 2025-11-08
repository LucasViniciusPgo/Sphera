import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    parceiros: 0,
    clientes: 0,
    servicos: 0,
    arquivos: 0,
  });

  useEffect(() => {
    const parceiros = JSON.parse(localStorage.getItem("parceiros") || "[]");
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]");
    const servicos = JSON.parse(localStorage.getItem("servicos") || "[]");
    const arquivos = JSON.parse(localStorage.getItem("arquivos") || "[]");
    setStats({
      parceiros: parceiros.length,
      clientes: clientes.length,
      servicos: servicos.length,
      arquivos: arquivos.length,
    });
  }, []);

  const reloadStats = () => {
    const parceiros = JSON.parse(localStorage.getItem("parceiros") || "[]");
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]");
    const servicos = JSON.parse(localStorage.getItem("servicos") || "[]");
    const arquivos = JSON.parse(localStorage.getItem("arquivos") || "[]");
    setStats({
      parceiros: parceiros.length,
      clientes: clientes.length,
      servicos: servicos.length,
      arquivos: arquivos.length,
    });
  };

  const handleClearData = () => {
    // Remove apenas as chaves usadas pelo sistema (em vez de clear total se preferir)
    localStorage.removeItem("parceiros");
    localStorage.removeItem("clientes");
    localStorage.removeItem("servicos");
    localStorage.removeItem("arquivos");
    reloadStats();
    toast({
      title: "Dados limpos",
      description: "Todos os registros locais foram removidos.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Visão geral do sistema</p>
      </div>

      {/* Botão para limpar dados com confirmação */}
      <div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Limpar dados locais
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá remover parceiros, clientes, serviços e arquivos armazenados no seu navegador. Não é possível desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearData}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Parceiros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.parceiros}</div>
            <p className="text-xs text-muted-foreground">
              Parceiros cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientes}</div>
            <p className="text-xs text-muted-foreground">
              Clientes cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Arquivos Importados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.arquivos}</div>
            <p className="text-xs text-muted-foreground">
              Arquivos cadastrados no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.servicos}</div>
          <p className="text-xs text-muted-foreground">
            Serviços cadastrados no sistema
          </p>
        </CardContent>
      </Card>

     

    </div>
  );
};

export default Dashboard;
