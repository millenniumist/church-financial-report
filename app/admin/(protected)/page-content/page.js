import Link from 'next/link';
import PageContentList from '@/components/admin/PageContentList';
import { prisma } from '@/lib/prisma';

export default async function PageContentAdminPage() {
  const sections = await prisma.pageContent.findMany({
    orderBy: [{ page: 'asc' }, { section: 'asc' }],
  });

  const formatted = sections.map((record) => ({
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
    updatedAt: record.updatedAt,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Page Content</h1>
          <p className="text-slate-600 mt-2">
            Manage reusable page sections and structured content blocks.
          </p>
        </div>
        <Link
          href="/admin/page-content/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium"
        >
          + New Section
        </Link>
      </div>

      <PageContentList sections={formatted} />
    </div>
  );
}
