const PROJECTS = [
  {
    name: 'Missouri State Lacrosse Website',
    summary:
      'Official Missouri State Lacrosse platform with role-based experiences for players, coaches, admins, and public users. Includes roster/content operations, secure account workflows, integrated team store + donations, and production backend services for payments, fulfillment, and transactional email.',
    stack: 'React, JavaScript, Firebase Auth, Postgres, Spring Boot (Java 17), PayPal REST, Printify API, AWS SES, AWS Secrets Manager, EC2',
  },
  {
    name: 'Nova Dom',
    summary:
      'A lightweight, TypeScript-first DOM editing engine for React, built for visual editors, page builders, and no-code style tools. Uses a flat DocumentTree model for scalable editing, efficient diffing, and history-safe undo/redo.',
    stack: 'TypeScript, React 19, Zustand, Vite',
  },
  {
    name: 'TabUp',
    summary:
      'Friend-first bill splitting app focused on receipt capture, flexible split logic, and payout-platform-aware reminders without handling money directly. Mobile shell is active, with backend architecture in progress for auth, history, notifications, and secure media workflows.',
    stack: 'React Native (Expo), TypeScript, NestJS, TypeORM, PostgreSQL, AWS (EC2, S3, Secrets Manager), Firebase Auth, APNs/FCM, Twilio SMS',
  },
] as const;

const EXPERIENCE = [
  {
    role: 'Lead Engineer - Even Dating LLC',
    period: 'December 2025 - Present',
    detail:
      'Designed and built a college dating app with a focus on user experience, performance, and scalability.',
  },
  {
    role: 'Grading Assistant - Missouri State University',
    period: 'August 2025 - December 2025',
    detail:
      'Assisted in grading assignments and providing feedback for a mid-level statistics theory course.',
  },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100">
      <div className="mx-auto w-full max-w-5xl px-6 pb-24 pt-10 md:px-8 md:pt-14">
        <header className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-7 md:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Portfolio</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">
            Cam Slade
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-300 md:text-base">
            Full Stack developer with experience in mobile and web app development. Currently a Computer Science and Mathematics student at Missouri State University, with a passion for building performant and user-friendly applications.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <a
              className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 hover:bg-neutral-700"
              href="#projects"
            >
              View Projects
            </a>
            <a
              className="rounded-md border border-neutral-700 px-3 py-2 hover:bg-neutral-900"
              href="#contact"
            >
              Contact
            </a>
          </div>
        </header>

        <section id="projects" className="mt-10">
          <h2 className="text-xl font-semibold">Selected Projects</h2>
          <div className="mt-4 grid gap-4">
            {PROJECTS.map((project) => (
              <article
                key={project.name}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
              >
                <h3 className="text-base font-medium">{project.name}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-300">{project.summary}</p>
                <p className="mt-3 text-xs text-neutral-400">{project.stack}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Experience</h2>
          <div className="mt-4 grid gap-4">
            {EXPERIENCE.map((item) => (
              <article key={item.role} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-medium">{item.role}</h3>
                  <p className="text-xs text-neutral-400">{item.period}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-300">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-2 text-sm text-neutral-300">camdenslade@outlook.com</p>
          <p className="mt-1 text-sm text-neutral-300">linkedin.com/in/camden-slade-230157155</p>
          <p className="mt-1 text-sm text-neutral-300">github.com/camdenslade</p>
        </section>
      </div>
    </main>
  );
}
