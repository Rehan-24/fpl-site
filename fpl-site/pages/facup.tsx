import Link from 'next/link';

export default function FACup() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <div className="bg-gradient-to-r from-blue-300 via-blue-400 to-purple-700 text-white p-6 shadow-lg">
        <h1 className="font-bold text-4xl text-[#37003c] text-center sm:text-left">
          THE FA Cup (v2)
        </h1>
        <nav className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 mt-4">
          <Link href="/"><button className="bg-[#32FF6A] font-semibold px-4 py-2 rounded shadow text-[#37003c] text-center">Home</button></Link>
          <Link href="/premier"><button className="bg-[#32FF6A] font-semibold px-4 py-2 rounded shadow text-[#37003c] text-center">Premier</button></Link>
          <Link href="/championship"><button className="bg-[#32FF6A] font-semibold px-4 py-2 rounded shadow text-[#37003c] text-center">Championship</button></Link>
          <Link href="/facup"><button className="bg-[#32FF6A] font-semibold px-4 py-2 rounded shadow text-[#37003c] text-center">FA Cup</button></Link>
        </nav>
      </div>

      <section className="p-6">
        <h2 className="text-3xl font-bold mb-4">FA Cup</h2>
        <p className="text-sm">Seeding — begins January</p>
        <div className="mt-6">
          <embed
            src="hhttps://tfpl.onrender.com/static/facup.pdf"
            type="application/pdf"
            width="100%"
            height="800px"
          />
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
        </div>
      </section>
    </main>
  );
}
