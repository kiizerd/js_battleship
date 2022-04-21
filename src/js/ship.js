const buildShipSections = (position, size, aligned) => {
  const sections = {};
  const [x, y] = position;
  for (let i = 0; i < size; i += 1) {
    if (aligned === 1) { // Ships aligned horizontally
      sections[[x, y + i]] = false;
    } else {
      sections[[x + i, y]] = false;
    }
  }

  return sections;
};

const Ship = (position, size, aligned = 1) => {
  const sections = buildShipSections(position, size, aligned);

  const hasBeenHit = (hitPosition) => {
    const validHit = Object.keys(sections).includes(hitPosition.join(','));
    if (validHit) {
      sections[hitPosition] = true;
    } else {
      throw new Error(`InvalidHit - Ship does not contain ${hitPosition}`);
    }
  };

  const isSunk = () => {
    const hitSections = Object.values(sections).filter(Boolean);

    return (hitSections.length === Object.values(sections).length);
  };

  return {
    size, sections, hasBeenHit, isSunk,
  };
};

export default Ship;
