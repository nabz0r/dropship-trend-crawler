# DropShip Trend Crawler: System Architecture

## Overview

The DropShip Trend Crawler is designed with a modular, maintainable architecture that separates concerns and follows best practices in modern web application development. This document provides detailed information about the system's architecture, components, data flow, and design decisions.

## High-Level Architecture

```mermaid
flowchart TD
    subgraph External["External Systems"]
        BraveAPI["Brave Search API"] 
        EcommerceAPI["E-commerce Platform API"]
    end
    
    subgraph Backend["Backend Services"]
        subgraph Core["Core Services"]
            Crawler["Crawler Service"]
            Analyzer["Analyzer Service"]
            CatalogManager["Catalog Manager"]
        end

        subgraph Data["Data Layer"]
            MongoDB[("MongoDB Database")]
            CacheLayer["Cache Layer"]
        end

        subgraph API["API Layer"]
            ProductsAPI["Products API"]
            TrendsAPI["Trends API"]
            SettingsAPI["Settings API"]
            AdminAPI["Admin API"]
        end
    end
    
    subgraph Frontend["Frontend"]
        Dashboard["Dashboard"]
        ProductManager["Product Manager"]
        ConfigEditor["Config Editor"]
    end

    BraveAPI --> Crawler
    Crawler --> MongoDB
    MongoDB --> Analyzer
    Analyzer --> MongoDB
    MongoDB --> CatalogManager
    CatalogManager --> EcommerceAPI
    
    MongoDB <--> ProductsAPI
    MongoDB <--> TrendsAPI
    MongoDB <--> SettingsAPI
    MongoDB <--> AdminAPI
    
    ProductsAPI --> Dashboard
    ProductsAPI --> ProductManager
    TrendsAPI --> Dashboard
    SettingsAPI --> ConfigEditor
    AdminAPI --> Dashboard
    
    classDef external fill:#f5f5f5,stroke:#333,stroke-width:1px
    classDef core fill:#d4f1f9,stroke:#333,stroke-width:1px
    classDef data fill:#ffe6cc,stroke:#333,stroke-width:1px
    classDef api fill:#d5e8d4,stroke:#333,stroke-width:1px
    classDef frontend fill:#e1d5e7,stroke:#333,stroke-width:1px
    
    class External external
    class Core core
    class Data data
    class API api
    class Frontend frontend
```

## Core Components

### Crawler Service

The Crawler Service is responsible for discovering potential products by querying the Brave Search API.

**Key Responsibilities:**
- Execute scheduled searches with predefined queries
- Process and filter search results for relevance
- Store discovered products in the database
- Handle API rate limiting and error recovery

**Internal Structure:**

```mermaid
flowchart LR
    subgraph CrawlerService["Crawler Service"]
        Scheduler["Task Scheduler"]
        QueryManager["Query Manager"]
        ApiConnector["API Connector"]
        ResultFilter["Result Filter"]
        ProductMapper["Product Mapper"]
    end
    
    Scheduler --> QueryManager
    QueryManager --> ApiConnector
    ApiConnector --> ResultFilter
    ResultFilter --> ProductMapper
    
    style CrawlerService fill:#d4f1f9,stroke:#333,stroke-width:1px
```

### Analyzer Service

The Analyzer Service evaluates products to determine their potential for dropshipping success.

**Key Responsibilities:**
- Analyze products based on multiple criteria
- Calculate scoring using weighted factors
- Generate recommendations (index, watch, skip)
- Update product analysis in the database

**Scoring Algorithm:**

```mermaid
flowchart TD
    Input["Product Data"] --> PopAnalysis["Popularity Analysis"]
    Input --> ProfitAnalysis["Profitability Analysis"]
    Input --> CompAnalysis["Competition Analysis"]
    Input --> SeasonAnalysis["Seasonality Analysis"]
    
    PopAnalysis -- "40%" --> WeightedSum
    ProfitAnalysis -- "30%" --> WeightedSum
    CompAnalysis -- "20%" --> WeightedSum
    SeasonAnalysis -- "10%" --> WeightedSum
    
    WeightedSum["Weighted Sum Calculation"] --> FinalScore["Final Score (0-100)"]
    FinalScore --> Decision
    
    Decision{"Score Thresholds"}
    Decision -- "≥70" --> Index["Index (Add to catalog)"]
    Decision -- "40-69" --> Watch["Watch (Monitor)"]
    Decision -- "<40" --> Skip["Skip (Ignore)"]
    
    style Input fill:#f5f5f5,stroke:#333,stroke-width:1px
    style FinalScore fill:#d5e8d4,stroke:#333,stroke-width:1px
    style Decision fill:#ffe6cc,stroke:#333,stroke-width:1px
    style Index fill:#d5e8d4,stroke:#333,stroke-width:1px
    style Watch fill:#fff2cc,stroke:#333,stroke-width:1px
    style Skip fill:#f8cecc,stroke:#333,stroke-width:1px
```

### Catalog Manager

The Catalog Manager handles the integration with e-commerce platforms for product management.

**Key Responsibilities:**
- Add recommended products to the catalog
- Remove underperforming products from the catalog
- Track product performance metrics
- Maintain synchronization with e-commerce platforms

## Data Model

```mermaid
erDiagram
    PRODUCT {
        ObjectId _id
        String title
        String description
        String url
        String source
        String query
        Boolean analyzed
        Date discoveredAt
        Date updatedAt
    }
    
    ANALYSIS {
        ObjectId _id
        ObjectId productId
        Number score
        String recommendation
        Array reasons
        Date analyzedAt
    }
    
    CATALOG_ITEM {
        ObjectId _id
        ObjectId productId
        String catalogStatus
        String catalogId
        Date indexedAt
        Date deindexedAt
    }
    
    METADATA {
        ObjectId _id
        ObjectId productId
        Number price
        String category
        String brand
        String imageUrl
        String supplier
        Number estimatedMargin
    }
    
    SETTINGS {
        ObjectId _id
        Object crawler
        Object analyzer
        Object catalogManager
    }
    
    PRODUCT ||--o| ANALYSIS : "has"
    PRODUCT ||--o| CATALOG_ITEM : "linked to"
    PRODUCT ||--o| METADATA : "has"
```

## API Structure

### RESTful Endpoints

The system exposes a comprehensive RESTful API for interacting with the application.

```mermaid
classDiagram
    class ProductsAPI {
        +GET /api/products
        +GET /api/products/:id
        +POST /api/products
        +PUT /api/products/:id
        +DELETE /api/products/:id
        +PUT /api/products/:id/analysis
        +PUT /api/products/:id/catalog-status
    }
    
    class TrendsAPI {
        +GET /api/trends
        +GET /api/trends/history
        +GET /api/trends/categories
        +GET /api/trends/search-terms
    }
    
    class SettingsAPI {
        +GET /api/settings
        +PUT /api/settings
        +GET /api/settings/crawler
        +PUT /api/settings/crawler
        +GET /api/settings/analyzer
        +PUT /api/settings/analyzer
        +GET /api/settings/reset
    }
    
    class AdminAPI {
        +POST /api/crawl
    }
```

## Deployment Architecture

```mermaid
flowchart TD
    subgraph Development["Development Environment"]
        DevCode["Source Code"] --> DevBuild["Local Build"]
        DevBuild --> DevDeploy["Local Deployment"]
    end
    
    subgraph CI["CI/CD Pipeline"]
        GitRepo["GitHub Repository"] --> GHActions["GitHub Actions"]
        GHActions --> Tests["Automated Tests"]
        Tests --> DockerBuild["Docker Build"]
    end
    
    subgraph Production["Production Environment"]
        DockerBuild --> DockerImage["Docker Image"]  
        DockerImage --> Container["Docker Container"]
        Container --> MongoDB[("MongoDB Atlas")]
        Container --> UserTraffic["User Traffic"]        
    end
    
    classDef dev fill:#d5e8d4,stroke:#333,stroke-width:1px
    classDef ci fill:#dae8fc,stroke:#333,stroke-width:1px
    classDef prod fill:#ffe6cc,stroke:#333,stroke-width:1px
    
    class Development dev
    class CI ci
    class Production prod
```

## System Operation

### Typical Crawling Process

```mermaid
sequenceDiagram
    participant Scheduler
    participant Crawler
    participant BraveAPI as Brave Search API
    participant Filter
    participant DB as MongoDB
    participant Analyzer
    participant CatalogMgr as Catalog Manager
    participant ECommerce as E-commerce Platform
    
    Scheduler->>Crawler: Trigger hourly crawl
    Crawler->>Crawler: Load search queries from settings
    
    loop For each search query
        Crawler->>BraveAPI: Send search request
        BraveAPI-->>Crawler: Return search results
        Crawler->>Filter: Process search results
        Filter-->>Crawler: Return filtered products
        Crawler->>DB: Save discovered products
    end
    
    Crawler->>Analyzer: Trigger analysis
    Analyzer->>DB: Get unanalyzed products
    
    loop For each unanalyzed product
        Analyzer->>Analyzer: Perform analysis
        Analyzer->>DB: Save analysis results
    end
    
    Analyzer->>CatalogMgr: Trigger catalog update
    CatalogMgr->>DB: Get products to index/deindex
    
    loop For products to index
        CatalogMgr->>ECommerce: Add product to catalog
        ECommerce-->>CatalogMgr: Confirm addition
        CatalogMgr->>DB: Update product status
    end
    
    loop For products to deindex
        CatalogMgr->>ECommerce: Remove product from catalog
        ECommerce-->>CatalogMgr: Confirm removal
        CatalogMgr->>DB: Update product status
    end
```

## Technical Design Considerations

### Scalability

The system is designed to scale horizontally with increasing load:

- Stateless services allow multiple instances
- Database collections are indexed for performance
- Caching is implemented for frequently accessed data
- Asynchronous processing for long-running tasks

### Resilience

Failure handling mechanisms are built in:

- Retry logic for external API calls
- Graceful degradation to demo mode when APIs are unavailable
- Error logging and monitoring
- Transaction handling for database operations

### Security

Security considerations include:

- Environment-based configuration for sensitive credentials
- Input validation on all API endpoints
- Rate limiting for public endpoints
- CORS configuration for API access control

## Performance Optimization

```mermaid
graph LR
    A["Raw Query Results"] --> B["Relevance Filtering"]
    B --> C["Duplicate Detection"]
    C --> D["Database Batch Operations"]
    D --> E["Optimized Storage"]
    
    style A fill:#f5f5f5,stroke:#333,stroke-width:1px
    style B fill:#d5e8d4,stroke:#333,stroke-width:1px
    style C fill:#d5e8d4,stroke:#333,stroke-width:1px
    style D fill:#d5e8d4,stroke:#333,stroke-width:1px
    style E fill:#d5e8d4,stroke:#333,stroke-width:1px
```

## Technology Stack Details

### Backend

- **Node.js**: JavaScript runtime for server-side code
- **Express**: Web framework for RESTful API
- **Mongoose**: MongoDB object modeling tool
- **node-cron**: Task scheduler for periodic jobs
- **Axios**: HTTP client for external API calls
- **Winston**: Logging library
- **dotenv**: Environment configuration management

### Database

- **MongoDB**: NoSQL database for flexible document storage
- **Indexes**: Optimized for query performance
- **Schema validation**: Ensures data integrity

### Frontend

- **HTML5/CSS3/JavaScript**: Core web technologies
- **Chart.js**: Visualization library for analytics
- **Fetch API**: For client-side API communication

## Future Architecture Enhancements

```mermaid
flowchart TD
    Current["Current System"] --> ML["Machine Learning Integration"]
    Current --> Auth["Authentication System"]
    Current --> Microservices["Microservices Architecture"]
    Current --> RealTime["Real-time Updates"]
    
    ML --> PredictiveAnalysis["Predictive Performance Analysis"]
    ML --> AutoCategories["Automatic Categorization"]
    
    Auth --> UserRoles["Role-based Access Control"]
    Auth --> APIKeys["API Key Management"]
    
    Microservices --> ServiceMesh["Service Mesh"]
    Microservices --> KubeDeployment["Kubernetes Deployment"]
    
    RealTime --> WebSockets["WebSocket Implementation"]
    RealTime --> LiveDashboard["Live Dashboard Updates"]
    
    style Current fill:#d5e8d4,stroke:#333,stroke-width:1px
    style ML fill:#dae8fc,stroke:#333,stroke-width:1px
    style Auth fill:#dae8fc,stroke:#333,stroke-width:1px
    style Microservices fill:#dae8fc,stroke:#333,stroke-width:1px
    style RealTime fill:#dae8fc,stroke:#333,stroke-width:1px
```

## Conclusion

The DropShip Trend Crawler architecture is designed with modularity, scalability, and maintainability in mind. By separating concerns into distinct services and implementing clean interfaces between components, the system can evolve and grow while maintaining stability and performance. The modular design also allows for the replacement or enhancement of individual components without affecting the entire system.