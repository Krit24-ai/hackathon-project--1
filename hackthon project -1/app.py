from flask import Flask, request, jsonify, session, render_template, redirect, url_for
from flask_cors import CORS
from datetime import datetime
import json

app = Flask(__name__)
app.secret_key = 'your-secret-key'
CORS(app)  # Enable CORS if frontend is served separately


# ---- Load users from JSON file ----
def load_users():
    with open("users.json", "r") as file:
        return json.load(file)


# ---- Auth Routes ----
@app.route('/')
def signin_page():
    return render_template('signin.html')


@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')

    users = load_users()

    # Check if user exists
    for user in users:
        if user["username"] == username and user["password"] == password:
            session['user'] = username  # store user in session
            return redirect(url_for('main_page'))

    return "❌ Invalid username or password"


@app.route('/main')
def main_page():
    if not session.get('user'):
        return redirect(url_for('signin_page'))
    return render_template('main.html', user=session['user'])


@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('signin_page'))


# ---- Community Posts Routes ----
community_posts = []


@app.route('/community/posts', methods=['GET'])
def get_community_posts():
    # Return posts in reverse chronological order
    return jsonify(list(reversed(community_posts)))


@app.route('/community/posts', methods=['POST'])
def add_community_post():
    if not session.get('user'):
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    content = data.get('content', '').strip()
    if not content:
        return jsonify({"error": "Empty post"}), 400

    post = {
        "user": session.get('user'),
        "content": content,
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    }
    community_posts.append(post)
    return jsonify(post), 201


if __name__ == '__main__':
    app.run(debug=True)
