import Ship from '../src/js/ship';

test('initializes with correct sections', () => {
  const ship = Ship([0, 0], 1);
  const { sections } = ship;
  expect(sections).toEqual({ '0,0': false });
});

test('handles and tracks hits', () => {
  const ship = Ship([0, 0], 1);
  ship.hasBeenHit([0, 0]);
  const { sections } = ship;
  const firstSection = sections['0,0'];
  expect(firstSection).toBe(true);
});

test('knows if ship is sunk', () => {
  const ship = Ship([0, 0], 1);
  ship.hasBeenHit([0, 0]);
  expect(ship.isSunk()).toBe(true);
});
