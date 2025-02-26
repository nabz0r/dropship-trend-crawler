# How DropShip Trend Crawler Works

## Introduction

DropShip Trend Crawler is a system that automatically identifies trending products for dropshipping. This document explains in detail how it works, its components, and how to use it effectively.

## General Architecture

The system consists of three main modules:

1. **Crawler**: Discovers potential products using the Brave Search API
2. **Analyzer**: Evaluates each product based on multiple criteria
3. **Catalog Manager**: Automates the addition and removal of products

## Product Discovery Process

Unlike a traditional web crawler that directly crawls websites, this system uses the Brave Search API as an intermediary to discover potential products. Here's how it works:

### 1. Configuring queries

The system is configured with a set of predefined search queries, such as:
- "trending products dropshipping"
- "best selling products online"
- "trending products ecommerce"
- "viral products social media"

You can customize these queries by editing the `config/crawler-settings.json` configuration file.

### 2. Running searches

Every hour (or manually via the interface), the system sends these queries to the Brave Search API. Brave Search is a search engine that indexes billions of web pages and returns the most relevant results.

**Benefit**: We don't need to manage the complex infrastructure required to crawl millions of websites directly - Brave takes care of it for us.

### 3. Processing results

For each query, the system receives up to 20 results (configurable). These results contain:
- The title of the page
- A description
- The full URL
- Other metadata

### 4. Initial filtering

A first filtering is carried out to keep only the results relevant to dropshipping. This filtering is based on predefined keywords and a relevance score.

## Product analysis process

After the discovery of the products, each one is analyzed to determine its potential.

### Analysis criteria

The analysis is done according to four main criteria:

1. **Popularity (40%)**: Evaluates the current demand for the product
- Mentions of terms like "popular", "trendy", "viral"
- In production, could integrate data from social networks and Google Trends

2. **Profitability (30%)**: Estimates potential margins
- Analysis of generally profitable categories (accessories, gadgets, etc.)
- Keywords related to margins and profits

3. **Competition (20%)**: Evaluates the level of market saturation
- A high score means low competition (positive)
- Detection of niches versus saturated markets

4. **Seasonality (10%)**: Determines whether the product is currently in season
- Taking into account the current month
- Seasonal products vs. timeless products

### Calculating the overall score

A score between 0 and 100 is calculated based on these criteria, weighted according to their importance. Based on this score, a recommendation is generated:

- Score ≥ 70: **Index** (add to catalog)
- Score between 40 and 70: **Monitor** (interesting potential)
- Score < 40: **Ignore** (low potential)

These thresholds are configurable in the `config/crawler-settings.json` file.

## Automatic catalog management

Depending on the analyses, the system can automatically:

1. **Add products**: Products with the "index" recommendation are added to the catalog
2. **Monitor products**: Products with the "monitor" recommendation are kept for future analysis
3. **Remove products**: Products whose performance declines can be automatically removed

This automation can be enabled or disabled in the settings.

## Brave Search API Setup

### Obtaining an API Key

To use the system in production, you will need a Brave Search API Key:

1. Visit [Brave Search API](https://brave.com/search/api/)
2. Create an account or log in
3. Subscribe to a plan (there is usually a free option with limited quota)
4. Generate your API Key
5. Add this key to the `.env` file:
```
BRAVE_API_KEY=your_api_key_here
```

### Demo Mode

If you do not have a Brave Search API Key, the system will run in demo mode, generating dummy data for you to test all the features.

## Customization and Improvement

The system is designed to be easily adaptable. Here are some possible areas for improvement:

### Additional data sources

You could integrate other sources to improve discovery and analysis:
- Marketplace APIs (Amazon, AliExpress, etc.)
- Social media data (Instagram, TikTok, etc.)
- Google Trends API
- Dropshipping Supplier Data

### Advanced Analytics Algorithms

Current algorithms are relatively simple but effective. You could implement:
- Machine learning to predict product performance
- Sentiment analysis on product reviews
- Computer vision to analyze product images

### Integration with your e-commerce platform

For full automation, you should connect the system to your sales platform:
1. Modify the `addProductToCatalog` and `removeProductFromCatalog` methods in `src/services/catalogManager.js`
2. Implement the logic specific to your platform (Shopify, WooCommerce, etc.)

## Conclusion

The DropShip Trend Crawler offers an innovative approach to discover trending products without having to manage the complex infrastructure of a traditional web crawler. By using the Brave Search API as a data source and analysis algorithms tailored for dropshipping, it automates much of the product selection process.
