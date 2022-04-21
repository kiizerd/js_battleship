import PubSub from 'pubsub-js';

const Player = (board, number, playerType = 'human') => {
  const previousFires = {};

  const randomComputerMove = () => {
    let move = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
    while (previousFires[move] !== undefined) {
      move = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
    }
    return move;
  };

  const humanMove = async () => {
    const movePromise = new Promise((resolve) => {
      PubSub.subscribe('CELL_CLICKED', async (event, data) => {
        resolve(data);
      });
    });

    return movePromise;
  };

  const getMove = () => {
    const playerIsHuman = playerType === 'human';
    let move = [];
    if (playerIsHuman) {
      move = humanMove();
    } else {
      move = randomComputerMove();
    }
    return move;
  };

  const fireAt = (enemyBoard, targetPosition) => {
    const fireResult = enemyBoard.receiveAttack(targetPosition);
    previousFires[targetPosition] = fireResult;
  };

  return {
    getMove, fireAt, number, playerType,
  };
};

export default Player;
