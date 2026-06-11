export default function PrivacyPage() {
  return (
    <article className="mx-auto grid max-w-3xl gap-4 px-4 py-8">
      <h1 className="font-semibold text-3xl">Privacy</h1>
      <p>
        Rage AI scans local transcripts only after opt-in. Local stats stay on your machine unless
        you run the publish command and confirm the preview.
      </p>
      <p>
        Published leaderboard rows include aggregate counts, rates, host app, handle, plugin
        version, ruleset version, and a top intensity bucket. They do not include raw transcript
        text, exact matched words, transcript paths, model names, raw IPs, account IDs, or GitHub
        usernames.
      </p>
      <p>
        Private anti-abuse data includes a random local install ID and HMAC-derived IP buckets. IP
        buckets are retained for 30 days for rate limiting and abuse prevention.
      </p>
    </article>
  )
}
