const { searchProducts, filterRelevantProducts } = require('../src/services/crawler');

// Mock pour axios
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({
    data: {
      web: {
        results: [
          {
            title: 'Produit Tendance 1',
            description: 'Description du produit tendance pour dropshipping',
            url: 'https://example.com/produit1'
          },
          {
            title: 'Produit Non Pertinent',
            description: 'Ceci n\'est pas un produit pour le dropshipping',
            url: 'https://example.com/nonpertinent'
          }
        ]
      }
    }
  }))
}));

// Mock pour le logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Configuration de l'environnement pour les tests
process.env.BRAVE_API_KEY = 'fake_api_key_for_tests';

describe('Service Crawler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('searchProducts', () => {
    it('devrait retourner des produits formatés correctement', async () => {
      const query = 'produits tendance';
      const results = await searchProducts(query);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('title', 'Produit Tendance 1');
      expect(results[0]).toHaveProperty('source', 'brave_search');
      expect(results[0]).toHaveProperty('query', 'produits tendance');
      expect(results[0]).toHaveProperty('discoveredAt');
    });
  });
  
  describe('filterRelevantProducts', () => {
    it('devrait filtrer les produits non pertinents', async () => {
      const mockProducts = [
        {
          title: 'Produit Tendance Dropshipping',
          description: 'Un super produit populaire pour le ecommerce'
        },
        {
          title: 'Article de Blog',
          description: 'Un article qui parle de la météo'
        },
        {
          title: 'Vente Flash',
          description: 'Une promotion limitée dans le temps'
        }
      ];
      
      const filteredProducts = await filterRelevantProducts(mockProducts);
      
      expect(filteredProducts).toHaveLength(2);
      expect(filteredProducts[0].title).toBe('Produit Tendance Dropshipping');
      expect(filteredProducts[1].title).toBe('Vente Flash');
    });
  });
});