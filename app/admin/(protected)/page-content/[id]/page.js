import { notFound } from 'next/navigation';
import PageContentForm from '@/components/admin/PageContentForm';
import { prisma } from '@/lib/prisma';

export default async function EditPageContentPage({ params }) {
  const { id } = await params;
  const record = await prisma.pageContent.findUnique({ where: { id } });

  if (!record) {
    notFound();
  }

  const formatted = {
    id: record.id,
    page: record.page,
    section: record.section,
    title: {
      th: record.title?.th ?? '',
      en: record.title?.en ?? '',
    },
    subtitle: {
      th: record.subtitle?.th ?? '',
      en: record.subtitle?.en ?? '',
    },
    description: {
      th: record.description?.th ?? '',
      en: record.description?.en ?? '',
    },
    body: record.body ?? null,
    metadata: record.metadata ?? null,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Edit Page Section</h1>
        <p className="text-slate-600 mt-2">
          Update the localized content or structured payload for this section.
        </p>
      </div>
      <PageContentForm section={formatted} />
    </div>
  );
}
