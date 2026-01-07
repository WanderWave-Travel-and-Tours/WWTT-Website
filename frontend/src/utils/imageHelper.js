export const getImageUrl = (image, placeholder = 'No+Image') => {
  if (!image) {
    return `https://via.placeholder.com/800x400?text=${placeholder}`;
  }
  
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  
  return `http://localhost:5000/uploads/${image}`;
};