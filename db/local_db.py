# C:\Users\HP\Documents\AI Planet\db\local_db.py

import sqlite3
import os

DATABASE_FILE = "data/conversations.db"

def init_db():
    """
    Deletes the old database file on every restart and creates a new, empty one.
    """
    # --- NEW LOGIC: DELETE THE OLD DATABASE FILE ON STARTUP ---
    if os.path.exists(DATABASE_FILE):
        os.remove(DATABASE_FILE)
        print("[♻️] Previous chat history database deleted on restart.")
    
    # Ensure the 'data' directory exists
    os.makedirs(os.path.dirname(DATABASE_FILE), exist_ok=True)
    
    # Connect to create a new, empty database file and table
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS conversations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        query TEXT,
                        context TEXT,
                        response TEXT,
                        file_uploaded BOOLEAN,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )''')
    conn.commit()
    conn.close()

def store_conversation(query, context, response, file_uploaded):
    """Stores a single turn of conversation in the database."""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute('INSERT INTO conversations (query, context, response, file_uploaded) VALUES (?, ?, ?, ?)',
                   (query, context, response, file_uploaded))
    conn.commit()
    conn.close()

def clear_conversations():
    """Deletes all non-file-upload conversation entries from the database."""
    if not os.path.exists(DATABASE_FILE): return
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM conversations WHERE NOT file_uploaded")
    conn.commit()
    conn.close()
    print("[✔️] Conversation history cleared.")

def get_recent_conversations(limit: int = 5):
    """Fetches the most recent conversation turns from the database to be used as memory."""
    if not os.path.exists(DATABASE_FILE): return []
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT query, response FROM conversations WHERE NOT file_uploaded ORDER BY timestamp DESC LIMIT ?", (limit,))
    history = cursor.fetchall()[::-1]
    conn.close()
    messages = []
    for user_query, ai_response in history:
        messages.append({"role": "user", "content": user_query})
        messages.append({"role": "assistant", "content": ai_response})
    return messages