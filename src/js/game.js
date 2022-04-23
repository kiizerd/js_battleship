import PubSub from 'pubsub-js';
import Gameboard from './gameboard';
import Display from './display';
import Player from './player';

const Game = () => {
  const boards = { human: Gameboard(), comp: Gameboard() };
  const players = { human: Player(boards.human, 0), comp: Player(boards.comp, 1, 'computer') };
  const display = Display();
  const state = {};

  const unplacedShipDropListener = (eventName, eventData) => {
    const { position, sectionCount } = eventData;
    if (!position || !sectionCount) return;
    const validity = boards.human.validShipPlacement(position, sectionCount);

    if (validity) {
      boards.human.placeShip(position, sectionCount);
      display.updateBoard(boards.human, 0);
      display.updateUnplacedShips(sectionCount);
    }
    display.updateBoard(boards.human, 0);
  };

  const shipMovedListener = (eventName, eventData) => {
    const { originalShip, position, sectionCount } = eventData;
    const board = boards.human;
    const ship = board.shipAtPosition(originalShip[0]);
    board.removeShip(originalShip[0]);
    display.updateBoard(board, 0);
    const validity = boards.human.validShipPlacement(position, sectionCount);

    if (validity) {
      display.updateBoard(boards.human, 0);
      boards.human.placeShip(position, sectionCount);
    } else {
      board.ships[ship.size].push(ship);
      Object.keys(ship.sections).forEach((sectionPos) => {
        board.grid[sectionPos] = ship;
      });
    }
    display.updateBoard(boards.human, 0);
  };

  const shipRotationListener = (eventName, eventData) => {
    const { position, sectionCount } = eventData;
    const board = boards.human;
    const ship = board.shipAtPosition(position);
    if (!ship) return;
    const currentRotation = board.shipAtPosition(position).aligned;
    const nextRotation = currentRotation === 0 ? 1 : 0;
    board.removeShip(position);
    display.updateBoard(board, 0);
    const validity = board.validShipPlacement(position, sectionCount, nextRotation);

    if (validity) {
      board.placeShip(position, sectionCount, nextRotation);
      display.updateBoard(board, 0);
    } else {
      board.ships[ship.size].push(ship);
      Object.keys(ship.sections).forEach((sectionPos) => {
        board.grid[sectionPos] = ship;
      });
    }
    display.updateBoard(board, 0);
  };

  const isGameOver = () => {
    const boardShipsSunk = Object.values(boards).map((board) => board.allShipsSunk());
    return boardShipsSunk.filter(Boolean).length !== 0;
  };

  const determineWinner = () => {
    if (!isGameOver()) return null;
    const winnerKey = Object.keys(boards).find((key) => {
      const board = boards[key];
      return !board.allShipsSunk();
    });

    return String(winnerKey);
  };

  const gameLoop = async () => {
    // Randomize starting player
    const firstPlayerIndex = Math.floor(Math.random() * 2);
    const playerKeys = Object.keys(players);
    let currentKey = playerKeys[firstPlayerIndex];
    let currentPlayer = players[currentKey];
    let currentBoard = boards[currentKey];
    while (!isGameOver()) {
      let currentMove = [];
      if (currentPlayer.playerType === 'human') {
        display.updateStatus('Your turn - select a cell to attack.');
        // Wait for valid human input
        let humanSelection = await currentPlayer.getMove();
        while (humanSelection.parent === currentPlayer.number) {
          humanSelection = await currentPlayer.getMove();
        }
        currentMove = humanSelection.position;
      } else {
        display.updateStatus('Enemy move - brace for impact.');
        // Wait for timeout to simulate computer contemplation
        let compSelection = await currentPlayer.getMove();
        while (compSelection.parent === currentPlayer.number) {
          compSelection = await currentPlayer.getMove();
        }
        currentMove = compSelection;
      }
      // Aquire target
      const targetKey = currentKey === 'comp' ? 'human' : 'comp';
      // Fire
      currentPlayer.fireAt(boards[targetKey], currentMove);

      // Set current to next player
      currentKey = currentKey === playerKeys[0] ? playerKeys[1] : playerKeys[0];
      currentPlayer = players[currentKey];
      currentBoard = boards[currentKey];

      // Update board
      display.updateBoard(currentBoard, Object.values(players).indexOf(currentPlayer));
    }

    display.updateBoard(currentBoard, Object.values(players).indexOf(currentPlayer));
    const winner = determineWinner();
    const capitalizedWinner = `${winner[0].toUpperCase()}${winner.slice(1, winner.length)}`;
    display.updateStatus(`Game Over - ${capitalizedWinner} wins!`);
  };

  const generateRandomPlacements = (boardKey) => {
    const randomPosition = () => [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
    const board = boards[boardKey];
    let xtraLargeShipCount = 0;
    while (xtraLargeShipCount < 1) {
      const position = randomPosition();
      const alignment = Math.round(Math.random() * 2);
      const validPos = board.validShipPlacement(position, 4, alignment);
      if (validPos) {
        board.placeShip(position, 4, alignment);
        xtraLargeShipCount += 1;
      }
    }
    let largeShipCount = 0;
    while (largeShipCount < 2) {
      const position = randomPosition();
      const alignment = Math.round(Math.random() * 2);
      const validPos = board.validShipPlacement(position, 3, alignment);
      if (validPos) {
        board.placeShip(position, 3, alignment);
        largeShipCount += 1;
      }
    }
    let medShipCount = 0;
    while (medShipCount < 3) {
      const position = randomPosition();
      const alignment = Math.round(Math.random() * 2);
      const validPos = board.validShipPlacement(position, 2, alignment);
      if (validPos) {
        board.placeShip(position, 2, alignment);
        medShipCount += 1;
      }
    }
    let smallShipCount = 0;
    while (smallShipCount < 4) {
      const position = randomPosition();
      const validPos = board.validShipPlacement(position, 1);
      if (validPos) {
        board.placeShip(position, 1);
        smallShipCount += 1;
      }
    }
  };

  const randomButtonSetupListener = () => {
    if (state.randomButtonClicked) return;
    generateRandomPlacements('human');
    display.updateBoard(boards.human, 0);
    PubSub.publish('ALL_SHIPS_PLACED', {});
    // Prevents double calling and crashing game in infinite loop
    state.randomButtonClicked = true;
  };

  const setupPlayerSide = () => {
    display.buildBoard(0);
    display.buildUnplacedShips();
    PubSub.subscribe('SHIP_DROPPED', unplacedShipDropListener);
    PubSub.subscribe('SHIP_MOVED', shipMovedListener);
    PubSub.subscribe('SHIP_ROTATED', shipRotationListener);
    PubSub.subscribe('RANDOM_BTN_CLICKED', randomButtonSetupListener);
  };

  const setupCompSide = () => {
    display.buildBoard(1);
    setTimeout(() => {
      generateRandomPlacements('comp');
      display.updateBoard(boards.comp, 1);
    }, 100);
  };

  const gameSetup = () => {
    setupPlayerSide();
    PubSub.subscribe('ALL_SHIPS_PLACED', () => {
      state.allShipsPlaced = true;
      display.updateStatus('Start Game!');
      setupCompSide();
    });
  };

  const startButtonListener = () => {
    if (!state.allShipsPlaced) return;
    if (state.startButtonClicked) return;
    state.startButtonClicked = true;
    gameLoop();
  };

  const start = () => {
    display.updateStatus('Place your ships');
    gameSetup();
    PubSub.subscribe('START_BTN_CLICKED', startButtonListener);
  };

  return { start };
};

export default Game;
