import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getPartners, type PartnerDetails } from "@/services/partnersService";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";

export default function PastasArquivos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [partners, setPartners] = useState<PartnerDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useRef(false);
  const pageSize = 12;

  // Debounce search
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const timer = setTimeout(() => {
      if (page === 1) {
        loadPartners(1, searchTerm);
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadPartners = useCallback(async (pageParam: number, searchParam: string) => {
    setIsLoading(true);
    try {
      const { items } = await getPartners({
        page: pageParam,
        pageSize,
        search: searchParam || undefined
      });

      if (pageParam > 1 && items.length === 0) {
        toast({
          title: "Fim da lista",
          description: "Não existem mais pastas para exibir.",
        });
        setHasMore(false);
        setPage(prev => prev - 1);
        setIsLoading(false);
        return;
      }

      setPartners(items);
      setHasMore(items.length >= pageSize);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao carregar pastas",
        description: "Não foi possível carregar a lista de parceiros.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPartners(page, searchTerm);
  }, [page, loadPartners]);

  const handleFolderClick = (partner: PartnerDetails) => {
    const totalClients = partner.clientsCount || 0;
    navigate(`/home/arquivos/${partner.id}`, { state: { partnerId: partner.id, totalClients } });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Arquivos</h1>
        <p className="text-muted-foreground">Arquivos organizados por parceiro</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Busca</CardTitle>
          <CardDescription>Localize parceiros pelo nome</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar parceiro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {searchTerm && (
              <div className="flex gap-2 text-sm text-muted-foreground items-center">
                <span>Filtro ativo:</span>
                <span className="bg-secondary px-2 py-1 rounded">Busca: "{searchTerm}"</span>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-primary hover:underline ml-2"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading && partners.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando pastas...
        </div>
      ) : partners.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum parceiro encontrado</h3>
              <p className="text-muted-foreground mt-2">
                Cadastre parceiros para organizar seus arquivos.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner) => {

            return (
              <Card
                key={partner.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleFolderClick(partner)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{partner.legalName}</CardTitle>
                  <Folder className="h-8 w-8 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {partner.clientsCount || 0} {(partner.clientsCount || 0) === 1 ? "cliente" : "clientes"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            <PaginationItem>
              <PaginationLink isActive>{page}</PaginationLink>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage(p => p + 1)}
                className={!hasMore ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
