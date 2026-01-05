import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root");

const renderFatal = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Erro inesperado";

  // eslint-disable-next-line no-console
  console.error("[FATAL_RENDER]", error);

  if (!rootEl) return;

  // Mostra algo mesmo se o React falhar antes de montar
  rootEl.innerHTML = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px;">
      <h1 style="font-size: 18px; font-weight: 700; margin: 0 0 8px;">Algo deu errado</h1>
      <p style="margin: 0 0 12px; color: rgba(0,0,0,.65);">A página não conseguiu carregar. Tente atualizar.</p>
      <pre style="white-space: pre-wrap; background: rgba(0,0,0,.04); padding: 12px; border-radius: 10px; overflow:auto;">${String(
        message
      )}</pre>
    </div>
  `;
};

if (!rootEl) {
  renderFatal(new Error("Elemento #root não encontrado"));
} else {
  window.addEventListener("error", (e) => {
    renderFatal((e as ErrorEvent).error ?? (e as ErrorEvent).message);
  });

  window.addEventListener("unhandledrejection", (e) => {
    renderFatal((e as PromiseRejectionEvent).reason);
  });

  try {
    createRoot(rootEl).render(
      <StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </StrictMode>
    );
  } catch (e) {
    renderFatal(e);
  }
}

