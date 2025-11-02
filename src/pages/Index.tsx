import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Lock, Mail, Users, List } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email, password });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-card/80 backdrop-blur-sm border-border shadow-2xl">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Bem-vindo</h1>
            <p className="text-muted-foreground">Entre com suas credenciais</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <a
                href="#"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Esqueceu a senha?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold py-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Entrar
            </Button>
          </form>

          {/* Navigation */}
          <div className="pt-4 border-t border-border space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/cadastro-parceiros")}
            >
              <Users className="mr-2 h-4 w-4" />
              Cadastrar Parceiros
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/parceiros")}
            >
              <List className="mr-2 h-4 w-4" />
              Listar Parceiros
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <a href="#" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Cadastre-se
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Index;
