// src/components/MascotGif/MascotGif.jsx
import sampleGif from '../../../../backend/assets/samples.gif';
import './MascotGif.css';

const MascotGif = ({ onClick }) => {
  const handleClick = () => {
    if (typeof onClick === 'function') {
      onClick();
    } else if (typeof window.openGHLChat === 'function') {
      window.openGHLChat();
    }
  };

  return (
    <img
      src={sampleGif}
      alt="mascot"
      className="mascot-gif"
      onClick={handleClick}
    />
  );
};

export default MascotGif;