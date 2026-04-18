import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Auralis Health — El doctor habla, el sistema hace todo lo demás',
  description: 'Copiloto de documentación clínica por voz para Auralis Health',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#F8FBFD]">
        {/* Header global */}
        <header className="sticky top-0 z-50 bg-white border-b border-primary-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-900">Auralis Health</h1>
                <p className="text-[10px] text-primary-500 -mt-1">Clínica</p>
              </div>
            </div>

            {/* Doctor info */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-success-50 rounded-full">
                <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                <span className="text-xs text-success-600 font-medium">Sistema activo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">DM</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-primary-900">Dr. Martínez</p>
                  <p className="text-[10px] text-primary-400">Medicina Interna</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
