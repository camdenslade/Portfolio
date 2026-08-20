import ProjectPageClient from './ProjectPageClient';

const SLUGS = ['even-dating', 'tabup', 'missouri-state-lacrosse', 'smoke-launcher', 'nova-dom', 'kimbu', 'versa', 'binate', 'Glyph'];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export default function Page({ params }: { params: { slug: string } }) {
  return <ProjectPageClient slug={params.slug} />;
}
