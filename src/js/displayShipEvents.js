import PubSub from 'pubsub-js';

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const state = {};

PubSub.subscribe('RESET_BTN_CLICKED', () => {
  state.startButtonClicked = undefined;
});

PubSub.subscribe('START_BTN_CLICKED', () => {
  state.startButtonClicked = true;
});

const addShipEventListeners = (ship) => {
  const { shipSections } = ship;
  ship.addEventListener('mouseenter', () => {
    shipSections.forEach((section) => section.classList.add('hover'));
  });

  ship.addEventListener('mouseleave', () => {
    shipSections.forEach((section) => section.classList.remove('hover'));
  });

  ship.addEventListener('dragstart', () => false);

  ship.addEventListener('mousedown', (downEvent) => {
    if (downEvent.button !== 0) return;
    const sectionClicked = document.elementFromPoint(
      downEvent.clientX,
      downEvent.clientY,
    );
    const clickedSectionIndex = Array.from(ship.children).indexOf(sectionClicked);
    const shipSectionCount = Array.from(ship.children).length;
    const shipClone = ship.cloneNode(true);
    const { style } = shipClone;
    const shiftX = downEvent.clientX - ship.getBoundingClientRect().left;
    const shiftY = downEvent.clientY - ship.getBoundingClientRect().top;
    const moveAt = (pageX, pageY) => {
      style.left = `${pageX - shiftX}px`;
      style.top = `${pageY - shiftY}px`;
    };

    shipSections.forEach((section) => section.classList.add('greyed'));
    style.position = 'absolute';
    style.zIndex = '1000';
    document.body.append(shipClone);
    moveAt(downEvent.pageX, downEvent.pageY);

    let currentDroppable = null;
    let droppablePosition = null;
    const onMouseMove = (moveEvent) => {
      moveAt(moveEvent.pageX, moveEvent.pageY);
      shipClone.hidden = true;
      const elemBelow = document.elementFromPoint(
        moveEvent.clientX,
        moveEvent.clientY,
      );
      shipClone.hidden = false;
      if (!elemBelow) return;
      const droppableBelow = elemBelow.closest('.board-cell');
      if (currentDroppable !== droppableBelow) {
        if (currentDroppable) {
          currentDroppable.classList.remove('drag-hover');
        }
        currentDroppable = droppableBelow;
        if (currentDroppable) {
          currentDroppable.classList.add('drag-hover');
          droppablePosition = [
            clamp(currentDroppable.position[0], 0, 10),
            clamp(
              currentDroppable.position[1] - clickedSectionIndex,
              0,
              10 - shipSectionCount,
            ),
          ];
        }
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    shipClone.onmouseup = () => {
      const previousHovered = Array.from(document.querySelectorAll('.drag-hover'));
      previousHovered.forEach((node) => node.classList.remove('drag-hover'));
      Array.from(shipClone.children).forEach((cell) => cell.classList.remove('hover'));
      shipSections.forEach((section) => section.classList.remove('greyed'));
      document.removeEventListener('mousemove', onMouseMove);
      shipClone.onmouseup = null;

      shipClone.remove();

      PubSub.publish('SHIP_DROPPED', {
        position: droppablePosition,
        sectionCount: shipSectionCount,
      });
    };
  });
};

const surroundingCells = (position) => {
  const board = document.querySelector('.gameboard-1');
  const { grid } = board;
  const [x, y] = position;
  const surrounding = [
    [x - 1, y + 1], [x, y + 1], [x + 1, y + 1],
    [x - 1, y], [x + 1, y],
    [x - 1, y - 1], [x, y - 1], [x + 1, y - 1],
  ];

  return surrounding.map((surroundingPos) => grid[surroundingPos]).filter((cell) => {
    if (!cell) return false;

    return true;
  });
};

const surroundingShipCells = (position) => {
  const board = document.querySelector('.gameboard-1');
  const { grid } = board;
  const shipCells = [grid[position]];
  const surrounding = shipCells.map((cell) => surroundingCells(cell.position)).flat();
  while (shipCells.length !== shipCells[0].shipSize) {
    if (shipCells.length > shipCells[0].shipSize) break;
    surrounding.forEach((cell) => {
      if (Array.from(cell.classList).includes('ship')) {
        if (!shipCells.includes(cell)) {
          shipCells.push(cell);
        }
      }
    });
    shipCells.forEach((cell) => {
      const cellsAround = surroundingCells(cell.position);
      cellsAround.forEach((anotherCell) => {
        if (Array.from(anotherCell.classList).includes('ship')) {
          if (!shipCells.includes(anotherCell)) {
            shipCells.push(anotherCell);
          }
        }
      });
    });
  }

  return shipCells.sort((a, b) => a.style.offsetTop > b.style.offsetTop);
};

const placedShipRightMouseDown = (event) => {
  if (state.startButtonClicked) return;
  const cellClicked = document.elementFromPoint(
    event.clientX,
    event.clientY,
  ).closest('.board-cell');
  PubSub.publish('SHIP_ROTATED', {
    position: cellClicked.position,
    sectionCount: cellClicked.shipSize,
  });
};

const placedShipMouseMove = (event) => {
  if (state.startButtonClicked) return;

  const ship = document.querySelector('.replacing-ship-container');
  if (!ship) return;
  const { style } = ship;
  const moveAt = (pageX, pageY) => {
    style.top = `${pageY - ship.offsets[1]}px`;
    style.left = `${pageX - ship.offsets[0]}px`;
  };

  let currentDroppable = null;
  moveAt(event.pageX, event.pageY);
  ship.hidden = true;
  const elemBelow = document.elementFromPoint(
    event.clientX,
    event.clientY,
  );
  ship.hidden = false;
  const previousHovered = Array.from(document.querySelectorAll('.drag-hover'));
  previousHovered.forEach((node) => node.classList.remove('drag-hover'));
  if (!elemBelow) return;
  const droppableBelow = elemBelow.closest('.board-cell');
  if (currentDroppable !== droppableBelow) {
    currentDroppable = droppableBelow;
    if (currentDroppable) {
      currentDroppable.classList.add('drag-hover');
    }
  }
};

const placedShipMouseUp = (event) => {
  if (state.startButtonClicked) return;
  if (event.button !== 0) return;

  const ship = document.querySelector('.replacing-ship-container');
  if (!ship) return;
  const previousHovered = Array.from(document.querySelectorAll('.drag-hover'));
  previousHovered.forEach((node) => node.classList.remove('drag-hover'));
  const sectionClicked = document.elementFromPoint(
    event.clientX,
    event.clientY,
  );
  const clickedSectionIndex = Array.from(ship.children).indexOf(sectionClicked);
  ship.hidden = true;
  const elemBelow = document.elementFromPoint(
    event.clientX,
    event.clientY,
  );
  ship.hidden = false;

  let currentDroppable = null;
  let droppablePosition = null;
  if (!elemBelow) return;
  const droppableBelow = elemBelow.closest('.board-cell');
  currentDroppable = droppableBelow;
  if (currentDroppable) {
    ship.shipCells.forEach((cell) => cell.classList.remove('ship', 'greyed'));
    document.removeEventListener('mousemove', placedShipMouseMove);
  }

  droppablePosition = [
    clamp(currentDroppable.position[0], 0, 10),
    clamp(
      currentDroppable.position[1] - clickedSectionIndex,
      0,
      10 - ship.shipCells.length,
    ),
  ];

  const originalShip = ship.shipCells.map((cell) => cell.position);

  PubSub.publish('SHIP_MOVED', {
    originalShip,
    position: droppablePosition,
    sectionCount: ship.shipCells.length,
  });
  ship.onmouseup = null;
  ship.remove();
};

const placedShipMouseDown = (event) => {
  if (event.button === 2) placedShipRightMouseDown(event);
  if (event.button !== 0) return;

  const enemyBoard = document.querySelector('.gameboard-2');
  if (enemyBoard) {
    const enemyBoardRect = enemyBoard.getBoundingClientRect();
    if (event.clientX > enemyBoardRect.left) return;
    if (state.startButtonClicked) return;
  }

  const targetCell = event.target;
  targetCell.isTargetCell = true;
  const cellPosition = targetCell.position;
  const shipCells = surroundingShipCells(cellPosition);
  const container = document.createElement('div');
  container.shipCells = shipCells;
  container.classList.add('replacing-ship-container');
  shipCells.forEach((cell) => {
    const cellClone = cell.cloneNode();
    cellClone.classList.add('hover');
    cellClone.classList.remove('board-cell');
    container.appendChild(cellClone);
    cell.classList.add('greyed');
  });

  const shipTop = Math.min(...shipCells.map((cell) => {
    const cellTop = cell.offsetTop;
    return cellTop;
  }));

  const { style } = container;
  style.position = 'absolute';
  style.zIndex = '1000';
  const shiftX = event.clientX - targetCell.getBoundingClientRect().left;
  style.left = event.pageX - shiftX;
  style.top = shipTop;
  const offsetX = Math.abs(shiftX);
  const offsetY = Math.abs(event.pageY - shipTop);
  container.offsets = [offsetX, offsetY];
  container.onmouseup = placedShipMouseUp;

  document.body.append(container);
};

const addPlacedShipEventListeners = (shipCell) => {
  shipCell.addEventListener('mousedown', placedShipMouseDown);
  document.addEventListener('mousemove', placedShipMouseMove);
  shipCell.addEventListener('mouseup', placedShipMouseUp);
};

const removePlacedShipEventListeners = (shipCell) => {
  shipCell.removeEventListener('mousedown', placedShipMouseDown);
  document.removeEventListener('mousemove', placedShipMouseMove);
  shipCell.removeEventListener('mouseup', placedShipMouseUp);
};

export {
  addShipEventListeners,
  addPlacedShipEventListeners,
  removePlacedShipEventListeners,
};
