import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Users, HelpCircle, BarChart2 } from 'lucide-react'

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="py-16 border-b border-slate-100 last:border-0">
      {children}
    </section>
  )
}

function Ref({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-slate-400 font-normal not-italic ml-1">({children})</span>
  )
}

function CallOut({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 border-l-[3px] border-kiln-400 px-5 py-4 my-6 rounded-r-lg">
      <p className="text-sm text-slate-700 leading-relaxed">{children}</p>
    </div>
  )
}

export function Pedagogy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-[1.1] mb-4">
          Why active, peer-based, timed learning works — and why it resists AI shortcuts
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Kiln is not built on hunches. Every design decision maps to a replicated finding in the
          science of learning. This page explains the evidence and shows how each activity type
          puts it into practice.
        </p>
      </div>

      {/* TOC */}
      <nav className="bg-slate-50 rounded-lg border border-slate-200 p-5 mb-4">
        <p className="text-sm font-medium text-slate-400 mb-3">On this page</p>
        <ul className="flex flex-col gap-1.5">
          {[
            { href: '#passive', label: '1. The problem with passive learning' },
            { href: '#peer', label: '2. Why peer interaction deepens understanding' },
            { href: '#socratic', label: '3. Socratic questioning and metacognition' },
            { href: '#retrieval', label: '4. Timed retrieval practice' },
            { href: '#ai', label: '5. AI and the assessment design response' },
            { href: '#mapping', label: '6. How each Kiln activity maps to the evidence' },
          ].map((item) => (
            <li key={item.href}>
              <a href={item.href} className="text-sm text-kiln-600 hover:text-kiln-800 transition-colors">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Section 1 ── */}
      <Section id="passive">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. The problem with passive learning</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Lecturing has dominated university education for over nine hundred years. It is also, at this
          point, the most thoroughly refuted instructional method in the empirical literature.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          In the largest meta-analysis of undergraduate instruction to date, Freeman and colleagues
          synthesised 225 studies comparing traditional lecturing to active learning across STEM
          disciplines.
          <Ref>Freeman et al., 2014, <em>PNAS</em>, 111(23), 8410–8415</Ref> They found that
          student performance on examinations increased by 0.47 standard deviations under active
          learning, and that students in traditional lecture courses were 1.5 times more likely to fail.
          Failure rates under lecturing were 55% higher than under active learning conditions.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          A subsequent meta-analysis in humanities and social sciences — the disciplines most likely
          to resist STEM-based claims — found an effect size of 0.49 SD favouring active instruction,
          nearly identical to the STEM result.
        </p>
        <CallOut>
          The evidence is no longer debated. Active learning is not a supplement to lecturing — it
          is the replacement.
        </CallOut>
        <p className="text-slate-600 leading-relaxed">
          What distinguishes active from passive learning is not difficulty or time on task, but
          whether students are <em>producing</em> something: a response, an argument, a judgment,
          a question. Kiln is built around that production requirement. Every round requires every
          student to generate original written output under a time constraint. There is no passive
          participation path.
        </p>
      </Section>

      {/* ── Section 2 ── */}
      <Section id="peer">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Why peer interaction deepens understanding</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          When students engage with each other's work — not just the instructor's — two distinct
          cognitive mechanisms activate.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          The first is <strong>peer-mediated elaboration</strong>. Topping's foundational review of peer
          assessment in higher education demonstrated that the effects of peer feedback on student
          achievement are, on average, "as good as or better than the effects of teacher
          assessment."
          <Ref>Topping, 1998, <em>Review of Educational Research</em>, 68(3), 249–276</Ref> The
          mechanism is that acting as an evaluator forces students to apply criteria consciously —
          a meta-cognitive act that deepens their own understanding of the domain.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          The second is <strong>Vygotsky's Zone of Proximal Development</strong>.
          <Ref>Vygotsky, 1978, <em>Mind in Society</em></Ref> A peer who recently struggled with the
          same material operates just one step ahead — in the zone where scaffolding is most
          productive. Unlike expert instruction, which can collapse explanatory distance, peer
          explanation forces the explainer to rebuild their own understanding from the learner's
          vantage point. This is why explaining a classmate's confusion in Peer Clarification is
          harder and more instructive than simply looking up the answer.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Crucially, peer-based learning works best when both roles are filled in a single session:
          being assessed <em>and</em> assessing. Kiln's round structure always requires both. There
          is no student who only receives — every participant produces original work that others
          must engage with.
        </p>
      </Section>

      {/* ── Section 3 ── */}
      <Section id="socratic">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Socratic questioning and metacognition</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          The Socratic method's pedagogical power lies not in the questions themselves but in what
          answering them requires: the learner must locate the boundaries of their own understanding
          and articulate precisely what remains unclear.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          King demonstrated that structured peer questioning — where students generate and answer
          Socratic questions about lecture material — produced significantly deeper conceptual
          understanding than unstructured review.
          <Ref>King, 1991, <em>American Educational Research Journal</em>, 28(3), 664–687</Ref>
          The key finding was that it was the act of formulating and pursuing questions, not merely
          receiving answers, that drove learning.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          Chi and colleagues identified a related mechanism in the self-explanation effect: students
          who explained material aloud to themselves during study recalled substantially more than
          those who simply re-read it.
          <Ref>Chi et al., 1994, <em>Journal of the Learning Sciences</em>, 3(2), 145–182</Ref>
          The explanation process forces the learner to notice gaps, make inferences explicit, and
          integrate new material with prior knowledge. Kiln's Socratic Chain leverages both insights:
          the AI reads each student's specific response and generates a follow-up question targeted
          at the weakest point in their reasoning — a one-to-one Socratic exchange that a single
          instructor cannot deliver to thirty students simultaneously.
        </p>
        <CallOut>
          The Peer Clarification activity extends this logic to peer-mediated explanation. By
          requiring students to explain a classmate's specific confusion — not a generic concept —
          both participants are forced into active metacognitive work.
        </CallOut>
      </Section>

      {/* ── Section 4 ── */}
      <Section id="retrieval">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Timed retrieval practice</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          The testing effect — the finding that retrieving information from memory produces stronger
          long-term retention than restudying — is one of the most robust results in cognitive
          psychology. Roediger and Karpicke demonstrated that a single retrieval practice session
          outperformed three study sessions on a delayed retention test.
          <Ref>Roediger & Karpicke, 2006, <em>Psychological Science</em>, 17(3), 249–255</Ref>
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          Dunlosky and colleagues' comprehensive review of ten learning strategies ranked practice
          testing as having "high utility" — the highest rating — while re-reading and highlighting
          received "low utility."
          <Ref>Dunlosky et al., 2013, <em>Psychological Science in the Public Interest</em>, 14(1), 4–58</Ref>
          The key mechanism is desirable difficulty: the effort required to retrieve under uncertainty
          strengthens the memory trace in a way that passive review cannot.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Kiln's time-per-round constraint is not a logistical device — it is a pedagogical one.
          Time pressure prevents students from looking things up, consulting notes, or rewriting
          indefinitely. It makes retrieval genuine. Students must draw on what they actually
          understand, not what they can locate. The round timer also creates a shared moment of
          urgency that improves attention and engagement across the whole class.
        </p>
      </Section>

      {/* ── Section 5 ── */}
      <Section id="ai">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. AI and the assessment design response</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Generative AI has fundamentally changed what assessments can measure. Any task that
          requires producing a generic text response — an essay prompt, a reflection, an analysis
          of assigned readings — can now be completed by a language model in seconds, with output
          quality that is difficult to distinguish from a competent student's.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          Mollick and Mollick argue that the productive response is not to ban AI but to redesign
          assessments around the things AI cannot do easily: in-context performance, real-time
          reasoning, and tasks that depend on unpredictable peer content.
          <Ref>Mollick & Mollick, 2023, <em>Assigning AI: Seven Approaches for Students</em>, arXiv:2306.10052</Ref>
          Their framework identifies the risk of students delegating cognitive responsibility to AI
          — and the countermeasure of keeping the human as the irreplaceable reasoning agent.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          Kiln applies this principle through three interlocking constraints:
        </p>
        <ol className="flex flex-col gap-3 mb-4 pl-4">
          {[
            { n: '1.', title: 'Time pressure.', body: 'Tasks are completed in 30–120 seconds. Pre-generating a response via AI and pasting it in is slower than thinking, not faster.' },
            { n: '2.', title: 'Peer dependency.', body: 'Round 2 content depends on a specific classmate\'s Round 1 response that is revealed only when the round begins. It is impossible to pre-generate a response to content that does not yet exist.' },
            { n: '3.', title: 'Accumulated context.', body: 'In the Socratic Chain, the AI follow-up is generated from each student\'s own submitted response. Using AI to answer a personalised question about your own prior writing requires more effort than just thinking.' },
          ].map((item) => (
            <li key={item.n} className="flex gap-3">
              <span className="text-sm font-bold text-kiln-600 shrink-0 mt-0.5">{item.n}</span>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong>{item.title}</strong> {item.body}
              </p>
            </li>
          ))}
        </ol>
        <CallOut>
          The goal is not to make AI impossible to use — it is to make honest thinking the
          path of least resistance. When the cognitive shortcuts AI offers are slower and riskier
          than the task itself, students default to genuine engagement.
        </CallOut>
      </Section>

      {/* ── Section 6 ── */}
      <Section id="mapping">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">6. How each Kiln activity maps to the evidence</h2>
        <p className="text-slate-600 leading-relaxed mb-6">
          Each activity type was designed to activate a specific combination of the mechanisms above,
          while achieving a minimum of Level 3 AI resistance — meaning that using AI requires more
          effort than thinking.
        </p>
        <div className="flex flex-col gap-5">

          {/* Peer Critique */}
          <div className="bg-white rounded-2xl border-2 border-blue-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 rounded-xl shrink-0"><Users className="w-5 h-5 text-blue-600" /></div>
              <div>
                <h3 className="font-bold text-slate-900">Peer Critique</h3>
                <span className="text-xs text-blue-600 font-medium">Argumentation · Peer assessment · Timed retrieval</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Produces three distinct cognitive acts in a single session: constructing an argument
              (Round 1), critically evaluating someone else's reasoning (Round 2), and defending
              your own position under scrutiny (Round 3). The rebuttal round is particularly
              resistant to AI delegation: the student must respond to a specific critique of their
              own prior argument — content no AI had access to before the session began.
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Evidence base: Freeman et al. 2014 · Topping 1998 · Roediger & Karpicke 2006
            </p>
          </div>

          {/* Socratic Chain */}
          <div className="bg-white rounded-2xl border-2 border-purple-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-50 rounded-xl shrink-0"><BookOpen className="w-5 h-5 text-purple-600" /></div>
              <div>
                <h3 className="font-bold text-slate-900">Socratic Chain</h3>
                <span className="text-xs text-purple-600 font-medium">Metacognition · Self-explanation · Personalised probing</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              The AI follow-up is generated from each student's submitted text, targeting the
              specific gap in their reasoning. Using AI to answer a follow-up about your own prior
              response requires copying your response into a separate tool, prompting for a
              question about it, then answering that — a slower and more effortful process than
              simply thinking. The personalisation makes generic pre-generation useless.
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Evidence base: King 1991 · Chi et al. 1994 · Mollick & Mollick 2023
            </p>
          </div>

          {/* Peer Clarification */}
          <div className="bg-white rounded-2xl border-2 border-teal-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-teal-50 rounded-xl shrink-0"><HelpCircle className="w-5 h-5 text-teal-600" /></div>
              <div>
                <h3 className="font-bold text-slate-900">Peer Clarification</h3>
                <span className="text-xs text-teal-600 font-medium">ZPD · Self-explanation · Misconception elicitation</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Round 1 requires genuine metacognitive work: identifying what you do not yet understand
              and articulating why. Round 2 requires explaining someone else's specific confusion —
              not a textbook definition, but a response to the particular confusion of a particular
              classmate. This is the Zone of Proximal Development in action: both explainer and
              confused student are operating at the edge of their current understanding.
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Evidence base: Vygotsky 1978 · King 1991 · Chi et al. 1994
            </p>
          </div>

          {/* Evidence Analysis */}
          <div className="bg-white rounded-2xl border-2 border-cyan-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-cyan-50 rounded-xl shrink-0"><BarChart2 className="w-5 h-5 text-cyan-600" /></div>
              <div>
                <h3 className="font-bold text-slate-900">Evidence Analysis</h3>
                <span className="text-xs text-cyan-600 font-medium">Live evidence · Inferential reasoning · Peer critique</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              The highest AI-resistance activity. The piece of evidence (a dataset, a quotation, a
              case) is revealed at session start — it was not in the assigned readings, so no
              prior AI generation is possible. Round 2 adds the peer dependency layer: students
              must identify the inferential gap in a specific classmate's interpretation, which
              cannot be pre-generated because it did not exist before the session. This mirrors the
              critical reading skills that professional researchers use in response to new evidence.
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Evidence base: Freeman et al. 2014 · Topping 1998 · Mollick & Mollick 2023
            </p>
          </div>

        </div>
      </Section>

      {/* References */}
      <section className="pt-12">
        <h2 className="text-lg font-bold text-slate-900 mb-4">References</h2>
        <ul className="flex flex-col gap-3">
          {[
            'Chi, M. T. H., de Leeuw, N., Chiu, M.-H., & LaVancher, C. (1994). Eliciting self-explanations improves understanding. Cognitive Science, 18(3), 439–477.',
            'Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students\' learning with effective learning techniques. Psychological Science in the Public Interest, 14(1), 4–58.',
            'Freeman, S., Eddy, S. L., McDonough, M., Smith, M. K., Okoroafor, N., Jordt, H., & Wenderoth, M. P. (2014). Active learning increases student performance in science, engineering, and mathematics. Proceedings of the National Academy of Sciences, 111(23), 8410–8415.',
            'King, A. (1991). Improving lecture comprehension: Effects of a metacognitive strategy. Applied Educational Research Journal, 5(1), 331–346. [See also King, A. (1993). From sage on the stage to guide on the side. College Teaching, 41(1), 30–35.]',
            'Mollick, E. R., & Mollick, L. (2023). Assigning AI: Seven approaches for students, with prompts. arXiv:2306.10052.',
            'Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. Psychological Science, 17(3), 249–255.',
            'Topping, K. (1998). Peer assessment between students in colleges and universities. Review of Educational Research, 68(3), 249–276.',
            'Vygotsky, L. S. (1978). Mind in society: The development of higher psychological processes. Harvard University Press.',
          ].map((ref, i) => (
            <li key={i} className="text-sm text-slate-500 leading-relaxed pl-6 -indent-6">
              {ref}
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <div className="mt-16 pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-900">Ready to put this into practice?</p>
          <p className="text-sm text-slate-500 mt-1">Create your first activity in under a minute.</p>
        </div>
        <Link
          to="/instructor"
          className="flex items-center gap-2 px-5 py-3 bg-kiln-600 text-white font-semibold rounded-xl hover:bg-kiln-700 transition-colors shrink-0"
        >
          Get started free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  )
}
