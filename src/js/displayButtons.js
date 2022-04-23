import PubSub from 'pubsub-js';

const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const randomBtn = document.getElementById('random-btn');

startBtn.addEventListener('click', () => {
  PubSub.publish('START_BTN_CLICKED', {});
});

resetBtn.addEventListener('click', () => {
  PubSub.publish('RESET_BTN_CLICKED', {});
});

randomBtn.addEventListener('click', () => {
  PubSub.publish('RANDOM_BTN_CLICKED', {});
});

export { startBtn, resetBtn, randomBtn };
