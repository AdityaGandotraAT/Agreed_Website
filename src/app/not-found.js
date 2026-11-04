import Link from "next/link";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-md text-base leading-7">
        The page you requested does not exist.
      </p>
      <Link href="/" className="text-base font-medium underline underline-offset-4">
        Go to home
      </Link>
    </main>
  );
}
