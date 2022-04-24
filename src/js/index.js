import PubSub from 'pubsub-js';
import '../styles/main.scss';
import Game from './game';

let game = Game();
game.start();

const resetButtonListener = () => {
  PubSub.clearAllSubscriptions();
  game = null;
  PubSub.clearAllSubscriptions();
  PubSub.subscribe('RESET_BTN_CLICKED', resetButtonListener);
  const boards = document.querySelector('#boards');
  while (boards.firstChild) {
    boards.removeChild(boards.firstChild);
  }
  game = Game();
  game.start();
};

PubSub.subscribe('RESET_BTN_CLICKED', resetButtonListener);

const infoToggle = document.getElementById('toggle-info');
infoToggle.addEventListener('click', () => {
  infoToggle.parentElement.classList.toggle('info-hidden');
});
