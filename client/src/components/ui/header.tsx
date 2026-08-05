import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSiteConfig } from "@/hooks/use-site-config";
import { Avatar } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import AdminMenu from "./admin-menu";
import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const SOUND_ALERT_STORAGE_KEY = "professional_sound_alert_enabled";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundAlertEnabled, setSoundAlertEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = window.localStorage.getItem(SOUND_ALERT_STORAGE_KEY);
    return saved === null ? true : saved === "true";
  });
  const previousUnseenCountRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioUnlockedRef = useRef(false);
  const hasUserInteractedRef = useRef(false);
  const { user, logoutMutation } = useAuth();
  const { data: siteConfig } = useSiteConfig();
  const [location] = useLocation();
  const currentUserId = user?.id ?? null;

  const { data: unseenData } = useQuery<{ count: number; isProfessional?: boolean }>({
    queryKey: ["/api/professional/unseen-count", currentUserId],
    enabled: !!currentUserId,
    refetchInterval: 30000,
  });
  const unseenCount = unseenData?.count ?? 0;
  const isProfessional = unseenData?.isProfessional === true;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SOUND_ALERT_STORAGE_KEY, String(soundAlertEnabled));
  }, [soundAlertEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const getAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      return audioContextRef.current;
    };

    const unlockAudio = async () => {
      try {
        const ctx = getAudioContext();
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        audioUnlockedRef.current = ctx.state === "running";
      } catch {
        audioUnlockedRef.current = false;
      }
    };

    const onFirstInteraction = () => {
      hasUserInteractedRef.current = true;
      void unlockAudio();
    };

    window.addEventListener("pointerdown", onFirstInteraction, { passive: true });
    window.addEventListener("keydown", onFirstInteraction);
    window.addEventListener("touchstart", onFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
    };
  }, []);

  const playNotificationTone = async () => {
    if (typeof window === "undefined") return;
    if (!hasUserInteractedRef.current) return;
    if (!audioUnlockedRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;
      if (ctx.state !== "running") {
        await ctx.resume();
      }
      if (ctx.state !== "running") return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
      masterGain.connect(ctx.destination);

      const firstTone = ctx.createOscillator();
      firstTone.type = "triangle";
      firstTone.frequency.setValueAtTime(880, now);
      firstTone.connect(masterGain);
      firstTone.start(now);
      firstTone.stop(now + 0.16);

      const secondTone = ctx.createOscillator();
      secondTone.type = "triangle";
      secondTone.frequency.setValueAtTime(1175, now + 0.18);
      secondTone.connect(masterGain);
      secondTone.start(now + 0.18);
      secondTone.stop(now + 0.36);

      audioUnlockedRef.current = true;
    } catch {
      audioUnlockedRef.current = false;
    }
  };

  useEffect(() => {
    previousUnseenCountRef.current = null;
  }, [currentUserId]);

  useEffect(() => {
    if (!isProfessional) {
      previousUnseenCountRef.current = null;
      return;
    }

    const previousCount = previousUnseenCountRef.current;
    if (previousCount === null) {
      previousUnseenCountRef.current = unseenCount;
      return;
    }

    if (soundAlertEnabled && unseenCount > previousCount) {
      void playNotificationTone();
    }

    previousUnseenCountRef.current = unseenCount;
  }, [isProfessional, soundAlertEnabled, unseenCount]);

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
              className="h-12 w-12 min-w-[48px] object-contain"
            />
          ) : (
            <i className="fas fa-cut text-blue-500 text-2xl"></i>
          )}
          <span className="text-2xl font-bold text-gray-800">
            {siteConfig?.siteName || "Salão de Beleza"}
          </span>
        </Link>
        
        {/* Mobile/Tablet menu button */}
        <div className="lg:hidden">
          <button 
            className="text-gray-800 focus:outline-none" 
            aria-label="Menu"
            onClick={toggleMobileMenu}
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
        
        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          <a href="#services" className="text-gray-700 hover:text-blue-500 transition-colors duration-200">Serviços</a>
          <a href="#prices" className="text-gray-700 hover:text-blue-500 transition-colors duration-200">Preços</a>
          <a href="#appointments" className="text-gray-700 hover:text-blue-500 transition-colors duration-200">Agendamentos</a>
          <a href="#reviews" className="text-gray-700 hover:text-blue-500 transition-colors duration-200">Avaliações</a>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className={`group relative flex items-center space-x-3 bg-gray-100 px-3 py-2 rounded-full transition-colors duration-200 hover:bg-gray-200 cursor-pointer ${location === "/profile" ? "ring-2 ring-blue-200" : ""}`}
              >
                <Avatar 
                  userId={user.id} 
                  userName={user.name || user.username}
                  imageUrl={user.profileImageBase64 ? (user.profileImageBase64.startsWith('http') ? user.profileImageBase64 : `/api/images/user/${user.id}`) : undefined}
                  size="sm"
                />
                <div className="text-sm">
                  <div className="font-medium text-gray-800 transition-colors group-hover:text-blue-600 group-focus-visible:text-blue-600">{user.name || user.username}</div>
                  {user.isAdmin && (
                    <div className="text-xs text-blue-600 font-medium">Administrador</div>
                  )}
                </div>
                {isProfessional && unseenCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-4 h-4 px-1 flex items-center justify-center rounded-full shadow">
                    {unseenCount > 9 ? "9+" : unseenCount}
                  </span>
                )}
              </Link>
              {isProfessional && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white">
                  <span className="text-xs text-gray-600 font-medium">Som alerta</span>
                  <Switch
                    checked={soundAlertEnabled}
                    onCheckedChange={setSoundAlertEnabled}
                    aria-label="Ativar alerta sonoro de novos agendamentos"
                  />
                </div>
              )}
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
      
      {/* Mobile/Tablet menu */}
      <div className={`bg-white lg:hidden ${mobileMenuOpen ? "" : "hidden"}`}>
        <div className="container mx-auto px-4 py-3 space-y-3">
          <a href="#services" className="block text-gray-700 py-2 hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Serviços</a>
          <a href="#prices" className="block text-gray-700 py-2 hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Preços</a>
          <a href="#appointments" className="block text-gray-700 py-2 hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Agendamentos</a>
          <a href="#reviews" className="block text-gray-700 py-2 hover:text-blue-500" onClick={() => setMobileMenuOpen(false)}>Avaliações</a>
          
          {user ? (
            <>
              <Link
                href="/profile"
                className="group relative flex items-center space-x-3 bg-gray-100 px-3 py-2 rounded-lg mb-3 hover:bg-gray-200 transition-colors cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Avatar 
                  userId={user.id} 
                  userName={user.name || user.username}
                  imageUrl={user.profileImageBase64 ? (user.profileImageBase64.startsWith('http') ? user.profileImageBase64 : `/api/images/user/${user.id}`) : undefined}
                  size="sm"
                />
                <div className="text-sm">
                  <div className="font-medium text-gray-800 transition-colors group-hover:text-blue-600 group-focus-visible:text-blue-600">{user.name || user.username}</div>
                  {user.isAdmin && (
                    <div className="text-xs text-blue-600 font-medium">Administrador</div>
                  )}
                </div>
                {isProfessional && unseenCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-5 h-5 px-1 flex items-center justify-center rounded-full">
                    {unseenCount > 9 ? "9+" : unseenCount}
                  </span>
                )}
              </Link>
              {user.isAdmin && (
                <div className="py-2">
                  <AdminMenu />
                </div>
              )}
              {isProfessional && (
                <div className="flex items-center justify-between px-1 py-2">
                  <span className="text-sm text-gray-700 font-medium">Som alerta</span>
                  <Switch
                    checked={soundAlertEnabled}
                    onCheckedChange={setSoundAlertEnabled}
                    aria-label="Ativar alerta sonoro de novos agendamentos"
                  />
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
