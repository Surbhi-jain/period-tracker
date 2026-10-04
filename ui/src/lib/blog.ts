export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  topic: string;
  minutes: number;
  blocks: BlogBlock[];
};

const POSTS: BlogPost[] = [
  {
    slug: "what-your-period-can-tell-you",
    title: "What your period can tell you about health",
    description:
      "A cycle is a repeating signal. Logged start days help you notice change — they do not diagnose illness.",
    date: "2026-10-03",
    topic: "Health",
    minutes: 5,
    blocks: [
      {
        type: "p",
        text: "A period is not only bleeding. It is the most visible part of a cycle that repeats. When you write down the start day of bleeding each time, you get a simple health record: how far apart periods are, how long they last, and whether that pattern has changed.",
      },
      {
        type: "p",
        text: "That record can help you and a doctor see what is usual for you. It cannot name a disease. Luna is a tracking tool. Dates are estimates, not a diagnosis, and must not be used as contraception.",
      },
      { type: "h2", text: "What a pattern can show" },
      {
        type: "p",
        text: "Most cycles land somewhere between about 21 and 35 days from one start day to the next. Bleeding often lasts a few days. After a few logged periods, you can see your own average, and how much that gap moves.",
      },
      {
        type: "ul",
        items: [
          "A fairly steady gap means your body is repeating a rhythm. That is useful to know, even when the next date still shifts a little.",
          "Gaps that jump around — 24 days, then 40, then 28 — are a change worth writing down and taking to a clinic if they keep happening.",
          "A cycle that is often shorter than 21 days, or often longer than 35, is a reason to talk to a doctor.",
        ],
      },
      { type: "h2", text: "What it cannot predict" },
      {
        type: "p",
        text: "A calendar cannot tell you that you have PCOS, a thyroid problem, low iron, fibroids or endometriosis. Those need a person who can ask questions, examine you and, if needed, run tests. Your dates are one piece of that visit, not the answer.",
      },
      {
        type: "p",
        text: "An estimate of the next period, fertile days or ovulation is a guide based on past starts. Stress, illness, travel, weight change, a new medicine or age can move the next cycle. Treat every date as a range, not a verdict.",
      },
      { type: "h2", text: "How to use the record" },
      {
        type: "p",
        text: "Log the start day and end day of bleeding. After two or three cycles, look at the gaps. If something worries you — pain that stops your day, very heavy flow, bleeding between periods, or a period that does not come — take those dates to a doctor. The tracker is there so you do not have to remember them from scratch.",
      },
    ],
  },
  {
    slug: "how-to-notice-a-change-in-your-period",
    title: "How to notice a change in your period",
    description:
      "Health clues sit in what changed for you, not in a perfect 28-day cycle.",
    date: "2026-10-01",
    topic: "Health",
    minutes: 4,
    blocks: [
      {
        type: "p",
        text: "A “normal” period is the one that is usual for you. Some people bleed for three days every 26 days. Others bleed for six days every 32. The useful question is not “is this textbook?” It is “is this different from my last few cycles?”",
      },
      { type: "h2", text: "Changes worth writing down" },
      {
        type: "ul",
        items: [
          "The start-to-start gap becomes much shorter or much longer than your average.",
          "Bleeding lasts many more days, or stops after one day when it used to last longer.",
          "Flow is much heavier or much lighter than usual.",
          "Pain, clots or flooding are new, or they now stop you working or sleeping.",
          "You bleed between periods, or after sex.",
          "A period does not come, and you are not pregnant.",
        ],
      },
      { type: "h2", text: "Why a cycle can move" },
      {
        type: "p",
        text: "A late or early period is common after stress, a fever, a long trip, a new routine, a big change in sleep or food, or starting or stopping a medicine, including hormonal contraception. Age also matters: cycles can wander in the years after the first period, and again as menopause approaches.",
      },
      {
        type: "p",
        text: "One odd cycle is often just one odd cycle. A new pattern that lasts two or three months is the one to take to a doctor, along with the start and end days you logged.",
      },
      { type: "h2", text: "What Luna can help with" },
      {
        type: "p",
        text: "Luna keeps the dates in one place and shows a range for the next start. That makes change easier to see. It does not decide why the change happened, and it must not be used as contraception.",
      },
    ],
  },
  {
    slug: "missed-or-late-periods",
    title: "Missed or late periods, and what they might mean",
    description:
      "A late start has many causes. The dates help you describe it. A test or a doctor tells you more.",
    date: "2026-09-24",
    topic: "Health",
    minutes: 4,
    blocks: [
      {
        type: "p",
        text: "If bleeding does not start when you expected, the first useful facts are the last start day and how many days have passed. That is what a late period means in a tracker: the next start has not arrived yet, compared with your usual gap.",
      },
      { type: "h2", text: "Pregnancy is one reason, not the only one" },
      {
        type: "p",
        text: "If you have had sex and a period is late, a pregnancy test is the clear next step. A calendar estimate cannot confirm or rule out pregnancy. If the test is positive, or you are unsure, see a doctor or clinic.",
      },
      {
        type: "p",
        text: "If you are not pregnant, a late or missed period can still come from stress, illness, a lot of exercise, a big change in weight, thyroid problems, PCOS, perimenopause, or a medicine. Luna cannot sort those out. A doctor can.",
      },
      { type: "h2", text: "When to get care sooner" },
      {
        type: "ul",
        items: [
          "You have gone three months without a period and you are not pregnant.",
          "You are bleeding very heavily, or you feel faint, breathless or in severe pain.",
          "You have a positive pregnancy test and pain or bleeding.",
          "Periods were regular and then stopped after you came off hormonal contraception, and several months have passed.",
        ],
      },
      {
        type: "p",
        text: "Bring the start days you have. They help a clinician see whether this is a one-off delay or a new pattern. Dates are still estimates, not a diagnosis, and must not be used as contraception.",
      },
    ],
  },
  {
    slug: "heavy-short-or-long-bleeding",
    title: "Heavy, short, or long bleeding",
    description:
      "How long you bleed, and how heavy it feels, is a health signal you can write down in two dates.",
    date: "2026-09-18",
    topic: "Health",
    minutes: 4,
    blocks: [
      {
        type: "p",
        text: "Cycle length is the gap from one start day of bleeding to the next. Period length is different: it is the number of days from the start day to the end day. Both matter for health, and both are easy to lose if you only remember “it was sometime last month.”",
      },
      { type: "h2", text: "What to log" },
      {
        type: "p",
        text: "Use the first day of red bleeding that needs a pad, tampon, cup or period underwear as the start. Use the last day of bleeding as the end. If you are still bleeding, save the start and add the end later. Stay consistent so the days can be compared.",
      },
      { type: "h2", text: "When flow is a reason to speak to a doctor" },
      {
        type: "ul",
        items: [
          "You soak through a pad or tampon every hour for several hours, or you pass large clots.",
          "Bleeding lasts more than seven days, or it used to last a few days and now lasts much longer.",
          "Bleeding is so heavy you feel dizzy, tired or short of breath — that can be a sign of low iron.",
          "You bleed between periods, or after sex.",
          "Pain is new, or it now stops you going to work, school or sleep.",
        ],
      },
      {
        type: "p",
        text: "Very heavy periods can come from fibroids, polyps, a bleeding disorder, a thyroid problem, or the years around menopause. Very light or very short bleeding can also be a change worth checking, especially if it is new. None of those names can be read off a calendar alone.",
      },
      { type: "h2", text: "What the tracker is for" },
      {
        type: "p",
        text: "Luna stores the start and end so you can see whether bleeding is getting longer or shorter. That is a health notebook, not a test result. Talk to a doctor about anything that worries you.",
      },
    ],
  },
  {
    slug: "start-day-of-bleeding",
    title: "Why the start day of bleeding is the health date that matters",
    description:
      "Health questions about “how often” and “how long” both begin with the first day of bleeding.",
    date: "2026-09-12",
    topic: "Cycle",
    minutes: 3,
    blocks: [
      {
        type: "p",
        text: "If a doctor asks how often your periods come, the honest answer is a list of start days, not a guess. Cycle length is counted from one start day of bleeding to the next. Period length is counted from that start day to the end day.",
      },
      { type: "h2", text: "Start day" },
      {
        type: "p",
        text: "Use the first day you see red bleeding that needs a pad, tampon, cup or period underwear. Light brown spotting the day before does not have to be the start, unless that is how you already count. Stay consistent. The pattern only helps if you count the same way each month.",
      },
      { type: "h2", text: "End day" },
      {
        type: "p",
        text: "Use the last day of bleeding. If you are still bleeding when you open Luna, save the start day and come back to add the end day later. Those two dates are enough to see whether bleeding is getting longer, shorter or staying put.",
      },
      { type: "h2", text: "Why this predicts anything at all" },
      {
        type: "p",
        text: "After a few start days, you can see your usual gap and a range for the next period. That is the only “prediction” a tracker can honestly make: what your recent cycles suggest, with room to shift. It is not a diagnosis, and it must not be used as contraception.",
      },
    ],
  },
  {
    slug: "period-calendar-is-not-contraception",
    title: "A period calendar cannot predict a safe day",
    description:
      "Fertile days on a calendar can help you notice a pattern. They cannot reliably prevent pregnancy, and they are not a health all-clear.",
    date: "2026-09-08",
    topic: "Health",
    minutes: 3,
    blocks: [
      {
        type: "p",
        text: "It is tempting to treat a marked fertile window as a map of safe and unsafe days, or as proof that a cycle is healthy. That is the old calendar method. It fails often enough that Luna will not offer it as protection or as a medical result.",
      },
      { type: "h2", text: "Ovulation can move" },
      {
        type: "p",
        text: "Luna estimates ovulation 14 days before the next period start. That is a widely used rule, not a measurement of the egg. A late night, a fever, a new routine or a changed cycle can shift ovulation earlier or later than the calendar says.",
      },
      {
        type: "p",
        text: "Sperm can live for a few days. So a day that looks “safe” on a chart can still sit inside a fertile stretch. A day that looks “fertile” can also be wrong if ovulation moved.",
      },
      { type: "h2", text: "What the calendar is for" },
      {
        type: "ul",
        items: [
          "Seeing when bleeding last started and ended.",
          "Getting a range for the next period.",
          "Noticing your own average, once you have logged more than one cycle.",
          "Optionally seeing estimated fertile days if you are trying to conceive.",
          "Taking a clear date list to a doctor if something worries you.",
        ],
      },
      {
        type: "p",
        text: "If you need contraception, talk to a doctor or clinic about a method that fits you. If you have been trying to conceive for a year — or six months if you are over 35 — see a doctor as well. Dates are estimates, not a diagnosis.",
      },
    ],
  },
];

export function listPosts() {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string) {
  return POSTS.find((post) => post.slug === slug) ?? null;
}

export function latestPosts(count = 3) {
  return listPosts().slice(0, count);
}
