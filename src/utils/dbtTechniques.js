// Static DBT technique card data — no API calls, pure content

export const DBT_TECHNIQUES = [
  {
    id: 'tipp',
    title: 'TIPP: Reset your body first',
    tagline: 'For: overwhelming anxiety, spiraling thoughts, panic',
    content: [
      {
        label: 'T — Temperature',
        text: 'Splash cold water on your face or hold ice. This activates the dive reflex and slows your heart rate within 30 seconds. It works whether you believe it will or not.',
      },
      {
        label: 'I — Intense exercise',
        text: '60 seconds of jumping jacks, pushups, or walking fast. Burns off adrenaline physically.',
      },
      {
        label: 'P — Paced breathing',
        text: 'Breathe in for 4 counts, hold for 1, out for 6. The longer exhale activates your parasympathetic system. Do this for 2 minutes.',
      },
      {
        label: 'P — Progressive relaxation',
        text: 'Tense each muscle group for 5 seconds then release, starting from your feet upward.',
      },
    ],
  },
  {
    id: 'why-reframe',
    title: 'The "Why" Reframe',
    tagline: 'For: anxiety before meetings, fear of authority, wanting to be liked',
    content: [
      {
        label: null,
        text: 'Before a meeting: remind yourself that asking "why" is not weakness — it is how competent people operate. Curious people are seen as engaged, not ignorant.',
      },
      {
        label: null,
        text: 'When you feel like you need to prove yourself: shift from "I need them to think I\'m smart" to "I want to understand this better." That shift is invisible to others and completely changes your internal experience.',
      },
      {
        label: null,
        text: 'After a meeting: instead of replaying what you said, ask "what did I learn?" One thing. Just one.',
      },
      {
        label: null,
        text: 'Reminder: people in authority generally like people who ask good questions more than people who stay silent to seem competent.',
      },
    ],
  },
  {
    id: 'opposite-action',
    title: 'Opposite Action',
    tagline: 'For: avoidance, procrastination, shutting down when anxious',
    content: [
      { label: null, text: 'When anxiety says "don\'t send that email" — send it.' },
      { label: null, text: 'When shame says "stay quiet in this meeting" — ask one question.' },
      { label: null, text: 'When your brain says "I\'ll do it later when I feel ready" — do 5 minutes of it right now. You will never feel ready first.' },
      { label: null, text: 'The action does not have to be big. It has to be opposite to what the avoidance impulse is telling you.' },
      { label: null, text: 'This is not about forcing positivity. It is about not letting anxiety make your decisions.' },
    ],
  },
  {
    id: 'self-compassion',
    title: 'Self-Compassion Reframe',
    tagline: 'For: self-criticism, inner loathing, "I\'m not good enough" thoughts',
    content: [
      { label: null, text: 'When a harsh self-critical thought appears, ask: "Would I say this to a colleague who was struggling with the same thing?" If no — it doesn\'t get to stay in that form.' },
      { label: null, text: 'Rewrite it as if you were talking to that colleague. Not falsely positive — just fair.' },
      { label: null, text: 'Example: "I\'m so stupid for missing that" → "I missed something. I can follow up and clarify. That\'s a normal thing that happens."' },
      { label: null, text: 'You do not have to believe the reframe immediately. You just have to say it. The belief comes later with repetition.' },
    ],
  },
  {
    id: 'wise-mind',
    title: 'Wise Mind Check-In',
    tagline: 'For: big decisions, reactive moments, before sending an angry or anxious message',
    content: [
      { label: null, text: 'DBT describes three states: Emotion Mind (all feeling, no logic), Reasonable Mind (all logic, no feeling), and Wise Mind (the overlap — both acknowledged).' },
      { label: null, text: 'Ask: "Am I in emotion mind right now?" Signs: urgency, black-and-white thinking, wanting to react immediately.' },
      { label: null, text: 'If yes: do not act yet. Do TIPP first (Card 1), then return.' },
      { label: null, text: 'Wise Mind question: "What would I advise a friend I cared about to do in this situation?" That answer is usually closer to your wise mind than whatever you\'re about to do impulsively.' },
    ],
  },
  {
    id: 'adhd-focus-reset',
    title: 'The ADHD Focus Reset',
    tagline: 'For: can\'t start, overwhelmed by a task, hyperfocus on the wrong thing',
    content: [
      { label: null, text: 'If you cannot start: shrink the task until it is embarrassingly small. Not "write the report" — "open the document." Not "answer emails" — "open one email."' },
      { label: null, text: 'If you are hyperfocusing on something unimportant: set a 10-minute timer. When it goes off, you must switch. The hyperfocus feels productive but often isn\'t — the timer is not optional.' },
      { label: null, text: 'Interest is not optional for ADHD brains — it is neurological fuel. If something feels impossible to start, ask: "Is there any angle on this that I find genuinely interesting?" Start from there.' },
      { label: null, text: 'Body doubling works: put on a video of someone working quietly, go to a coffee shop, or text someone "I\'m going to work on X for 30 minutes."' },
    ],
  },
]
