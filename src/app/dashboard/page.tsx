import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/categories";
import { saveProfile, addCareItem, deleteCareItem } from "./actions";
import { GenerateSection } from "./GenerateSection";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [profile, items] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.careItem.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const inputClass =
    "rounded-lg border border-current/20 bg-transparent px-3 py-2 text-sm";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My CareCard</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="text-sm opacity-70 hover:underline">Sign out</button>
        </form>
      </header>

      {/* Profile */}
      <section className="mb-10 rounded-xl border border-current/10 p-5">
        <h2 className="mb-1 text-lg font-semibold">About me</h2>
        <p className="mb-4 text-sm opacity-60">
          The basics, plus how you communicate best — this shapes the document.
        </p>
        <form action={saveProfile} className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input
              name="displayName"
              required
              defaultValue={profile?.displayName ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Pronouns
            <input
              name="pronouns"
              defaultValue={profile?.pronouns ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Date of birth
            <input
              name="dateOfBirth"
              placeholder="e.g. 1990-05-14"
              defaultValue={profile?.dateOfBirth ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Emergency contact
            <input
              name="emergencyContact"
              defaultValue={profile?.emergencyContact ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            How I communicate best
            <textarea
              name="communicationNotes"
              rows={3}
              placeholder="e.g. Please ask one question at a time and give me a moment to answer."
              defaultValue={profile?.communicationNotes ?? ""}
              className={inputClass}
            />
          </label>
          <div className="sm:col-span-2">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Save profile
            </button>
          </div>
        </form>
      </section>

      {/* Care items */}
      <section className="mb-10 rounded-xl border border-current/10 p-5">
        <h2 className="mb-1 text-lg font-semibold">My information</h2>
        <p className="mb-4 text-sm opacity-60">
          Add anything a professional should know. You can add as many entries as
          you like.
        </p>

        <form
          action={addCareItem}
          className="mb-6 grid gap-3 rounded-lg bg-current/5 p-4 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-sm">
            Type
            <select name="category" className={inputClass} defaultValue="CONDITION">
              {CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_META[cat].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Severity (optional)
            <input name="severity" placeholder="mild / moderate / severe" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Title
            <input name="title" required placeholder="Short summary" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Details (optional)
            <textarea name="details" rows={2} className={inputClass} />
          </label>
          <div className="sm:col-span-2">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Add entry
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-6">
          {CATEGORY_ORDER.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide opacity-60">
                  {CATEGORY_META[cat].label}
                </h3>
                <ul className="flex flex-col gap-2">
                  {catItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-current/10 px-3 py-2"
                    >
                      <div className="text-sm">
                        <span className="font-medium">{item.title}</span>
                        {item.severity && (
                          <span className="ml-2 rounded bg-current/10 px-1.5 py-0.5 text-xs">
                            {item.severity}
                          </span>
                        )}
                        {item.details && (
                          <p className="opacity-70">{item.details}</p>
                        )}
                      </div>
                      <form action={deleteCareItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <button className="text-xs opacity-50 hover:text-red-500 hover:opacity-100">
                          Remove
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="text-sm opacity-50">Nothing added yet.</p>
          )}
        </div>
      </section>

      {/* Generate */}
      <GenerateSection hasProfile={Boolean(profile)} />
    </main>
  );
}
