// sample data for demos: lessons, a word bank at different stages, and 6 weeks of progress.
// every sample item id starts with "sample-" and every sample word has sample: true,
// so "remove sample data" deletes exactly these and nothing the student made.

import { MOCK_NOTES, MOCK_PRACTICE } from "./mock";
import type { Item, WordEntry } from "./types";

const DAY = 24 * 3600 * 1000;

export function sampleItems(now: number): Item[] {
  return [
    {
      id: "sample-econ-1",
      type: "lecture",
      course: "ECON 101",
      title: "Supply and Demand",
      createdAt: now - 2 * DAY,
      source: "(sample lecture)",
      notes: MOCK_NOTES,
      practice: MOCK_PRACTICE,
    },
    {
      id: "sample-econ-2",
      type: "reading",
      course: "ECON 101",
      title: "Opportunity Cost",
      createdAt: now - 9 * DAY,
      source: "(sample reading)",
      notes: {
        title: "Opportunity Cost",
        summary: "Every choice has a cost: the best thing you gave up. Scarcity means we always have to choose.",
        sections: [
          { heading: "Scarcity", points: ["Scarcity means we have limited time and money.", "Because of scarcity, we must make choices."] },
          {
            heading: "Opportunity cost",
            points: ["The opportunity cost is the best option you gave up.", "Studying tonight has an opportunity cost: the time you could spend with friends."],
          },
          { heading: "Trade-offs", points: ["A trade-off is getting more of one thing by giving up another.", "Good decisions compare the benefits and the costs."] },
        ],
        terms: [
          { term: "scarcity", meaning: "not having enough of something for everyone", arabic: "الندرة — محدودية الموارد مقارنة بالحاجات" },
          { term: "opportunity cost", meaning: "the best option you give up when you choose", arabic: "تكلفة الفرصة البديلة — قيمة أفضل خيار تخليت عنه" },
          { term: "trade-off", meaning: "giving up one thing to get another", arabic: "المفاضلة — التخلي عن شيء للحصول على آخر" },
          { term: "benefits", meaning: "the good things you get from a choice", arabic: "المنافع — الفوائد التي تحصل عليها من القرار" },
        ],
      },
    },
    {
      id: "sample-biol-1",
      type: "lecture",
      course: "BIOL 110",
      title: "Photosynthesis",
      createdAt: now - 5 * DAY,
      source: "(sample lecture)",
      notes: {
        title: "Photosynthesis",
        summary: "Plants make their own food from light, water and carbon dioxide. They release oxygen as a by-product.",
        sections: [
          {
            heading: "What photosynthesis is",
            points: ["Photosynthesis is how plants make food using sunlight.", "It happens inside the chloroplast of plant cells."],
          },
          {
            heading: "What goes in and out",
            points: ["Plants take in carbon dioxide and water.", "They make glucose, a type of sugar, and release oxygen."],
          },
          { heading: "Why it matters", points: ["Almost all food chains start with photosynthesis.", "It also gives us the oxygen we breathe."] },
        ],
        terms: [
          { term: "photosynthesis", meaning: "how plants make food using sunlight", arabic: "البناء الضوئي — صنع النبات غذاءه باستخدام ضوء الشمس" },
          { term: "chloroplast", meaning: "the part of a plant cell where food is made", arabic: "البلاستيدة الخضراء — جزء في الخلية النباتية يصنع الغذاء" },
          { term: "carbon dioxide", meaning: "a gas that plants take in from the air", arabic: "ثاني أكسيد الكربون — غاز يمتصه النبات من الهواء" },
          { term: "glucose", meaning: "a simple sugar that gives energy", arabic: "الجلوكوز — سكر بسيط يعطي الطاقة" },
          { term: "food chains", meaning: "who eats who in nature", arabic: "السلاسل الغذائية — تسلسل انتقال الغذاء بين الكائنات" },
        ],
      },
    },
    {
      id: "sample-engl-1",
      type: "assignment",
      course: "ENGL 102",
      title: "Argumentative Essay",
      createdAt: now - 1 * DAY,
      source:
        "Write a 1000-word argumentative essay on whether university attendance should be mandatory. Use at least three scholarly sources and cite them in APA 7th edition. Address a counterargument. Submit as a PDF on Moodle by 5 December.",
      assignment: {
        title: "Argumentative Essay",
        goal: "Write an essay that argues if students must attend class or not, and support your opinion with sources.",
        steps: [
          "Choose your side: should attendance be mandatory or not?",
          "Find three scholarly sources, like journal articles, that discuss attendance.",
          "Write a thesis: one sentence that says your opinion.",
          "Write body paragraphs, each with one reason and evidence from a source.",
          "Write one paragraph about the other side (the counterargument) and answer it.",
          "Check your APA citations and the reference list.",
        ],
        handIn: ["One PDF file on Moodle"],
        format: ["About 1000 words", "APA 7th edition", "Due 5 December"],
        terms: [
          { term: "argumentative essay", meaning: "an essay that tries to convince the reader", arabic: "المقال الجدلي — مقال يحاول إقناع القارئ برأي" },
          { term: "scholarly sources", meaning: "research written by experts and checked by experts", arabic: "المصادر الأكاديمية — أبحاث محكّمة كتبها مختصون" },
          { term: "counterargument", meaning: "the opposite opinion to yours", arabic: "الرأي المعارض — الحجة المضادة لرأيك" },
          { term: "thesis", meaning: "one sentence with your main opinion", arabic: "الأطروحة — الجملة التي تلخص رأيك الأساسي" },
        ],
      },
    },
  ];
}

/** a word bank at different stages: learned, half-way, and due for review right now. */
export function sampleWords(now: number): Record<string, WordEntry> {
  const w = (term: string, meaning: string, arabic: string, course: string, streak: number, dueInDays: number, arabicUses: number, ageDays: number): WordEntry => ({
    term,
    meaning,
    arabic,
    course,
    addedAt: now - ageDays * DAY,
    inBank: true,
    taps: arabicUses + 1,
    seenSinceTap: 0,
    known: false,
    streak,
    due: now + dueInDays * DAY,
    arabicUses,
    sample: true,
  });
  const list = [
    // learned (3 correct recalls)
    w("demand", "how much people want to buy", "الطلب — كمية ما يريد الناس شراءه", "ECON 101", 3, 14, 3, 30),
    w("supply", "how much sellers offer to sell", "العرض — كمية ما يعرضه البائعون", "ECON 101", 3, 14, 2, 30),
    w("scarcity", "not having enough of something for everyone", "الندرة — محدودية الموارد مقارنة بالحاجات", "ECON 101", 3, 14, 4, 25),
    w("glucose", "a simple sugar that gives energy", "الجلوكوز — سكر بسيط يعطي الطاقة", "BIOL 110", 3, 14, 1, 20),
    w("shortage", "less of a product than people want", "النقص — الكمية المعروضة أقل من المطلوبة", "ECON 101", 3, 14, 2, 40),
    w("surplus", "more of a product than people want", "الفائض — الكمية المعروضة أكثر من المطلوبة", "ECON 101", 3, 14, 2, 40),
    w("benefits", "the good things you get from a choice", "المنافع — الفوائد التي تحصل عليها من القرار", "ECON 101", 3, 14, 1, 35),
    w("carbon dioxide", "a gas that plants take in from the air", "ثاني أكسيد الكربون — غاز يمتصه النبات من الهواء", "BIOL 110", 3, 14, 2, 33),
    w("thesis", "one sentence with your main opinion", "الأطروحة — الجملة التي تلخص رأيك الأساسي", "ENGL 102", 3, 14, 3, 28),
    w("scholarly sources", "research written by experts and checked by experts", "المصادر الأكاديمية — أبحاث محكّمة كتبها مختصون", "ENGL 102", 3, 14, 4, 26),
    w("food chains", "who eats who in nature", "السلاسل الغذائية — تسلسل انتقال الغذاء بين الكائنات", "BIOL 110", 3, 14, 1, 22),
    w("argumentative essay", "an essay that tries to convince the reader", "المقال الجدلي — مقال يحاول إقناع القارئ برأي", "ENGL 102", 3, 14, 2, 18),
    // half-way
    w("opportunity cost", "the best option you give up when you choose", "تكلفة الفرصة البديلة — قيمة أفضل خيار تخليت عنه", "ECON 101", 2, 5, 3, 12),
    w("trade-off", "giving up one thing to get another", "المفاضلة — التخلي عن شيء للحصول على آخر", "ECON 101", 1, 2, 2, 10),
    w("chloroplast", "the part of a plant cell where food is made", "البلاستيدة الخضراء — جزء في الخلية النباتية يصنع الغذاء", "BIOL 110", 1, 2, 2, 6),
    // due now, ready for the review demo
    w("equilibrium", "the balance point where buying equals selling", "التوازن — النقطة التي يتساوى فيها العرض والطلب", "ECON 101", 1, -1, 2, 4),
    w("photosynthesis", "how plants make food using sunlight", "البناء الضوئي — صنع النبات غذاءه باستخدام ضوء الشمس", "BIOL 110", 0, -1, 1, 5),
    w("counterargument", "the opposite opinion to yours", "الرأي المعارض — الحجة المضادة لرأيك", "ENGL 102", 0, -1, 1, 1),
    w("elasticity", "how much buying changes when price changes", "المرونة — مدى تغيّر الشراء عند تغيّر السعر", "ECON 101", 2, -1, 3, 3),
  ];
  return Object.fromEntries(list.map((x) => [x.term.toLowerCase(), x]));
}
