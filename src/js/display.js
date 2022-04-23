import PubSub from 'pubsub-js';
import './displayButtons';
import {
  addShipEventListeners,
  addPlacedShipEventListeners,
  removePlacedShipEventListeners,
} from './displayShipEvents';

const Display = () => {
  const state = {};

  PubSub.subscribe('START_BTN_CLICKED', () => {
    state.startButtonClicked = true;
    const boardsContainer = document.querySelector('#boards');
    [...boardsContainer.children].forEach((board) => {
      const { grid } = board;
      Object.keys(grid).forEach((pos) => {
        const cell = grid[pos];
        removePlacedShipEventListeners(cell);
      });
    });
  });

  PubSub.subscribe('RESET_BTN_CLICKED', () => {
    state.startButtonClicked = undefined;
  });

  PubSub.subscribe('ALL_SHIPS_PLACED', () => {
    const unplacedShipsContainer = document.querySelector('.ships-container');
    if (!unplacedShipsContainer) return;
    unplacedShipsContainer.remove();
  });

  const updateStatus = (newStatusString) => {
    const status = document.querySelector('#status');
    status.textContent = newStatusString;
  };

  const buildShip = (parentElement, size) => {
    const ship = document.createElement('div');
    ship.classList.add('unplaced-ship');
    const shipSections = [];
    ship.shipSections = shipSections;
    for (let i = 0; i < size; i += 1) {
      const section = document.createElement('div');
      section.classList.add('cell', 'ship');
      shipSections.push(section);
      ship.appendChild(section);
    }

    addShipEventListeners(ship, parentElement);
    parentElement.appendChild(ship);
  };

  const buildUnplacedShipsContainer = () => {
    const shipsContainer = document.createElement('section');
    shipsContainer.classList.add('ships-container');
    for (let i = 0; i < 10; i += 1) {
      switch (i) {
        case 0:
          buildShip(shipsContainer, 4);
          break;
        case 1:
        case 2:
          buildShip(shipsContainer, 3);
          break;
        case 3:
        case 4:
        case 5:
          buildShip(shipsContainer, 2);
          break;
        default:
          buildShip(shipsContainer, 1);
          break;
      }
    }

    return shipsContainer;
  };

  const buildUnplacedShips = () => {
    const container = buildUnplacedShipsContainer();
    const boards = document.querySelector('#boards');
    boards.after(container);
  };

  const updateUnplacedShips = (placedShipSize) => {
    const container = document.querySelector('.ships-container');
    const unplacedShips = Array.from(container.children);
    const placedShip = unplacedShips.find((unplacedShip) => {
      const unplacedShipSize = unplacedShip.shipSections.length;
      return unplacedShipSize === placedShipSize;
    });
    if (!placedShip) return;
    placedShip.classList.add('fading-ship');
    setTimeout(() => {
      placedShip.remove();

      if (container.children.length === 0) {
        container.remove();
        PubSub.publish('ALL_SHIPS_PLACED', {});
      }
    }, 400);
  };

  const buildBoardContainer = (boardIndex) => {
    const container = document.createElement('section');
    const boardCSSClass = boardIndex === 0 ? 'gameboard-1' : 'gameboard-2';
    container.classList.add(boardCSSClass);
    container.classList.add('gameboard');
    container.boardIndex = boardIndex;

    return container;
  };

  const buildGridCell = (position) => {
    const cell = document.createElement('div');
    cell.classList.add('cell', 'board-cell');
    cell.position = position;
    cell.addEventListener('contextmenu', (e) => e.preventDefault());
    cell.addEventListener('click', () => {
      if (!state.startButtonClicked) return;
      PubSub.publish('CELL_CLICKED', {
        position, parent: cell.parentElement.boardIndex,
      });
    });

    return cell;
  };

  const buildBoardGrid = (parent) => {
    const grid = {};
    for (let i = 0; i < 100; i += 1) {
      const pos = [Math.floor(i / 10), i % 10];
      const cell = buildGridCell(pos);
      grid[pos] = cell;
      parent.appendChild(cell);
    }

    return grid;
  };

  const buildBoardElements = (boardIndex) => {
    const container = buildBoardContainer(boardIndex);
    const grid = buildBoardGrid(container);
    container.grid = grid;

    return { container };
  };

  const buildBoard = (index) => {
    const { container } = buildBoardElements(index);

    const boardsContainer = document.querySelector('#boards');
    boardsContainer.appendChild(container);
  };

  const updateShips = (gameBoard, boardIndex) => {
    const boardElement = document.querySelector(`.gameboard-${boardIndex + 1}`);
    const { grid, ships } = gameBoard;

    // Remove ship class from cells without ships
    Object.values(boardElement.grid).forEach((cell) => {
      if (grid[cell.position] === '') {
        cell.classList.remove('ship');
      }
    });

    // Add ship class to cells containing ships
    Object.values(ships).forEach((shipType) => {
      shipType.forEach((ship) => {
        Object.keys(ship.sections).forEach((section) => {
          const cell = boardElement.grid[section];
          cell.classList.add('ship');
          cell.shipSize = shipType[0].size;
          addPlacedShipEventListeners(cell);
        });
      });
    });
  };

  const updateAttacks = (gameBoard, boardIndex) => {
    const boardElement = document.querySelector(`.gameboard-${boardIndex + 1}`);
    const { receivedAttacks } = gameBoard;

    Object.keys(receivedAttacks).forEach((attack) => {
      const attackStatus = receivedAttacks[attack];
      const cell = boardElement.grid[attack];
      if (attackStatus === 'hit') {
        cell.classList.add('hit');
      } else if (attackStatus === 'miss') {
        cell.classList.add('miss');
      }
    });
  };

  const updateBoard = (gameBoard, boardIndex) => {
    updateShips(gameBoard, boardIndex);
    updateAttacks(gameBoard, boardIndex);
  };

  const resetBoard = () => {
    const boardsContainer = document.querySelector('#boards');
    const containerParent = boardsContainer.parentElement;
    const clonedContainer = boardsContainer.cloneNode();
    containerParent.removeChild(boardsContainer);
    while (clonedContainer.firstChild) {
      clonedContainer.removeChild(clonedContainer.firstChild);
    }
    const controls = document.getElementById('controls');
    controls.after(clonedContainer);

    buildBoard(0);
  };

  return {
    buildShip,
    buildBoard,
    resetBoard,
    updateBoard,
    updateStatus,
    buildUnplacedShips,
    updateUnplacedShips,
  };
};

export default Display;
