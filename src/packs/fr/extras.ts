import type { DrillSeed, LanguagePack, MistakeCategory, ScenarioSeed } from '../types'
import { phrases, prompts } from '../helpers'

// Available from week 1: phrases that rescue a conversation.
export const repairPhrases = phrases('fr-repair', [
  ['Comment dit-on « fork » en français ?', 'How do you say "fork" in French?', 'Swap "fork" for any word.'],
  ['Vous pouvez répéter, s\'il vous plaît ?', 'Could you repeat that, please?'],
  ['Plus lentement, s\'il vous plaît.', 'More slowly, please.'],
  ['Je veux dire…', 'I mean…'],
  ['Qu\'est-ce que ça veut dire ?', 'What does that mean?'],
  ['Je ne comprends pas.', "I don't understand."],
  ['Comment ça s\'écrit ?', 'How is that spelled?'],
  ['Comment ça se prononce ?', 'How is that pronounced?'],
  ['Je ne suis pas sûr d\'avoir compris.', "I'm not sure I understood.", 'Women: sûre.'],
  ['Attendez, je cherche le mot.', "Wait, I'm looking for the word."],
  ['Vous pouvez l\'écrire, s\'il vous plaît ?', 'Could you write it down, please?'],
  ['Je suis débutant, soyez patient avec moi !', "I'm a beginner, bear with me!", 'Women: débutante.'],
])

export const personalScript: LanguagePack['personalScript'] = [
  {
    id: 'fr-script-intro',
    week: 1,
    title: 'Who I am',
    guide: 'Your name, where you live and for how long, the languages you speak. 4–6 short sentences.',
    example: 'Bonjour ! Je m\'appelle Alex. J\'habite à Moscou depuis trois ans. Je parle anglais et russe, et j\'apprends le français.',
  },
  {
    id: 'fr-script-work',
    week: 1,
    title: 'What I do',
    guide: 'Your job or field, where you work, one thing you like about it.',
    example: 'Je travaille dans l\'informatique. Je travaille pour une entreprise internationale. J\'aime mon travail parce que c\'est intéressant.',
  },
  {
    id: 'fr-script-city',
    week: 2,
    title: 'My city and home',
    guide: 'Your neighbourhood, your flat, how you get around.',
    example: 'J\'habite dans un quartier calme. Mon appartement est petit mais lumineux. Je prends le métro tous les jours.',
  },
  {
    id: 'fr-script-day',
    week: 2,
    title: 'My typical day',
    guide: 'Morning to evening, with times. Use -er verbs, avoir and faire.',
    example: 'Je me lève à sept heures. Je commence le travail à neuf heures. Le soir, je fais du sport ou je regarde une série.',
  },
]

// Re-recorded in weeks 1, 4, 8 and 12 for "Then and now".
export const benchmarkPrompts = prompts('fr-bench', [
  ['Présente-toi et raconte ta semaine.', 'Introduce yourself and talk about your week.'],
  ['Décris ta ville et ton quartier.', 'Describe your city and your neighbourhood.'],
  ['Parle de tes projets pour le mois prochain.', 'Talk about your plans for next month.'],
])

export const selfTalkPrompts = prompts('fr-self', [
  ['Décris ce que tu vois par la fenêtre.', 'Describe what you can see out of the window.'],
  ['Planifie ta journée de demain à voix haute.', 'Plan tomorrow out loud.'],
  ['Décris la pièce où tu es.', "Describe the room you're in."],
  ['Qu\'est-ce que tu as mangé aujourd\'hui ?', 'What have you eaten today?'],
  ['Décris ce que tu portes aujourd\'hui.', "Describe what you're wearing today."],
  ['Explique comment tu prépares ton plat préféré.', 'Explain how you make your favourite dish.'],
  ['Décris les gens autour de toi dans le métro.', 'Describe the people around you on the metro.'],
  ['Qu\'est-ce qui t\'a fait sourire aujourd\'hui ?', 'What made you smile today?'],
  ['Parle de la météo et de ce que tu vas faire ce soir.', "Talk about the weather and what you're doing tonight."],
  ['Raconte ta dernière conversation avec un ami.', 'Retell your last conversation with a friend.'],
  ['Quelles sont les trois choses à faire cette semaine ?', 'What are three things you need to do this week?'],
  ['Décris une photo de ton téléphone.', 'Describe a photo on your phone.'],
  ['Si tu avais une journée libre demain, qu\'est-ce que tu ferais ?', 'If you had a free day tomorrow, what would you do?'],
  ['Explique ton travail à un enfant.', 'Explain your job to a child.'],
  ['Quel est le meilleur endroit de ta ville ? Pourquoi ?', 'What is the best place in your city? Why?'],
  ['Parle d\'un livre, d\'un film ou d\'un podcast récent.', 'Talk about a recent book, film or podcast.'],
  ['Décris ton meilleur ami.', 'Describe your best friend.'],
  ['Qu\'est-ce que tu as appris cette semaine ?', 'What did you learn this week?'],
  ['Raconte ton trajet d\'aujourd\'hui.', "Describe today's journey."],
  ['Qu\'est-ce que tu aimerais changer dans ta routine ?', 'What would you like to change about your routine?'],
])

export const fluencyCheck: LanguagePack['fluencyCheck'] = [
  { id: 'fc-intro', title: 'Introduce yourself', target: 'Présente-toi : qui tu es, où tu vis, ce que tu fais et pourquoi tu apprends le français.', minutes: 2 },
  { id: 'fc-weekend', title: 'Describe your last weekend', target: 'Raconte ton dernier week-end en détail.', minutes: 2 },
  { id: 'fc-plans', title: 'Talk about plans', target: 'Parle de tes projets pour les fêtes et pour l\'année prochaine.', minutes: 2 },
  { id: 'fc-opinion', title: 'Give an opinion', target: 'Donne ton avis : vaut-il mieux vivre dans une grande ville ou à la campagne ? Pourquoi ?', minutes: 2 },
  { id: 'fc-story', title: 'Tell a short story', target: 'Raconte une petite histoire qui t\'est arrivée : le décor, les événements, la fin.', minutes: 2 },
]

export const drills: DrillSeed[] = [
  {
    id: 'nasal',
    title: 'Nasal vowels: an / on / in',
    explain: 'Three different nasal sounds. "an/en" is open, mouth wide (like "ah" through the nose). "on" has rounded lips. "in/ain/un" is flatter, lips spread. Never pronounce the n.',
    items: [
      { a: 'lent', b: 'long', en: 'slow / long' },
      { a: 'banc', b: 'bon', en: 'bench / good' },
      { a: 'vent', b: 'vin', en: 'wind / wine' },
      { a: 'blanc', b: 'blond', en: 'white / blond' },
      { a: 'temps', b: 'thon', en: 'time / tuna' },
      { a: 'pain', b: 'pont', en: 'bread / bridge' },
      { a: 'Un bon vin blanc.', en: 'A good white wine. (all three sounds)' },
    ],
  },
  {
    id: 'u-ou',
    title: 'u vs ou',
    explain: '"ou" is like English "oo". For "u", say "ee" and round your lips without moving your tongue. The difference changes meaning.',
    items: [
      { a: 'tu', b: 'tout', en: 'you / all' },
      { a: 'rue', b: 'roue', en: 'street / wheel' },
      { a: 'vu', b: 'vous', en: 'seen / you' },
      { a: 'dessus', b: 'dessous', en: 'on top / underneath' },
      { a: 'lu', b: 'loup', en: 'read / wolf' },
      { a: 'Tu as vu la roue dans la rue ?', en: 'Did you see the wheel in the street?' },
    ],
  },
  {
    id: 'e-e',
    title: 'é vs è',
    explain: '"é" is closed and tense, lips spread (like the start of "day" without the glide). "è / ê / ai" is more open, jaw lower (like "bed"). It separates passé composé from imparfait.',
    items: [
      { a: 'et', b: 'est', en: 'and / is' },
      { a: 'parlé', b: 'parlait', en: 'spoke / was speaking' },
      { a: 'les', b: 'lait', en: 'the / milk' },
      { a: 'fée', b: 'fait', en: 'fairy / done' },
      { a: 'j\'ai mangé', b: 'je mangeais', en: 'I ate / I was eating' },
      { a: 'Mon père préfère le café.', en: 'My father prefers coffee.' },
    ],
  },
  {
    id: 'r',
    title: 'The French R',
    explain: 'Made at the back of the throat, like a soft gargle — close to the Russian "х" but voiced. Start with "gr" words, then put it at the start and end of words.',
    items: [
      { a: 'gros', en: 'big' },
      { a: 'très', en: 'very' },
      { a: 'rue', en: 'street' },
      { a: 'Paris', en: 'Paris' },
      { a: 'rouge', en: 'red' },
      { a: 'la rentrée', en: 'back to school/work' },
      { a: 'Trois gros rats gris.', en: 'Three big grey rats.' },
    ],
  },
  {
    id: 'liaison',
    title: 'Liaison',
    explain: 'A silent final consonant is pronounced when the next word starts with a vowel sound. -s and -x become a "z" sound. Compare "ils ont" (they have, z) with "ils sont" (they are, s).',
    items: [
      { a: 'ils ont', b: 'ils sont', en: 'they have / they are' },
      { a: 'vous êtes', en: 'you are (voo-zet)' },
      { a: 'les amis', en: 'the friends (lay-zamee)' },
      { a: 'un enfant', en: 'a child (uh-nenfan)' },
      { a: 'deux heures', en: 'two o\'clock (duh-zur)' },
      { a: 'C\'est important.', en: "It's important. (say-tim…)" },
    ],
  },
  {
    id: 'silent',
    title: 'Silent letters',
    explain: 'Final consonants are usually silent, except often c, r, f, l ("careful" letters). The -ent verb ending in ils parlent is silent. H is always silent.',
    items: [
      { a: 'petit', en: 'small (puh-tee)' },
      { a: 'beaucoup', en: 'a lot (boh-koo)' },
      { a: 'ils parlent', en: 'they speak (eel parl)' },
      { a: 'vingt', en: 'twenty (van)' },
      { a: 'le temps', en: 'time (tan)' },
      { a: 'un hôtel', en: 'a hotel (h silent)' },
      { a: 'avec, pour, neuf, sel', en: 'c, r, f, l are usually pronounced' },
    ],
  },
  {
    id: 's-z',
    title: 's vs z between vowels',
    explain: 'A single s between vowels sounds like z; double ss is s. Mixing them changes the word.',
    items: [
      { a: 'poisson', b: 'poison', en: 'fish / poison' },
      { a: 'dessert', b: 'désert', en: 'dessert / desert' },
      { a: 'coussin', b: 'cousin', en: 'cushion / cousin' },
    ],
  },
]

export const scenarios: ScenarioSeed[] = [
  { id: 'cafe', title: 'Café', setup: 'A busy café in Paris in the morning. The learner wants to order breakfast and maybe ask about the wifi.', role: 'a friendly but busy server' },
  { id: 'colleague', title: 'Meeting a colleague', setup: 'First day with a new French colleague at an international company. Small talk by the coffee machine.', role: 'a new French colleague, curious about the learner' },
  { id: 'directions', title: 'Asking directions', setup: 'The learner is lost near a metro station in Lyon and needs to find a museum.', role: 'a helpful local passer-by' },
  { id: 'weekend', title: 'Weekend chat', setup: 'Monday morning. Two friends catch up about what they did at the weekend.', role: 'a friend who had an eventful weekend' },
  { id: 'interview', title: 'Job interview', setup: 'A short, friendly job interview for a role at a French company. Questions about background, strengths and plans.', role: 'a kind interviewer' },
  { id: 'plans', title: 'Making plans', setup: 'Two friends try to organise an evening out this week: day, time, place and activity.', role: 'a friend with a busy schedule' },
  { id: 'hotel', title: 'Complaining politely at a hotel', setup: 'The learner\'s hotel room is noisy and the shower doesn\'t work. They want a solution.', role: 'a hotel receptionist' },
  { id: 'film', title: 'Discussing a film', setup: 'Two friends discuss a film or series they both watched recently, giving opinions.', role: 'a film-loving friend with strong opinions' },
  { id: 'surprise', title: 'Surprise me', setup: 'Pick an everyday scenario suitable for the learner\'s level and this week\'s theme. Tell the learner the situation in one English sentence first.', role: 'whoever fits the scenario' },
]

export const mistakeCategories: MistakeCategory[] = [
  { id: 'gender', label: 'Gender and agreement', hint: 'le/la, un/une, adjective and participle endings' },
  { id: 'verb', label: 'Verb forms', hint: 'conjugation, irregular verbs, participles' },
  { id: 'tense', label: 'Tense choice', hint: 'passé composé vs imparfait, present vs future' },
  { id: 'prep', label: 'Prepositions', hint: 'à / en / de / chez / dans' },
  { id: 'order', label: 'Word order', hint: 'adjective position, pronouns, negation' },
  { id: 'pron', label: 'Pronunciation', hint: 'nasal vowels, u/ou, silent letters, liaison' },
  { id: 'vocab', label: 'Vocabulary', hint: 'wrong word, false friends, English slipping in' },
]

// French typography: a narrow no-break space (U+202F) before ? ! ; and inside « »,
// a no-break space (U+00A0) before :. Also curly apostrophes.
const NNBSP = ' '
const NBSP = ' '
export function frenchTypography(text: string): string {
  return text
    .replace(/(?<=[^\s?!;:])[   ]*([?!;])/g, `${NNBSP}$1`)
    .replace(/(?<=[^\s?!;:])[   ]*:(?=\s|$)/g, `${NBSP}:`)
    .replace(/«[   ]*/g, `«${NNBSP}`)
    .replace(/[   ]*»/g, `${NNBSP}»`)
    .replace(/'/g, '’')
}

// Items I'm least sure about; the learner sees these flagged in the course review.
export const reviewFlags: Record<string, string> = {
  'fr-w02-p04': '"Je travaille de chez moi" is understood everywhere, but "Je télétravaille le lundi" is what many people in France actually say. Keep either.',
  'fr-w03-p06': '"Je vais prendre…" uses week 7 grammar early. It\'s the most natural way to order, so I kept it as a fixed phrase.',
  'fr-w06-p22': 'Mixes passé composé with "il était fermé" (imparfait, week 9). Natural French, but grammar you haven\'t met yet.',
  'fr-w10-p18': 'Very formal (letters and emails). Useful to recognise; you may prefer to hide it for speaking practice.',
  'fr-w12-p12': '"je savais seulement dire" is correct; "je ne savais dire que" is more idiomatic but trickier. Choose which to learn.',
  'fr-repair-p12': '"Soyez patient" is fine; "soyez indulgent avec moi" is also common and sounds a bit warmer.',
}
