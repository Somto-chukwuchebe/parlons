import type { WeekSeed } from '../types'
import { phrases, prompts } from '../helpers'

// Month 2 (weeks 5–8): past, future and opinions.

export const week5: WeekSeed = {
  week: 5,
  theme: 'Last weekend',
  grammar: 'Passé composé with avoir',
  lesson: `The passé composé is the everyday past tense: "I did / I have done". It has two parts: avoir in the present + a past participle.

j'ai parlé, tu as mangé, il a regardé, nous avons travaillé, vous avez fini, ils ont vu.

Participles: -er verbs → -é (parler → parlé). -ir verbs → -i (finir → fini). Common irregulars to learn by heart: faire → fait, voir → vu, lire → lu, boire → bu, prendre → pris, avoir → eu, être → été.

Negative: ne… pas wraps around avoir: je n'ai pas mangé. Same with jamais and rien: je n'ai rien fait.

"C'était…" (it was) is a different tense (imparfait, week 9), but use it now as a fixed phrase to react: C'était super !`,
  models: [
    { target: 'J\'ai regardé un film samedi.', en: 'I watched a film on Saturday.' },
    { target: 'Tu as bien dormi ?', en: 'Did you sleep well?' },
    { target: 'On a mangé dans un restaurant italien.', en: 'We ate in an Italian restaurant.' },
    { target: 'Nous avons fait une longue promenade.', en: 'We went for a long walk.' },
    { target: 'Vous avez vu le match ?', en: 'Did you see the match?' },
    { target: 'Ils ont pris le train.', en: 'They took the train.' },
    { target: 'Je n\'ai rien fait de spécial.', en: "I didn't do anything special." },
    { target: 'Je n\'ai pas eu le temps.', en: "I didn't have time." },
  ],
  canDo: [
    'I can say what I did last weekend or yesterday.',
    'I can use common irregular past forms (fait, vu, pris, lu, bu, eu).',
    'I can ask someone about their weekend and react.',
    'I can say what I did not do.',
  ],
  phrases: phrases('fr-w05', [
    ['Qu\'est-ce que tu as fait ce week-end ?', 'What did you do this weekend?'],
    ['Samedi, j\'ai [[vu]] des amis.', 'On Saturday, I saw some friends.'],
    ['J\'ai [[regardé]] un film à la maison.', 'I watched a film at home.'],
    ['J\'ai mangé dans un petit restaurant italien.', 'I ate in a little Italian restaurant.'],
    ['On a beaucoup parlé.', 'We talked a lot.'],
    ['J\'ai [[fait]] une longue promenade dans le parc.', 'I went for a long walk in the park.'],
    ['J\'ai travaillé un peu dimanche matin.', 'I worked a little on Sunday morning.'],
    ['J\'ai bien dormi.', 'I slept well.'],
    ['J\'ai lu un livre.', 'I read a book.'],
    ['Hier soir, j\'ai cuisiné pour des amis.', 'Last night, I cooked for friends.'],
    ['J\'ai acheté une nouvelle veste.', 'I bought a new jacket.'],
    ['J\'ai appelé ma famille.', 'I called my family.'],
    ['J\'ai écouté un podcast en français.', 'I listened to a podcast in French.'],
    ['J\'ai eu une semaine chargée.', 'I had a busy week.'],
    ['Je n\'ai [[rien]] fait de spécial.', "I didn't do anything special."],
    ['Je n\'ai pas eu le temps de sortir.', "I didn't have time to go out."],
    ['Tu as passé un bon week-end ?', 'Did you have a good weekend?'],
    ['Oui, j\'ai passé un très bon week-end, merci.', 'Yes, I had a really good weekend, thanks.'],
    ['C\'était super !', 'It was great!', 'Fixed phrase for now; c\'était is imparfait (week 9).'],
    ['C\'était un peu ennuyeux.', 'It was a bit boring.'],
    ['J\'ai [[pris]] le train pour aller à la campagne.', 'I took the train to the countryside.'],
    ['J\'ai bu un verre avec un collègue.', 'I had a drink with a colleague.'],
    ['On a joué aux cartes.', 'We played cards.'],
    ['J\'ai fini un gros projet vendredi.', 'I finished a big project on Friday.'],
    ['J\'ai oublié mon téléphone chez moi.', 'I left my phone at home.'],
    ['J\'ai déjà vu ce film.', "I've already seen this film."],
    ['Je n\'ai jamais essayé.', "I've never tried."],
    ['Il a plu tout le week-end.', 'It rained all weekend.'],
    ['Tu as vu le match ?', 'Did you see the match?'],
    ['Qu\'est-ce que tu as pensé du film ?', 'What did you think of the film?'],
  ]),
  prompts: prompts('fr-w05', [
    ['Raconte ton dernier week-end en détail.', 'Describe last weekend in detail.', ['Samedi, j\'ai…', 'Ensuite…', 'Dimanche…']],
    ['Qu\'est-ce que tu as fait hier, du matin au soir ?', 'What did you do yesterday, from morning to evening?'],
    ['Raconte un bon repas que tu as mangé récemment.', 'Tell me about a good meal you had recently.'],
    ['Qu\'est-ce que tu as fait au travail cette semaine ?', 'What did you do at work this week?'],
    ['Pose des questions à un ami sur son week-end et réagis.', "Ask a friend about their weekend and react.", ['Tu as passé un bon week-end ?', 'C\'était comment ?']],
    ['Raconte un film ou une série que tu as regardé récemment.', 'Talk about a film or series you watched recently.'],
  ]),
}

export const week6: WeekSeed = {
  week: 6,
  theme: 'Where I went',
  grammar: 'Passé composé with être; common irregular past participles',
  lesson: `About 15 verbs — mostly about movement — use être instead of avoir in the passé composé: aller, venir, partir, arriver, sortir, entrer, rentrer, rester, monter, descendre, tomber, naître, mourir, devenir, revenir. All reflexive verbs (se lever, se reposer) use être too.

With être, the participle agrees with the subject like an adjective: il est allé, elle est allée, ils sont allés, elles sont allées. In speech most of these sound identical.

More irregular participles (with avoir): mettre → mis, dire → dit, écrire → écrit, devoir → dû, pouvoir → pu, vouloir → voulu, recevoir → reçu, comprendre → compris, découvrir → découvert.

Background descriptions like "it was closed" use the imparfait (était). You'll learn it properly in week 9 — for now, treat "il était fermé" as a set phrase.`,
  models: [
    { target: 'Je suis allé au cinéma.', en: 'I went to the cinema.' },
    { target: 'Elle est venue chez moi.', en: 'She came to my place.' },
    { target: 'Nous sommes partis tôt.', en: 'We left early.' },
    { target: 'Vous êtes restés combien de temps ?', en: 'How long did you stay?' },
    { target: 'Ils sont rentrés tard.', en: 'They got home late.' },
    { target: 'Je me suis bien reposé.', en: 'I had a good rest.' },
    { target: 'J\'ai dû travailler samedi.', en: 'I had to work on Saturday.' },
    { target: 'J\'ai écrit un long message.', en: 'I wrote a long message.' },
  ],
  canDo: [
    'I can say where I went and when I came back.',
    'I can tell someone about a trip or a day out.',
    'I can choose between avoir and être in the past.',
    'I can use irregular past participles like mis, dit, écrit, dû, pu.',
  ],
  phrases: phrases('fr-w06', [
    ['Je suis [[allé]] au cinéma samedi.', 'I went to the cinema on Saturday.', 'Women: allée (same sound).'],
    ['Je suis [[sorti]] avec des amis vendredi soir.', 'I went out with friends on Friday night.'],
    ['Je suis rentré tard.', 'I got home late.'],
    ['Je suis [[resté]] à la maison dimanche.', 'I stayed at home on Sunday.'],
    ['Nous sommes partis tôt le matin.', 'We left early in the morning.'],
    ['Je suis arrivé à l\'heure.', 'I arrived on time.'],
    ['Elle est venue chez moi.', 'She came to my place.'],
    ['Ils sont allés en Italie l\'été dernier.', 'They went to Italy last summer.'],
    ['Je suis né dans une petite ville.', 'I was born in a small town.'],
    ['Je suis tombé malade la semaine dernière.', 'I got ill last week.'],
    ['Je suis descendu du bus au mauvais arrêt.', 'I got off the bus at the wrong stop.'],
    ['Tu es allé où en vacances ?', 'Where did you go on holiday?'],
    ['Je suis allé à Saint-Pétersbourg en juillet.', 'I went to Saint Petersburg in July.'],
    ['Je suis parti une semaine.', 'I went away for a week.'],
    ['On est allés à la mer.', 'We went to the seaside.'],
    ['Je me suis bien [[reposé]].', 'I had a good rest.'],
    ['Je me suis levé tard dimanche.', 'I got up late on Sunday.'],
    ['Nous nous sommes promenés le long de la rivière.', 'We walked along the river.'],
    ['J\'ai mis un pull chaud.', 'I put on a warm jumper.'],
    ['J\'ai [[dû]] travailler samedi.', 'I had to work on Saturday.'],
    ['J\'ai pu me reposer un peu.', 'I managed to rest a little.'],
    ['J\'ai voulu visiter le musée, mais il était fermé.', 'I wanted to visit the museum, but it was closed.'],
    ['J\'ai écrit un long message à mon frère.', 'I wrote a long message to my brother.'],
    ['J\'ai dit bonjour à mes voisins.', 'I said hello to my neighbours.'],
    ['J\'ai découvert un super café.', 'I discovered a great café.'],
    ['J\'ai reçu un cadeau.', 'I received a present.'],
    ['J\'ai enfin compris la règle !', 'I finally understood the rule!'],
    ['Je ne suis pas sorti ce week-end.', "I didn't go out this weekend."],
    ['Tu es rentré quand ?', 'When did you get back?'],
    ['On s\'est bien amusés.', 'We had a great time.'],
  ]),
  prompts: prompts('fr-w06', [
    ['Raconte ton dernier voyage : où tu es allé, avec qui et ce que tu as fait.', 'Tell me about your last trip: where you went, who with and what you did.'],
    ['Raconte une soirée où tu es sorti avec des amis.', 'Describe an evening out with friends.'],
    ['Qu\'est-ce que tu as fait le week-end dernier ? Utilise au moins trois verbes avec « être ».', 'What did you do last weekend? Use at least three verbs that take être.'],
    ['Raconte un trajet qui s\'est mal passé (retard, mauvais arrêt…).', 'Tell me about a journey that went wrong (delay, wrong stop…).'],
    ['Où es-tu allé l\'été dernier ?', 'Where did you go last summer?'],
    ['Raconte un grand événement de ta vie : une naissance, un déménagement, un premier emploi.', 'Talk about a big life event: a birth, a move, a first job.', ['Je suis né…', 'Je suis parti…', 'Je suis arrivé…']],
  ]),
}

export const week7: WeekSeed = {
  week: 7,
  theme: 'Plans',
  grammar: 'Futur proche (je vais + infinitive); invitations, accepting and declining',
  lesson: `The easiest way to talk about the future: aller in the present + an infinitive.

je vais voir, tu vas partir, il va neiger, nous allons manger, vous allez rester, ils vont venir.

Negative: ne… pas wraps around aller: je ne vais pas travailler demain.

Useful time words: ce soir, demain, ce week-end, la semaine prochaine, le mois prochain, l'année prochaine.

Inviting: Tu es libre… ? Ça te dit de… ? Tu veux venir… ?
Accepting: Avec plaisir ! Bonne idée ! Ça marche !
Declining kindly: Désolé, je ne peux pas… C'est dommage, une autre fois peut-être.`,
  models: [
    { target: 'Je vais voir un match ce soir.', en: "I'm going to watch a match tonight." },
    { target: 'Tu vas partir en vacances ?', en: 'Are you going on holiday?' },
    { target: 'Il va neiger demain.', en: "It's going to snow tomorrow." },
    { target: 'Nous allons dîner chez des amis.', en: "We're going to have dinner at some friends'." },
    { target: 'Je ne vais pas travailler lundi.', en: "I'm not going to work on Monday." },
    { target: 'Ça te dit d\'aller au cinéma ?', en: 'Do you fancy going to the cinema?' },
    { target: 'Désolé, je ne peux pas samedi.', en: "Sorry, I can't on Saturday." },
  ],
  canDo: [
    'I can talk about my plans for tonight, the weekend and next year.',
    'I can invite someone and suggest a time and place.',
    'I can accept or politely decline an invitation.',
    'I can arrange where and when to meet.',
  ],
  phrases: phrases('fr-w07', [
    ['Qu\'est-ce que tu [[vas]] faire ce week-end ?', 'What are you going to do this weekend?'],
    ['Je vais voir un match avec des amis.', "I'm going to watch a match with friends."],
    ['Samedi, je vais faire du patin à glace.', "On Saturday, I'm going ice skating."],
    ['Ce soir, je vais rester tranquille à la maison.', "Tonight, I'm going to have a quiet evening at home."],
    ['L\'année prochaine, je vais voyager en France.', "Next year, I'm going to travel to France."],
    ['Je ne vais pas travailler demain.', "I'm not going to work tomorrow."],
    ['On se voit quand ?', 'When shall we meet up?'],
    ['Tu es libre samedi soir ?', 'Are you free on Saturday evening?'],
    ['Ça te [[dit]] d\'aller au cinéma ?', 'Do you fancy going to the cinema?'],
    ['Tu veux venir dîner chez moi ?', 'Do you want to come for dinner at my place?'],
    ['Avec plaisir !', 'With pleasure!'],
    ['Bonne idée, j\'adore ce restaurant.', 'Good idea, I love that restaurant.'],
    ['D\'accord, on se retrouve à quelle heure ?', 'OK, what time shall we meet?'],
    ['On se retrouve devant le cinéma à huit heures.', "Let's meet outside the cinema at eight."],
    ['Désolé, je ne peux pas, je suis pris ce soir.', "Sorry, I can't, I'm busy tonight.", 'Women: désolée, prise.'],
    ['C\'est dommage, une autre fois peut-être.', "That's a shame, another time maybe."],
    ['Je vais voir, je te confirme demain.', "I'll see and confirm tomorrow."],
    ['Je ne suis pas sûr, je vais vérifier mon agenda.', "I'm not sure, I'll check my diary.", 'Women: sûre.'],
    ['Qu\'est-ce que tu proposes ?', 'What do you suggest?'],
    ['Pourquoi pas dimanche ?', 'Why not Sunday?'],
    ['Je vais prendre des vacances en décembre.', "I'm going to take some time off in December."],
    ['Il va neiger demain.', "It's going to snow tomorrow."],
    ['Je vais commencer un nouveau projet au travail.', "I'm going to start a new project at work."],
    ['Je vais appeler ma mère ce soir.', "I'm going to call my mum tonight."],
    ['On va fêter mon anniversaire samedi.', "We're going to celebrate my birthday on Saturday."],
    ['Je vais [[essayer]] de me coucher plus tôt.', "I'm going to try to go to bed earlier."],
    ['Ça marche !', 'Deal! / Works for me!'],
    ['À samedi, alors !', 'See you Saturday, then!'],
    ['Je t\'envoie l\'adresse par message.', "I'll text you the address."],
    ['Tu viens avec nous ?', 'Are you coming with us?'],
  ]),
  prompts: prompts('fr-w07', [
    ['Parle de tes projets pour le week-end prochain.', 'Talk about your plans for next weekend.', ['Samedi, je vais…', 'Dimanche…']],
    ['Invite un ami à dîner : propose un jour, une heure et un lieu.', 'Invite a friend to dinner: suggest a day, a time and a place.', ['Tu es libre… ?', 'On se retrouve…']],
    ['Refuse poliment une invitation et propose une autre date.', 'Politely decline an invitation and suggest another date.', ['Désolé, je ne peux pas…', 'Pourquoi pas… ?']],
    ['Quels sont tes projets pour les fêtes de fin d\'année ?', 'What are your plans for the end-of-year holidays?'],
    ['Qu\'est-ce que tu vas faire pour progresser en français le mois prochain ?', 'What are you going to do to improve your French next month?'],
    ['Organise une sortie avec un collègue : accepte, négocie l\'heure, confirme.', 'Arrange an outing with a colleague: accept, agree on a time, confirm.'],
  ]),
}

export const week8: WeekSeed = {
  week: 8,
  theme: 'Opinions',
  grammar: 'je pense que, je trouve que, j\'aime / je préfère… parce que; describing people and places',
  lesson: `Giving an opinion:
• Je pense que / Je crois que / Je trouve que + a full sentence: Je trouve que la ville est belle.
• À mon avis, … / Pour moi, …
• J'aime / J'adore / Je préfère / Je déteste + noun or infinitive, then parce que + reason.

Reacting: Je suis d'accord. Je ne suis pas d'accord. Tu as raison. Ça dépend.

Adjectives agree with the noun and usually come after it: un quartier calme, une ville dynamique. A few short, common ones come before: grand, petit, bon, beau, nouveau, vieux.

Comparing: plus… que (more than), moins… que (less than), aussi… que (as… as). Irregular: bon → meilleur.`,
  models: [
    { target: 'Je pense que c\'est une bonne idée.', en: "I think it's a good idea." },
    { target: 'Je trouve que le film est trop long.', en: 'I find the film too long.' },
    { target: 'Je préfère le thé parce que le café me rend nerveux.', en: 'I prefer tea because coffee makes me jittery.' },
    { target: 'C\'est un quartier calme et agréable.', en: "It's a quiet, pleasant neighbourhood." },
    { target: 'Elle est grande et très drôle.', en: "She's tall and very funny." },
    { target: 'Paris est plus petit que Moscou.', en: 'Paris is smaller than Moscow.' },
    { target: 'Ce café est meilleur que l\'autre.', en: 'This café is better than the other one.' },
  ],
  canDo: [
    'I can give my opinion and a reason for it.',
    'I can agree and disagree politely.',
    'I can describe a person\'s appearance and character.',
    'I can describe and compare places.',
  ],
  phrases: phrases('fr-w08', [
    ['Je [[pense]] que c\'est une bonne idée.', "I think it's a good idea."],
    ['Je [[trouve]] que Moscou est une ville très dynamique.', 'I find Moscow a very lively city.'],
    ['À mon avis, le film est trop long.', 'In my opinion, the film is too long.'],
    ['Je [[préfère]] le thé au café.', 'I prefer tea to coffee.'],
    ['J\'aime bien cette ville parce qu\'il y a beaucoup de parcs.', 'I like this city because there are lots of parks.'],
    ['Je n\'aime pas trop l\'hiver parce qu\'il fait nuit tôt.', "I don't really like winter because it gets dark early."],
    ['Je suis d\'accord avec toi.', 'I agree with you.'],
    ['Je ne suis pas d\'accord.', "I don't agree."],
    ['Ça dépend.', 'It depends.'],
    ['Pour moi, le plus important, c\'est la santé.', 'For me, the most important thing is health.'],
    ['Qu\'est-ce que tu en penses ?', 'What do you think of it?'],
    ['Tu trouves ça comment ?', 'What do you make of it?'],
    ['C\'est intéressant, mais un peu compliqué.', "It's interesting, but a bit complicated."],
    ['Il est grand, brun et très drôle.', "He's tall, dark-haired and very funny."],
    ['Elle est sympa et très intelligente.', "She's nice and very smart."],
    ['Mon collègue est quelqu\'un de très calme.', 'My colleague is a very calm person.'],
    ['C\'est un quartier calme et agréable.', "It's a quiet, pleasant neighbourhood."],
    ['L\'appartement est petit mais lumineux.', 'The flat is small but bright.'],
    ['Il y a trop de monde le samedi.', "It's too crowded on Saturdays."],
    ['Le métro est rapide et pas cher.', 'The metro is fast and cheap.'],
    ['Ce restaurant est [[meilleur]] que l\'autre.', 'This restaurant is better than the other one.'],
    ['Paris est plus petit que Moscou.', 'Paris is smaller than Moscow.'],
    ['Le français est moins difficile que le russe.', 'French is less difficult than Russian.'],
    ['J\'adore cette série, elle est vraiment drôle.', 'I love this series, it\'s really funny.'],
    ['Je déteste attendre.', 'I hate waiting.'],
    ['Ça me plaît beaucoup.', 'I really like it.'],
    ['Ça ne me plaît pas du tout.', "I don't like it at all."],
    ['Franchement, je ne sais pas.', "Honestly, I don't know."],
    ['Tu as raison.', "You're right."],
    ['C\'est vrai, mais il y a un problème.', "That's true, but there's a problem."],
  ]),
  prompts: prompts('fr-w08', [
    ['Donne ton avis sur Moscou : ce que tu aimes, ce que tu n\'aimes pas, et pourquoi.', "Give your opinion of Moscow: what you like, what you don't, and why.", ['J\'aime… parce que…', 'Je n\'aime pas trop…']],
    ['Décris un ami proche : son physique et son caractère.', "Describe a close friend: appearance and personality."],
    ['Compare deux villes que tu connais.', 'Compare two cities you know.', ['plus… que', 'moins… que', 'meilleur']],
    ['Quel est ton film ou ta série préférée ? Pourquoi ?', "What's your favourite film or series? Why?"],
    ['Télétravail ou bureau ? Donne ton opinion avec deux raisons.', 'Working from home or the office? Give your opinion with two reasons.'],
    ['Décris ton quartier à quelqu\'un qui ne le connaît pas.', "Describe your neighbourhood to someone who doesn't know it."],
    ['Réagis : « Le français est une langue difficile. » Tu es d\'accord ?', 'React: "French is a difficult language." Do you agree?'],
  ]),
}
