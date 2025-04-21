import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()

class Database:
    def __init__(self):
        self.conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME', 'deepfake_game'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', ''),
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432')
        )
        self.cur = self.conn.cursor(cursor_factory=RealDictCursor)

    def create_user(self, username, password):
        try:
            # Hash the password
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            self.cur.execute(
                "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
                (username, hashed.decode('utf-8'))
            )
            self.conn.commit()
            return True
        except psycopg2.IntegrityError:
            return False  # Username already exists
        except Exception as e:
            print(f"Error creating user: {e}")
            return False

    def verify_user(self, username, password):
        try:
            # First check if user exists
            self.cur.execute(
                "SELECT password_hash FROM users WHERE username = %s",
                (username,)
            )
            result = self.cur.fetchone()
            
            if not result:
                print(f"User {username} not found")
                return False
            
            # If password is empty (for token verification), just check if user exists
            if not password:
                return True
            
            # Verify password
            stored_hash = result['password_hash'].encode('utf-8')
            provided_password = password.encode('utf-8')
            
            if bcrypt.checkpw(provided_password, stored_hash):
                print(f"User {username} verified successfully")
                return True
            
            print(f"Invalid password for user {username}")
            return False
        except Exception as e:
            print(f"Error verifying user {username}: {e}")
            return False

    def update_user_stats(self, username, score, level, is_correct):
        try:
            # First verify the user exists
            self.cur.execute(
                "SELECT id FROM users WHERE username = %s",
                (username,)
            )
            if not self.cur.fetchone():
                print(f"User {username} not found")
                return False

            # Update the stats
            self.cur.execute(
                "SELECT update_user_stats(%s, %s, %s, %s)",
                (username, score, level, is_correct)
            )
            self.conn.commit()
            
            # Verify the update worked
            self.cur.execute(
                "SELECT highest_score, highest_level FROM users WHERE username = %s",
                (username,)
            )
            result = self.cur.fetchone()
            if result:
                print(f"Stats updated for {username}: score={result['highest_score']}, level={result['highest_level']}")
                return True
            return False
        except Exception as e:
            print(f"Error updating stats for {username}: {e}")
            self.conn.rollback()
            return False

    def get_leaderboard(self, username=None):
        try:
            # Get top 10 users
            self.cur.execute("""
                SELECT username, highest_score, highest_level
                FROM users
                ORDER BY highest_score DESC
                LIMIT 10
            """)
            top_10 = self.cur.fetchall()

            # Get user's rank if username is provided
            user_rank = None
            if username:
                self.cur.execute("""
                    SELECT rank, username, highest_score, highest_level
                    FROM (
                        SELECT username, highest_score, highest_level,
                               RANK() OVER (ORDER BY highest_score DESC) as rank
                        FROM users
                    ) ranked_users
                    WHERE username = %s
                """, (username,))
                user_rank = self.cur.fetchone()

            return {
                'top_10': top_10,
                'user_rank': user_rank
            }
        except Exception as e:
            print(f"Error getting leaderboard: {e}")
            return {'top_10': [], 'user_rank': None}

    def get_user_stats(self, username):
        try:
            self.cur.execute("""
                SELECT username, highest_score, highest_level,
                       total_games_played, total_correct_answers,
                       total_incorrect_answers, last_played_at
                FROM users
                WHERE username = %s
            """, (username,))
            return self.cur.fetchone()
        except Exception as e:
            print(f"Error getting user stats: {e}")
            return None

    def close(self):
        self.cur.close()
        self.conn.close() 