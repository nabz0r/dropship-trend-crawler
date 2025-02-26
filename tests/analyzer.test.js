const { analyzeProduct } = require('../src/services/analyzer');

// Mock pour le logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Service Analyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock pour Math.random pour avoir des résultats déterministes
    jest.spyOn(global.Math, 'random').mockReturnValue(0.75);
  });
  
  afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
  });
  
  describe('analyzeProduct', () => {
    it('devrait générer une analyse avec un score et une recommandation', async () => {
      const mockProduct = {
        title: 'Produit Test',
        description: 'Description du produit',
        url: 'https://example.com/produit'
      };
      
      const analysis = await analyzeProduct(mockProduct);
      
      expect(analysis).toHaveProperty('score');
      expect(analysis).toHaveProperty('recommendation');
      expect(analysis).toHaveProperty('reasons');
      expect(analysis).toHaveProperty('analyzedAt');
      
      // Avec notre mock de Math.random à 0.75, le score devrait être 75
      expect(analysis.score).toBe(75);
      expect(analysis.recommendation).toBe('index');
      expect(analysis.reasons).toHaveLength(3);
    });
    
    it('devrait gérer les erreurs correctement', async () => {
      // Forcer une erreur dans l'analyse
      const mockProduct = null;
      
      const analysis = await analyzeProduct(mockProduct);
      
      expect(analysis.score).toBe(0);
      expect(analysis.recommendation).toBe('error');
      expect(analysis.reasons[0]).toContain('Erreur');
    });
  });
});