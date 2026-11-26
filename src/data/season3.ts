/* Season III: everything the organisers confirmed on 24 November 2026.
   Date 3 January 2027, fee 100,000 UZS, six committees, each with its own working
   language, and the delegate application rebuilt from the Google Form used so far.

   Used twice: by the seed (a fresh database starts with it) and by the admin's
   one-time "Apply the Season III update" action (the live database already exists).

   Committee descriptions are written in the committee's working language on
   purpose: a visitor reads about the EU committee in Russian and about HRC in
   Uzbek, whatever language the site is in. Uzbek and Russian copy is a draft
   waiting for review by a native speaker. */
import type { L } from '../i18n'
import type { Committee, FaqItem, GalleryItem, Question, SeasonCommittee } from './types'

export const SEASON3_DATE = '2027-01-03'

export const SEASON3_FEE: L = { en: '100,000 UZS', uz: '100 000 soʻm', ru: '100 000 сум' }

const empty = (): L => ({ en: '', uz: '', ru: '' })

/** New committees. HRC already exists from Seasons I and II and is reused. */
export const SEASON3_NEW_COMMITTEES: Committee[] = [
  {
    id: 'eu',
    abbr: 'ЕС',
    name: { en: 'European Union', uz: 'Yevropa Ittifoqi', ru: 'Европейский союз' },
    blurb: {
      en: 'Twenty-seven states deciding together.',
      uz: 'Yigirma yetti davlat birgalikda qaror qabul qiladi.',
      ru: 'Двадцать семь государств, которые решают вместе.',
    },
    photo: null,
    order: 6,
  },
  {
    id: 'cedaw',
    abbr: 'CEDAW',
    name: {
      en: 'Committee on the Elimination of Discrimination against Women',
      uz: 'Xotin-qizlarga nisbatan kamsitishga barham berish qoʻmitasi',
      ru: 'Комитет по ликвидации дискриминации в отношении женщин',
    },
    blurb: {
      en: 'Equal rights for women, in law and in life.',
      uz: 'Xotin-qizlarning qonunda va hayotda teng huquqlari.',
      ru: 'Равные права женщин в законе и в жизни.',
    },
    photo: null,
    order: 7,
  },
  {
    id: 'unsc',
    abbr: 'UNSC',
    name: { en: 'Security Council', uz: 'Xavfsizlik Kengashi', ru: 'Совет Безопасности' },
    blurb: {
      en: 'War, peace and the power of the veto.',
      uz: 'Urush, tinchlik va veto kuchi.',
      ru: 'Война, мир и сила вето.',
    },
    photo: null,
    order: 8,
  },
  {
    id: 'ga',
    abbr: 'GA',
    name: { en: 'General Assembly', uz: 'Bosh Assambleya', ru: 'Генеральная Ассамблея' },
    blurb: {
      en: 'Every member state, one equal vote.',
      uz: 'Har bir aʼzo davlat, bitta teng ovoz.',
      ru: 'Каждое государство, один равный голос.',
    },
    photo: null,
    order: 9,
  },
  {
    id: 'interpol',
    abbr: 'INTERPOL',
    name: {
      en: 'International Criminal Police Organization',
      uz: 'Xalqaro jinoiy politsiya tashkiloti',
      ru: 'Международная организация уголовной полиции',
    },
    blurb: {
      en: 'Police cooperation across borders.',
      uz: 'Chegaralar osha politsiya hamkorligi.',
      ru: 'Сотрудничество полиции поверх границ.',
    },
    photo: null,
    order: 10,
  },
]

const sc = (committeeId: string, language: SeasonCommittee['language'], about: string, double = false): SeasonCommittee => ({
  committeeId,
  agenda: empty(),
  chairIds: [],
  language,
  double,
  about,
})

/** The six committees of Season III, in the order the organisers listed them. */
export const SEASON3_COMMITTEES: SeasonCommittee[] = [
  sc(
    'eu',
    'ru',
    'Европейский союз объединяет двадцать семь государств, которые договорились решать вместе многое из того, что обычно решают поодиночке: торговлю, границы, климат, энергетику, права человека. Здесь мало просто сказать «нет». Решения рождаются в долгих переговорах, где каждая страна отстаивает свои интересы и при этом знает, что без соседей ей не справиться.\n\nЭто комитет двойной делегации. Каждую страну представляют два делегата: вы вместе готовите позицию, делите между собой выступления и переговоры и отвечаете за страну как одна команда. Если напарник у вас уже есть, укажите его в заявке.\n\nРабочий язык комитета: русский.',
    true,
  ),
  sc(
    'cedaw',
    'en',
    'CEDAW guards one promise: the 1979 Convention on the Elimination of All Forms of Discrimination against Women, signed by almost every country in the world. In this committee you look at the places where that promise breaks. Unequal pay. Girls kept out of school. Violence behind closed doors. Laws that still treat women as less.\n\nYou speak for your country: what it has done, what it has not, and what the world should ask of it next.\n\nThe working language is English.',
  ),
  sc(
    'unsc',
    'en',
    'Fifteen seats, five of them permanent, and the only UN body whose decisions every member state is bound to carry out. The Security Council meets when peace breaks: wars, ceasefires, sanctions, peacekeeping missions.\n\nDebate here is fast and the stakes are high. Any one of the five permanent members can stop a resolution with a single vote against, so every clause is negotiated twice. Come ready to argue under pressure and to find the one wording that no one vetoes.\n\nThe working language is English.',
  ),
  sc(
    'ga',
    'en',
    'The one room where every member state has a seat and an equal vote: 193 countries, from the largest to the smallest. The General Assembly debates what the whole world shares, from development and disarmament to health and climate.\n\nIt is the largest committee of the day. Alliances form across continents, small states count as much as great powers, and a good speech can move a whole bloc. A strong place for your first conference.\n\nThe working language is English.',
  ),
  sc(
    'hrc',
    'uz',
    'Inson huquqlari boʻyicha kengash BMTning 47 aʼzo davlatdan iborat organi. U dunyoning istalgan burchagida inson huquqlari qanday himoya qilinayotganini kuzatadi: soʻz erkinligi, kamsitish, qochqinlar va urush qurbonlarining taqdiri shu yerda muhokama qilinadi.\n\nSiz oʻz davlatingiz pozitsiyasini himoya qilasiz, ittifoqchilar topasiz va jahon hamjamiyatiga tavsiyalar beradigan rezolyutsiya ustida ishlaysiz.\n\nQoʻmitaning ish tili: oʻzbek tili.',
  ),
  sc(
    'interpol',
    'en',
    'INTERPOL connects the police of 196 countries so that crime cannot hide behind a border. It arrests no one itself. It shares information, issues notices for wanted and missing people, and helps states act together against terrorism, trafficking and cybercrime.\n\nIn this committee you balance two things every state wants at once: catching criminals, and keeping full control over its own territory and its own citizens.\n\nThe working language is English.',
  ),
]

const q = (
  id: string,
  type: Question['type'],
  label: L,
  required: boolean,
  order: number,
  options: L[] = [],
): Question => ({ id, type, label, required, options, order })

/** Added on 25 November 2026: where the delegate comes from, and whether they need a dormitory.
    The live database gets them from a one-time admin action that inserts them after "Place of study or work". */
export const SEASON3_EXTRA_QUESTIONS: Question[] = [
  q('location', 'short', { en: 'City and country you come from', uz: 'Qaysi shahar va davlatdansiz?', ru: 'Из какого вы города и страны?' }, true, 3),
  q(
    'dorm',
    'single',
    { en: 'Do you need a dormitory during the conference?', uz: 'Konferensiya davomida sizga yotoqxona kerakmi?', ru: 'Нужно ли вам общежитие на время конференции?' },
    true,
    4,
    [
      { en: 'Yes', uz: 'Ha', ru: 'Да' },
      { en: 'No', uz: 'Yoʻq', ru: 'Нет' },
    ],
  ),
]

/** The delegate application, rebuilt from the Google Form the organisers used before. */
export const SEASON3_QUESTIONS: Question[] = [
  q('name', 'short', { en: 'Full name', uz: 'Toʻliq ismingiz', ru: 'Полное имя' }, true, 0),
  q('email', 'email', { en: 'Email', uz: 'Email', ru: 'Email' }, true, 1),
  q('study', 'short', { en: 'Place of study or work', uz: 'Oʻqish yoki ish joyingiz', ru: 'Место учёбы или работы' }, true, 2),
  ...SEASON3_EXTRA_QUESTIONS,
  q('telegram', 'short', { en: 'Telegram username', uz: 'Telegram foydalanuvchi nomingiz', ru: 'Имя пользователя в Telegram' }, true, 3),
  q('phone', 'phone', { en: 'Phone number', uz: 'Telefon raqamingiz', ru: 'Номер телефона' }, true, 4),
  q(
    'experience',
    'long',
    {
      en: 'Your MUN experience. If you have none, write "N/A".',
      uz: 'MUN tajribangiz. Agar boʻlmasa, «N/A» deb yozing.',
      ru: 'Ваш опыт MUN. Если опыта нет, напишите «N/A».',
    },
    true,
    5,
  ),
  q('committee', 'committees', { en: 'Your committee', uz: 'Qoʻmitangiz', ru: 'Ваш комитет' }, true, 6),
  q(
    'country',
    'short',
    { en: 'The country you would like to represent', uz: 'Vakil boʻlishni xohlagan davlatingiz', ru: 'Страна, которую вы хотели бы представлять' },
    false,
    7,
  ),
  q(
    'why',
    'long',
    { en: 'Why would you be a great delegate?', uz: 'Nega aynan siz ajoyib delegat boʻlasiz?', ru: 'Почему из вас выйдет отличный делегат?' },
    false,
    8,
  ),
  q('english', 'single', { en: 'Your English level', uz: 'Ingliz tili darajangiz', ru: 'Ваш уровень английского' }, false, 9, [
    { en: 'A1-A2', uz: 'A1-A2', ru: 'A1-A2' },
    { en: 'B1-B2', uz: 'B1-B2', ru: 'B1-B2' },
    { en: 'C1-C2', uz: 'C1-C2', ru: 'C1-C2' },
  ]),
  q(
    'agree',
    'multiple',
    {
      en: 'I agree to be photographed during the conference and to have the photos published. Once my application is accepted, I will pay the participation fee of 100,000 UZS, which is non-refundable.',
      uz: 'Konferensiya davomida suratga olinishimga va suratlar eʼlon qilinishiga roziman. Arizam qabul qilingach, 100 000 soʻm miqdoridagi ishtirok badalini toʻlayman. Badal qaytarilmaydi.',
      ru: 'Я согласен(на), что меня будут фотографировать на конференции и фотографии опубликуют. После одобрения заявки я оплачу взнос за участие, 100 000 сум. Взнос не возвращается.',
    },
    true,
    10,
    [{ en: 'Yes', uz: 'Ha', ru: 'Да' }],
  ),
]

/** The chair application (added 26 November 2026). The organisers asked for experience,
    "why SIFMUN" and the silent-committee scenario; the rest covers what a Secretariat
    needs to pick and place chairs. */
export const SEASON3_CHAIR_QUESTIONS: Question[] = [
  q('name', 'short', { en: 'Full name', uz: 'Ism va familiyangiz', ru: 'Имя и фамилия' }, true, 0),
  q('email', 'email', { en: 'Email', uz: 'Email', ru: 'Email' }, true, 1),
  q('phone', 'phone', { en: 'Phone number', uz: 'Telefon raqamingiz', ru: 'Номер телефона' }, true, 2),
  q('telegram', 'short', { en: 'Telegram username', uz: 'Telegram foydalanuvchi nomingiz', ru: 'Имя пользователя в Telegram' }, true, 3),
  q('study', 'short', { en: 'Place of study or work', uz: 'Oʻqish yoki ish joyingiz', ru: 'Место учёбы или работы' }, true, 4),
  q('location', 'short', { en: 'City and country you come from', uz: 'Qaysi shahar va davlatdansiz?', ru: 'Из какого вы города и страны?' }, true, 5),
  q(
    'experience',
    'long',
    {
      en: 'Your MUN experience: conferences, committees and roles (delegate, chair, Secretariat), and any awards.',
      uz: 'MUN tajribangiz: konferensiyalar, qoʻmitalar va rollar (delegat, rais, kotibiyat), mukofotlar boʻlsa ularni ham yozing.',
      ru: 'Ваш опыт MUN: конференции, комитеты и роли (делегат, председатель, секретариат), а также награды, если есть.',
    },
    true,
    6,
  ),
  q(
    'committee',
    'committees',
    { en: 'The committee you would like to chair', uz: 'Qaysi qoʻmitada rais boʻlishni xohlaysiz?', ru: 'Какой комитет вы хотели бы вести?' },
    true,
    7,
  ),
  q(
    'languages',
    'multiple',
    {
      en: 'Which working languages can you chair in?',
      uz: 'Qaysi ish tillarida raislik qila olasiz?',
      ru: 'На каких рабочих языках вы можете вести комитет?',
    },
    true,
    8,
    [
      { en: 'English', uz: 'English', ru: 'English' },
      { en: 'Oʻzbekcha', uz: 'Oʻzbekcha', ru: 'Oʻzbekcha' },
      { en: 'Русский', uz: 'Русский', ru: 'Русский' },
    ],
  ),
  q(
    'procedure',
    'single',
    {
      en: 'How well do you know the rules of procedure?',
      uz: 'Protsedura qoidalarini qanchalik yaxshi bilasiz?',
      ru: 'Насколько хорошо вы знаете правила процедуры?',
    },
    true,
    9,
    [
      { en: 'I have chaired with them', uz: 'Ular boʻyicha raislik qilganman', ru: 'Я уже вёл(а) комитет по ним' },
      { en: 'I know them well as a delegate', uz: 'Delegat sifatida yaxshi bilaman', ru: 'Хорошо знаю их как делегат' },
      { en: 'I am still learning them', uz: 'Hali oʻrganyapman', ru: 'Ещё изучаю' },
    ],
  ),
  q(
    'whySif',
    'long',
    { en: 'Why SIFMUN?', uz: 'Nega aynan SIFMUN?', ru: 'Почему именно SIFMUN?' },
    true,
    10,
  ),
  q(
    'silent',
    'long',
    {
      en: 'Your committee goes quiet: no motions, no speakers, nobody moves. What do you do?',
      uz: 'Qoʻmitangiz jim qoldi: taklif yoʻq, soʻzga chiquvchi yoʻq, hech kim harakat qilmayapti. Nima qilasiz?',
      ru: 'Ваш комитет затих: нет предложений, нет выступающих, никто ничего не делает. Что вы будете делать?',
    },
    true,
    11,
  ),
  q(
    'conflict',
    'long',
    {
      en: 'A delegate keeps breaking the rules of procedure or speaks to others disrespectfully. How do you handle it?',
      uz: 'Bir delegat protsedura qoidalarini qayta-qayta buzmoqda yoki boshqalarga hurmatsizlik bilan gapirmoqda. Qanday yoʻl tutasiz?',
      ru: 'Делегат раз за разом нарушает правила процедуры или неуважительно говорит с другими. Как вы поступите?',
    },
    true,
    12,
  ),
  q(
    'dorm',
    'single',
    { en: 'Do you need a dormitory during the conference?', uz: 'Konferensiya davomida sizga yotoqxona kerakmi?', ru: 'Нужно ли вам общежитие на время конференции?' },
    true,
    13,
    [
      { en: 'Yes', uz: 'Ha', ru: 'Да' },
      { en: 'No', uz: 'Yoʻq', ru: 'Нет' },
    ],
  ),
  q(
    'commit',
    'multiple',
    {
      en: 'If I am selected, I commit to chairing my committee for the whole conference on 3 January 2027, to preparing for it in advance and to following the instructions of the Secretariat.',
      uz: 'Agar tanlansam, 2027-yil 3-yanvardagi konferensiya davomida oʻz qoʻmitamga toʻliq raislik qilishga, unga oldindan tayyorlanishga va kotibiyat koʻrsatmalariga amal qilishga majburiyat olaman.',
      ru: 'Если меня выберут, я обязуюсь вести свой комитет всю конференцию 3 января 2027 года, заранее к ней подготовиться и следовать указаниям секретариата.',
    },
    true,
    14,
    [{ en: 'Yes, I commit', uz: 'Ha, majburiyat olaman', ru: 'Да, обязуюсь' }],
  ),
]

/** FAQ answers that changed now that the date, the fee and the committees are known. */
export const SEASON3_FAQ: Pick<FaqItem, 'id' | 'answer'>[] = [
  {
    id: 'language',
    answer: {
      en: 'Each committee has one working language. The EU committee works in Russian, HRC in Uzbek, and CEDAW, the Security Council, the General Assembly and INTERPOL in English. Choose the committee in the language you argue best in.',
      uz: 'Har bir qoʻmitaning bitta ish tili bor. Yevropa Ittifoqi qoʻmitasi rus tilida, HRC oʻzbek tilida, CEDAW, Xavfsizlik Kengashi, Bosh Assambleya va INTERPOL esa ingliz tilida ishlaydi. Oʻzingiz eng yaxshi bahslashadigan tildagi qoʻmitani tanlang.',
      ru: 'У каждого комитета один рабочий язык. Комитет Европейского союза работает на русском, HRC на узбекском, а CEDAW, Совет Безопасности, Генеральная Ассамблея и INTERPOL на английском. Выбирайте комитет на том языке, на котором вам легче всего спорить.',
    },
  },
  {
    id: 'when-where',
    answer: {
      en: 'On 3 January 2027 at Fergana Digital Hub.',
      uz: '2027-yil 3-yanvar kuni, Fergana Digital Hub.',
      ru: '3 января 2027 года в Fergana Digital Hub.',
    },
  },
  {
    id: 'how-register',
    answer: {
      en: 'Fill in the form on this page. Once your application is accepted, we will contact you about the participation fee of 100,000 UZS.',
      uz: 'Shu sahifadagi shaklni toʻldiring. Arizangiz qabul qilingach, 100 000 soʻm ishtirok badali haqida siz bilan bogʻlanamiz.',
      ru: 'Заполните форму на этой странице. После одобрения заявки мы свяжемся с вами по поводу взноса за участие, 100 000 сум.',
    },
  },
]

const venuePhoto = (name: string, width: number, height: number) => ({
  src: `/media/venue/${name}.webp`,
  thumb: `/media/venue/${name}-thumb.webp`,
  width,
  height,
})

/** Photos of Fergana Digital Hub, the Season III venue. On the Register page and in Season III on History. */
export const SEASON3_VENUE: GalleryItem[] = [
  {
    id: 's3-venue-building',
    seasonId: 'season-3',
    kind: 'photo',
    photo: venuePhoto('fdh-building', 1440, 1920),
    alt: {
      en: 'Fergana Digital Hub from the outside: a glass tower and a long glass wing',
      uz: 'Fergana Digital Hub tashqaridan: shisha minora va uzun shisha qanot',
      ru: 'Fergana Digital Hub снаружи: стеклянная башня и длинное стеклянное крыло',
    },
    order: 1,
  },
  {
    id: 's3-venue-round-hall',
    seasonId: 'season-3',
    kind: 'photo',
    photo: venuePhoto('fdh-round-hall', 960, 1280),
    alt: {
      en: 'A round conference table under a gold ring chandelier',
      uz: 'Oltin halqali qandil ostidagi dumaloq konferensiya stoli',
      ru: 'Круглый стол для заседаний под золотой люстрой-кольцом',
    },
    order: 2,
  },
  {
    id: 's3-venue-boardroom',
    seasonId: 'season-3',
    kind: 'photo',
    photo: venuePhoto('fdh-boardroom', 960, 1280),
    alt: {
      en: 'A long meeting table with chairs on both sides',
      uz: 'Ikki tomonida stullar turgan uzun majlis stoli',
      ru: 'Длинный стол для заседаний со стульями по обе стороны',
    },
    order: 3,
  },
  {
    id: 's3-venue-atrium',
    seasonId: 'season-3',
    kind: 'photo',
    photo: venuePhoto('fdh-atrium', 960, 1280),
    alt: {
      en: 'The atrium seen from below, open to a glass roof',
      uz: 'Pastdan koʻrinish: shisha tomli atrium',
      ru: 'Атриум снизу, под стеклянной крышей',
    },
    order: 4,
  },
  {
    id: 's3-venue-hall',
    seasonId: 'season-3',
    kind: 'photo',
    photo: venuePhoto('fdh-hall', 960, 1280),
    alt: {
      en: 'A wide open hall with rows of tables and large windows',
      uz: 'Stollar qatorlari va katta derazalari bor keng zal',
      ru: 'Просторный зал с рядами столов и большими окнами',
    },
    order: 5,
  },
]
