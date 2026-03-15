export function Privacy() {
  return (
    <div className="max-w-2xl mx-auto py-10 animate-fade-in">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-10">Last updated: March 2026</p>

      <div className="flex flex-col gap-8 text-sm text-slate-600 leading-relaxed">

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">What is Kiln?</h2>
          <p>
            Kiln is an AI-assisted active learning platform for higher-education instructors.
            Instructors create activities; students join sessions using a code — no student
            account is required.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">What data we collect</h2>
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-semibold text-slate-800">Instructors</p>
              <p>Email address and password (or magic-link token) used to create and manage activities and sessions.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Students</p>
              <p>
                A display name (chosen by the student at join time) and the text responses they
                submit during a session. No email, account, or persistent identifier is required
                or collected from students.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Usage data</p>
              <p>
                Standard web server logs (IP address, browser type, pages visited) retained for
                up to 90 days for security and debugging purposes.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Feedback</p>
              <p>
                If you submit feedback through the app, we collect the message text and,
                optionally, the email address you provide.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">How we use your data</h2>
          <ul className="flex flex-col gap-1.5 list-disc list-inside">
            <li>To operate and deliver the Kiln service</li>
            <li>To generate AI follow-up questions and evaluations using student responses</li>
            <li>To respond to support or feedback messages</li>
            <li>To improve the product based on aggregated, anonymised usage patterns</li>
          </ul>
          <p className="mt-3">We do not sell your data. We do not use your data for advertising.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Third-party processors</h2>
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-semibold text-slate-800">Supabase</p>
              <p>
                Database, authentication, and realtime infrastructure. Data is stored in
                Supabase-managed PostgreSQL. See{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" className="text-kiln-600 hover:underline">
                  supabase.com/privacy
                </a>.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Anthropic</p>
              <p>
                Student responses are sent to Anthropic's Claude API to generate personalised
                follow-up questions and scenario turns. Anthropic does not use API inputs to
                train its models. See{' '}
                <a href="https://www.anthropic.com/privacy" target="_blank" rel="noreferrer" className="text-kiln-600 hover:underline">
                  anthropic.com/privacy
                </a>.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Data retention</h2>
          <p>
            Session data (responses, transcripts, evaluations) is retained indefinitely until
            an instructor deletes the associated activity or requests account deletion.
            Student session tokens expire automatically and are not linked to persistent
            identities.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Your rights</h2>
          <p>
            You may request access to, correction of, or deletion of your data at any time
            by contacting us. For instructors, you can also delete your activities and
            sessions directly from the dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Contact</h2>
          <p>
            Questions about this policy:{' '}
            <a href="mailto:feedback@usekiln.org" className="text-kiln-600 hover:underline">
              feedback@usekiln.org
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
