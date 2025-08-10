import Link from 'next/link';
import NavBar from '../components/NavBar';
import useGWDeadline from '@/public/hooks/useGWDeadline';
import Head from 'next/head';

export default function FACup() {
  
  const { gwInfo, loading, error } = useGWDeadline();

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
        <Head>
          <title>FA Cup - The Fantasy Premier League</title>
          <meta property="og:title" content="THE Fantasy FA Cup" />
          <meta property="og:description" content="FA Cup Bracket" />
          <meta property="og:image" content="https://static.vecteezy.com/system/resources/previews/025/409/495/large_2x/emirates-fa-cup-logo-with-name-white-symbol-abstract-design-illustration-with-red-background-free-vector.jpg" />
          <meta property="og:url" content="https://tfpl.vercel.app/facup" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="THE Fantasy Premier League" />
        </Head>
       
       <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 bg-[#5b329e] text-[#37003c] p-6 shadow-lg overflow-hidden">
               {/* ripple vector background */}
               <div className="navbar-ripple pointer-events-none select-none absolute inset-0"></div>
                     
               {/* Content above ripple */}
               <h1 className="text-center sm:text-left relative z-10 text-4xl font-bold text-[#37003c]">Fantasy FA Cup (v2)</h1>
                     
               <div className="navbar-buttons relative z-20">
                 <NavBar />
               </div>
        </header>

        {/* Show Gameweek Deadline bar if data is available */}
        {gwInfo && !loading && !error && (
          <div className="bg-[#37003c] text-[#32FF6A] font-bold p-2 text-center">
            <p>GW{gwInfo.gwNumber} Deadline: {gwInfo.deadline}  PST</p>
          </div>
        )}

        {/* Show loading state */}
        {loading && (
          <div className="bg-[#37003c] text-[#32FF6A] font-bold p-2 text-center">
            <p>Loading Gameweek Info...</p>
          </div>
        )}

        {/* Show error state */}
        {error && (
          <div className="bg-[#37003c] text-[#32FF6A] font-bold p-2 text-center">
            <p>{error}</p>
          </div>
        )}

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
