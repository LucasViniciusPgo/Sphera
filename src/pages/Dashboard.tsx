import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    parceiros: 0,
    clientes: 0,
    servicos: 0,
  });

  useEffect(() => {
    const parceiros = JSON.parse(localStorage.getItem("parceiros") || "[]");
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]");
    const servicos = JSON.parse(localStorage.getItem("servicos") || "[]");
    setStats({
      parceiros: parceiros.length,
      clientes: clientes.length,
      servicos: servicos.length,
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Visão geral do sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

      <Card>
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
