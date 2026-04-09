'use client';

import { api } from "~/trpc/react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { History } from "lucide-react";

export default function HistorialPage() {
  const { data: sessions, isLoading } = api.session.getRecent.useQuery({ limit: 20 });

  if (isLoading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-16 h-16 mx-auto text-text-muted mb-4" />
        <h2 className="text-xl font-semibold">Sin sesiones</h2>
        <p className="text-text-muted mt-2">Completa tu primera simulación para ver el historial.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Historial</h1>
      <div className="space-y-3">
        {sessions.map((session) => (
          <Card key={session.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{session.subject}</h3>
                <p className="text-sm text-text-muted">
                  {new Date(session.createdAt).toLocaleDateString("es-CL")}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {session.mode}
                </Badge>
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${
                    session.estimatedScore >= 500 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {session.estimatedScore}
                </div>
                <p className="text-xs text-text-muted">
                  {session.correctCount}/{session.questionCount}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}