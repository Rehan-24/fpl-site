import Head from "next/head";
import NavBar from "@/components/NavBar";
import GWInfoBar from "@/components/GWInfoBar";

const LINKS = [
  { label: "Official FPL", href: "https://fantasy.premierleague.com/" },
  { label: "r/FantasyPL (Reddit)", href: "https://www.reddit.com/r/FantasyPL/" },
  { label: "Live Bonus Point Tracker", href: "https://www.anewpla.net/fpl/live/" },
  { label: "LiveFPL", href: "https://www.livefpl.net/" },
  { label: "FPL Newspaper PL", href: "https://www.fplmundo.com/723566" },
  { label: "FPL Newspaper CL", href: "https://www.fplmundo.com/850022" },
  { label: "FPL Newspaper Blank", href: "https://www.fplmundo.com/" }
];

export default function LinksPage() {
  return (
    <>
      <Head>
        <title>Links | tFPL</title>
        <meta property="og:title" content="tFPL Links" />
        <meta property="og:description" content="Discord, Reddit, and useful FPL resources." />
        <meta property="og:image" content="https://media.istockphoto.com/id/1468586532/photo/close-up-of-female-soccer-team-stacking-hands-in-the-field.webp?s=1024x1024&w=is&k=20&c=As235Hd0Y91RZy3h4Yv4PnwmpEEyjYnmxw96liOdICw=" />
        <meta property="og:url" content="https://tfpl.vercel.app/links" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="THE Fantasy Premier League" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
        <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 bg-[#5b329e] text-[#37003c] p-6 shadow-lg overflow-hidden">
          <div className="navbar-ripple pointer-events-none select-none absolute inset-0"></div>
          <h1 className="text-center sm:text-left relative z-10 text-4xl font-bold text-[#37003c]">Links</h1>
          <div className="navbar-buttons relative z-20">
            <NavBar />
          </div>
        </header>

        <GWInfoBar />

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ul className="space-y-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-gray-300 bg-purple-100 backdrop-blur px-4 py-3 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#32FF6A]"
                >
                  <span className="font-semibold text-[#37003c]">{l.label}</span>
                  <span className="text-sm text-gray-600" aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
