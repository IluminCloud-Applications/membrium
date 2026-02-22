import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { LoginPage } from "@/pages/login";
import { SetupPage } from "@/pages/setup";
import { AdminRoutes } from "./routes/AdminRoutes";
import { MemberRoutes } from "./routes/MemberRoutes";
import { authService } from "@/services/authService";

type AppState = "loading" | "setup" | "ready";

export default function App() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [platformName, setPlatformName] = useState("Área de Membros");

  useEffect(() => {
    checkInstallation();
  }, []);

  useEffect(() => {
    document.title = platformName;
  }, [platformName]);

  async function checkInstallation() {
    try {
      const response = await authService.checkInstall();
      if (response.installed) {
        setPlatformName(response.platform_name || "Área de Membros");
        setAppState("ready");
      } else {
        setAppState("setup");
      }
    } catch {
      setAppState("setup");
    }
  }

  function handleSetupComplete() {
    setAppState("loading");
    checkInstallation();
  }

  if (appState === "loading") {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {appState === "setup" ? (
          <>
            <Route
              path="/install"
              element={<SetupPage onSetupComplete={handleSetupComplete} />}
            />
            <Route path="*" element={<Navigate to="/install" replace />} />
          </>
        ) : (
          <>
            <Route
              path="/login"
              element={<LoginPage platformName={platformName} />}
            />

            {/* Admin routes with sidebar layout */}
            <Route
              path="/admin/*"
              element={<AdminRoutes platformName={platformName} />}
            />

            {/* Student member area */}
            <Route
              path="/member/*"
              element={<MemberRoutes />}
            />

            <Route path="/install" element={<Navigate to="/login" replace />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <img src="/favicon.webp" alt="" className="w-12 h-12 animate-pulse" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
