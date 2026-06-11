export default function InstallPage() {
  return (
    <article className="mx-auto grid max-w-3xl gap-5 px-4 py-8">
      <h1 className="font-semibold text-3xl">Install Rage</h1>
      <p className="text-zinc-600">
        Rage ships as Claude and Codex marketplace plugins from the `wiseiodev/rageai` repo.
      </p>
      <section className="grid gap-2">
        <h2 className="font-semibold text-xl">Claude Code</h2>
        <pre className="overflow-auto rounded-md bg-zinc-950 p-4 text-sm text-white">
          /plugin marketplace add wiseiodev/rageai
        </pre>
        <p className="text-zinc-600">Install the `rage` plugin, then run `/rage:scan`.</p>
      </section>
      <section className="grid gap-2">
        <h2 className="font-semibold text-xl">Codex</h2>
        <pre className="overflow-auto rounded-md bg-zinc-950 p-4 text-sm text-white">
          codex plugin marketplace add wiseiodev/rageai --sparse .agents/plugins --sparse
          plugins/rage-codex
        </pre>
        <p className="text-zinc-600">
          Install Rage from the repo marketplace and use the Rage skills.
        </p>
      </section>
    </article>
  )
}
