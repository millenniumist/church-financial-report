import Link from "next/link";

export default function MissionPagination({ pagination }) {
  const { page, totalPages, hasPreviousPage, hasNextPage } = pagination;

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  const buildHref = (targetPage) =>
    targetPage === 1 ? "/missions" : `/missions?page=${targetPage}`;

  return (
    <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Mission pagination">
      {hasPreviousPage ? (
        <Link
          href={buildHref(page - 1)}
          className="px-4 py-2 text-sm font-medium rounded-full border border-primary/50 text-primary hover:bg-primary/10 transition"
        >
          ก่อนหน้า
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm font-medium rounded-full border border-slate-200 text-slate-400 cursor-not-allowed">
          ก่อนหน้า
        </span>
      )}

      {pages.map((pageNumber) => (
        <Link
          key={pageNumber}
          href={buildHref(pageNumber)}
          className={`min-w-[2.5rem] px-3 py-2 text-sm font-semibold rounded-full text-center transition ${
            pageNumber === page
              ? "bg-primary text-white shadow-sm"
              : "text-slate-600 bg-slate-100 hover:bg-primary/10 hover:text-primary"
          }`}
        >
          {pageNumber}
        </Link>
      ))}

      {hasNextPage ? (
        <Link
          href={buildHref(page + 1)}
          className="px-4 py-2 text-sm font-medium rounded-full border border-primary/50 text-primary hover:bg-primary/10 transition"
        >
          ถัดไป
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm font-medium rounded-full border border-slate-200 text-slate-400 cursor-not-allowed">
          ถัดไป
        </span>
      )}
    </nav>
  );
}
