import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSiteConfig } from "@/hooks/use-site-config";
import { Avatar } from "@/components/ui/avatar";
import AdminMenu from "./admin-menu";
import { AlertTriangle } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { data: siteConfig } = useSiteConfig();
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          {siteConfig?.logoUrl ? (
            <img 
              src={siteConfig.logoUrl} 
              alt={siteConfig.siteName} 
              className="h-8 w-8 object-contain"
            />
          ) : (
            <i className="fas fa-cut text-blue-500 text-xl"></i>
          )}
          <span className="text-2xl font-bold text-gray-800">
            {siteConfig?.siteName || "Salão de Beleza"}
          </span>
        </Link>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button 
            className="text-gray-800 focus:outline-none" 
            aria-label="Menu"
            onClick={toggleMobileMenu}
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#services" className="text-gray-700 hover:text-blue-500 transition-colors duration-200">Serviços</a>
          <a href="#prices" className="text-gray-700 hover:text-blue-500 transition-colors duration-200">Preços</a>
          <a href="#appointments" className="text-gray-700 hover:text-blue-500 transition-colors duration-200">Agendamentos</a>
          <a href="#reviews" className="text-gray-700 hover:text-blue-500 transition-colors duration-200">Avaliações</a>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-100 px-3 py-2 rounded-full">
                <Avatar 
                  userId={user.id} 
                  userName={user.name || user.username}
                  imageUrl={user.profileImageBase64 ? `/api/images/user/${user.id}` : undefined}
                  size="sm"
                />
                <div className="text-sm">
                  <div className="font-medium text-gray-800">{user.name || user.username}</div>
                  {user.isAdmin && (
                    <div className="text-xs text-blue-600 font-medium">Administrador</div>
                  )}
                </div>
              </div>
              <Link 
                href="/profile" 
                className={`text-gray-700 hover:text-blue-500 transition-colors duration-200 ${location === "/profile" ? "text-blue-500 font-medium" : ""}`}
              >
                Meu Perfil
              </Link>
              {user.isAdmin && <AdminMenu />}
              <button 
                onClick={() => logoutMutation.mutate()}
                className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors duration-200"
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Saindo..." : "Sair"}
              </button>
            </div>
          ) : (
            <Link 
              href="/auth" 
              className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors duration-200"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
      
      {/* Mobile menu */}
      <div className={`bg-white md:hidden ${mobileMenuOpen ? "" : "hidden"}`}>
        <div className="container mx-auto px-4 py-3 space-y-3">
          <a href="#services" className="block text-gray-700 py-2 hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Serviços</a>
          <a href="#prices" className="block text-gray-700 py-2 hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Preços</a>
          <a href="#appointments" className="block text-gray-700 py-2 hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Agendamentos</a>
          <a href="#reviews" className="block text-gray-700 py-2 hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Avaliações</a>
          
          {user ? (
            <>
              <div className="flex items-center space-x-3 bg-gray-100 px-3 py-2 rounded-lg mb-3">
                <Avatar 
                  userId={user.id} 
                  userName={user.name || user.username}
                  imageUrl={user.profileImageBase64 ? `/api/images/user/${user.id}` : undefined}
                  size="sm"
                />
                <div className="text-sm">
                  <div className="font-medium text-gray-800">{user.name || user.username}</div>
                  {user.isAdmin && (
                    <div className="text-xs text-blue-600 font-medium">Administrador</div>
                  )}
                </div>
              </div>
              <Link 
                href="/profile" 
                className="block text-gray-700 py-2 hover:text-blue-500" 
                onClick={() => setMobileMenuOpen(false)}
              >
                Meu Perfil
              </Link>
              {user.isAdmin && (
                <div className="py-2">
                  <AdminMenu />
                </div>
              )}
              <button 
                onClick={() => {
                  logoutMutation.mutate();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 py-2 hover:text-blue-500"
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Saindo..." : "Sair"}
              </button>
            </>
          ) : (
            <Link 
              href="/auth" 
              className="block text-gray-700 py-2 hover:text-blue-500"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>

    {/* Banner de aviso: WhatsApp não cadastrado */}
    {user && !user.isAdmin && !user.phone && (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-800 text-sm">
            <AlertTriangle size={16} className="shrink-0 text-amber-500" />
            <span>
              <strong>WhatsApp não cadastrado.</strong> Adicione seu número para que possamos confirmar seus agendamentos.
            </span>
          </div>
          <Link
            href="/profile"
            className="shrink-0 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-full transition-colors"
          >
            Adicionar agora
          </Link>
        </div>
      </div>
    )}
  </>
  );
}
