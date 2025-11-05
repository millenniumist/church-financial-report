const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const fallbackMissionsSeed = [
  {
    slug: 'community-outreach',
    title: {
      th: 'ประกาศและรับใช้ชุมชน',
      en: 'Community Outreach & Service',
    },
    theme: {
      th: 'นำข่าวประเสริฐสู่คนรอบข้าง',
      en: 'Bringing the gospel to our neighbours',
    },
    summary: {
      th: 'สร้างสัมพันธภาพกับชุมชนชลบุรีผ่านการช่วยเหลือ การประกาศ และกิจกรรมที่ตอบสนองความต้องการทั้งฝ่ายวิญญาณและร่างกาย',
      en: 'We build relationships across Chonburi through practical care, evangelism, and gatherings that meet both spiritual and physical needs.',
    },
    description: {
      th: 'ทีมพันธกิจชุมชนออกเยี่ยมเยียน แจกอาหาร เครื่องอุปโภคบริโภค และเปิดโอกาสให้ผู้คนได้รู้จักพระเยซูคริสต์ผ่านคำพยานและการนมัสการร่วมกัน ชุมชนที่เราเข้าไปมักมีทั้งความต้องการด้านร่างกายและจิตใจ เราจึงทำงานร่วมกับหน่วยงานท้องถิ่นเพื่อให้ความช่วยเหลืออย่างยั่งยืน',
      en: 'Our outreach team makes regular visits, distributes food and essentials, and shares the hope of Jesus through testimonies and worship. Because many neighbours carry both material and emotional needs, we partner with local agencies to bring long-term care.',
    },
    focusAreas: {
      th: ['การประกาศ', 'การช่วยเหลือสังคม', 'การหนุนใจครอบครัว'],
      en: ['Evangelism', 'Community care', 'Family encouragement'],
    },
    scripture: {
      reference: {
        th: 'มัทธิว 5:16',
        en: 'Matthew 5:16',
      },
      text: {
        th: 'ให้แสงสว่างของท่านฉายออกไปต่อหน้ามนุษย์ เพื่อเขาจะได้เห็นการกระทำดีของท่าน และถวายเกียรติแด่พระบิดาของท่านผู้สถิตในสวรรค์',
        en: 'Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.',
      },
    },
    nextSteps: {
      th: [
        'จัดค่ายประกาศสำหรับเยาวชนในชุมชน',
        'เปิดคลาสภาษาอังกฤษเพื่อสร้างสัมพันธภาพกับคนรุ่นใหม่',
        'ทำงานร่วมกับโรงพยาบาลและสถานสงเคราะห์ในพื้นที่',
      ],
      en: [
        'Host an evangelistic camp for youth in the neighbourhood',
        'Launch English classes to connect with the next generation',
        'Partner with local hospitals and shelters for practical care',
      ],
    },
    pinned: true,
  },
  {
    slug: 'family-discipleship',
    title: {
      th: 'สร้างสาวกในครอบครัว',
      en: 'Forming Disciples at Home',
    },
    theme: {
      th: 'ครอบครัวคือคริสตจักรเล็ก',
      en: 'Every household is a small church',
    },
    summary: {
      th: 'พัฒนาหัวหน้าครอบครัวให้เป็นผู้นำด้านจิตวิญญาณ ผ่านการอบรม การนมัสการประจำบ้าน และกลุ่มสามัคคีธรรมย่อย',
      en: 'We equip parents and guardians to shepherd their homes through training, home worship, and intimate fellowship groups.',
    },
    description: {
      th: 'คริสตจักรจัดหลักสูตรสั้นและเวิร์กช็อปเพื่อเสริมสร้างให้พ่อแม่และผู้ปกครองนำครอบครัวในทางพระเจ้า เราสร้างสื่อประกอบการศึกษาพระคัมภีร์สำหรับเด็กและวัยรุ่น รวมถึงค่ายครอบครัวเพื่อฟื้นฟูความสัมพันธ์ทั้งในบ้านและกับพระเจ้า',
      en: 'We host short courses and workshops that help parents lead their families spiritually. Custom discipleship resources for children and teens, together with family retreats, renew both relationships and devotion to Christ.',
    },
    focusAreas: {
      th: ['การเป็นสาวกในครอบครัว', 'การนมัสการในบ้าน', 'การอบรมพ่อแม่'],
      en: ['Family discipleship', 'Home worship', 'Parent coaching'],
    },
    scripture: {
      reference: {
        th: 'โยชูวา 24:15',
        en: 'Joshua 24:15',
      },
      text: {
        th: 'ส่วนข้าพเจ้าและครอบครัวของข้าพเจ้า เราจะปรนนิบัติพระเจ้า',
        en: 'As for me and my household, we will serve the Lord.',
      },
    },
    nextSteps: {
      th: [
        'เปิดกลุ่มเรียนพระคัมภีร์ออนไลน์สำหรับครอบครัว',
        'สร้างคู่มือกิจกรรมสำหรับการนมัสการในบ้าน',
        'จัดทีมพี่เลี้ยงให้ครอบครัวใหม่ในคริสตจักร',
      ],
      en: [
        'Launch an online Bible study track for families',
        'Publish home worship activity guides',
        'Pair new families with seasoned mentors',
      ],
    },
    pinned: true,
  },
  {
    slug: 'youth-discipleship',
    title: {
      th: 'เยาวชนผู้เป็นผู้นำแห่งอนาคต',
      en: 'Raising Tomorrow’s Leaders',
    },
    theme: {
      th: 'เติบโตในพระวจนะและการรับใช้',
      en: 'Growing in the Word and in service',
    },
    summary: {
      th: 'หนุนเสริมเยาวชนให้รักพระเจ้า รับใช้ด้วยของประทาน และเป็นพยานในโรงเรียนและมหาวิทยาลัย',
      en: 'We empower youth to love Jesus, serve with their gifts, and witness on their campuses.',
    },
    description: {
      th: 'ทีมเยาวชนจัดการนมัสการประจำสัปดาห์ กลุ่มย่อย และกิจกรรมค่ายฤดูร้อนเพื่อเสริมสร้างชีวิตฝ่ายวิญญาณ เราให้โอกาสเยาวชนได้ทำงานร่วมกับทีมสื่อ เสียงเพลง และกิจกรรมชุมชน เพื่อค้นพบของประทานและใช้มันเพื่อพระมหาบัญชา',
      en: 'Weekly youth services, small groups, and summer camps strengthen spiritual lives. Students serve alongside media, music, and outreach teams to discover and deploy their gifts for the Great Commission.',
    },
    focusAreas: {
      th: ['การเป็นสาวกของเยาวชน', 'การให้คำปรึกษา', 'การพัฒนาของประทาน'],
      en: ['Youth discipleship', 'Mentoring', 'Gift development'],
    },
    scripture: {
      reference: {
        th: '1 ทิโมธี 4:12',
        en: '1 Timothy 4:12',
      },
      text: {
        th: 'อย่าให้ผู้หนึ่งผู้ใดดูหมิ่นความเป็นคนหนุ่มของท่าน แต่จงเป็นตัวอย่างแก่ผู้เชื่อทั้งหลาย',
        en: 'Do not let anyone look down on you because you are young, but set an example for the believers.',
      },
    },
    nextSteps: {
      th: [
        'สร้างโปรแกรมพี่เลี้ยงสำหรับเยาวชนปีหนึ่ง',
        'จัดค่ายผู้นำเยาวชนประจำปี',
        'ร่วมมือกับคริสตจักรเพื่อนบ้านเพื่อจัดกิจกรรมร่วมกัน',
      ],
      en: [
        'Launch a mentoring track for first-year students',
        'Host the annual youth leadership camp',
        'Collaborate with nearby churches for joint gatherings',
      ],
    },
    pinned: false,
  },
  {
    slug: 'worship-ministry',
    title: {
      th: 'พันธกิจนมัสการ',
      en: 'Worship Ministry',
    },
    theme: {
      th: 'ถวายเกียรติแด่พระเจ้าด้วยสุดใจ',
      en: 'Honouring God with all our hearts',
    },
    summary: {
      th: 'พัฒนาทีมงานนมัสการให้มีมาตรฐานทั้งด้านดนตรี เทคโนโลยี และชีวิตฝ่ายวิญญาณ เพื่อรับใช้คริสตจักรอย่างถวายเกียรติ',
      en: 'We invest in worship teams musically, technically, and spiritually so they can lead the church with excellence.',
    },
    description: {
      th: 'ทีมงานนมัสการจัดการฝึกอบรมด้านดนตรี การสื่อสาร และการนำการนมัสการ เราพัฒนาชุดคู่มือการเตรียมใจผู้นำ และทำงานร่วมกับฝ่ายมัลติมีเดียเพื่อสร้างบรรยากาศการนมัสการที่เต็มด้วยพระสิริของพระเจ้า',
      en: 'Training covers musicianship, communication, and worship-leading disciplines. Devotional guides and collaboration with the media team help create Christ-exalting gatherings.',
    },
    focusAreas: {
      th: ['การนมัสการ', 'การอบรมทีมงาน', 'การจัดการระบบเสียงและสื่อ'],
      en: ['Corporate worship', 'Team training', 'Production systems'],
    },
    scripture: {
      reference: {
        th: 'สดุดี 96:9',
        en: 'Psalm 96:9',
      },
      text: {
        th: 'จงนมัสการพระเจ้าในสง่าราศีแห่งความบริสุทธิ์ของพระองค์',
        en: 'Worship the Lord in the splendour of his holiness.',
      },
    },
    nextSteps: {
      th: [
        'จัดอบรมดนตรีสรรเสริญสำหรับสมาชิกใหม่',
        'อัปเกรดระบบเสียงและการถ่ายทอดสด',
        'สร้างคลังเพลงสรรเสริญภาษาไทยร่วมสมัย',
      ],
      en: [
        'Host a praise music workshop for new volunteers',
        'Upgrade sound and livestream infrastructure',
        'Build a contemporary Thai worship song library',
      ],
    },
    pinned: false,
  },
  {
    slug: 'global-missions',
    title: {
      th: 'พันธกิจสู่ต่างประเทศ',
      en: 'Global Missions',
    },
    theme: {
      th: 'ส่งผู้รับใช้ไปถึงสุดปลายแผ่นดิน',
      en: 'Sending workers to the ends of the earth',
    },
    summary: {
      th: 'ร่วมมือกับพันธมิตรในภูมิภาคอาเซียนเพื่อประกาศข่าวประเสริฐ สนับสนุนมิชชันนารี และจัดทีมสั้นระยะไปช่วยงาน',
      en: 'We partner across ASEAN to share the gospel, support missionaries, and send short-term teams.',
    },
    description: {
      th: 'คริสตจักรสนับสนุนมิชชันนารีเต็มเวลา และจัดทีมระยะสั้นออกไปช่วยงานในประเทศเพื่อนบ้าน ปีนี้เรามุ่งเน้นการทำงานกับชุมชนคนไทยในต่างแดน และสนับสนุนการปลูกคริสตจักรใหม่ในพื้นที่ที่ยังเข้าถึงได้ยาก',
      en: 'Our church funds full-time missionaries and deploys short-term teams in neighbouring nations. This year we focus on Thai diaspora communities and planting churches in hard-to-reach regions.',
    },
    focusAreas: {
      th: ['การส่งมิชชันนารี', 'การอธิษฐานทวีประเทศ', 'การหนุนใจและทรัพยากรเพื่อการรับใช้'],
      en: ['Missionary sending', 'Intercession for nations', 'Encouragement and resources for ministry'],
    },
    scripture: {
      reference: {
        th: 'กิจการ 1:8',
        en: 'Acts 1:8',
      },
      text: {
        th: 'แต่ท่านทั้งหลายจะได้รับฤทธิ์เดชเมื่อพระวิญญาณบริสุทธิ์เสด็จมาเหนือท่าน และจะเป็นพยานของเราทั้งในเยรูซาเล็ม ยูเดีย สะมาเรีย และถึงที่สุดปลายแผ่นดินโลก',
        en: 'You will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, Judea, Samaria, and to the ends of the earth.',
      },
    },
    nextSteps: {
      th: [
        'จัดทีมสั้นระยะไปช่วยงานคริสตจักรพี่น้องในลาว',
        'สนับสนุนทุนการศึกษาแก่บุตรของมิชชันนารี',
        'เปิดห้องอธิษฐานรายสัปดาห์เพื่อประเทศเพื่อนบ้าน',
      ],
      en: [
        'Send a short-term team to support partner churches in Laos',
        'Provide scholarships for missionary children',
        'Open a weekly intercession room for neighbouring nations',
      ],
    },
    pinned: false,
  },
  {
    slug: 'care-ministry',
    title: {
      th: 'ดูแลผู้สูงอายุและผู้ป่วย',
      en: 'Care for Seniors & the Sick',
    },
    theme: {
      th: 'เป็นมือและหัวใจของพระคริสต์',
      en: 'Being the hands and heart of Christ',
    },
    summary: {
      th: 'เยี่ยมเยียน ดูแล ให้กำลังใจ และจัดการนมัสการในบ้านสำหรับผู้สูงอายุและผู้ป่วยที่ไม่สามารถมาคริสตจักรได้',
      en: 'We visit, care for, and encourage seniors and patients who cannot attend church, bringing worship into their homes.',
    },
    description: {
      th: 'ทีมดูแลเยี่ยมเยียนประจำทุกสัปดาห์เพื่ออธิษฐาน หนุนใจ และแสดงความรักของพระเจ้าแก่ผู้ป่วยและผู้สูงอายุ เราจัดบริการนมัสการย่อมๆ ในบ้านและโรงพยาบาล พร้อมมอบรายการสื่อเฝ้าเดี่ยวให้สมาชิกติดตามได้ด้วยตนเอง',
      en: 'Each week our care team prays with and encourages homebound members, offering small worship services and devotional resources so they can stay connected to the church family.',
    },
    focusAreas: {
      th: ['การเยี่ยมเยียน', 'การดูแลด้านจิตวิญญาณ', 'การหนุนใจผู้ดูแล'],
      en: ['Visitation ministry', 'Spiritual care', 'Caregiver support'],
    },
    scripture: {
      reference: {
        th: 'มัทธิว 25:36',
        en: 'Matthew 25:36',
      },
      text: {
        th: 'เราเจ็บป่วยท่านได้มาเยี่ยมเรา',
        en: 'I was sick and you came to visit me.',
      },
    },
    nextSteps: {
      th: [
        'จัดอบรมอาสาสมัครด้านการเยี่ยมเยียนเชิงจิตวิญญาณ',
        'สร้างเครือข่ายกับโรงพยาบาลในจังหวัด',
        'ผลิตสื่อเสียงเฝ้าเดี่ยวสำหรับผู้สูงอายุ',
      ],
      en: [
        'Train volunteers in spiritual caregiving',
        'Build partnerships with provincial hospitals',
        'Produce audio devotionals for seniors',
      ],
    },
    pinned: false,
  },
];

function loadSiteDataSnapshot() {
  try {
    const siteDataPath = path.resolve(__dirname, '../content/site-data.json');
    const raw = fs.readFileSync(siteDataPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[seed] Unable to load site-data.json snapshot:', error.message);
    return null;
  }
}

function normalizeSchedule(schedule = '') {
  return schedule.replace(/\s+/g, ' ').trim();
}

function slugifyTitle(title, index) {
  if (!title) {
    return `mission-${index + 1}`;
  }
  const ascii = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return ascii || `mission-${index + 1}`;
}

function buildMissionsSeedFromSite(siteData) {
  if (!siteData || !Array.isArray(siteData.upcomingEvents) || siteData.upcomingEvents.length === 0) {
    return null;
  }

  return siteData.upcomingEvents.map((event, index) => {
    const title = event?.title?.trim() || `กิจกรรมพิเศษ ${index + 1}`;
    const schedule = normalizeSchedule(event?.schedule ?? '');
    const date = normalizeSchedule(event?.date ?? '');
    const headline = [date, schedule].filter(Boolean).join(' • ') || title;
    const description =
      schedule || date
        ? `กำหนดการ: ${headline}`
        : `กิจกรรม "${title}" จากปฏิทินกิจกรรมของคริสตจักรชลบุรี`;

    return {
      slug: slugifyTitle(title, index),
      title: {
        th: title,
        en: title,
      },
      theme: {
        th: 'กิจกรรมคริสตจักร',
        en: 'Church activity',
      },
      summary: {
        th: headline,
        en: headline,
      },
      description: {
        th: description,
        en: description,
      },
      focusAreas: {
        th: ['การนมัสการ', 'การสามัคคีธรรม', 'การอธิษฐาน'],
        en: ['Worship', 'Fellowship', 'Prayer'],
      },
      scripture: null,
      nextSteps: {
        th: [
          `ร่วมอธิษฐานสำหรับ "${title}"`,
          'ชวนครอบครัวและเพื่อนมาร่วมกิจกรรม',
          'ติดต่อผู้นำคริสตจักรเพื่อร่วมรับใช้',
        ],
        en: [
          `Pray for "${title}"`,
          'Invite friends and family to join',
          'Contact church leaders to serve together',
        ],
      },
      pinned: index < 2,
      heroImageUrl: null,
      images: [],
      startDate: null,
      endDate: null,
    };
  });
}

function buildProjectsSeedFromSite(siteData) {
  if (!siteData || !Array.isArray(siteData.news) || siteData.news.length === 0) {
    return [];
  }

  return siteData.news.map((item, index) => {
    const name = item?.title?.trim() || `ข่าวคริสตจักร ${index + 1}`;
    const description = (item?.description || item?.meta || '').trim();
    const targetAmount = 100000 + index * 25000;
    const currentAmount = Math.round(targetAmount * 0.45);

    return {
      name,
      description,
      targetAmount,
      currentAmount,
      priority: siteData.news.length - index,
      isActive: true,
      images: item?.image ? [item.image] : [],
    };
  });
}

const siteDataSnapshot = loadSiteDataSnapshot();
const missionsSeed = buildMissionsSeedFromSite(siteDataSnapshot) ?? fallbackMissionsSeed;
const projectsSeed = buildProjectsSeedFromSite(siteDataSnapshot);

const fallbackContactInfoSeed = {
  id: 1,
  name: {
    th: 'คริสตจักรชลบุรี ภาค 7',
    en: 'Chonburi Church, Region 7',
  },
  phone: '033-126404, 080-5664871',
  email: 'chounburichurch.info@gmail.com',
  address: {
    th: '528/10 ถนนราษฎร์ประสงค์ ตำบลมะขามหย่ง อำเภอเมือง จังหวัดชลบุรี 20000',
    en: '528/10 Ratsadornprasong Road, Makham Yong, Mueang Chonburi, Chonburi 20000',
  },
  social: {
    facebook: 'https://www.facebook.com/ChonburiChurch',
    facebookLive: 'https://www.facebook.com/ChonburiChurch/live/',
    youtube: 'https://www.youtube.com/@ChonburiChurch',
  },
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.23072979261!2d100.9818814148232!3d13.36440269057635!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3102b407a51c4f5f%3A0x67c51ce81a95e01!2z4LiE4Lij4Li04LmA4LiX4Lio4Lih4Li14Lii4Li14Liq4Li44Lih4Li54LilIOC4geC4suC4o-C4sOC4iuC4suC4peC4seC4lyA3!5e0!3m2!1sen!2sth!4v1730322384196!5m2!1sen!2sth',
  coordinates: {
    latitude: 13.3644026,
    longitude: 100.9818814,
  },
  worshipTimes: [
    {
      day: {
        th: 'วันอาทิตย์',
        en: 'Sunday',
      },
      time: '09:30 - 10:00',
      event: {
        th: 'ศึกษาพระคัมภีร์',
        en: 'Bible Study',
      },
    },
    {
      day: {
        th: 'วันอาทิตย์',
        en: 'Sunday',
      },
      time: '10:00 - 12:00',
      event: {
        th: 'นมัสการและเทศนา',
        en: 'Worship Gathering & Sermon',
      },
    },
    {
      day: {
        th: 'วันพุธ',
        en: 'Wednesday',
      },
      time: '08:00',
      event: {
        th: 'เยี่ยมเยียนสมาชิก',
        en: 'Member Visitation',
      },
    },
    {
      day: {
        th: 'วันพฤหัสบดี',
        en: 'Thursday',
      },
      time: '19:00',
      event: {
        th: 'นมัสการตามบ้าน',
        en: 'Home Worship',
      },
    },
    {
      day: {
        th: 'วันศุกร์',
        en: 'Friday',
      },
      time: '19:00',
      event: {
        th: 'ประชุมอธิษฐาน',
        en: 'Prayer Meeting',
      },
    },
  ],
};

function buildContactInfoSeed(siteData) {
  if (!siteData || !siteData.contact) {
    return null;
  }

  const { contact } = siteData;
  const addressLines = Array.isArray(contact.address) ? contact.address : [];
  const thaiAddress = addressLines
    .filter((line) => !/โทร/.test(line))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const phoneLine = contact.phone
    ? contact.phone
    : addressLines.find((line) => /โทร/.test(line));

  const phone = phoneLine
    ? phoneLine.replace(/.*โทร[.:]?\s*/i, '').replace(/\s+/g, ' ').replace(/^,/, '').trim()
    : null;

  return {
    ...fallbackContactInfoSeed,
    phone: phone || fallbackContactInfoSeed.phone,
    address: {
      ...fallbackContactInfoSeed.address,
      th: thaiAddress || fallbackContactInfoSeed.address.th,
    },
  };
}

const contactInfoSeed = buildContactInfoSeed(siteDataSnapshot) ?? fallbackContactInfoSeed;

const navigationSeed = [
  {
    label: {
      th: 'หน้าแรก',
      en: 'Home',
    },
    href: '/',
    order: 1,
  },
  {
    label: {
      th: 'เกี่ยวกับเรา',
      en: 'About',
    },
    href: '/about',
    order: 2,
  },
  {
    label: {
      th: 'การนมัสการ',
      en: 'Worship',
    },
    href: '/worship',
    order: 3,
  },
  {
    label: {
      th: 'พันธกิจ',
      en: 'Missions',
    },
    href: '/missions',
    order: 4,
  },
  {
    label: {
      th: 'โครงการ',
      en: 'Projects',
    },
    href: '/projects',
    order: 5,
  },
  {
    label: {
      th: 'การเงิน',
      en: 'Finance',
    },
    href: '/financial',
    order: 6,
  },
  {
    label: {
      th: 'ติดต่อเรา',
      en: 'Contact',
    },
    href: '/contact',
    order: 7,
  },
];

const pageContentSeed = [
  {
    page: 'landing',
    section: 'hero',
    title: {
      th: 'ยินดีต้อนรับสู่คริสตจักรชลบุรี',
      en: 'Welcome to Chonburi Church',
    },
    description: {
      th: 'ร่วมเดินไปกับเราในการประกาศพระกิตติคุณ สร้างสาวก และดูแลชุมชนด้วยความรักของพระคริสต์',
      en: 'Join us as we proclaim the gospel, make disciples, and care for our city with the love of Christ.',
    },
    body: {
      tagline: {
        th: 'ร่วมนำข่าวประเสริฐสู่ชุมชนของเรา',
        en: 'Partner with us to reach our community',
      },
      cta: {
        href: '/missions',
        label: {
          th: 'สำรวจพันธกิจของเรา',
          en: 'Explore our missions',
        },
      },
    },
  },
  {
    page: 'landing',
    section: 'featured',
    subtitle: {
      th: 'กิจกรรมและการนมัสการ',
      en: 'Gatherings & Worship',
    },
    title: {
      th: 'เข้าร่วมนมัสการและสามัคคีธรรมกับเรา',
      en: 'Worship and grow together with us',
    },
    description: {
      th: 'ร่วมมอบเวลาพิเศษแด่พระเจ้าในทุกวันอาทิตย์ และต่อยอดความสัมพันธ์ผ่านกิจกรรมที่หนุนใจทุกวัย',
      en: 'Set apart time to worship God each Sunday and grow deeper through gatherings designed for every generation.',
    },
    body: {
      bullets: {
        th: [
          'การนมัสการประจำสัปดาห์ พร้อมบทเรียนพระคัมภีร์สำหรับทุกวัย',
          'กลุ่มสามัคคีธรรมและกิจกรรมพิเศษสำหรับครอบครัวและเยาวชน',
          'กิจกรรมบริการสังคมและพันธกิจชุมชนตลอดปี',
        ],
        en: [
          'Weekly worship services with Bible teaching for every age',
          'Small groups and special events for families and youth',
          'Year-round community service and outreach initiatives',
        ],
      },
      cta: {
        href: '/worship',
        label: {
          th: 'ดูตารางกิจกรรม',
          en: 'View the schedule',
        },
      },
    },
  },
  {
    page: 'landing',
    section: 'promo',
    title: {
      th: 'ข่าวดีเพื่อทุกคน',
      en: 'Good news for everyone',
    },
    description: {
      th: 'Full Gospel – พระกิตติคุณเพื่อทุกครอบครัว',
      en: 'Full Gospel – The gospel for every family.',
    },
    body: {
      cta: {
        href: '/about',
        label: {
          th: 'เรียนรู้พระกิตติคุณ',
          en: 'Discover the gospel',
        },
      },
    },
  },
];

const financialRecordsSeed = [
  {
    date: new Date('2024-01-01T00:00:00.000Z'),
    notes: 'ม.ค. 2024',
    income: 125000,
    expenses: 94000,
    balance: 31000,
    incomeDetails: [
      { id: 'tithes', label: 'ถวายสิบลด', amount: 82000 },
      { id: 'offerings', label: 'ถวายพิเศษ', amount: 25000 },
      { id: 'missions-support', label: 'สนับสนุนพันธกิจ', amount: 18000 },
    ],
    expenseDetails: [
      { id: 'operations', label: 'ค่าใช้จ่ายดำเนินงาน', amount: 32000 },
      { id: 'missions', label: 'พันธกิจ', amount: 26000 },
      { id: 'benevolence', label: 'สวัสดิการสมาชิก', amount: 14000 },
      { id: 'facilities', label: 'อาคารและสาธารณูปโภค', amount: 22000 },
    ],
  },
  {
    date: new Date('2024-02-01T00:00:00.000Z'),
    notes: 'ก.พ. 2024',
    income: 118500,
    expenses: 102500,
    balance: 16000,
    incomeDetails: [
      { id: 'tithes', label: 'ถวายสิบลด', amount: 76000 },
      { id: 'offerings', label: 'ถวายพิเศษ', amount: 28000 },
      { id: 'missions-support', label: 'สนับสนุนพันธกิจ', amount: 14500 },
    ],
    expenseDetails: [
      { id: 'operations', label: 'ค่าใช้จ่ายดำเนินงาน', amount: 35000 },
      { id: 'missions', label: 'พันธกิจ', amount: 30000 },
      { id: 'benevolence', label: 'สวัสดิการสมาชิก', amount: 13000 },
      { id: 'facilities', label: 'อาคารและสาธารณูปโภค', amount: 24500 },
    ],
  },
  {
    date: new Date('2024-03-01T00:00:00.000Z'),
    notes: 'มี.ค. 2024',
    income: 132800,
    expenses: 111200,
    balance: 21600,
    incomeDetails: [
      { id: 'tithes', label: 'ถวายสิบลด', amount: 91000 },
      { id: 'offerings', label: 'ถวายพิเศษ', amount: 25500 },
      { id: 'missions-support', label: 'สนับสนุนพันธกิจ', amount: 16200 },
    ],
    expenseDetails: [
      { id: 'operations', label: 'ค่าใช้จ่ายดำเนินงาน', amount: 36000 },
      { id: 'missions', label: 'พันธกิจ', amount: 31000 },
      { id: 'benevolence', label: 'สวัสดิการสมาชิก', amount: 15000 },
      { id: 'facilities', label: 'อาคารและสาธารณูปโภค', amount: 29200 },
    ],
  },
];

async function seedProjects() {
  await prisma.futureProject.deleteMany();
  if (!projectsSeed.length) {
    return;
  }

  for (const project of projectsSeed) {
    await prisma.futureProject.create({ data: project });
  }
}

async function seedMissions() {
  await prisma.mission.deleteMany();
  for (const mission of missionsSeed) {
    await prisma.mission.create({ data: mission });
  }
}

async function seedContactInfo() {
  await prisma.contactInfo.upsert({
    where: { id: contactInfoSeed.id },
    update: {
      name: contactInfoSeed.name,
      phone: contactInfoSeed.phone,
      email: contactInfoSeed.email,
      address: contactInfoSeed.address,
      social: contactInfoSeed.social,
      mapEmbedUrl: contactInfoSeed.mapEmbedUrl,
      coordinates: contactInfoSeed.coordinates,
      worshipTimes: contactInfoSeed.worshipTimes,
    },
    create: contactInfoSeed,
  });
}

async function seedNavigation() {
  await prisma.navigationItem.deleteMany();
  for (const item of navigationSeed) {
    await prisma.navigationItem.create({ data: item });
  }
}

async function seedPageContent() {
  await prisma.pageContent.deleteMany();
  for (const content of pageContentSeed) {
    await prisma.pageContent.create({ data: content });
  }
}

async function seedFinancialRecords() {
  await prisma.financialRecord.deleteMany();
  for (const record of financialRecordsSeed) {
    await prisma.financialRecord.create({ data: record });
  }
}

async function main() {
  await seedProjects();
  await seedMissions();
  await seedContactInfo();
  await seedNavigation();
  await seedPageContent();
  await seedFinancialRecords();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
