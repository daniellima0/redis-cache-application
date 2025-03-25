# Node.js & Python Application with SQLite and Redis

This project is a full-stack backend application using Node.js with Express, SQLite for database management, and Python with Redis for rate-limiting user connections.

## Features
- **User Registration & Authentication**: Users can register and log in.
- **Service Listings**: Users can create and view services.
- **Rate Limiting**: Uses Redis to limit user logins per time window.
- **Cross-Origin Resource Sharing (CORS)**: Enabled for secure cross-domain requests.

## Technologies Used
- **Node.js & Express** (Backend API for user and service management)
- **SQLite** (Database for storing users and services)
- **Python & Flask** (Rate-limiting API using Redis)
- **Redis** (Rate-limiting logic for login attempts)

## Installation & Setup
### Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/)
- [Python 3](https://www.python.org/)
- [Redis](https://redis.io/)

### Steps
1. Clone the repository:
   ```sh
   git clone <repo_url>
   cd <project_directory>
   ```

2. Install dependencies:
   ```sh
   cd backend
   npm install
   ```
   ```sh
   cd redis-python
   pip install -r requirements.txt
   ```

3. Start the Redis server:
   ```sh
   redis-server
   ```

4. Run the Python Flask rate-limiting service:
   ```sh
   cd redis-python
   python main.py
   ```

5. Start the Node.js backend server:
   ```sh
   cd backend
   node server.js
   ```

## API Endpoints
### User Authentication
- **POST /register** - Register a new user.
- **POST /login** - Login and validate user access.

### Services
- **GET /services** - Fetch all available services.
- **GET /services/:id** - Fetch a specific service by ID.
- **POST /services** - Create a new service.

### Rate Limiting API
- **GET /can_connect?user_id=** - Check if a user can connect based on rate limits.

## Configuration
- Modify the SQLite database path in `server.js` if necessary.
- Update the Redis host/port in `main.py` if running remotely.

