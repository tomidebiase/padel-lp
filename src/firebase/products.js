const products = [
  {
    id: 'paleta-1',
    name: 'Paleta Adidas Metalbone',
    category: 'paletas',
    price: 120000,
    stock: 5,
    brand: 'Adidas',
    description:
      'Paleta de alto rendimiento ideal para jugadores avanzados. Excelente potencia y control.',
    image:
      'https://images.openai.com/thumbnails/url/q0lfE3icDclJDoIwAADAFwFGRAOJMSDiEkEhrCeCBUqD0JbWYh_lg_yNznW-n45zwixNa0YwScKbWuGPUVch4xVHQAV40FiHCUEj3NHt_yw7qM0jCCuT6jXpV7Dv0tKew7Q3bnPkxFkedCKKHNKOuWQcLx3qTXe_Uhhl6wQuqG5kiXi7OmX8fNpcZ9mD2CiGPMS1_2RuKRJUXARGDfCG19zGUyxFhfZKAw8_WdhAJQ',
  },
  {
    id: 'paleta-2',
    name: 'Paleta Bullpadel Vertex',
    category: 'paletas',
    price: 145000,
    stock: 3,
    brand: 'Bullpadel',
    description:
      'Modelo profesional con gran salida de bola y muy buen equilibrio para competencia.',
    image:
      'https://images.openai.com/thumbnails/url/bVANoXicDclLDoIwFADAE_ERpQKJIahJQyIoGMAdsY8GqvajfRtcektvo7Od72dCNDbxPK7gNRvkg4NMLd3R4hUFuKClZydtjFBj-tz8L8nKIaZQSR9D09G3eNwts31ADzfJ823UOjDvwtV6Lk5xBpcSWE8iWYuC6q6R7WJvsSIsb8i5Pga97-sfqB4uOQ',
  },
{
  id: 'pelotas-1',
  name: 'Pelotas Wilson Performance',
  category: 'pelotas',
  price: 12000,
  stock: 20,
  brand: 'Head',
  description:
    'Tubo de pelotas premium para pádel, con excelente rebote y durabilidad.',
  image:
    'https://www.wilsonstore.com.ar/cdn/shop/files/WR8900801001.png?v=1694706018&width=700',
},
{
  id: 'pelotas-2',
  name: 'Pelotas Wilson Premier X3',
  category: 'pelotas',
  price: 10000,
  stock: 15,
  brand: 'Wilson',
  description:
    'Pelotas diseñadas para partidos intensos, con buena resistencia y salida uniforme.',
  image:
    'https://www.wilsonstore.com.ar/cdn/shop/files/2_409698e0-9406-4984-8ad7-d768b38617c4.png?v=1765546566&width=700',
},
];

export const getProducts = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(products);
    }, 400);
  });
};

export const getProductById = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(products.find((product) => product.id === id));
    }, 400);
  });
};

export const getProductsByCategory = (category) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(products.filter((product) => product.category === category));
    }, 400);
  });
};