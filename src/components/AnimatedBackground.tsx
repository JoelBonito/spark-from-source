export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Gradiente 1 - Roxo */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.08] animate-background-shift"
        style={{
          left: '20%',
          top: '30%',
          background: 'radial-gradient(circle, hsl(var(--accent-purple)) 0%, transparent 70%)',
        }}
      />
      
      {/* Gradiente 2 - Azul */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.08] animate-background-shift"
        style={{
          left: '80%',
          top: '70%',
          background: 'radial-gradient(circle, hsl(var(--accent-blue)) 0%, transparent 70%)',
          animationDelay: '5s',
        }}
      />
      
      {/* Gradiente 3 - Ciano */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.06] animate-background-shift"
        style={{
          left: '50%',
          top: '50%',
          background: 'radial-gradient(circle, hsl(var(--accent-cyan)) 0%, transparent 70%)',
          animationDelay: '10s',
        }}
      />
    </div>
  );
}
