import redis
import time
from flask import Flask, jsonify, request
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
# CORS setup with custom configurations
CORS(
    app,
    resources={
        r"/*": {
            "origins": "*",  # Allow all origins
            "allow_headers": [
                "Content-Type",
                "Authorization",
            ],  # Allow specific headers
            "expose_headers": ["X-Custom-Header"],  # Expose custom headers to client
            "methods": ["GET", "POST", "OPTIONS"],  # Allow specific HTTP methods
            "supports_credentials": True,
        }
    },
)


# After request hook to add custom headers
@app.after_request
def add_cors_headers(response):
    response.headers["X-Custom-Header"] = "SomeValue"  # Custom header
    response.headers["Access-Control-Allow-Origin"] = "*"  # Allow all origins
    response.headers["Access-Control-Allow-Methods"] = (
        "GET, POST, OPTIONS"  # Allowed methods
    )
    response.headers["Access-Control-Allow-Headers"] = (
        "Content-Type, Authorization"  # Allowed headers
    )
    return response


redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)
print("Redis connection status:", redis_client.ping())

WINDOW_SIZE = 600  # 10 minutes
MAX_CONNECTIONS = 10


def can_connect(user_id):
    key = f"user:{user_id}:connections"
    connections = redis_client.lrange(key, 0, -1)

    now = time.time()
    connections = [float(ts) for ts in connections if now - float(ts) < WINDOW_SIZE]
    redis_client.delete(key)
    for ts in connections:
        redis_client.rpush(key, ts)

    if len(connections) < MAX_CONNECTIONS:
        redis_client.rpush(key, now)
        redis_client.expire(key, WINDOW_SIZE)
        return True
    return False


@app.route("/can_connect", methods=["GET"])
def check_connection():
    user_id = request.args.get("user_id")
    if user_id is None:
        return jsonify({"error": "user_id is required"}), 400

    if can_connect(user_id):
        return jsonify({"message": "User can connect"})
    else:
        return jsonify({"message": "User exceeded the limit"}), 403


if __name__ == "__main__":
    app.run(host="0.0.0.0")  # Exposing the API on port 5000
