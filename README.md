# DropShip Trend Crawler

An automated system that uses the Brave Search API to identify trending products for dropshipping.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-nabz0r-yellow?style=for-the-badge&logo=buymeacoffee&logoColor=white)](https://buymeacoffee.com/nabz0r)

## How it works

Unlike a traditional web crawler, this system uses the Brave Search API to discover potential products by performing targeted searches. The process takes place in three main steps:

1. **Discovery**: Predefined queries are sent to the Brave Search API to find potential products
2. **Analysis**: Each product is evaluated according to popularity, profitability, competition and seasonality
3. **Decision**: Based on this analysis, the system recommends adding, monitoring or ignoring each product

[Learn more about how it works in detail](docs/howitworks.md)

## Objective

This project aims to develop a web application that:

1. Automatically crawls the web at regular intervals (every hour)
2. Identifies trending products on various platforms
3. Analyzes their potential for dropshipping
4. Generates recommendations for adding or removing products
5. Automates the indexing/deindexing of products in your catalog

## Architecture

The system is organized into several modules:

- **Crawler**: Uses the API Brave Search to discover products and analyze trends
- **Analyzer**: Evaluates the relevance and profitability of identified products
- **Catalog Manager**: Manages the addition and removal of products
- **Web interface**: Dashboard to visualize trends and configure the system
- **API**: For integration with other systems

## Technologies

- **Backend**: Node.js with Express
- **Frontend**: HTML, CSS, JavaScript
- **Database**: MongoDB
- **Crawling**: Brave Search API
- **Deployment**: Docker and GitHub Actions (planned for future versions)

## Prerequisites

- Node.js 14+ and npm installed
- MongoDB installed and running (optional - the system can run in demo mode without a database)
- Brave Search API key (optional - the system uses test data if no key is configured)

[MongoDB Installation Guide](docs/mongodb-installation.md)

## Installation

```bash
# Clone the repository
git clone https://github.com/nabz0r/dropship-trend-crawler.git
cd dropship-trend-crawler

# Install dependencies
npm install

# Configuration
cp .env.example .env
# Edit the .env file with your API keys and other settings
```

## Run

### Development mode (with automatic reloading)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

The application will be available at `http://localhost:3000` (or the port specified in your .env file).

## Key Features

### Demo Mode

The system can run without MongoDB and Brave Search API keys using mock data. This is great for quickly testing features without a full setup.

### Custom configuration

You can customize the system behavior via the `config/crawler-settings.json` file or via the web interface:
- Modify search queries
- Adjust the weights of the different analysis factors
- Configure decision thresholds
- Enable/disable automatic indexing

### API Endpoints

The REST API exposes the following endpoints:

- `GET /api/products` - List of discovered products
- `GET /api/products/:id` - Details of a specific product
- `POST /api/products` - Add a product manually
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

- `GET /api/trends` - Current product trends
- `GET /api/trends/history` - Trend history
- `GET /api/trends/categories` - Trends by category
- `GET /api/trends/search-terms` - Top search terms

- `GET /api/settings` - Current system settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/reset` - Reset to default

- `POST /api/crawl` - Manually trigger a crawl

## Integrating with your dropshipping system

To integrate this system with your dropshipping platform, you can:

1. Modify the `addProductToCatalog` and `removeProductFromCatalog` methods in `src/services/catalogManager.js` to connect them to your e-commerce API.

2. Develop specific middlewares to translate data between our format and your platform's.

3. Use the REST API to develop your own user interface.

## Future development

See the task list in the [TASKS.md](TASKS.md) file for features planned for future releases.

## Documentation

See the `docs/` folder for detailed information on:

- [How the system works](docs/fonctionnement.md)
- Using the [Brave Search API](docs/brave_api.md)
- [Installing MongoDB](docs/mongodb-installation.md)

## 🤝 Contribution

We welcome :
- 💻 Network Engineers
- 👀 Research Scientists
- 🌎 Cloud Architects
- 🤖 AI/ML Specialists

## 📱 Contact

- 📧 Email: nabz0r@gmail.com
- 🐙 GitHub: [@nabz0r](https://github.com/nabz0r)

## 📄 License

MIT License - Innovation without Boundaries

