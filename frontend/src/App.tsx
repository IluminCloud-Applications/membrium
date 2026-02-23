import { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { LoginPage } from "@/pages/login";
import { SetupPage } from "@/pages/setup";
import { MaintenancePage } from "@/pages/maintenance";
import { QuickAccessPage } from "@/pages/quick-access";
import { AdminRoutes } from "./routes/AdminRoutes";
import { MemberRoutes } from "./routes/MemberRoutes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthRedirect } from "@/components/auth/AuthRedirect";
import { YouTubeCallbackPage } from "@/pages/settings/YouTubeCallbackPage";
import { authService } from "@/services/authService";

type AppState = "loading" | "setup" | "maintenance" | "ready";

export default function App() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [platformName, setPlatformName] = useState("Área de Membros");

  const checkInstallation = useCallback(async () => {
    try {
      const response = await authService.checkInstall();
      if (response.installed) {
        setPlatformName(response.platform_name || "Área de Membros");
        setAppState("ready");
      } else {
        // Server explicitly responded with installed=false — safe to show setup
        setAppState("setup");
      }
    } catch {
      // Any error (network error, proxy 502, server 500, etc.)
      // means we can't confirm install status → show maintenance.
      // Setup is ONLY shown when the server explicitly says installed=false.
      setAppState("maintenance");
    }
  }, []);

  useEffect(() => {
    checkInstallation();
  }, [checkInstallation]);

  useEffect(() => {
    document.title = platformName;
  }, [platformName]);

  /** Called by MaintenancePage — returns true if backend is back online */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authService.checkInstall();
      if (response.installed) {
        setPlatformName(response.platform_name || "Área de Membros");
        return true;
      }
      // Server is up and says not installed — go to setup
      setAppState("setup");
      return true;
    } catch {
      // Still offline
      return false;
    }
  }, []);

  function handleSetupComplete() {
    setAppState("loading");
    checkInstallation();
  }

  function handleReconnected() {
    setAppState("loading");
    checkInstallation();
  }

  if (appState === "loading") {
    return <LoadingScreen />;
  }

  if (appState === "maintenance") {
    return (
      <MaintenancePage
        onReconnected={handleReconnected}
        checkConnection={checkConnection}
      />
    );
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

            {/* Quick access — auto-auth by UUID */}
            <Route
              path="/quick-access/:uuid"
              element={<QuickAccessPage />}
            />

            {/* YouTube OAuth callback (popup, no auth needed) */}
            <Route
              path="/auth/youtube/callback"
              element={<YouTubeCallbackPage />}
            />

            {/* Admin routes — protected, admin only */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedType="admin">
                  <AdminRoutes platformName={platformName} />
                </ProtectedRoute>
              }
            />

            {/* Student member area — protected, student only */}
            <Route
              path="/member/*"
              element={
                <ProtectedRoute allowedType="student">
                  <MemberRoutes />
                </ProtectedRoute>
              }
            />

            <Route path="/install" element={<Navigate to="/login" replace />} />
            {/* Root redirect — checks auth and sends to correct area */}
            <Route path="/" element={<AuthRedirect />} />
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
