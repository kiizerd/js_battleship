import Ship from './ship';

const buildGameboardGrid = () => {
  const grid = {};
  for (let i = 0; i < 100; i += 1) {
    const pos = [Math.floor(i / 10), i % 10];
    grid[pos] = '';
  }

  return grid;
};

const Gameboard = () => {
  const grid = buildGameboardGrid();
  const ships = {
    1: [], 2: [], 3: [], 4: [],
  };
  const receivedAttacks = {};

  const placeShip = (position, shipSize, aligned = 1) => {
    const ship = Ship(position, shipSize, aligned);
    Object.keys(ship.sections).forEach((section) => {
      grid[section] = ship;
    });
    ships[shipSize].push(ship);
  };

  const shipAtPosition = (position) => {
    const flatShips = Object.values(ships).flat();
    return flatShips.find((ship) => {
      const shipKeys = Object.keys(ship.sections);
      const pos = typeof position === 'string' ? position : position.join(',');
      return shipKeys.includes(pos);
    });
  };

  const removeShip = (position) => {
    const ship = shipAtPosition(position);
    if (!ship) return;
    Object.keys(ship.sections).forEach((sectionPos) => {
      grid[sectionPos] = '';
    });

    ships[ship.size].splice(ships[ship.size].indexOf(ship), 1);
  };

  const getSurroundingPositions = (position) => {
    const [x, y] = position;
    const surrounding = [
      [x - 1, y + 1], [x, y + 1], [x + 1, y + 1],
      [x - 1, y], [x, y], [x + 1, y],
      [x - 1, y - 1], [x, y - 1], [x + 1, y - 1],
    ];

    // Remove positions outside of grid
    // to allow ship placement on edges of board
    return surrounding;
  };

  const positionInsideGrid = (position) => {
    const [x, y] = position;
    if (x < 0 || x > 9 || y < 0 || y > 9) return false;
    return true;
  };

  const validShipPlacement = (position, shipSize, aligned = 1) => {
    const shipPositions = [];
    let positions = [];
    const [x, y] = position;
    for (let i = 0; i < shipSize; i += 1) {
      let surrounding = [];
      let pos = [];
      if (aligned === 1) {
        pos = [x, y + i];
      } else {
        pos = [x + i, y];
      }
      shipPositions.push(pos);
      surrounding = getSurroundingPositions(pos).filter((element) => {
        const [elementX, elementY] = element;
        if (elementX < 0 || elementX > 9 || elementY < 0 || elementY > 9) {
          return false;
        }
        return true;
      });
      positions.push(surrounding);
    }
    positions = positions.flat();
    const surroundingsValid = positions.every((pos) => grid[pos] === '');
    const positionsValid = shipPositions.every((pos) => positionInsideGrid(pos));
    const validity = surroundingsValid && positionsValid;

    return validity;
  };

  const receiveAttack = (position) => {
    const ship = shipAtPosition(position);
    let result = '';
    if (ship) {
      ship.hasBeenHit(position);
      result = 'hit';
    } else {
      result = 'miss';
    }
    receivedAttacks[position] = result;

    return result;
  };

  const allShipsSunk = () => {
    const flatShips = Object.values(ships).flat();
    const sunkShips = flatShips.map((ship) => ship.isSunk()).filter(Boolean);
    return flatShips.length === sunkShips.length;
  };

  return {
    grid,
    ships,
    placeShip,
    removeShip,
    receiveAttack,
    receivedAttacks,
    allShipsSunk,
    shipAtPosition,
    validShipPlacement,
  };
};

export default Gameboard;
