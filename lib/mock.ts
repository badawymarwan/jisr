// sample content used in demo mode (no api keys set), so the app is fully
// clickable before the keys are added.

import type { AssignmentHelp, Notes, Practice } from "./types";

export const MOCK_TRANSCRIPT = `Okay everyone, today we look at how markets find a price. When many people want a product, demand is high. When sellers offer a lot of a product, supply is high. The price where the amount people want to buy equals the amount sellers offer is called the equilibrium. If the price is too low, we get a shortage, because people want more than sellers offer. If the price is too high, we get a surplus. Elasticity tells us how much buying changes when the price changes.`;

export const MOCK_NOTES: Notes = {
  title: "Supply and Demand",
  summary: "Prices change when the amount people want to buy and the amount sellers offer don't match. The market moves towards a balance point.",
  sections: [
    { heading: "Demand", points: ["Demand is how much people want to buy.", "When prices go up, people usually buy less."] },
    { heading: "Supply", points: ["Supply is how much sellers offer.", "When prices go up, sellers usually offer more."] },
    {
      heading: "Equilibrium",
      points: ["Equilibrium is the price where buying and selling amounts are equal.", "At equilibrium there is no shortage and no surplus."],
    },
    {
      heading: "Shortage and surplus",
      points: ["A shortage happens when the price is too low.", "A surplus happens when the price is too high."],
    },
    { heading: "Elasticity", points: ["Elasticity shows how much buying changes when the price changes."] },
  ],
  terms: [
    { term: "demand", meaning: "how much people want to buy", arabic: "الطلب — كمية ما يريد الناس شراءه" },
    { term: "supply", meaning: "how much sellers offer to sell", arabic: "العرض — كمية ما يعرضه البائعون" },
    { term: "equilibrium", meaning: "the balance point where buying equals selling", arabic: "التوازن — السعر الذي يتساوى عنده العرض والطلب" },
    { term: "shortage", meaning: "less of a product than people want", arabic: "النقص — الكمية المعروضة أقل من المطلوبة" },
    { term: "surplus", meaning: "more of a product than people want", arabic: "الفائض — الكمية المعروضة أكثر من المطلوبة" },
    { term: "elasticity", meaning: "how much buying changes when price changes", arabic: "المرونة — مدى تغيّر الشراء عند تغيّر السعر" },
  ],
};

export const MOCK_PRACTICE: Practice = {
  quiz: [
    {
      q: "What is equilibrium?",
      options: ["The highest price", "The price where buying equals selling", "When sellers stop selling", "A tax on products"],
      answer: 1,
      why: "Equilibrium is the balance point where the amount bought equals the amount offered.",
    },
    {
      q: "What happens when the price is too low?",
      options: ["A surplus", "Nothing changes", "A shortage", "Supply goes up"],
      answer: 2,
      why: "A low price makes people want more than sellers offer, so there is a shortage.",
    },
    {
      q: "When prices go up, people usually...",
      options: ["Buy more", "Buy less", "Sell less", "Stop working"],
      answer: 1,
      why: "Higher prices usually make people buy less. This is demand.",
    },
  ],
  flashcards: [
    { front: "demand", back: "How much people want to buy.", arabic: "الطلب" },
    { front: "supply", back: "How much sellers offer.", arabic: "العرض" },
    { front: "equilibrium", back: "The price where buying equals selling.", arabic: "التوازن" },
    { front: "shortage", back: "Less of a product than people want.", arabic: "النقص" },
    { front: "surplus", back: "More of a product than people want.", arabic: "الفائض" },
  ],
};

export const MOCK_ASSIGNMENT: AssignmentHelp = {
  title: "Lab Report 2",
  goal: "Write a lab report that explains your heat transfer experiment and what your results show.",
  steps: [
    "Write a short introduction: what the experiment tested and why.",
    "Describe the method: the equipment and the steps you followed.",
    "Show your results in a table and one graph.",
    "In the discussion, explain what the results mean and any errors.",
    "Finish with a short conclusion and your references.",
  ],
  handIn: ["One PDF report", "Your raw data sheet as an appendix"],
  format: ["Maximum 1,500 words", "APA referencing", "Due Sunday 11:59 pm on Moodle"],
  terms: [
    { term: "heat transfer", meaning: "how heat moves from one thing to another", arabic: "انتقال الحرارة" },
    { term: "method", meaning: "the steps you followed in the experiment", arabic: "طريقة العمل — الخطوات التي اتبعتها" },
    { term: "appendix", meaning: "extra material added at the end", arabic: "ملحق — مواد إضافية في نهاية التقرير" },
    { term: "APA referencing", meaning: "a set style for listing your sources", arabic: "أسلوب APA لكتابة المراجع" },
  ],
};

export const MOCK_LIVE_LINES: { points: string[]; terms: Notes["terms"] }[] = [
  { points: ["Today we look at how markets find a price."], terms: [] },
  { points: ["When many people want a product, demand is high."], terms: [MOCK_NOTES.terms[0]] },
  { points: ["When sellers offer a lot, supply is high."], terms: [MOCK_NOTES.terms[1]] },
  { points: ["The price where buying equals selling is the equilibrium."], terms: [MOCK_NOTES.terms[2]] },
  { points: ["If the price is too low, we get a shortage."], terms: [MOCK_NOTES.terms[3]] },
  { points: ["If the price is too high, we get a surplus."], terms: [MOCK_NOTES.terms[4]] },
];
