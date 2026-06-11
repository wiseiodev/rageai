export default function PayloadPage() {
  return (
    <article className="mx-auto grid max-w-3xl gap-4 px-4 py-8">
      <h1 className="font-semibold text-3xl">Publish Payload</h1>
      <p>
        The CLI shows the exact JSON before sending anything. Public payload and private anti-abuse
        metadata are shown as separate objects.
      </p>
      <pre className="overflow-auto rounded-md bg-zinc-950 p-4 text-sm text-white">
        {JSON.stringify(
          {
            publicPayload: {
              handle: 'wise',
              hostApp: 'codex',
              pluginVersion: '0.1.0',
              rulesetVersion: '2026.06.11-en-v1',
              generatedAt: '2026-06-11T12:00:00.000Z',
              windows: [
                {
                  window: 'daily',
                  userMessageCount: 14,
                  userWordCount: 520,
                  scoredProfanityCount: 6,
                  ratePerThousandWords: 11.54,
                  topIntensity: 'strong',
                  rankEligible: true,
                },
              ],
            },
            privateAntiAbuse: {
              installId: 'local-random-uuid',
            },
          },
          null,
          2,
        )}
      </pre>
    </article>
  )
}
