import Link from 'next/link'

export default function NavBar() {
  return (
    <nav className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 mt-4">
      <Link href="/"><button className="bg-[#32FF6A] px-4 py-2 rounded shadow text-[#37003c] font-semibold">Home</button></Link>
      <Link href="/premier"><button className="bg-[#32FF6A] px-4 py-2 rounded shadow text-[#37003c] font-semibold">Premier</button></Link>
      <Link href="/championship"><button className="bg-[#32FF6A] px-4 py-2 rounded shadow text-[#37003c] font-semibold">Championship</button></Link>
      <Link href="/facup"><button className="bg-[#32FF6A] px-4 py-2 rounded shadow text-[#37003c] font-semibold">FA Cup</button></Link>
      <Link href="/managers"><button className="bg-[#32FF6A] px-4 py-2 rounded shadow text-[#37003c] font-semibold">Managers</button></Link>
      <Link href="/news"><button className="bg-[#32FF6A] px-4 py-2 rounded shadow text-[#37003c] font-semibold">News</button></Link>
      <Link href="/links"><button className="bg-[#32FF6A] px-4 py-2 rounded shadow text-[#37003c] font-semibold">Links</button></Link>
    </nav>
  )
}
