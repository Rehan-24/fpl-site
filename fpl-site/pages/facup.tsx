import Link from 'next/link';
import NavBar from '../components/NavBar';

export default function FACup() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <div className="bg-gradient-to-r from-blue-300 via-blue-400 to-purple-700 text-white p-6 shadow-lg">
        <h1 className="font-bold text-4xl text-[#37003c] text-center sm:text-left">
          THE FA Cup (v2)
        </h1>
        <NavBar />
      </div>

      <section className="p-6">
        <h2 className="text-3xl font-bold mb-4">FA Cup</h2>
        <p className="text-sm">Seeding — begins January</p>
        <div className="mt-6">
          <p className="text-sm text-gray-600 mt-2">
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
