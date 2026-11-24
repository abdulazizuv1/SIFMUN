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
import type { Committee, FaqItem, Question, SeasonCommittee } from './types'

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

/** The delegate application, rebuilt from the Google Form the organisers used before. */
export const SEASON3_QUESTIONS: Question[] = [
  q('name', 'short', { en: 'Full name', uz: 'Toʻliq ismingiz', ru: 'Полное имя' }, true, 0),
  q('email', 'email', { en: 'Email', uz: 'Email', ru: 'Email' }, true, 1),
  q('study', 'short', { en: 'Place of study or work', uz: 'Oʻqish yoki ish joyingiz', ru: 'Место учёбы или работы' }, true, 2),
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
