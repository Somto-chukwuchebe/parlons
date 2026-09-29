import type { WeekSeed } from '../types'
import { phrases, prompts } from '../helpers'

// Month 3 (weeks 9–12): real conversation.

export const week9: WeekSeed = {
  week: 9,
  theme: 'Stories',
  grammar: 'Imparfait for background vs passé composé for events (basics); telling a short story',
  lesson: `A story needs two past tenses:
• Imparfait = the background, the scenery, what was going on, habits: Il faisait beau. J'étais dans le métro. Enfant, je jouais au foot.
• Passé composé = the events that move the story forward: Mon téléphone a sonné. Je suis sorti.

Think of a film: the imparfait is the set and the music; the passé composé is the action.

Forming the imparfait: take the nous form of the present, drop -ons, add -ais, -ais, -ait, -ions, -iez, -aient. nous parlons → je parlais. Only être is irregular: j'étais.

Story connectors: d'abord (first), ensuite / puis (then), tout à coup (suddenly), pendant que (while), finalement (in the end), bref (anyway, in short).`,
  models: [
    { target: 'Il pleuvait quand je suis arrivé.', en: 'It was raining when I arrived.' },
    { target: 'J\'étais dans le métro quand mon téléphone a sonné.', en: 'I was on the metro when my phone rang.' },
    { target: 'Enfant, je jouais au foot tous les week-ends.', en: 'As a child, I played football every weekend.' },
    { target: 'Il y avait beaucoup de monde.', en: 'There were lots of people.' },
    { target: 'Tout à coup, j\'ai entendu un bruit.', en: 'Suddenly, I heard a noise.' },
    { target: 'Pendant que je cuisinais, mon ami est arrivé.', en: 'While I was cooking, my friend arrived.' },
    { target: 'Finalement, je suis rentré à minuit.', en: 'In the end, I got home at midnight.' },
  ],
  canDo: [
    'I can tell a short story with a beginning, middle and end.',
    'I can set the scene with the imparfait and narrate events with the passé composé.',
    'I can describe what life used to be like.',
    'I can use story connectors to keep a listener following.',
  ],
  phrases: phrases('fr-w09', [
    ['Quand j\'[[étais]] petit, j\'habitais dans une petite ville.', 'When I was little, I lived in a small town.', 'Women: petite.'],
    ['Il faisait beau, alors on est sortis.', 'The weather was nice, so we went out.'],
    ['Il [[pleuvait]] quand je suis arrivé.', 'It was raining when I arrived.'],
    ['J\'étais dans le métro quand mon téléphone a sonné.', 'I was on the metro when my phone rang.'],
    ['Il y [[avait]] beaucoup de monde.', 'There were lots of people.'],
    ['C\'était ma première fois à Paris.', 'It was my first time in Paris.'],
    ['Je ne savais pas quoi dire.', "I didn't know what to say."],
    ['J\'avais très faim.', 'I was really hungry.'],
    ['Tout à coup, j\'ai entendu un bruit.', 'Suddenly, I heard a noise.'],
    ['D\'abord, on a pris un café.', 'First, we had a coffee.'],
    ['Ensuite, on est allés au musée.', 'Then we went to the museum.'],
    ['Après, on a dîné au bord de l\'eau.', 'Afterwards, we had dinner by the water.'],
    ['Finalement, je suis rentré à minuit.', 'In the end, I got home at midnight.'],
    ['Pendant que je [[cuisinais]], mon ami est arrivé.', 'While I was cooking, my friend arrived.'],
    ['Un jour, j\'ai raté mon train.', 'One day, I missed my train.'],
    ['Je lisais quand quelqu\'un a frappé à la porte.', 'I was reading when someone knocked at the door.'],
    ['Il faisait très froid ce jour-là.', 'It was very cold that day.'],
    ['Je me sentais un peu nerveux.', 'I was feeling a bit nervous.', 'Women: nerveuse.'],
    ['Tout le monde riait.', 'Everyone was laughing.'],
    ['Au début, je ne comprenais rien.', "At first, I didn't understand anything."],
    ['Heureusement, un passant m\'a aidé.', 'Luckily, a passer-by helped me.'],
    ['Malheureusement, le magasin était fermé.', 'Unfortunately, the shop was closed.'],
    ['Et puis, tu sais ce qui s\'est passé ?', 'And then, you know what happened?'],
    ['Je te raconte ce qui m\'est arrivé hier.', 'Let me tell you what happened to me yesterday.'],
    ['C\'était une soirée incroyable.', 'It was an incredible evening.'],
    ['Enfant, je [[jouais]] au foot tous les week-ends.', 'As a child, I played football every weekend.'],
    ['Avant, je ne parlais pas du tout français.', "Before, I didn't speak French at all."],
    ['On s\'est perdus, mais c\'était drôle.', 'We got lost, but it was funny.'],
    ['Bref, c\'était une journée bizarre.', 'Anyway, it was a strange day.'],
    ['Il était une fois un petit village.', 'Once upon a time, there was a little village.'],
  ]),
  prompts: prompts('fr-w09', [
    ['Raconte un souvenir d\'enfance.', 'Tell a childhood memory.', ['Quand j\'étais petit…', 'Un jour…']],
    ['Raconte une journée où rien ne s\'est passé comme prévu.', "Tell me about a day when nothing went to plan."],
    ['Raconte ta première journée dans un nouveau travail.', 'Describe your first day at a new job.'],
    ['Décris un voyage mémorable : d\'abord le décor, puis les événements.', 'Describe a memorable trip: first set the scene, then tell what happened.', ['Il faisait…', 'Il y avait…', 'Tout à coup…']],
    ['Raconte une rencontre surprenante.', 'Tell me about a surprising encounter.'],
    ['Comment était ta vie il y a dix ans ? Qu\'est-ce qui a changé ?', 'What was your life like ten years ago? What has changed?', ['Avant, je…', 'Maintenant…']],
    ['Raconte une petite histoire en cinq étapes : d\'abord, ensuite, tout à coup, finalement, bref.', 'Tell a short story in five steps using the connectors.'],
  ]),
}

export const week10: WeekSeed = {
  week: 10,
  theme: 'Wishes and politeness',
  grammar: 'Conditionnel (je voudrais, j\'aimerais, ce serait); making suggestions',
  lesson: `The conditionnel means "would". It softens requests, expresses wishes and imagines situations.

Form: the future stem (usually the infinitive) + imparfait endings: j'aimerais, tu aimerais, il aimerait, nous aimerions, vous aimeriez, ils aimeraient.
Irregular stems to know: être → ser- (ce serait), avoir → aur- (j'aurais), pouvoir → pourr- (vous pourriez), vouloir → voudr- (je voudrais), faire → fer- (je ferais), devoir → devr- (tu devrais), falloir → faudr- (il faudrait).

Uses:
• Politeness: Vous pourriez… ? Ça vous dérangerait de… ?
• Wishes: J'aimerais visiter… Ce serait génial.
• Advice: Tu devrais… À ta place, je…
• Suggestions: On pourrait… Et si on + imparfait… ? (Et si on allait au parc ?)
• Hypotheses: Si + imparfait, conditionnel: Si j'avais le temps, je voyagerais.`,
  models: [
    { target: 'J\'aimerais visiter la Provence.', en: "I'd like to visit Provence." },
    { target: 'Ce serait génial !', en: 'That would be great!' },
    { target: 'Vous pourriez parler plus lentement ?', en: 'Could you speak more slowly?' },
    { target: 'On pourrait aller au restaurant.', en: 'We could go to a restaurant.' },
    { target: 'Et si on allait au parc ?', en: 'How about going to the park?' },
    { target: 'Tu devrais essayer ce café.', en: 'You should try this café.' },
    { target: 'Si j\'avais plus de temps, je voyagerais plus.', en: "If I had more time, I'd travel more." },
  ],
  canDo: [
    'I can make polite requests with the conditionnel.',
    'I can talk about wishes and dreams.',
    'I can make suggestions and give advice.',
    'I can say what I would do in an imaginary situation.',
  ],
  phrases: phrases('fr-w10', [
    ['J\'[[aimerais]] visiter la Provence un jour.', "I'd like to visit Provence one day."],
    ['Je voudrais parler français couramment.', "I'd like to speak French fluently."],
    ['Ce [[serait]] génial !', 'That would be great!'],
    ['Ce serait mieux de partir tôt.', 'It would be better to leave early.'],
    ['Pourriez-vous m\'aider, s\'il vous plaît ?', 'Could you help me, please?'],
    ['Vous [[pourriez]] parler plus lentement ?', 'Could you speak more slowly?'],
    ['Est-ce que ce serait possible de changer de chambre ?', 'Would it be possible to change rooms?'],
    ['On pourrait aller au restaurant ce soir.', 'We could go to a restaurant tonight.'],
    ['Et si on allait au parc ?', 'How about going to the park?'],
    ['Tu [[devrais]] essayer ce café.', 'You should try this café.'],
    ['À ta place, je prendrais le train.', "If I were you, I'd take the train."],
    ['Ça me ferait plaisir.', "I'd like that. / That would make me happy."],
    ['J\'aimerais bien, mais je n\'ai pas le temps.', "I'd like to, but I don't have time."],
    ['Si j\'avais plus de temps, je voyagerais plus.', "If I had more time, I'd travel more."],
    ['Si j\'étais riche, j\'achèterais une maison au bord de la mer.', "If I were rich, I'd buy a house by the sea."],
    ['Je préférerais rester ici.', "I'd rather stay here."],
    ['Ça vous dérangerait de fermer la fenêtre ?', 'Would you mind closing the window?'],
    ['Je vous serais reconnaissant de me répondre rapidement.', "I'd be grateful if you could reply quickly.", 'Formal, e.g. in an email. Women: reconnaissante.'],
    ['Il [[faudrait]] réserver à l\'avance.', 'We ought to book in advance.'],
    ['Tu aurais un moment ?', 'Would you have a moment?'],
    ['Auriez-vous une table pour ce soir ?', 'Would you have a table for tonight?'],
    ['Je me demandais si tu étais libre demain.', 'I was wondering if you were free tomorrow.'],
    ['Ce serait sympa de se revoir.', 'It would be nice to see each other again.'],
    ['Qu\'est-ce que tu ferais à ma place ?', 'What would you do in my place?'],
    ['J\'aimerais vivre à Paris pendant un an.', "I'd like to live in Paris for a year."],
    ['Je souhaiterais parler au responsable.', "I'd like to speak to the manager."],
    ['Vous pourriez répéter la dernière phrase ?', 'Could you repeat the last sentence?'],
    ['Je voudrais réserver une chambre pour deux nuits.', "I'd like to book a room for two nights."],
    ['Ça ne vous dérange pas ?', "You don't mind?"],
    ['Volontiers !', 'Gladly!'],
  ]),
  prompts: prompts('fr-w10', [
    ['Si tu pouvais vivre n\'importe où, où est-ce que tu vivrais ? Pourquoi ?', 'If you could live anywhere, where would you live? Why?', ['Si je pouvais…, je vivrais…']],
    ['À l\'hôtel, ta chambre est bruyante. Demande poliment à changer.', 'At a hotel, your room is noisy. Politely ask to change.', ['Excusez-moi…', 'Est-ce que ce serait possible de… ?']],
    ['Propose trois idées de sortie à un ami avec « on pourrait » et « et si on… ».', 'Suggest three outings to a friend using "on pourrait" and "et si on…".'],
    ['Un ami veut apprendre le russe. Donne-lui des conseils.', 'A friend wants to learn Russian. Give them advice.', ['Tu devrais…', 'À ta place, je…']],
    ['Qu\'est-ce que tu ferais avec un mois de vacances ?', 'What would you do with a month off?'],
    ['Décris ton travail idéal.', 'Describe your ideal job.', ['J\'aimerais…', 'Ce serait…']],
    ['Laisse un message vocal poli à un collègue pour lui demander de l\'aide.', 'Leave a polite voice message asking a colleague for help.'],
  ]),
}

export const week11: WeekSeed = {
  week: 11,
  theme: 'Keeping a conversation going',
  grammar: 'Fillers and connectors (alors, en fait, du coup, bon, d\'ailleurs); asking someone to repeat or slow down; rephrasing when stuck',
  lesson: `Fluent speakers aren't people who never get stuck — they're people who keep talking while they think. This week is about the glue.

Fillers and connectors:
• alors — so, well then
• en fait — actually, in fact
• du coup — so, as a result (very common in speech)
• bon — right, well
• d'ailleurs — by the way, besides
• enfin — well, I mean
• bref — anyway

When you don't know a word, describe it: C'est un truc pour… (it's a thing for…), C'est comme… mais… (it's like… but…), C'est quelqu'un qui… (it's someone who…).

When you don't understand: Pardon ? Vous pouvez répéter ? Plus lentement, s'il vous plaît. Ça veut dire quoi ?

Show you're listening: Ah bon ? C'est vrai ? Je vois. Tout à fait. Then ask a follow-up question.`,
  models: [
    { target: 'Alors, comment ça s\'est passé ?', en: 'So, how did it go?' },
    { target: 'En fait, je ne suis pas d\'accord.', en: "Actually, I don't agree." },
    { target: 'Du coup, on a changé de plan.', en: 'So we changed plans.' },
    { target: 'D\'ailleurs, tu as vu Marie ?', en: 'By the way, have you seen Marie?' },
    { target: 'C\'est un truc qu\'on utilise pour ouvrir les bouteilles.', en: "It's a thing you use to open bottles." },
    { target: 'Ah bon ? Raconte !', en: 'Really? Tell me!' },
  ],
  canDo: [
    'I can use fillers to keep talking while I think.',
    'I can ask someone to repeat, slow down or explain a word.',
    'I can describe something when I don\'t know the word.',
    'I can react to what someone says and ask follow-up questions.',
  ],
  phrases: phrases('fr-w11', [
    ['[[Alors]], comment ça s\'est passé ?', 'So, how did it go?'],
    ['En [[fait]], je ne suis pas d\'accord.', "Actually, I don't agree."],
    ['Du [[coup]], on a changé de plan.', 'So we changed plans.'],
    ['Bon, on y va ?', 'Right, shall we go?'],
    ['D\'ailleurs, tu as vu Marie récemment ?', 'By the way, have you seen Marie recently?'],
    ['Enfin, je veux dire…', 'Well, I mean…'],
    ['Comment dire…', 'How can I put it…'],
    ['C\'est-à-dire que je n\'ai pas beaucoup de temps.', "That is to say, I don't have much time."],
    ['Pardon, je n\'ai pas bien compris.', "Sorry, I didn't quite understand."],
    ['Tu peux parler un peu plus lentement ?', 'Can you speak a bit more slowly?'],
    ['Ça veut dire quoi, exactement ?', 'What does that mean, exactly?'],
    ['Je ne connais pas ce mot.', "I don't know that word."],
    ['C\'est le mot que je cherchais !', "That's the word I was looking for!"],
    ['C\'est un [[truc]] qu\'on utilise pour ouvrir les bouteilles.', "It's a thing you use to open bottles."],
    ['C\'est un peu comme un marché, mais couvert.', "It's a bit like a market, but indoors."],
    ['C\'est quelqu\'un qui répare les voitures.', "It's someone who repairs cars."],
    ['Je ne sais pas comment on dit ça en français.', "I don't know how to say that in French."],
    ['Ah bon ?', 'Really?'],
    ['C\'est vrai ? Raconte !', 'Really? Tell me!'],
    ['Et toi, qu\'est-ce que tu en penses ?', 'And you, what do you think?'],
    ['Ah oui, je vois.', 'Oh yes, I see.'],
    ['Tout à fait.', 'Absolutely.'],
    ['Moi non plus, je n\'aime pas ça.', "Me neither, I don't like that."],
    ['Ça m\'étonne !', 'That surprises me!'],
    ['Où en étais-je ?', 'Where was I?'],
    ['Pour revenir à ce que tu disais…', 'To go back to what you were saying…'],
    ['Autrement dit, c\'est trop tard.', "In other words, it's too late."],
    ['Donc, si je comprends bien, tu pars demain ?', "So, if I understand correctly, you're leaving tomorrow?"],
    ['Attends, je réfléchis.', 'Hang on, let me think.'],
    ['Et sinon, quoi de neuf ?', "Anyway, what's new?"],
  ]),
  prompts: prompts('fr-w11', [
    ['Raconte ta semaine en utilisant alors, en fait, du coup, bon et d\'ailleurs.', 'Talk about your week using alors, en fait, du coup, bon and d\'ailleurs.'],
    ['Décris un objet sans dire son nom.', 'Describe an object without saying its name.', ['C\'est un truc pour…', 'C\'est comme… mais…']],
    ['Explique à un ami français un mot russe difficile à traduire.', 'Explain a hard-to-translate Russian word to a French friend.'],
    ['Joue les deux rôles : tu ne comprends pas, tu demandes de répéter, puis tu reformules.', "Play both parts: you don't understand, ask them to repeat, then rephrase."],
    ['Parle de ton travail pendant deux minutes sans t\'arrêter. Si tu bloques, reformule.', 'Talk about your work for two minutes without stopping. If you get stuck, rephrase.'],
    ['Réagis à une nouvelle surprenante et pose trois questions.', 'React to surprising news and ask three follow-up questions.', ['Ah bon ?', 'C\'est vrai ?', 'Et alors ?']],
  ]),
}

export const week12: WeekSeed = {
  week: 12,
  theme: 'Final review and fluency check',
  grammar: 'Mixed practice; my 10-minute conversation test',
  lesson: `This week pulls everything together. Each day, mix the tenses you now own:
• present for who you are and what you do (weeks 1–4),
• passé composé and imparfait for what happened (weeks 5–6, 9),
• futur proche for plans (week 7),
• opinions with reasons (week 8),
• conditionnel for wishes and politeness (week 10),
• fillers and repair phrases to keep going (week 11).

The final fluency check is a recorded 10-minute self-test in five parts. Don't prepare scripts — the goal is to speak without switching to English. If you get stuck, use a repair phrase and carry on.

Ça fait (+ time) que + present = "I've been … for": Ça fait trois mois que j'apprends le français.`,
  models: [
    { target: 'Ça fait trois mois que j\'apprends le français.', en: "I've been learning French for three months." },
    { target: 'Au début, c\'était difficile.', en: 'At first, it was hard.' },
    { target: 'La semaine dernière, j\'ai parlé pendant une heure.', en: 'Last week, I spoke for an hour.' },
    { target: 'L\'année prochaine, je vais continuer.', en: "Next year, I'm going to carry on." },
    { target: 'Je trouve que les Français parlent vite.', en: 'I find that French people speak fast.' },
    { target: 'Si j\'avais plus de temps, je prendrais des cours.', en: "If I had more time, I'd take lessons." },
  ],
  canDo: [
    'I can hold a 10-minute conversation about myself, my week, my plans and my opinions.',
    'I can move between present, past and future without switching to English.',
    'I can recover when I get stuck, using repair phrases.',
    'I can talk about the holidays and New Year traditions.',
  ],
  phrases: phrases('fr-w12', [
    ['Ça [[fait]] trois mois que j\'apprends le français.', "I've been learning French for three months."],
    ['Au début, c\'était difficile, mais maintenant ça va mieux.', "At first it was hard, but now it's better."],
    ['J\'ai fait beaucoup de progrès.', "I've made a lot of progress."],
    ['Je comprends mieux quand on parle lentement.', 'I understand better when people speak slowly.'],
    ['Je fais encore des erreurs, mais ce n\'est pas grave.', "I still make mistakes, but that's OK."],
    ['Le plus difficile pour moi, c\'est la prononciation.', 'The hardest thing for me is pronunciation.'],
    ['Ce qui m\'aide le plus, c\'est de parler tous les jours.', 'What helps me most is speaking every day.'],
    ['L\'année prochaine, je vais continuer à apprendre.', "Next year, I'm going to keep learning."],
    ['J\'aimerais passer le DELF B1 un jour.', "I'd like to take the DELF B1 exam one day."],
    ['Si j\'avais plus de temps, je prendrais des cours particuliers.', "If I had more time, I'd take private lessons."],
    ['La semaine dernière, j\'ai parlé français pendant une heure.', 'Last week, I spoke French for an hour.'],
    ['Quand j\'ai commencé, je savais seulement dire « bonjour ».', 'When I started, I could only say "bonjour".'],
    ['Je pense que la grammaire française est assez logique.', 'I think French grammar is fairly logical.'],
    ['Je trouve que les Français parlent très vite.', 'I find that French people speak very fast.'],
    ['Pour les fêtes, je vais rester à Moscou.', "For the holidays, I'm staying in Moscow."],
    ['Qu\'est-ce que tu fais pour le Nouvel An ?', 'What are you doing for New Year?'],
    ['Joyeux Noël et bonne année !', 'Merry Christmas and Happy New Year!'],
    ['Je te souhaite de bonnes fêtes.', 'Happy holidays to you.'],
    ['On fait un grand repas en famille.', 'We have a big family meal.'],
    ['En Russie, on fête surtout le Nouvel An.', 'In Russia, New Year is the main celebration.'],
    ['Ça m\'a fait plaisir de discuter avec toi.', 'It was lovely chatting with you.'],
    ['On reste en contact ?', 'Shall we stay in touch?'],
    ['Tu peux me corriger si je me trompe.', 'Feel free to correct me if I get something wrong.'],
    ['Je me suis [[trompé]].', 'I made a mistake.', 'Women: trompée.'],
    ['Je vais y réfléchir.', "I'll think about it."],
    ['Ça dépend du temps qu\'il fait.', 'It depends on the weather.'],
    ['Il me semble que c\'est plus simple comme ça.', 'It seems to me it\'s simpler this way.'],
    ['J\'ai [[hâte]] de visiter la France.', "I can't wait to visit France."],
    ['Je suis fier de mes progrès.', "I'm proud of my progress.", 'Women: fière.'],
    ['À la prochaine !', 'Until next time!'],
  ]),
  prompts: prompts('fr-w12', [
    ['Présente-toi : qui tu es, où tu vis, ce que tu fais.', 'Introduce yourself: who you are, where you live, what you do.'],
    ['Raconte ton dernier week-end.', 'Tell me about last weekend.'],
    ['Parle de tes projets pour les fêtes et pour l\'année prochaine.', 'Talk about your plans for the holidays and next year.'],
    ['Donne ton avis : est-ce qu\'on peut apprendre une langue en trois mois ?', 'Give your opinion: can you learn a language in three months?'],
    ['Raconte une petite histoire qui t\'est arrivée.', 'Tell a short story about something that happened to you.'],
    ['Fais le bilan de tes trois mois de français : ce qui a marché, ce qui était difficile.', 'Review your three months of French: what worked and what was hard.'],
  ]),
}
