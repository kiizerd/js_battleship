import Gameboard from '../src/js/gameboard';

test('initializes with accurate grid', () => {
  const board = Gameboard();
  const { grid } = board;
  expect(grid[[0, 0]]).toBe('');
  expect(grid[[0, 9]]).toBe('');
  expect(grid[[9, 0]]).toBe('');
  expect(grid[[9, 9]]).toBe('');
});

test('accurately places ships', () => {
  const board = Gameboard();
  const { grid } = board;
  const position = [0, 0];
  board.placeShip(position, 2);
  const ship = grid[position];
  expect(ship.size).toBe(2);
  expect(ship.sections[position]).toBe(false);
});

test('receives attacks and tracks them', () => {
  const board = Gameboard();
  const { receivedAttacks } = board;
  const position = [0, 0];
  board.placeShip(position, 1);
  board.receiveAttack(position);
  expect(receivedAttacks[position]).toBe('hit');
});

test('accurately removes ships', () => {
  const board = Gameboard();
  const position = [3, 3];
  expect(board.grid['3,5']).toBe('');
  board.placeShip(position, 3);
  expect(board.grid['3,5']).not.toBe('');
  board.removeShip(position);
  expect(board.grid['3,5']).toBe('');
});

test('detects and tracks misses', () => {
  const board = Gameboard();
  const { receivedAttacks } = board;
  const position = [0, 0];
  board.receiveAttack(position);
  expect(receivedAttacks[position]).toBe('miss');
});

test('knows when all ships on board have sunk', () => {
  const board = Gameboard();
  board.placeShip([0, 1], 1);
  board.placeShip([1, 1], 1);
  board.receiveAttack([0, 1]);
  board.receiveAttack([1, 1]);
  expect(board.allShipsSunk()).toBe(true);
});

test('approves valid attempted ship placements', () => {
  const board = Gameboard();
  const position = [3, 3];
  const shipSize = 3;
  const validityCheck = board.validShipPlacement(position, shipSize);
  expect(validityCheck).toBe(true);
});

test('rejects invalid ship placements', () => {
  const board = Gameboard();
  const position = [3, 3];
  const shipSize = 3;
  board.placeShip(position, shipSize);
  const validityCheck = board.validShipPlacement(position, shipSize);
  expect(validityCheck).toBe(false);
});

test('prevents placing ships next to other ships', () => {
  const board = Gameboard();
  const position = [3, 3];
  const shipSize = 3;
  board.placeShip([2, 3], shipSize);
  const validityCheck = board.validShipPlacement(position, shipSize);
  expect(validityCheck).toBe(false);
});
