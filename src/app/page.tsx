import Link from "next/link";

import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const recentSessions = await api.session.getRecent({ limit: 1 });

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1D9E75] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Simula<span className="text-[hsl(280,100%,70%)]">PAA</span>
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
              href="/"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Simulacros →</h3>
              <div className="text-lg">
                Practica para la PAES con simulacros dinámicos
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
              href="/"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Progreso →</h3>
              <div className="text-lg">
                Revisa tu rendimiento y tendencias
              </div>
            </Link>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-white">
              {recentSessions.length > 0 ? `Último ensayo: ${recentSessions[0]?.subject}` : "Sin sesiones aún"}
            </p>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
