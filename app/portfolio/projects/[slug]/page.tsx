import ProjectPageClient from './ProjectPageClient';

const SLUGS = ['even-dating', 'codegraph', 'missouri-state-lacrosse', 'smoke-launcher', 'nova-dom', 'kimbu', 'versa', 'binate', 'Glyph'];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProjectPageClient slug={slug} />;
}
