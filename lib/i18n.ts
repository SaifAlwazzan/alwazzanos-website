export type Lang = 'ar' | 'en';

export const t = {
  nav: {
    home:     { ar: 'الرئيسية',  en: 'Home' },
    products: { ar: 'المنتجات',  en: 'Products' },
    about:    { ar: 'عن الشركة', en: 'About' },
    contact:  { ar: 'تواصل معنا', en: 'Contact' },
  },
  hero: {
    tagline:  { ar: 'أنظمة برمجية متكاملة للقطاع الصحي والتجاري', en: 'Integrated Software Systems for Healthcare & Business' },
    sub:      { ar: 'نبني أنظمة تشغيل ذكية مصممة خصيصاً للسوق العراقي منذ 2011', en: 'Building smart operating systems tailored for the Iraqi market since 2011' },
    cta:      { ar: 'استكشف المنتجات', en: 'Explore Products' },
    contact:  { ar: 'تواصل معنا', en: 'Contact Us' },
  },
  products: {
    title:    { ar: 'أنظمتنا', en: 'Our Systems' },
    sub:      { ar: 'حلول برمجية شاملة لكل احتياجات مؤسستك', en: 'Comprehensive software solutions for every organizational need' },
    learnMore:{ ar: 'اعرف أكثر', en: 'Learn More' },
  },
  clients: {
    title:    { ar: 'عملاؤنا', en: 'Our Clients' },
    sub:      { ar: 'نفخر بثقة عملائنا في منتجاتنا', en: 'We are proud of our clients\' trust in our products' },
  },
  about: {
    title:    { ar: 'عن AlwazzanOS', en: 'About AlwazzanOS' },
    body:     {
      ar: 'تأسست شركة AlwazzanOS for Software Developing عام 2011 على يد سيف الوزان بهدف واحد: بناء أنظمة برمجية حديثة تلبي احتياجات المؤسسات العراقية. على مدار أكثر من 14 عاماً، طورنا منظومة متكاملة من الأنظمة التشغيلية تغطي القطاع الصحي والتجاري، مع دعم كامل للغة العربية والعملة العراقية.',
      en: 'AlwazzanOS for Software Developing was founded in 2011 by Saif Alwazzan with one goal: building modern software systems that meet the needs of Iraqi institutions. Over 14+ years, we developed a comprehensive suite of operating systems covering healthcare and commerce, with full Arabic language and Iraqi currency support.',
    },
    mission:  { ar: 'مهمتنا', en: 'Our Mission' },
    missionBody: {
      ar: 'تمكين المؤسسات العراقية من الكفاءة الرقمية من خلال أنظمة برمجية موثوقة، ثنائية اللغة، وسهلة الاستخدام.',
      en: 'Empowering Iraqi institutions with digital efficiency through reliable, bilingual, and user-friendly software systems.',
    },
    founded:  { ar: 'تأسست عام', en: 'Founded' },
    clients:  { ar: 'عملاء موثوقون', en: 'Trusted Clients' },
    systems:  { ar: 'نظام متكامل', en: 'Integrated Systems' },
    years:    { ar: 'سنة خبرة', en: 'Years Experience' },
  },
  contact: {
    title:    { ar: 'تواصل معنا', en: 'Contact Us' },
    sub:      { ar: 'نحن هنا للإجابة على استفساراتك', en: 'We are here to answer your inquiries' },
    name:     { ar: 'الاسم الكامل', en: 'Full Name' },
    email:    { ar: 'البريد الإلكتروني', en: 'Email Address' },
    message:  { ar: 'رسالتك', en: 'Your Message' },
    send:     { ar: 'إرسال', en: 'Send Message' },
    sent:     { ar: 'تم الإرسال بنجاح!', en: 'Sent successfully!' },
  },
  footer: {
    rights:   { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
    tagline:  { ar: 'أنظمة تشغيل للمستقبل', en: 'Operating Systems for the Future' },
  },
} as const;

export function tr(key: { ar: string; en: string }, lang: Lang) {
  return key[lang];
}
