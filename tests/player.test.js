import PubSub from 'pubsub-js';
import Gameboard from '../src/js/gameboard';
import Player from '../src/js/player';

test('computer player generates a random move', () => {
  const boards = [Gameboard(), Gameboard()];
  const comp = Player(boards[0], 'computer');
  const firstCompMove = comp.getMove();
  const secondCompMove = comp.getMove();
  expect(firstCompMove).not.toBe(secondCompMove);
});

test('random generated move will not be an existing move', () => {
  const boards = [Gameboard(), Gameboard()];
  const comp = Player(boards[0], 'computer');
  const firstMove = [2, 2];
  boards[1].receiveAttack(firstMove);
  for (let i = 0; i < 250; i += 1) {
    const guess = comp.getMove();
    expect(guess).not.toBe(firstMove);
  }
});

test('waits for human input', async () => {
  const boards = [Gameboard(), Gameboard()];
  const player = Player(boards[0]);
  const resolution = player.getMove().then((move) => {
    player.fireAt(boards[1], move);
    expect(boards[1].receivedAttacks[move]).toBe('miss');
  });
  PubSub.publish('CELL_CLICKED', { parent: 0, position: [0, 0] });

  return resolution;
});

test('fires at given position', () => {
  const boards = [Gameboard(), Gameboard()];
  const player = Player(boards[0], 'computer');
  const attackPosition = player.getMove();
  player.fireAt(boards[1], attackPosition);
  expect(boards[1].receivedAttacks[attackPosition]).toBe('miss');
});
