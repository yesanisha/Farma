export const plantData = [
  {
    id: 'plant-01',
    name: 'PLANT 01',
    category: 'vegetables',
    image: require('../../assets/icon.png'), // Cherry tomatoes
    info01: 'High in vitamins C & K',
    info02: 'Perfect for containers',
    description: 'Cherry tomatoes are small, round tomatoes that grow in clusters.',
  },
  {
    id: 'plant-02',
    name: 'PLANT 02',
    category: 'vegetables',
    image: require('../../assets/icon.png'), // Lettuce
    info01: 'Rich in folate & iron',
    info02: 'Cool season crop',
    description: 'Fresh lettuce perfect for salads and sandwiches.',
  },
  {
    id: 'plant-03',
    name: 'PLANT 03',
    category: 'herbs',
    image: require('../../assets/icon.png'), // Small leafy herb
    info01: 'Aromatic culinary herb',
    info02: 'Easy to grow indoors',
    description: 'A versatile herb that adds flavor to many dishes.',
  },
  {
    id: 'plant-04',
    name: 'PLANT 04',
    category: 'vegetables',
    image: require('../../assets/icon.png'), // Leafy greens
    info01: 'Packed with nutrients',
    info02: 'Fast growing variety',
    description: 'Nutritious leafy greens perfect for healthy meals.',
  },
  {
    id: 'plant-05',
    name: 'PLANT 05',
    category: 'herbs',
    image: require('../../assets/icon.png'),
    info01: 'Natural pest repellent',
    info02: 'Blooms all season',
    description: 'Beautiful flowering herb with practical benefits.',
  },
  {
    id: 'plant-06',
    name: 'PLANT 06',
    category: 'succulents',
    image: require('../../assets/icon.png'),
    info01: 'Low water requirements',
    info02: 'Perfect for beginners',
    description: 'Hardy succulent that thrives with minimal care.',
  },
];

export const categories = [
  { id: 'all', name: 'All', count: plantData.length },
  { id: 'vegetables', name: 'Vegetables', count: plantData.filter(p => p.category === 'vegetables').length },
  { id: 'herbs', name: 'Herbs', count: plantData.filter(p => p.category === 'herbs').length },
  { id: 'dried-flowers', name: 'Dried flowers', count: plantData.filter(p => p.category === 'dried-flowers').length },
  { id: 'succulents', name: 'Succul', count: plantData.filter(p => p.category === 'succulents').length },
];

export const getPlantsByCategory = (category) => {
  if (category === 'all') return plantData;
  return plantData.filter(plant => plant.category === category);
};

export const searchPlants = (query, category = 'all') => {
  const plants = getPlantsByCategory(category);
  return plants.filter(plant =>
    plant.name.toLowerCase().includes(query.toLowerCase()) ||
    plant.description.toLowerCase().includes(query.toLowerCase())
  );
};