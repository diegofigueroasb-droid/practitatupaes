'use client';

import { api } from "~/trpc/react";
import { Card } from "~/components/ui/card";

export default function ProgresoPage() {
  const { data: stats, isLoading } = api.progress.getStats.useQuery();
  const { data: trend } = api.progress.getTrend.useQuery({ limit: 10 });

  if (isLoading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tu Progreso</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <div className="text-4xl font-bold text-primary">{stats?.totalSessions ?? 0}</div>
          <p className="text-sm text-text-muted">Simulaciones</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-4xl font-bold text-primary">{stats?.averageScore ?? 0}</div>
          <p className="text-sm text-text-muted">Promedio</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-4">Rendimiento por Materia</h2>
        {stats?.bySubject.length === 0 ? (
          <p className="text-text-muted text-center py-4">Sin datos aún</p>
        ) : (
          <div className="space-y-3">
            {stats?.bySubject.map((item) => (
              <div key={item.subject} className="flex justify-between items-center">
                <span>{item.subject}</span>
                <span
                  className={`font-semibold ${
                    item.avgScore >= 500 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.avgScore} pts ({item.count})
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-4">Tendencia Reciente</h2>
        {trend && trend.length > 0 ? (
          <div className="flex items-end gap-1 h-32">
            {trend.map((item, i) => (
              <div
                key={i}
                className="flex-1 bg-primary rounded-t"
                style={{ height: `${(item.score / 850) * 100}%` }}
                title={`${item.score} pts - ${item.subject}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-center py-4">Sin datos aún</p>
        )}
      </Card>
    </div>
  );
}