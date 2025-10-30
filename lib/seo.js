// SEO Configuration
export const siteConfig = {
  name: 'คริสตจักรชลบุรี ภาค7',
  nameEn: 'Chonburi Presbyterian Church - Region 7',
  description: 'คริสตจักรชลบุรี ภาค7 - ศูนย์รวมของชุมชนคริสเตียน พร้อมการนมัสการ กิจกรรม และการรับใช้พระเจ้า',
  url: 'https://your-domain.com', // Update with actual domain
  image: '/og-image.jpg', // Add an OG image to public folder
  keywords: [
    'คริสตจักรชลบุรี',
    'Presbyterian Church Chonburi',
    'คริสตจักรเพรสไบทีเรียน',
    'ภาค7',
    'นมัสการ',
    'กิจกรรมคริสเตียน',
    'ชุมชนคริสเตียน ชลบุรี',
  ],
};

export function generateMetadata({
  title,
  description,
  path = '',
  image,
  keywords = [],
}) {
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const finalDescription = description || siteConfig.description;
  const url = `${siteConfig.url}${path}`;
  const ogImage = image || siteConfig.image;
  const allKeywords = [...siteConfig.keywords, ...keywords].join(', ');

  return {
    title: fullTitle,
    description: finalDescription,
    keywords: allKeywords,
    openGraph: {
      title: fullTitle,
      description: finalDescription,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'th_TH',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: finalDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
