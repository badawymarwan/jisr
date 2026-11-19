import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Hello</h1>
      <Link href="/words">Go to word bank</Link>
    </div>
  );
}