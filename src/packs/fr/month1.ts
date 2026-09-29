import type { WeekSeed } from '../types'
import { phrases, prompts } from '../helpers'

// Month 1 (weeks 1–4): foundations and pronunciation.
// Seed text uses ordinary spaces before ? ! : ; — the pack's typography rule
// turns them into French non-breaking spaces at display time.

export const week1: WeekSeed = {
  week: 1,
  theme: 'Sounds of French and introducing myself',
  grammar: 'Nasal vowels, silent letters, liaison; être and s\'appeler; greetings',
  lesson: `French spelling hides a lot: most final consonants are silent (petit, beaucoup, ils parlent), and a few vowel combinations become nasal sounds (an/en, on, in/un). When a silent final consonant meets a word starting with a vowel, it often wakes up and links across — that's liaison: vous‿êtes sounds like "voo-zet".

This week's two verbs:
• être (to be): je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont.
• s'appeler (to be called): je m'appelle, tu t'appelles, vous vous appelez.

Tu or vous? Use vous with strangers, in shops and at work until invited otherwise; tu with friends, children and people your age in relaxed settings. When unsure, start with vous.`,
  models: [
    { target: 'Je suis anglophone.', en: "I'm an English speaker." },
    { target: 'Tu es d\'où ?', en: 'Where are you from? (informal)' },
    { target: 'Elle est très sympa.', en: "She's very nice." },
    { target: 'Nous sommes collègues.', en: "We're colleagues." },
    { target: 'Vous êtes français ?', en: 'Are you French? (liaison: vous‿êtes)' },
    { target: 'Ils sont à Moscou.', en: "They're in Moscow." },
    { target: 'Je m\'appelle Alex, et vous ?', en: "My name's Alex, and you?" },
    { target: 'Comment vous appelez-vous ?', en: "What's your name? (formal)" },
  ],
  canDo: [
    'I can greet people and say goodbye, formally and informally.',
    'I can say my name, where I live and what I do.',
    'I can say which languages I speak.',
    'I can pronounce the three nasal vowels and make common liaisons.',
  ],
  phrases: phrases('fr-w01', [
    ['Bonjour, comment allez-vous ?', 'Hello, how are you? (formal)'],
    ['Salut, ça va ?', "Hi, how's it going?"],
    ['Ça va bien, merci. Et vous ?', "I'm fine, thanks. And you?"],
    ['Comment tu t\'appelles ?', "What's your name? (informal)"],
    ['Comment vous appelez-vous ?', "What's your name? (formal)", 'Liaison: vous‿appelez.'],
    ['Je m\'[[appelle]] Alex.', 'My name is Alex.', 'Swap in your own name.'],
    ['Enchanté, moi c\'est Alex.', 'Nice to meet you, I\'m Alex.', 'Women write "Enchantée" (sounds the same).'],
    ['Je suis anglophone, mais je parle aussi russe.', "I'm an English speaker, but I also speak Russian."],
    ['J\'[[habite]] à Moscou.', 'I live in Moscow.'],
    ['J\'habite à Moscou depuis trois ans.', "I've been living in Moscow for three years.", 'French uses the present tense with depuis. Change the number.'],
    ['Tu habites où ?', 'Where do you live? (informal)'],
    ['Vous êtes d\'où ?', 'Where are you from? (formal)', 'Liaison: vous‿êtes.'],
    ['Je ne suis pas d\'ici.', "I'm not from here."],
    ['J\'apprends le français depuis peu.', "I've only recently started learning French."],
    ['Je parle un peu français.', 'I speak a little French.'],
    ['Qu\'est-ce que tu fais dans la vie ?', 'What do you do (for a living)?'],
    ['Je [[travaille]] dans une entreprise internationale.', 'I work at an international company.'],
    ['Je travaille dans l\'informatique.', 'I work in IT.', 'Swap in your own field: la finance, le marketing, l\'éducation…'],
    ['Moscou est une très grande ville.', 'Moscow is a very big city.'],
    ['Mes amis sont très sympas.', 'My friends are really nice.', 'Liaison: mes‿amis.'],
    ['Je suis content de vous rencontrer.', "I'm glad to meet you.", 'Women: contente.'],
    ['On se tutoie ?', 'Shall we use "tu" with each other?'],
    ['Merci beaucoup !', 'Thank you very much!'],
    ['De rien.', "You're welcome."],
    ['S\'il vous plaît.', 'Please. (formal)'],
    ['Excusez-moi.', 'Excuse me.'],
    ['Pardon, je ne comprends pas.', "Sorry, I don't understand."],
    ['Bonne journée !', 'Have a good day!'],
    ['À bientôt !', 'See you soon!'],
    ['Au revoir, à demain !', 'Goodbye, see you tomorrow!'],
  ]),
  prompts: prompts('fr-w01', [
    ['Présente-toi : ton prénom, où tu habites et ce que tu fais.', 'Introduce yourself: your name, where you live and what you do.', ['Je m\'appelle…', 'J\'habite à…', 'Je travaille…']],
    ['Tu rencontres un nouveau collègue. Dis bonjour et demande-lui son prénom.', 'You meet a new colleague. Say hello and ask their name.', ['Bonjour !', 'Comment vous appelez-vous ?', 'Enchanté']],
    ['Quelles langues est-ce que tu parles ?', 'Which languages do you speak?', ['Je parle…', 'un peu', 'aussi']],
    ['Décris ta ville en deux ou trois phrases.', 'Describe your city in two or three sentences.', ['C\'est une grande ville.', 'J\'habite…']],
    ['Pourquoi est-ce que tu apprends le français ?', 'Why are you learning French?', ['J\'apprends le français parce que…']],
    ['Termine une conversation poliment et dis au revoir.', 'End a conversation politely and say goodbye.', ['Merci beaucoup', 'Bonne journée !', 'À bientôt !']],
    ['Lis à voix haute : « Vous êtes d\'où ? Mes amis sont à Moscou. »', 'Read aloud, making the liaisons: vous‿êtes, mes‿amis.'],
  ]),
}

export const week2: WeekSeed = {
  week: 2,
  theme: 'My day',
  grammar: 'Present tense of -er verbs; avoir and faire; time and days; daily routine',
  lesson: `Most French verbs end in -er (parler, travailler, regarder) and follow one pattern. Drop -er and add: je parle, tu parles, il parle, nous parlons, vous parlez, ils parlent. Good news: je, tu, il and ils forms all sound the same.

Two irregular verbs you'll use constantly:
• avoir (to have): j'ai, tu as, il a, nous avons, vous avez, ils ont.
• faire (to do/make): je fais, tu fais, il fait, nous faisons, vous faites, ils font.

Time: Il est huit heures (8:00), huit heures et demie (8:30), midi (noon). Days take "le" for habits: le lundi = on Mondays; lundi = this Monday.

Routine verbs like se lever (to get up) are reflexive: je me lève, je me couche.`,
  models: [
    { target: 'Je travaille de neuf heures à six heures.', en: 'I work from nine to six.' },
    { target: 'Tu regardes des séries en français ?', en: 'Do you watch series in French?' },
    { target: 'Nous parlons anglais au bureau.', en: 'We speak English at the office.' },
    { target: 'Vous commencez à quelle heure ?', en: 'What time do you start?' },
    { target: 'J\'ai une réunion à dix heures.', en: 'I have a meeting at ten.' },
    { target: 'Ils ont deux enfants.', en: 'They have two children. (liaison: ils‿ont)' },
    { target: 'Je fais du sport le samedi.', en: 'I do sport on Saturdays.' },
    { target: 'Qu\'est-ce que vous faites ce soir ?', en: 'What are you doing this evening?' },
  ],
  canDo: [
    'I can describe my typical day from morning to evening.',
    'I can tell the time and talk about days of the week.',
    'I can say what I do at weekends and how often.',
    'I can ask someone about their routine.',
  ],
  phrases: phrases('fr-w02', [
    ['Je me [[lève]] à sept heures du matin.', 'I get up at seven in the morning.'],
    ['Le matin, je prends un café.', 'In the morning, I have a coffee.'],
    ['Je [[commence]] le travail à neuf heures.', 'I start work at nine.'],
    ['Je travaille de chez moi le lundi.', 'I work from home on Mondays.', '"Le lundi" = every Monday.'],
    ['Je prends le métro pour aller au travail.', 'I take the metro to get to work.'],
    ['Le trajet dure quarante minutes.', 'The commute takes forty minutes.'],
    ['Je déjeune vers une heure.', 'I have lunch around one.'],
    ['Je finis le travail à six heures.', 'I finish work at six.', 'Finir is an -ir verb: je finis, nous finissons.'],
    ['Le soir, je cuisine et je regarde une série.', 'In the evening, I cook and watch a series.'],
    ['Je me [[couche]] vers minuit.', 'I go to bed around midnight.'],
    ['J\'ai beaucoup de travail cette semaine.', 'I have a lot of work this week.'],
    ['J\'ai une réunion à onze heures.', 'I have a meeting at eleven.'],
    ['Je n\'ai pas le temps aujourd\'hui.', "I don't have time today."],
    ['Je [[fais]] du sport deux fois par semaine.', 'I do sport twice a week.'],
    ['Le week-end, je fais les courses.', 'At the weekend, I do the shopping.'],
    ['Je fais le ménage le samedi.', 'I do the housework on Saturdays.'],
    ['Quelle heure est-il ?', 'What time is it?'],
    ['Il est huit heures et demie.', "It's half past eight."],
    ['Il est midi.', "It's noon."],
    ['On est quel jour aujourd\'hui ?', 'What day is it today?'],
    ['Aujourd\'hui, on est mardi.', 'Today is Tuesday.'],
    ['J\'écoute des podcasts dans le métro.', 'I listen to podcasts on the metro.'],
    ['J\'étudie le français tous les jours.', 'I study French every day.'],
    ['Tu travailles le week-end ?', 'Do you work at weekends?'],
    ['Non, je ne travaille pas le dimanche.', "No, I don't work on Sundays."],
    ['D\'habitude, je rentre tard.', 'Usually, I get home late.'],
    ['Qu\'est-ce que tu fais ce soir ?', 'What are you doing tonight?'],
    ['J\'aime marcher le soir.', 'I like walking in the evening.'],
    ['Mon week-end commence le vendredi soir.', 'My weekend starts on Friday evening.'],
    ['Je suis toujours fatigué le lundi.', "I'm always tired on Mondays.", 'Women: fatiguée.'],
  ]),
  prompts: prompts('fr-w02', [
    ['Raconte ta journée typique, du matin au soir.', 'Describe your typical day, from morning to evening.', ['Je me lève…', 'Ensuite…', 'Le soir…']],
    ['Qu\'est-ce que tu fais le week-end ?', 'What do you do at the weekend?', ['Le samedi…', 'Je fais…']],
    ['Compare ton lundi et ton samedi.', 'Compare your Monday and your Saturday.'],
    ['À quelle heure tu te lèves et tu te couches ? Pourquoi ?', 'What time do you get up and go to bed? Why?'],
    ['Décris ton trajet pour aller au travail.', 'Describe your commute to work.', ['Je prends…', 'Le trajet dure…']],
    ['Parle de ton programme pour apprendre le français.', 'Talk about your plan for learning French.', ['J\'étudie…', 'tous les jours']],
    ['Pose trois questions à quelqu\'un sur sa routine.', 'Ask someone three questions about their routine.', ['Tu te lèves à quelle heure ?', 'Tu travailles le week-end ?']],
  ]),
}

export const week3: WeekSeed = {
  week: 3,
  theme: 'Food, cafés and shops',
  grammar: 'vouloir and pouvoir; je voudrais…; numbers and prices; ordering and asking politely',
  lesson: `Two verbs make almost every request possible:
• vouloir (to want): je veux, tu veux, il veut, nous voulons, vous voulez, ils veulent.
• pouvoir (can): je peux, tu peux, il peut, nous pouvons, vous pouvez, ils peuvent.

"Je veux" sounds blunt in a shop. Use "je voudrais" (I would like) instead — it's the polite default. "Je peux… ?" / "Est-ce que je peux… ?" asks for permission.

Some/any: du pain, de la soupe, de l'eau, des pommes. After a negative they become "de": je ne mange pas de viande.

Numbers 70–99 are built from sums: 70 = soixante-dix (60+10), 80 = quatre-vingts (4×20), 90 = quatre-vingt-dix (4×20+10). In Belgium and Switzerland you'll also hear septante and nonante.`,
  models: [
    { target: 'Je voudrais un café, s\'il vous plaît.', en: "I'd like a coffee, please." },
    { target: 'Tu veux un croissant ?', en: 'Do you want a croissant?' },
    { target: 'Vous voulez autre chose ?', en: 'Would you like anything else?' },
    { target: 'Je peux payer par carte ?', en: 'Can I pay by card?' },
    { target: 'On peut avoir la carte ?', en: 'Can we have the menu?' },
    { target: 'Je ne mange pas de viande.', en: "I don't eat meat." },
    { target: 'Ça fait soixante-dix euros.', en: "That's seventy euros." },
    { target: 'Ça coûte quatre-vingt-dix-neuf centimes.', en: 'It costs ninety-nine cents.' },
  ],
  canDo: [
    'I can order food and drinks politely in a café or restaurant.',
    'I can ask for prices and understand numbers up to 1,000.',
    'I can buy things in a shop or market.',
    'I can explain a dietary need or allergy.',
  ],
  phrases: phrases('fr-w03', [
    ['Je [[voudrais]] un café, s\'il vous plaît.', "I'd like a coffee, please."],
    ['Je voudrais un croissant et un jus d\'orange.', "I'd like a croissant and an orange juice."],
    ['Est-ce que je [[peux]] avoir de l\'eau, s\'il vous plaît ?', 'Could I have some water, please?'],
    ['Vous avez du thé ?', 'Do you have any tea?'],
    ['Qu\'est-ce que vous me conseillez ?', 'What do you recommend?'],
    ['Je vais prendre le plat du jour.', "I'll have the dish of the day.", 'Set phrase for ordering (you\'ll meet "je vais + verb" properly in week 7).'],
    ['Pour moi, une salade, s\'il vous plaît.', 'For me, a salad, please.'],
    ['Sans sucre, s\'il vous plaît.', 'Without sugar, please.'],
    ['C\'est combien ?', 'How much is it?'],
    ['Ça fait combien ?', 'How much is that altogether?'],
    ['Ça fait douze euros cinquante.', "That's twelve euros fifty."],
    ['Ça coûte trois cents roubles.', 'It costs three hundred roubles.'],
    ['L\'addition, s\'il vous plaît.', 'The bill, please.'],
    ['Je peux payer par carte ?', 'Can I pay by card?'],
    ['C\'est pour emporter.', "It's to take away."],
    ['C\'est pour manger sur place.', "It's to eat in."],
    ['Je voudrais un kilo de pommes.', "I'd like a kilo of apples."],
    ['Vous pouvez me donner un sac ?', 'Could you give me a bag?'],
    ['Je cherche du pain complet.', "I'm looking for wholemeal bread."],
    ['Je ne mange pas de viande.', "I don't eat meat."],
    ['Je suis allergique aux noix.', "I'm allergic to nuts."],
    ['C\'est délicieux !', "It's delicious!"],
    ['Encore un peu de pain, s\'il vous plaît.', 'A bit more bread, please.'],
    ['On peut avoir la carte ?', 'Can we have the menu?'],
    ['Vous voulez autre chose ?', 'Would you like anything else?', 'What the server or shop assistant will ask you.'],
    ['Non merci, c\'est tout.', "No thanks, that's all."],
    ['Vous avez une table pour deux ?', 'Do you have a table for two?'],
    ['Tu [[veux]] un café ?', 'Do you want a coffee?'],
    ['Oui, je veux bien, merci.', "Yes, I'd love one, thanks."],
    ['C\'est un peu trop cher pour moi.', "It's a bit too expensive for me."],
  ]),
  prompts: prompts('fr-w03', [
    ['Commande un petit-déjeuner dans un café à Paris.', 'Order breakfast in a café in Paris.', ['Je voudrais…', 'Et avec ça…', 'L\'addition']],
    ['Tu es au marché. Achète des fruits et demande les prix.', "You're at the market. Buy some fruit and ask the prices.", ['Je voudrais un kilo de…', 'C\'est combien ?']],
    ['Qu\'est-ce que tu manges d\'habitude dans une journée ?', 'What do you usually eat in a day?', ['Le matin…', 'À midi…', 'Le soir…']],
    ['Au restaurant, explique ton allergie ou ton régime, puis commande.', 'At a restaurant, explain your allergy or diet, then order.', ['Je suis allergique à…', 'Je ne mange pas de…']],
    ['Propose à un ami de prendre un café.', 'Suggest a coffee to a friend.', ['Tu veux…', 'On peut…']],
    ['Quel est ton plat préféré ? Décris-le.', "What's your favourite dish? Describe it."],
    ['Demande l\'addition et paie par carte.', 'Ask for the bill and pay by card.', ['L\'addition, s\'il vous plaît.', 'Je peux payer par carte ?']],
  ]),
}

export const week4: WeekSeed = {
  week: 4,
  theme: 'Questions and getting around',
  grammar: 'est-ce que, inversion basics, question words; aller; directions and transport',
  lesson: `Three ways to ask the same question:
1. Rising voice: Tu parles anglais ? (most common in speech)
2. Est-ce que: Est-ce que tu parles anglais ? (safe, neutral)
3. Inversion: Parles-tu anglais ? (more formal; common with vous: Parlez-vous anglais ?)

Question words: où (where), quand (when), comment (how), pourquoi (why), qui (who), combien (how much/many), quel/quelle (which). Put them before est-ce que: Où est-ce que tu habites ?

aller (to go) is irregular: je vais, tu vas, il va, nous allons, vous allez, ils vont. Transport: en métro, en bus, en voiture, but à pied (on foot) and à vélo.`,
  models: [
    { target: 'Est-ce que vous parlez anglais ?', en: 'Do you speak English?' },
    { target: 'Parlez-vous anglais ?', en: 'Do you speak English? (inversion)' },
    { target: 'Où est-ce que je peux acheter un billet ?', en: 'Where can I buy a ticket?' },
    { target: 'Pourquoi est-ce que tu apprends le français ?', en: 'Why are you learning French?' },
    { target: 'Je vais au travail en métro.', en: 'I go to work by metro.' },
    { target: 'Nous allons au musée à pied.', en: "We're walking to the museum." },
    { target: 'Ils vont où ce soir ?', en: 'Where are they going tonight?' },
    { target: 'Quel bus va à la gare ?', en: 'Which bus goes to the station?' },
  ],
  canDo: [
    'I can ask questions three ways (intonation, est-ce que, inversion).',
    'I can ask for and understand simple directions.',
    'I can buy a ticket and ask about transport times.',
    'I can say how I get around my city.',
  ],
  phrases: phrases('fr-w04', [
    ['Où est la station de métro, s\'il vous plaît ?', 'Where is the metro station, please?'],
    ['Excusez-moi, je [[cherche]] la gare.', "Excuse me, I'm looking for the station."],
    ['C\'est loin d\'ici ?', 'Is it far from here?'],
    ['C\'est à cinq minutes à pied.', "It's five minutes' walk."],
    ['Allez tout droit, puis tournez à gauche.', 'Go straight on, then turn left.'],
    ['Tournez à droite au feu.', 'Turn right at the traffic lights.'],
    ['C\'est en face de la banque.', "It's opposite the bank."],
    ['C\'est à côté de la pharmacie.', "It's next to the pharmacy."],
    ['Comment est-ce qu\'on va au centre-ville ?', 'How do you get to the city centre?'],
    ['Quel bus va à l\'aéroport ?', 'Which bus goes to the airport?'],
    ['Où est-ce que je peux acheter un billet ?', 'Where can I buy a ticket?'],
    ['Un aller-retour pour Lyon, s\'il vous plaît.', 'A return ticket to Lyon, please.'],
    ['Le prochain train part à quelle heure ?', 'What time does the next train leave?'],
    ['Je [[vais]] au travail en métro.', 'I go to work by metro.'],
    ['Je vais à la salle de sport à pied.', 'I walk to the gym.'],
    ['On va où ce soir ?', 'Where are we going tonight?'],
    ['Est-ce que tu vas souvent en France ?', 'Do you often go to France?'],
    ['Est-ce que vous parlez anglais ?', 'Do you speak English?'],
    ['[[Pourquoi]] est-ce que tu apprends le français ?', 'Why are you learning French?'],
    ['Parce que j\'aime la langue et la culture.', 'Because I love the language and the culture.'],
    ['Quand est-ce que le magasin ferme ?', 'When does the shop close?'],
    ['Il faut combien de temps pour y aller ?', 'How long does it take to get there?'],
    ['Parlez-vous anglais ?', 'Do you speak English? (inversion)'],
    ['Où allez-vous ?', 'Where are you going? (inversion)'],
    ['Pouvez-vous m\'aider ?', 'Can you help me?'],
    ['Je suis perdu.', "I'm lost.", 'Women: perdue.'],
    ['Vous pouvez me montrer sur le plan ?', 'Can you show me on the map?', 'Un plan = a city/metro map; une carte = a larger map.'],
    ['Il faut changer à la prochaine station.', 'You have to change at the next station.'],
    ['Descendez au prochain arrêt.', 'Get off at the next stop.'],
    ['Qu\'est-ce que c\'est ?', 'What is it?'],
  ]),
  prompts: prompts('fr-w04', [
    ['Explique à un touriste comment aller de chez toi à la station de métro la plus proche.', 'Explain to a tourist how to get from your home to the nearest metro station.', ['Allez tout droit…', 'Tournez à…', 'C\'est à… minutes']],
    ['Pose cinq questions à un nouveau collègue : qui, où, quand, pourquoi, comment.', 'Ask a new colleague five questions using who, where, when, why, how.'],
    ['Tu es perdu à Paris. Demande ton chemin.', "You're lost in Paris. Ask for directions.", ['Excusez-moi…', 'Je cherche…', 'C\'est loin ?']],
    ['Achète un billet de train aller-retour pour Bordeaux, pour demain matin.', 'Buy a return train ticket to Bordeaux for tomorrow morning.'],
    ['Décris comment tu vas au travail et combien de temps ça prend.', 'Describe how you get to work and how long it takes.'],
    ['Compare le métro de Moscou avec les transports d\'une autre ville.', "Compare Moscow's metro with transport in another city."],
    ['Pose trois questions avec « est-ce que », puis les mêmes avec l\'inversion.', 'Ask three questions with "est-ce que", then the same ones with inversion.'],
  ]),
}
