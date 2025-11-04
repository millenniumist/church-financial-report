import Link from 'next/link';
import { prisma } from '@/lib/prisma';

async function getStats() {
  const [
    missionsCount,
    projectsCount,
    activeMissions,
    activeProjects,
    navigationCount,
    visibleNavigationCount,
    pageContentCount,
    contactRecord
  ] = await Promise.all([
    prisma.mission.count(),
    prisma.futureProject.count(),
    prisma.mission.count({ where: { pinned: true } }),
    prisma.futureProject.count({ where: { isActive: true } }),
    prisma.navigationItem.count(),
    prisma.navigationItem.count({ where: { active: true } }),
    prisma.pageContent.count(),
    prisma.contactInfo.findFirst()
  ]);

  return {
    missionsCount,
    projectsCount,
    activeMissions,
    activeProjects,
    navigationCount,
    visibleNavigationCount,
    pageContentCount,
    contactConfigured: Boolean(contactRecord)
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      title: 'Missions',
      count: stats.missionsCount,
      description: `${stats.activeMissions} pinned`,
      link: '/admin/missions',
      icon: '🎯'
    },
    {
      title: 'Projects',
      count: stats.projectsCount,
      description: `${stats.activeProjects} active`,
      link: '/admin/projects',
      icon: '📊'
    },
    {
      title: 'Navigation',
      count: stats.navigationCount,
      description: `${stats.visibleNavigationCount} visible`,
      link: '/admin/navigation',
      icon: '🧭'
    },
    {
      title: 'Page Sections',
      count: stats.pageContentCount,
      description: 'Reusable page content',
      link: '/admin/page-content',
      icon: '📄'
    },
    {
      title: 'Contact Info',
      count: stats.contactConfigured ? 1 : 0,
      description: stats.contactConfigured ? 'Configured' : 'Needs setup',
      link: '/admin/contact',
      icon: '📞'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Manage your church content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.link}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-slate-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{card.title}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{card.count}</p>
                <p className="text-sm text-slate-500 mt-1">{card.description}</p>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            href="/admin/missions/new"
            className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-center font-medium"
          >
            + New Mission
          </Link>
          <Link
            href="/admin/projects/new"
            className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-center font-medium"
          >
            + New Project
          </Link>
          <Link
            href="/admin/page-content/new"
            className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-center font-medium"
          >
            + New Page Section
          </Link>
        </div>
      </div>
    </div>
  );
}
