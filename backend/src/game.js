export const deck = [
    // Clubs
    { name: 'Start Over (2)', value: 2, color: 'clubs', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'clubs' },
    { name: '4', value: 4, color: 'clubs' },
    { name: '5', value: 5, color: 'clubs' },
    { name: '6', value: 6, color: 'clubs' },
    { name: '7', value: 7, color: 'clubs' },
    { name: 'Mirror (8)', value: 8, color: 'clubs', isMagicCard: true },
    { name: 'You lose (9)', value: 9, color: 'clubs', isTeaseCard: true },
    { name: 'Clear all (10)', value: 10, color: 'clubs', isMagicCard: true },
    { name: 'J', value: 11, color: 'clubs' },
    { name: 'Q', value: 12, color: 'clubs' },
    { name: 'K', value: 13, color: 'clubs' },
    { name: 'Summon next (A)', value: 14, color: 'clubs', isMagicCard: true },
    // Diamonds
    { name: 'Start Over (2)', value: 2, color: 'diamonds', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'diamonds' },
    { name: '4', value: 4, color: 'diamonds' },
    { name: '5', value: 5, color: 'diamonds' },
    { name: '6', value: 6, color: 'diamonds' },
    { name: '7', value: 7, color: 'diamonds' },
    { name: 'Mirror (8)', value: 8, color: 'diamonds', isMagicCard: true },
    { name: 'You lose (9)', value: 9, color: 'diamonds', isTeaseCard: true },
    { name: 'Clear all (10)', value: 10, color: 'diamonds', isMagicCard: true },
    { name: 'J', value: 11, color: 'diamonds' },
    { name: 'Q', value: 12, color: 'diamonds' },
    { name: 'K', value: 13, color: 'diamonds' },
    { name: 'Summon next (A)', value: 14, color: 'diamonds', isMagicCard: true },
    // Hearts
    { name: 'Start Over (2)', value: 2, color: 'hearts', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'hearts' },
    { name: '4', value: 4, color: 'hearts' },
    { name: '5', value: 5, color: 'hearts' },
    { name: '6', value: 6, color: 'hearts' },
    { name: '7', value: 7, color: 'hearts' },
    { name: 'Mirror (8)', value: 8, color: 'hearts', isMagicCard: true },
    { name: 'You lose (9)', value: 9, color: 'hearts', isTeaseCard: true },
    { name: 'Clear all (10)', value: 10, color: 'hearts', isMagicCard: true },
    { name: 'J', value: 11, color: 'hearts' },
    { name: 'Q', value: 12, color: 'hearts' },
    { name: 'K', value: 13, color: 'hearts' },
    { name: 'Summon next (A)', value: 14, color: 'hearts', isMagicCard: true },
    // Spades
    { name: 'Start Over (2)', value: 2, color: 'spades', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'spades' },
    { name: '4', value: 4, color: 'spades' },
    { name: '5', value: 5, color: 'spades' },
    { name: '6', value: 6, color: 'spades' },
    { name: '7', value: 7, color: 'spades' },
    { name: 'Mirror (8)', value: 8, color: 'spades', isMagicCard: true },
    { name: 'You lose (9)', value: 9, color: 'spades', isTeaseCard: true },
    { name: 'Clear all (10)', value: 10, color: 'spades', isMagicCard: true },
    { name: 'J', value: 11, color: 'spades' },
    { name: 'Q', value: 12, color: 'spades' },
    { name: 'K', value: 13, color: 'spades' },
    { name: 'Summon next (A)', value: 14, color: 'spades', isMagicCard: true },
];

export const shuffleDeck = deck => [...deck].sort(() => Math.random() - 0.5);

const game = {
    userCards: {
        table: [
            { name: '5', value: 5, color: 'spades' },
            { name: '6', value: 6, color: 'spades' },
            { name: '7', value: 7, color: 'spades' },
        ],
        tableFlipped: [
            { name: 'J', value: 11, color: 'spades' },
            { name: 'Q', value: 12, color: 'spades' },
            { name: 'K', value: 13, color: 'spades' },
        ],
        hand: [
            { name: 'Q', value: 12, color: 'spades' },
            { name: 'K', value: 13, color: 'spades' },
            { name: 'Summon next (A)', value: 14, color: 'spades', isMagicCard: true },
        ],
    },
    opponents: {
        kiskutya: {
            table: 3,
            tableFlipped: [
                { name: 'J', value: 11, color: 'spades' },
                { name: 'Q', value: 12, color: 'spades' },
                { name: 'K', value: 13, color: 'spades' },
            ],
            hand: 3,
        },
    },
};
