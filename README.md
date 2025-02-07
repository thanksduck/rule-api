To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000
# rule-api
```markdown
# Rules API

This API provides endpoints for managing and retrieving rules, primarily designed for routing and access control based on domain and alias.  It utilizes a caching mechanism for efficient lookups and integrates with a MongoDB database for persistent storage.

## Getting Started

### Prerequisites

* Node.js (version >= 18 recommended)
* Bun (for package management and running the application)
* MongoDB (a running instance)
* Environment variables configured (see `.env.example` below)

### Installation

1. Clone the repository: `git clone <repository_url>`
2. Install dependencies: `bun install`
3. Create a `.env` file in the root directory and populate it with your environment variables (see `.env.example` for the required variables).
4. Start the development server: `bun run dev`
5. Build for production: `bun run build`
6. Run the production server: `bun run start`

### .env.example

```
PORT=4444  # Port the server will listen on (optional, defaults to 4444)
TOKEN=your_secret_token  # API authentication token (required)
ALLOWED_DOMAINS=example.com mydomain.net  # Space-separated list of allowed domains (required)
MONGODB_URI=mongodb://user:password@host:port/database # MongoDB connection URI (required)
```

## API Endpoints

All API endpoints are prefixed with `/v1/rule` or `/v1/rules`.

### Authentication

All endpoints (except GET /:domain/:rule) require authentication via a Bearer token in the `Authorization` header.

```
Authorization: Bearer your_secret_token
```

### Request Body Format

Most POST and PATCH requests expect a JSON body with the following format:

```json
{
  "domain": "example.com",  // Required (must be an allowed domain)
  "alias": "user@example.com", // Required (must be a valid email and the domain part must match the domain field)
  "destination": "[email address removed]", // Required (must be a valid email)
  "username": "user123", // Required
  "comment": "Optional comment",
  "active": true // Optional, defaults to true
}
```

### Endpoints

#### GET /

Retrieves all rules with pagination and sorting.

* **Query Parameters:**
    * `page`: Page number (default: 1)
    * `limit`: Number of rules per page (default: 10, max: 20)
    * `sortBy`: Field to sort by (default: `createdAt`)
    * `sortOrder`: Sorting order (`asc` or `desc`, default: `desc`)
    * `domain`: Filter by domain
    * `active`: Filter by active status (`true` or `false`)
* **Response:**
  ```json
  {
    "success": true,
    "message": "Rules retrieved successfully",
    "data": [ /* Array of rule objects */ ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 45,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```

#### GET /:domain

Retrieves all active rules for a specific domain.

* **Parameters:**
    * `domain`: The domain to retrieve rules for.
* **Response:**
  ```json
  {
    "success": true,
    "message": "All rules for example.com",
    "data": [ /* Array of rule objects */ ]
  }
  ```

#### GET /:domain/:rule

Retrieves a specific rule by domain and alias.  Does not require authentication.  Increments the `count` field.

* **Parameters:**
    * `domain`: The domain of the rule.
    * `rule`: The alias of the rule (e.g., `user@example.com`).
* **Response:**
  ```json
  {
    "success": true,
    "message": "Rule found",
    "data": "[email address removed]" // The destination email
  }
  ```

#### POST /

Creates a new rule.

* **Request Body:** (See above)
* **Response:**
  ```json
  {
    "success": true,
    "message": "Rule created successfully",
    "data": { /* The created rule object */ }
  }
  ```

#### PATCH /:domain/:rule

Updates an existing rule.

* **Parameters:**
    * `domain`: The domain of the rule.
    * `rule`: The alias of the rule (e.g., `user@example.com`).
* **Request Body:** (See above - all fields are optional for update)
* **Response:**
  ```json
  {
    "success": true,
    "message": "Rule updated successfully",
    "data": { /* The updated rule object */ }
  }
  ```

#### PATCH /:domain/:rule/:action

Toggles the active status of a rule.

* **Parameters:**
    * `domain`: The domain of the rule.
    * `rule`: The alias of the rule (e.g., `user@example.com`).
    * `action`: The action to perform (`enable`, `disable`, `switch`, `toggle`, `flip`).
* **Response:**
  ```json
  {
    "success": true,
    "message": "Rule has been enabled/disabled/toggled",
    "data": { /* The updated rule object */ }
  }
  ```

#### DELETE /:domain/:rule

Deletes a rule.

* **Parameters:**
    * `domain`: The domain of the rule.
    * `rule`: The alias of the rule (e.g., `user@example.com`).
* **Response:**
  ```json
  {
    "success": true,
    "message": "Rule has been deleted",
    "data": null
  }
  ```

## Error Handling

All API responses include a `success` field (true or false) and an `error` field containing a message if the request failed.  Appropriate HTTP status codes are also used.

## Caching

The API uses an in-memory cache to store active rules for fast retrieval. The cache is initialized on startup and synchronized with the database periodically.  Updates and deletions to rules also update the cache.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
```
