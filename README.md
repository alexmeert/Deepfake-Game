# Deepfake Game

A web-based game where you spot the original image among AI-generated deepfakes! Built with a Python FastAPI backend and a simple HTML/CSS/JavaScript frontend.

## Key Features

*   **AI Image Generation:** Uses Stable Diffusion (via `diffusers` and `torch`) to generate image variations based on source images in the `backend/images` directory.
*   **Dynamic Grid:** Presents the original and generated images in a grid that increases in size as the game level progresses.
*   **User Accounts:** Simple username/password registration and login.
*   **Score Tracking:** Records user scores, levels, and game statistics.
*   **Leaderboard:** Shows the top 10 players and the current user's rank.
*   **API Backend:** Powered by FastAPI, serving game data and handling user interactions.
*   **Database:** Uses PostgreSQL to store user information and game stats.

## Prerequisites

*   **Python:** Version 3.8 or higher recommended.
*   **pip:** Python package installer (usually comes with Python).
*   **PostgreSQL:** A running PostgreSQL server instance.
*   **(VERY Recommended)** NVIDIA GPU **WITH** CUDA: For significantly faster image generation by the backend. If you don't have one, `torch` will use the CPU, which **WILL** be slow.

## Backend Setup

1.  **Navigate to Backend:**
    ```bash
    cd backend
    ```

2.  **Create Virtual Environment (Recommended):**
    *   Windows:
        ```bash
        python -m venv venv
        .\venv\Scripts\activate
        ```
    *   macOS/Linux:
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *(Note: Installing `torch` can take a while and might require different versions depending on your system/CUDA setup. Please refer to the original documentation [PyTorch installation guide](https://pytorch.org/get-started/locally/) if you encounter issues.)*

4.  **Database Setup:**
    *   Make sure your PostgreSQL server is running.
    *   Create a new database (e.g., `deepfake_game`). You can use `createdb deepfake_game` in your terminal if you have PostgreSQL command-line tools installed.
    *   Connect to your *new* database using `psql` or a GUI tool. If using `psql`:
        ```bash
        psql -U your_postgres_user -d deepfake_game
        ```
    *   Run the `database.sql` script (in psql or pgAdmin) to create the necessary tables and functions:
        ```sql
        -- Inside the psql prompt:
        \i database.sql
        ```

5.  **Environment Variables:**
    *   Create a file named `.env` in the `backend` directory.
    *   Add your database connection details to it:
        ```dotenv
        # backend/.env
        DB_NAME=deepfake_game
        DB_USER=your_postgres_user
        DB_PASSWORD=your_postgres_password
        DB_HOST=localhost
        DB_PORT=5432
        ```
    *   Replace `your_postgres_user` and `your_postgres_password` with your actual PostgreSQL credentials. Adjust `DB_HOST` and `DB_PORT` if your server runs elsewhere.

6.  **Add Seed Images:**
    *   Place some `.jpg`, `.jpeg`, or `.png` images into the `backend/images/` directory. These will be used as the source for generating the game levels.

7.  **Run the Server:**
    ```bash
    uvicorn app:app --reload
    ```
    *   The API should now be running, typically at `http://127.0.0.1:8000`. You'll see output in the terminal confirming this, including the first time it loads the Stable Diffusion model (which can take some time).

## Frontend Setup (Seperate)

1.  **Navigate to Frontend:**
    ```bash
    cd frontend
    ```

2.  **Open the Game:**
    *   Simply open the `index.html` file in your web browser or type:
    ```bash
    start index.html
    ```

    *   The JavaScript (`script.js`) is configured to communicate with the backend API at `http://127.0.0.1:8000`. If your backend runs on a different address or port, you'll need to update the `API_BASE_URL` variable in `script.js`.

## Running the Application

1.  Ensure your PostgreSQL server is running.
2.  Start the backend server from the `backend` directory (`uvicorn app:app --reload`). Wait for it to load the model.
3.  Open the `frontend/index.html` file in your browser.
4.  Register an account, log in, and start playing! (or play as a guest!) 