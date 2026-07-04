import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight">CareCard</h1>
      <p className="text-lg opacity-80">
        Prepare for medical and care appointments with less stress. Record your
        conditions, allergies, sensory sensitivities, and support needs — then
        let CareCard turn them into a clear, one-page document you can hand to a
        professional to help you say what you need.
      </p>
      <p className="text-sm opacity-60">
        Built with people who are neurodivergent — or who simply find it hard to
        vocalize in the moment — in mind.
      </p>

      <div className="mt-4 flex gap-3">
        {session?.user ? (
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-500"
          >
            Go to my CareCard
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-500"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-current/20 px-5 py-2.5 font-medium hover:bg-current/5"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
