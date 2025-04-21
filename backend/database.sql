-- THIS FILE IS RAN INSIDE POSTGRESQL
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    highest_score INTEGER DEFAULT 0,
    highest_level INTEGER DEFAULT 0,
    total_games_played INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    total_incorrect_answers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_played_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_highest_score ON users(highest_score DESC);

CREATE OR REPLACE FUNCTION update_user_stats(
    p_username VARCHAR,
    p_score INTEGER,
    p_level INTEGER,
    p_correct BOOLEAN
) RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET 
        highest_score = GREATEST(highest_score, p_score),
        highest_level = GREATEST(highest_level, p_level),
        total_games_played = total_games_played + 1,
        total_correct_answers = total_correct_answers + CASE WHEN p_correct THEN 1 ELSE 0 END,
        total_incorrect_answers = total_incorrect_answers + CASE WHEN p_correct THEN 0 ELSE 1 END,
        last_played_at = CURRENT_TIMESTAMP
    WHERE username = p_username;
END;
$$ LANGUAGE plpgsql; 