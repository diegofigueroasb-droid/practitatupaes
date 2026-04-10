export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0F766E] to-[#15162c] text-white p-4">
      <div className="container flex flex-col items-center justify-center gap-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Practica<span className="text-teal-300">TuPAES</span>
        </h1>
        <p className="text-xl max-w-xl">
          Prepárate para la PAES con preguntas oficiales DEMRE
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-8">
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-6">
            <h3 className="text-2xl font-bold">Simulacros</h3>
            <p>Practica con preguntas del banco oficial</p>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-6">
            <h3 className="text-2xl font-bold">Progreso</h3>
            <p>Revisa tu rendimiento y tendencias</p>
          </div>
        </div>
      </div>
    </main>
  );
}
