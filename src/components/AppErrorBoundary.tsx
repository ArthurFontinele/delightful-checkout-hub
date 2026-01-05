import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[APP_ERROR_BOUNDARY]", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(this.state.message ?? "");
    } catch {
      // ignore
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <section className="w-full max-w-lg rounded-2xl border bg-card p-6 card-shadow">
            <h1 className="text-lg font-bold">Algo deu errado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A página não conseguiu carregar. Atualize e tente novamente.
            </p>

            {this.state.message ? (
              <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs text-foreground">
                {this.state.message}
              </pre>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={this.handleReload}>Atualizar</Button>
              <Button variant="outline" onClick={this.handleCopy}>
                Copiar erro
              </Button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
