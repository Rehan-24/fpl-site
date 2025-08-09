import Link from 'next/link';
import NavBar from '../components/NavBar';

export default function FACup() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
       <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 bg-[#5b329e] text-[#37003c] p-6 shadow-lg overflow-hidden">
               {/* ripple vector background */}
               <div className="navbar-ripple pointer-events-none select-none absolute inset-0"></div>
                     
               {/* Content above ripple */}
               <h1 className="text-center sm:text-left relative z-10 text-4xl font-bold text-[#37003c]">Fantasy FA Cup (v2)</h1>
                     
               <div className="navbar-buttons relative z-20">
                 <NavBar />
               </div>
        </header>

      <section className="p-6">
        <h2 className="text-3xl font-bold mb-4">FA Cup</h2>
        <p className="text-sm">Seeding — begins January</p>
        <div>
          <p className="text-sm text-gray-600 mt-3">
            Bracket failed to load? View it directly at
            <a
              href="https://challonge.com/tfplfacup"
              className="text-blue-600 underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              challonge.com/tfplfacup
            </a>.
          </p>
          <embed
            className='mt-4'
            src="https://tfpl.onrender.com/static/facup.pdf"
            type="application/pdf"
            width="100%"
            height="800px"
          />
        </div>
      </section>
    </main>
  );
}
