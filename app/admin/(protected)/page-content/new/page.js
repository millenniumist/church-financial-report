import PageContentForm from '@/components/admin/PageContentForm';

export default function NewPageContentPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Create Page Section</h1>
        <p className="text-slate-600 mt-2">
          Define a new reusable section for one of your pages.
        </p>
      </div>
      <PageContentForm />
    </div>
  );
}
