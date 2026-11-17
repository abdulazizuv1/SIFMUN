/* Seed data: every confirmed fact about SIFMUN, used two ways.
   1. The public site reads it while the database is empty or not connected.
   2. The admin's one-time "Import initial data" action writes it to Firestore.

   Only confirmed facts live here. Unknown things (agendas, chairs, awards, fees,
   names of the organisers) stay empty, and the public site hides empty sections.
   Uzbek and Russian text is a draft waiting for review by a native speaker. */
import type { L } from '../i18n'
import type { Content, GalleryItem, Photo } from './types'

const same = (text: string): L => ({ en: text, uz: text, ru: text })
const empty: L = { en: '', uz: '', ru: '' }

const photo = (name: string, width: number, height: number): Photo => ({
  src: `/media/seasons/${name}.webp`,
  thumb: `/media/seasons/${name}-thumb.webp`,
  width,
  height,
})

const P = {
  s1Group: photo('s1-group', 1280, 960),
  s1Wto: photo('s1-wto', 1040, 864),
  s1Delegates: photo('s1-delegates', 1280, 960),
  s1Dais: photo('s1-dais', 1200, 960),
  s1Ecosoc: photo('s1-ecosoc', 1280, 710),
  s2Group: photo('s2-group', 1280, 960),
  s2Badges: photo('s2-badges', 630, 610),
  s2Certificate: photo('s2-certificate', 1440, 1920),
  // committee photos, all taken at Season II
  cUnodc: photo('c-unodc', 1198, 748),
  cUnicef: photo('c-unicef', 1104, 690),
  cHrc: photo('c-hrc', 1102, 688),
}

const poster = (name: string, width: number, height: number): Photo => ({
  src: `/media/seasons/${name}-poster.webp`,
  width,
  height,
})

const gallery: GalleryItem[] = [
  {
    id: 's1-dais',
    seasonId: 'season-1',
    kind: 'photo',
    photo: P.s1Dais,
    alt: {
      en: 'Chairs at the front table, a chalkboard behind them reading SIF MUN 2026',
      uz: 'Raislar oldingi stolda, ortlarida SIF MUN 2026 deb yozilgan doska',
      ru: 'Председатели за столом президиума, на доске за ними надпись SIF MUN 2026',
    },
    order: 1,
  },
  {
    id: 's1-ecosoc',
    seasonId: 'season-1',
    kind: 'photo',
    photo: P.s1Ecosoc,
    alt: {
      en: 'The ECOSOC committee in session, the committee name drawn in chalk',
      uz: 'ECOSOC qoʻmitasi majlisda, qoʻmita nomi boʻr bilan yozilgan',
      ru: 'Комитет ECOSOC за работой, название комитета написано мелом',
    },
    order: 2,
  },
  {
    id: 's1-wto',
    seasonId: 'season-1',
    kind: 'photo',
    photo: P.s1Wto,
    alt: {
      en: 'Two participants presenting the WTO committee chalkboard',
      uz: 'Ikki ishtirokchi JST qoʻmitasi doskasini koʻrsatmoqda',
      ru: 'Две участницы показывают доску комитета ВТО',
    },
    order: 3,
  },
  {
    id: 's1-delegates',
    seasonId: 'season-1',
    kind: 'photo',
    photo: P.s1Delegates,
    alt: {
      en: 'Delegates with their country placards after a session',
      uz: 'Delegatlar sessiyadan soʻng davlat tablichkalari bilan',
      ru: 'Делегаты с табличками своих стран после сессии',
    },
    order: 4,
  },
  {
    id: 's1-group',
    seasonId: 'season-1',
    kind: 'photo',
    photo: P.s1Group,
    alt: {
      en: 'A group of Season I participants',
      uz: 'I mavsum ishtirokchilari guruhi',
      ru: 'Группа участников I сезона',
    },
    order: 5,
  },
  {
    id: 's2-group',
    seasonId: 'season-2',
    kind: 'photo',
    photo: P.s2Group,
    alt: {
      en: 'Season II participants in the hall of Central Asian Medical University',
      uz: 'II mavsum ishtirokchilari Central Asian Medical University zalida',
      ru: 'Участники II сезона в холле Central Asian Medical University',
    },
    order: 1,
  },
  {
    id: 's2-certificate',
    seasonId: 'season-2',
    kind: 'photo',
    photo: P.s2Certificate,
    alt: {
      en: 'A delegate holding a certificate of participation',
      uz: 'Delegat ishtirok sertifikatini ushlab turibdi',
      ru: 'Делегат с сертификатом участника',
    },
    order: 2,
  },
  {
    id: 's2-badges',
    seasonId: 'season-2',
    kind: 'photo',
    photo: P.s2Badges,
    alt: {
      en: 'Organiser, chair and delegate badges held together in a circle',
      uz: 'Doira shaklida ushlab turilgan tashkilotchi, rais va delegat beyjlari',
      ru: 'Бейджи организатора, председателя и делегата, сложенные в круг',
    },
    order: 3,
  },
  {
    id: 's2-hall',
    seasonId: 'season-2',
    kind: 'video',
    photo: poster('s2-hall', 720, 1280),
    video: '/media/seasons/s2-hall.mp4',
    alt: {
      en: 'The committee hall with country flags on the table',
      uz: 'Stolda davlat bayroqlari turgan qoʻmita zali',
      ru: 'Зал комитета с флагами стран на столе',
    },
    order: 4,
  },
  {
    id: 's2-table',
    seasonId: 'season-2',
    kind: 'video',
    photo: poster('s2-table', 720, 1290),
    video: '/media/seasons/s2-table.mp4',
    alt: {
      en: 'Delegates at the long table during a session',
      uz: 'Delegatlar sessiya vaqtida uzun stol atrofida',
      ru: 'Делегаты за длинным столом во время сессии',
    },
    order: 5,
  },
  {
    id: 's2-session',
    seasonId: 'season-2',
    kind: 'video',
    photo: poster('s2-session', 720, 850),
    video: '/media/seasons/s2-session.mp4',
    alt: {
      en: 'A full committee room in session',
      uz: 'Majlis paytidagi toʻla qoʻmita xonasi',
      ru: 'Полный зал комитета во время заседания',
    },
    order: 6,
  },
]

const sc = (committeeId: string) => ({ committeeId, agenda: { ...empty }, chairIds: [] })

export const seed: Content = {
  settings: {
    registrationStatus: 'soon',
    upcomingSeason: 3,
    capacity: null,
    fee: { ...empty },
    // Fergana Digital Hub, from the Google Maps embed the organiser supplied.
    mapLat: 40.36612570850655,
    mapLng: 71.70611412236755,
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d470.5356962493272!2d71.70611412236755!3d40.36612570850655!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sru!2s!4v1794857160825!5m2!1sru!2s',
    telegramUrl: 'https://t.me/sifmunchanel',
    telegramHandle: '@sifmunchanel',
    instagramUrl: 'https://instagram.com/sif_mun',
    instagramHandle: 'sif_mun',
  },

  seasons: [
    {
      id: 'season-1',
      number: 1,
      status: 'past',
      date: '2026-02-15',
      venue: same('Fergana School'),
      participants: 70,
      committees: [sc('wto'), sc('ecosoc'), sc('hrc')],
      cover: P.s1Dais,
      coverAlt: gallery[0].alt,
    },
    {
      id: 'season-2',
      number: 2,
      status: 'past',
      date: '2026-04-19',
      venue: same('Central Asian Medical University'),
      participants: 120,
      committees: [sc('unodc'), sc('hrc'), sc('unicef')],
      cover: P.s2Group,
      coverAlt: gallery[5].alt,
    },
    {
      id: 'season-3',
      number: 3,
      status: 'upcoming',
      date: null,
      venue: same('Fergana Digital Hub'),
      participants: null,
      committees: [],
      cover: null,
      coverAlt: { ...empty },
    },
  ],

  committees: [
    {
      id: 'unodc',
      abbr: 'UNODC',
      name: {
        en: 'United Nations Office on Drugs and Crime',
        uz: 'BMTning Giyohvandlik va jinoyatchilik boʻyicha boshqarmasi',
        ru: 'Управление ООН по наркотикам и преступности',
      },
      blurb: {
        en: 'Crime, corruption and drug policy across borders.',
        uz: 'Chegaralar osha jinoyatchilik, korrupsiya va giyohvandlikka qarshi siyosat.',
        ru: 'Преступность, коррупция и наркополитика поверх границ.',
      },
      photo: P.cUnodc,
      order: 1,
    },
    {
      id: 'wto',
      abbr: 'WTO',
      name: {
        en: 'World Trade Organization',
        uz: 'Jahon savdo tashkiloti',
        ru: 'Всемирная торговая организация',
      },
      blurb: {
        en: 'The rules of trade between nations.',
        uz: 'Davlatlar oʻrtasidagi savdo qoidalari.',
        ru: 'Правила торговли между государствами.',
      },
      photo: P.s1Wto,
      order: 2,
    },
    {
      id: 'hrc',
      abbr: 'HRC',
      name: {
        en: 'Human Rights Council',
        uz: 'Inson huquqlari boʻyicha kengash',
        ru: 'Совет по правам человека',
      },
      blurb: {
        en: 'How states protect the rights of their people.',
        uz: 'Davlatlar oʻz xalqining huquqlarini qanday himoya qiladi.',
        ru: 'Как государства защищают права своих людей.',
      },
      photo: P.cHrc,
      order: 3,
    },
    {
      id: 'unicef',
      abbr: 'UNICEF',
      name: {
        en: "United Nations Children's Fund",
        uz: 'BMT Bolalar jamgʻarmasi',
        ru: 'Детский фонд ООН',
      },
      blurb: {
        en: 'The rights and wellbeing of every child.',
        uz: 'Har bir bolaning huquqlari va farovonligi.',
        ru: 'Права и благополучие каждого ребёнка.',
      },
      photo: P.cUnicef,
      order: 4,
    },
    {
      id: 'ecosoc',
      abbr: 'ECOSOC',
      name: {
        en: 'Economic and Social Council',
        uz: 'Iqtisodiy va ijtimoiy kengash',
        ru: 'Экономический и Социальный Совет',
      },
      blurb: {
        en: 'Economic, social and environmental policy.',
        uz: 'Iqtisodiy, ijtimoiy va ekologik siyosat.',
        ru: 'Экономическая, социальная и экологическая политика.',
      },
      photo: P.s1Ecosoc,
      order: 5,
    },
  ],

  team: [
    {
      id: 'secretary-general',
      name: { ...empty },
      role: { en: 'Secretary General', uz: 'Bosh kotib', ru: 'Генеральный секретарь' },
      bio: { ...empty },
      group: 'lead',
      seasonId: null,
      photo: null,
      order: 1,
    },
    {
      id: 'deputy-secretary-general',
      name: { ...empty },
      role: {
        en: 'Deputy Secretary General',
        uz: 'Bosh kotib oʻrinbosari',
        ru: 'Заместитель генерального секретаря',
      },
      bio: { ...empty },
      group: 'lead',
      seasonId: null,
      photo: null,
      order: 2,
    },
  ],

  awards: [],

  gallery,

  faq: [
    {
      id: 'what-is-mun',
      question: {
        en: 'What is a Model United Nations?',
        uz: 'BMT modeli nima?',
        ru: 'Что такое модель ООН?',
      },
      answer: {
        en: 'A simulation of international diplomacy. You represent a country in a committee, give speeches, negotiate with other delegates, and vote on a resolution.',
        uz: 'Bu xalqaro diplomatiya simulyatsiyasi. Siz qoʻmitada bir davlat nomidan ishtirok etasiz, nutq soʻzlaysiz, boshqa delegatlar bilan muzokara olib borasiz va rezolyutsiya uchun ovoz berasiz.',
        ru: 'Это симуляция международной дипломатии. Вы представляете страну в комитете, выступаете с речами, ведёте переговоры с другими делегатами и голосуете за резолюцию.',
      },
      order: 1,
    },
    {
      id: 'language',
      question: {
        en: 'Which language will I speak?',
        uz: 'Qaysi tilda gapiraman?',
        ru: 'На каком языке я буду выступать?',
      },
      answer: {
        en: 'Your choice of English, Uzbek or Russian. All three are working languages at SIFMUN.',
        uz: 'Ingliz, oʻzbek yoki rus tilidan birini oʻzingiz tanlaysiz. Uchalasi ham SIFMUNning ish tillari.',
        ru: 'На английском, узбекском или русском, по вашему выбору. Все три языка рабочие на SIFMUN.',
      },
      order: 2,
    },
    {
      id: 'who',
      question: {
        en: 'Who can take part?',
        uz: 'Kimlar qatnasha oladi?',
        ru: 'Кто может участвовать?',
      },
      answer: {
        en: 'School and university students.',
        uz: 'Maktab oʻquvchilari va universitet talabalari.',
        ru: 'Школьники и студенты университетов.',
      },
      order: 3,
    },
    {
      id: 'when-where',
      question: {
        en: 'When and where is Season III?',
        uz: 'III mavsum qachon va qayerda boʻladi?',
        ru: 'Когда и где пройдёт III сезон?',
      },
      answer: {
        en: 'At Fergana Digital Hub. The date will be announced on our Telegram channel and on this page.',
        uz: 'Fergana Digital Hub binosida. Sana Telegram kanalimizda va shu sahifada eʼlon qilinadi.',
        ru: 'В Fergana Digital Hub. Дату объявим в нашем Telegram-канале и на этой странице.',
      },
      order: 4,
    },
    {
      id: 'certificate',
      question: {
        en: 'Will I get a certificate?',
        uz: 'Sertifikat beriladimi?',
        ru: 'Я получу сертификат?',
      },
      answer: {
        en: 'Yes. Every participant receives a certificate of participation.',
        uz: 'Ha. Har bir ishtirokchi ishtirok sertifikatini oladi.',
        ru: 'Да. Каждый участник получает сертификат участия.',
      },
      order: 5,
    },
    {
      id: 'how-register',
      question: {
        en: 'How do I register?',
        uz: 'Qanday roʻyxatdan oʻtaman?',
        ru: 'Как зарегистрироваться?',
      },
      answer: {
        en: 'The form on this page opens when registration starts. Join our Telegram to hear the moment it does.',
        uz: 'Roʻyxatdan oʻtish boshlanganda shu sahifadagi shakl ochiladi. Birinchi boʻlib bilish uchun Telegram kanalimizga qoʻshiling.',
        ru: 'Форма на этой странице откроется, когда начнётся регистрация. Подпишитесь на наш Telegram, чтобы узнать об этом сразу.',
      },
      order: 6,
    },
  ],

  roles: [
    {
      id: 'delegate',
      name: { en: 'Delegate', uz: 'Delegat', ru: 'Делегат' },
      description: {
        en: 'Represent a country in one committee. Research, speak, negotiate, vote.',
        uz: 'Bitta qoʻmitada bir davlat nomidan ishtirok eting. Oʻrganing, soʻzlang, muzokara qiling, ovoz bering.',
        ru: 'Представляйте страну в одном комитете. Изучайте, выступайте, договаривайтесь, голосуйте.',
      },
      active: true,
      questions: [],
      order: 1,
    },
    {
      id: 'chair',
      name: { en: 'Chair', uz: 'Rais', ru: 'Председатель' },
      description: {
        en: 'Lead a committee. Keep the debate fair and moving.',
        uz: 'Qoʻmitani boshqaring. Bahs adolatli va jonli oʻtishini taʼminlang.',
        ru: 'Ведите комитет. Следите, чтобы дебаты шли честно и не останавливались.',
      },
      // Registration through the site is for delegates only. An admin can switch this role on later.
      active: false,
      questions: [],
      order: 2,
    },
  ],
}
