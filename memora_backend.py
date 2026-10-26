"""
Memora Backend Integration Layer
Preserves 100% of existing functionality from code.ipynb, ChromaDB, and SQLite.
Exposes FastAPI REST API for Memora Frontend.
"""

import os
import re
import sqlite3
import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from sentence_transformers import SentenceTransformer
import fitz
import ollama

# ----------------- INITIALIZATION & MODELS -----------------

DB_PATH = "memora_tasks.db"
CHROMA_PATH = "./chroma_db"
MODEL_NAME = "llama3.2:3b"

# Load Sentence Transformer Embedding Model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Initialize ChromaDB Persistent Client
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
memory_collection = chroma_client.get_or_create_collection(name="memora_memories")

# Initialize SQLite Task Database
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task TEXT NOT NULL,
                date TEXT,
                action_type TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                user_id TEXT DEFAULT 'default'
            )
        """)
        # Check if user_id column exists
        cursor.execute("PRAGMA table_info(tasks)")
        cols = [c[1] for c in cursor.fetchall()]
        if "user_id" not in cols:
            cursor.execute("ALTER TABLE tasks ADD COLUMN user_id TEXT DEFAULT 'default'")
        conn.commit()

init_db()

# ----------------- LLM CALL -----------------

def ask_llm(prompt: str) -> str:
    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}]
        )
        return response["message"]["content"].strip()
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return f"Error communicating with local LLM: {str(e)}"

# ----------------- MEMORY FUNCTIONS -----------------

def save_memory(memory_id: str, memory: str, memory_type: str = "preference", source: str = "user", user_id: str = "default"):
    embedding = embedding_model.encode(memory).tolist()
    metadata = {
        "type": memory_type,
        "source": source,
        "user_id": user_id,
        "created_at": datetime.datetime.now().isoformat()
    }
    memory_collection.add(
        ids=[memory_id],
        documents=[memory],
        embeddings=[embedding],
        metadatas=[metadata]
    )
    return "Memory saved successfully."

def search_memory(query: str, n_results: int = 3, memory_type: Optional[str] = None, exclude_type: Optional[str] = None, user_id: Optional[str] = None):
    query_embedding = embedding_model.encode(query).tolist()
    query_kwargs: Dict[str, Any] = {
        "query_embeddings": [query_embedding],
        "n_results": n_results,
        "include": ["documents", "metadatas", "distances"]
    }
    
    where_clauses = []
    if memory_type:
        where_clauses.append({"type": memory_type})
    elif exclude_type:
        where_clauses.append({"type": {"$ne": exclude_type}})
        
    if where_clauses:
        if len(where_clauses) == 1:
            query_kwargs["where"] = where_clauses[0]
        else:
            query_kwargs["where"] = {"$and": where_clauses}

    results = memory_collection.query(**query_kwargs)
    return results

def get_all_memories(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    # Retrieve non-document personal memories
    data = memory_collection.get(
        include=["documents", "metadatas"]
    )
    memories = []
    ids = data.get("ids", [])
    docs = data.get("documents", [])
    metas = data.get("metadatas", [])
    for idx, mid in enumerate(ids):
        meta = metas[idx] if metas and idx < len(metas) else {}
        if meta and meta.get("type") == "document_chunk":
            continue
        memories.append({
            "id": mid,
            "text": docs[idx],
            "type": meta.get("type", "general") if meta else "general",
            "source": meta.get("source", "user") if meta else "user",
            "created_at": meta.get("created_at") if meta else None,
            "user_id": meta.get("user_id", "default") if meta else "default"
        })
    return memories

# ----------------- RAG PIPELINE -----------------

def rag_answer(question: str, n_results: int = 3) -> Dict[str, Any]:
    results = search_memory(question, n_results=n_results, memory_type="document_chunk")
    
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]

    if not docs:
        return {
            "answer": "I couldn't find any relevant document information in your stored knowledge.",
            "sources": []
        }

    context_parts = []
    sources = []
    for i, chunk in enumerate(docs):
        metadata = metas[i] if i < len(metas) else {}
        source = metadata.get("source", "Unknown")
        page = metadata.get("page", "Unknown")
        context_parts.append(f"[Source: {source}, Page: {page}]\n{chunk}")
        sources.append({
            "source": source,
            "page": page,
            "chunk_index": metadata.get("chunk_index", i),
            "snippet": chunk[:150] + "..." if len(chunk) > 150 else chunk
        })

    context = "\n\n---\n\n".join(context_parts)
    prompt = f"""You are Memora, a personal knowledge assistant.

Answer the user's question using ONLY the information provided in the context.
If the answer cannot be found in the context, say:
"I couldn't find that information in your stored knowledge."

Context:
{context}

User question:
{question}

Answer clearly and concisely.
"""
    answer = ask_llm(prompt)
    return {
        "answer": answer,
        "sources": sources
    }

# ----------------- NATURAL LANGUAGE DATE NORMALIZATION -----------------

def normalize_date(date_str: Optional[str], ref_date: Optional[datetime.date] = None) -> Optional[str]:
    if not date_str:
        return None
    cleaned = date_str.strip()
    if not cleaned or cleaned.upper() == "NONE":
        return None
        
    if ref_date is None:
        ref_date = datetime.date.today()
        
    s = cleaned.lower()
    
    if s == "today":
        return ref_date.strftime("%Y-%m-%d")
    if s == "tomorrow":
        return (ref_date + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
        
    m_days = re.search(r"in\s+(\d+)\s+days?", s)
    if m_days:
        days = int(m_days.group(1))
        return (ref_date + datetime.timedelta(days=days)).strftime("%Y-%m-%d")
        
    weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for idx, w in enumerate(weekdays):
        if f"next {w}" in s or s == w or f"this {w}" in s:
            days_ahead = (idx - ref_date.weekday()) % 7
            if days_ahead == 0:
                days_ahead = 7
            return (ref_date + datetime.timedelta(days=days_ahead)).strftime("%Y-%m-%d")
            
    # Try parsing month + day (e.g. October 30)
    for fmt in ["%B %d", "%b %d", "%B %d, %Y", "%Y-%m-%d", "%d %B", "%m/%d/%Y", "%Y/%m/%d"]:
        try:
            if "%Y" not in fmt:
                dt = datetime.datetime.strptime(f"{s} {ref_date.year}", f"{fmt} %Y")
            else:
                dt = datetime.datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
            
    return cleaned

# ----------------- ACTION & TASK EXTRACTION -----------------

def extract_action(query: str) -> str:
    prompt = f"""You are the action extraction component of Memora.

Extract the actionable task from the user's request.

Return the result in exactly this format:

TASK: <task>
DATE: <date or NONE>
ACTION: <action type: task or reminder>

Examples:

User: Remind me to submit my internship application on October 30.
TASK: Submit my internship application
DATE: October 30
ACTION: reminder

User: Create a task to finish my AI project.
TASK: Finish my AI project
DATE: NONE
ACTION: task

User query:
{query}
"""
    return ask_llm(prompt)

def parse_action(action_text: str) -> Dict[str, Optional[str]]:
    lines = action_text.strip().split("\n")
    action_data: Dict[str, Optional[str]] = {
        "task": None,
        "date": None,
        "action_type": "task"
    }
    for line in lines:
        line_clean = line.strip()
        if line_clean.startswith("TASK:"):
            action_data["task"] = line_clean.replace("TASK:", "").strip()
        elif line_clean.startswith("DATE:"):
            action_data["date"] = line_clean.replace("DATE:", "").strip()
        elif line_clean.startswith("ACTION:"):
            action_data["action_type"] = line_clean.replace("ACTION:", "").strip()

    if action_data["date"] and action_data["date"].upper() == "NONE":
        action_data["date"] = None

    return action_data

# ----------------- SQLITE TASK OPERATIONS -----------------

def save_task(task: str, date: Optional[str], action_type: str = "task", user_id: str = "default") -> int:
    created_at = datetime.datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tasks (task, date, action_type, status, created_at, user_id)
            VALUES (?, ?, ?, 'pending', ?, ?)
        """, (task, date, action_type, created_at, user_id))
        conn.commit()
        return cursor.lastrowid

def get_tasks(user_id: Optional[str] = None, status: Optional[str] = "pending") -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT id, task, date, action_type, status, created_at, user_id FROM tasks"
        params: List[Any] = []
        conditions = []
        if status:
            conditions.append("status = ?")
            params.append(status)
        if user_id and user_id != "default":
            conditions.append("(user_id = ? OR user_id = 'default')")
            params.append(user_id)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

def complete_task(task_id: int) -> bool:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE tasks
            SET status = 'completed'
            WHERE id = ?
        """, (task_id,))
        conn.commit()
        return cursor.rowcount > 0

def delete_task(task_id: int) -> bool:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        return cursor.rowcount > 0

def find_task(task_text: str, user_id: Optional[str] = None):
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT id, task, date, action_type, status, user_id
            FROM tasks
            WHERE task LIKE ?
            AND status = 'pending'
        """
        params: List[Any] = [f"%{task_text}%"]
        if user_id and user_id != "default":
            query += " AND (user_id = ? OR user_id = 'default')"
            params.append(user_id)
        query += " ORDER BY id DESC LIMIT 1"
        cursor.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None

def complete_task_by_text(task_text: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    task = find_task(task_text, user_id=user_id)
    if task is None:
        return {
            "success": False,
            "message": f"I couldn't find a pending task matching '{task_text}'."
        }
    success = complete_task(task["id"])
    if success:
        return {
            "success": True,
            "task_id": task["id"],
            "task": task["task"],
            "message": f"Task '{task['task']}' has been marked as completed."
        }
    return {
        "success": False,
        "message": "I couldn't update the task."
    }

def delete_task_by_text(task_text: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    task = find_task(task_text, user_id=user_id)
    if task is None:
        return {
            "success": False,
            "message": f"I couldn't find a matching task for '{task_text}'."
        }
    success = delete_task(task["id"])
    if success:
        return {
            "success": True,
            "task_id": task["id"],
            "task": task["task"],
            "message": f"Task '{task['task']}' has been deleted."
        }
    return {
        "success": False,
        "message": "I couldn't delete the task."
    }

# ----------------- ROUTING & CLASSIFICATION -----------------

def classify_query(query: str) -> str:
    prompt = f"""You are the query router for Memora, a personal knowledge and action assistant.

Classify the user's query into exactly ONE of these categories:

MEMORY
- Questions about personal facts, personal preferences, or stored personal information about the user.
- Examples: 'What is my favorite color?', 'What programming language do I prefer for AI projects?', 'What did I save about my internship?'

RAG
- Questions about general knowledge or documents/PDFs uploaded to Memora.
- Examples: 'What is environment?', 'What does the PDF say about the environment?'

ACTION
- Requests to CREATE, SET, or SAVE a new task, reminder, or action.
- Examples: 'Remind me to apply for the internship.', 'Prepare internship documents tomorrow.', 'Remind me about my deadline tomorrow.', 'Finish the project in 3 days.'

DATABASE
- Requests to READ, VIEW, CHECK, QUERY, UPDATE, COMPLETE, or DELETE existing stored tasks or reminders.
- Examples: 'What tasks do I have?', 'Show my pending tasks.', 'What am I overdue on?', 'What deadlines are coming up?', 'What's due tomorrow?', 'What do I have this week?', 'Mark my internship task as completed.', 'Delete my temporary task.'

Return ONLY one word: MEMORY, RAG, ACTION, or DATABASE. No punctuation or explanation.

User query: {query}
"""
    result = ask_llm(prompt)
    route = result.strip().upper()
    for valid in ["MEMORY", "RAG", "ACTION", "DATABASE"]:
        if valid in route:
            return valid
    return "MEMORY"

def classify_database_action(query: str) -> str:
    prompt = f"""You are the database action classifier for Memora, an AI personal assistant.

Classify the user's task request into exactly ONE of these categories:

VIEW
- User wants to see, list, or check general tasks.
- Examples: 'What tasks do I have?', 'Show my pending tasks.'

DATE
- User asks what tasks/deadlines are due on a specific day or date.
- Examples: 'What's due tomorrow?', 'What do I have on October 30?', 'What do I have today?'

DATE_RANGE
- User asks what tasks are due within a time range like this week, this month.
- Examples: 'What's due this week?', 'What do I have this week?'

OVERDUE
- User asks about past-due, missed, or late tasks/deadlines.
- Examples: 'What am I overdue on?', 'Which deadlines have I missed?', 'Show me my overdue tasks.'

UPCOMING
- User asks what tasks/deadlines are coming up soon in the future.
- Examples: 'What deadlines are coming up?', 'What do I have coming up?'

COMPLETE
- User wants to mark an existing task as completed.
- Examples: 'Mark my internship task as completed.', 'Complete my project task.'

DELETE
- User wants to remove/delete an existing task.
- Examples: 'Delete my temporary task.', 'Remove the meeting task.'

Return ONLY the single word (VIEW, DATE, DATE_RANGE, OVERDUE, UPCOMING, COMPLETE, or DELETE). No other text.

Query: {query}
"""
    result = ask_llm(prompt).strip().upper()
    for valid in ["DATE_RANGE", "OVERDUE", "UPCOMING", "COMPLETE", "DELETE", "DATE", "VIEW"]:
        if valid in result:
            return valid
    return "VIEW"

# Helper to extract a date mentioned in query
def extract_query_date(query: str) -> Optional[str]:
    prompt = f"""Extract the target date or day from the user's question.
If the user asks 'What's due tomorrow?', return 'tomorrow'.
If the user asks 'What do I have on October 30?', return 'October 30'.
If the user asks 'What is due today?', return 'today'.
If no specific date is mentioned, return 'NONE'.

Query: {query}
Return ONLY the date string:"""
    extracted = ask_llm(prompt).strip()
    return normalize_date(extracted)

# ----------------- MEMORA CHAT RESPONSE LAYER -----------------

def memora_chat(query: str, user_id: str = "default") -> Dict[str, Any]:
    """
    Main conversational entry point for Memora.
    Routes queries between MEMORY, RAG, ACTION, and DATABASE,
    and returns friendly conversational responses without exposing raw internal dictionaries.
    """
    route = classify_query(query)
    today_str = datetime.date.today().strftime("%Y-%m-%d")

    # 1. ---------------- MEMORY ----------------
    if route == "MEMORY":
        results = search_memory(
            query,
            n_results=3,
            exclude_type="document_chunk",
            user_id=user_id
        )
        docs = results.get("documents", [[]])[0]
        if not docs:
            return {
                "answer": "I don't seem to have any stored personal memories about that yet.",
                "route": "MEMORY"
            }
        
        context = "\n".join([f"- {d}" for d in docs])
        prompt = f"""You are Memora, a personal AI memory assistant.
Answer the user's question directly, concisely, and warmly based on their stored personal memories.
Do not invent anything not supported by the memories.

Stored Memories:
{context}

User question:
{query}

Answer in one or two clear, natural sentences:"""
        answer = ask_llm(prompt)
        return {
            "answer": answer,
            "route": "MEMORY",
            "data": {"memories": docs}
        }

    # 2. ---------------- RAG ----------------
    elif route == "RAG":
        rag_res = rag_answer(query)
        return {
            "answer": rag_res["answer"],
            "route": "RAG",
            "sources": rag_res["sources"]
        }

    # 3. ---------------- ACTION ----------------
    elif route == "ACTION":
        action_text = extract_action(query)
        action_data = parse_action(action_text)
        task_name = action_data["task"] or query
        raw_date = action_data["date"]
        norm_date = normalize_date(raw_date)

        task_id = save_task(
            task=task_name,
            date=norm_date,
            action_type=action_data["action_type"] or "task",
            user_id=user_id
        )

        date_msg = f" scheduled for {norm_date}" if norm_date else ""
        answer = f"I've saved your {action_data['action_type'] or 'task'}: \"{task_name}\"{date_msg}."

        return {
            "answer": answer,
            "route": "ACTION",
            "action": "CREATE",
            "task": {
                "id": task_id,
                "task": task_name,
                "date": norm_date,
                "action_type": action_data["action_type"] or "task",
                "status": "pending"
            }
        }

    # 4. ---------------- DATABASE ----------------
    elif route == "DATABASE":
        db_action = classify_database_action(query)

        # 4a. OVERDUE
        if db_action == "OVERDUE":
            all_pending = get_tasks(user_id=user_id, status="pending")
            overdue_tasks = []
            for t in all_pending:
                t_date = t.get("date")
                if t_date and t_date < today_str:
                    overdue_tasks.append(t)
            
            if overdue_tasks:
                items_str = ", ".join([f"'{t['task']}' (due {t['date']})" for t in overdue_tasks])
                answer = f"You have {len(overdue_tasks)} overdue task{'s' if len(overdue_tasks)>1 else ''}: {items_str}."
            else:
                answer = "You have no overdue tasks! Everything is up to date."
                
            return {
                "answer": answer,
                "route": "DATABASE",
                "action": "OVERDUE",
                "tasks": overdue_tasks
            }

        # 4b. UPCOMING
        elif db_action == "UPCOMING":
            all_pending = get_tasks(user_id=user_id, status="pending")
            upcoming_tasks = []
            for t in all_pending:
                t_date = t.get("date")
                if t_date and t_date >= today_str:
                    upcoming_tasks.append(t)
            
            upcoming_tasks.sort(key=lambda x: x["date"] or "")

            if upcoming_tasks:
                items_str = ", ".join([f"'{t['task']}' on {t['date']}" for t in upcoming_tasks])
                answer = f"You have {len(upcoming_tasks)} upcoming task{'s' if len(upcoming_tasks)>1 else ''}: {items_str}."
            else:
                answer = "You have no upcoming deadlines scheduled right now."

            return {
                "answer": answer,
                "route": "DATABASE",
                "action": "UPCOMING",
                "tasks": upcoming_tasks
            }

        # 4c. DATE
        elif db_action == "DATE":
            target_date = extract_query_date(query)
            all_pending = get_tasks(user_id=user_id, status="pending")
            matching_tasks = []
            if target_date:
                for t in all_pending:
                    if t.get("date") == target_date:
                        matching_tasks.append(t)

            if matching_tasks:
                items_str = ", ".join([f"'{t['task']}'" for t in matching_tasks])
                answer = f"On {target_date}, you have {len(matching_tasks)} task{'s' if len(matching_tasks)>1 else ''}: {items_str}."
            else:
                date_label = f"on {target_date}" if target_date else "for that date"
                answer = f"You don't have any tasks scheduled {date_label}."

            return {
                "answer": answer,
                "route": "DATABASE",
                "action": "DATE",
                "target_date": target_date,
                "tasks": matching_tasks
            }

        # 4d. DATE_RANGE (e.g. this week)
        elif db_action == "DATE_RANGE":
            today = datetime.date.today()
            # Start of week (Monday) and end of week (Sunday)
            start_of_week = today - datetime.timedelta(days=today.weekday())
            end_of_week = start_of_week + datetime.timedelta(days=6)
            s_str = start_of_week.strftime("%Y-%m-%d")
            e_str = end_of_week.strftime("%Y-%m-%d")

            all_pending = get_tasks(user_id=user_id, status="pending")
            matching_tasks = []
            for t in all_pending:
                t_date = t.get("date")
                if t_date and s_str <= t_date <= e_str:
                    matching_tasks.append(t)

            if matching_tasks:
                items_str = ", ".join([f"'{t['task']}' ({t['date']})" for t in matching_tasks])
                answer = f"For this week, you have {len(matching_tasks)} task{'s' if len(matching_tasks)>1 else ''}: {items_str}."
            else:
                answer = "You have no tasks scheduled for this week."

            return {
                "answer": answer,
                "route": "DATABASE",
                "action": "DATE_RANGE",
                "tasks": matching_tasks
            }

        # 4e. COMPLETE
        elif db_action == "COMPLETE":
            action_text = extract_action(query)
            action_data = parse_action(action_text)
            task_text = action_data["task"] or query
            res = complete_task_by_text(task_text, user_id=user_id)
            return {
                "answer": res["message"],
                "route": "DATABASE",
                "action": "COMPLETE",
                "task_id": res.get("task_id"),
                "success": res.get("success", False)
            }

        # 4f. DELETE
        elif db_action == "DELETE":
            action_text = extract_action(query)
            action_data = parse_action(action_text)
            task_text = action_data["task"] or query
            res = delete_task_by_text(task_text, user_id=user_id)
            return {
                "answer": res["message"],
                "route": "DATABASE",
                "action": "DELETE",
                "task_id": res.get("task_id"),
                "success": res.get("success", False)
            }

        # 4g. VIEW (default)
        else:
            tasks = get_tasks(user_id=user_id, status="pending")
            if tasks:
                items_str = ", ".join([f"'{t['task']}'" + (f" ({t['date']})" if t['date'] else "") for t in tasks])
                answer = f"You currently have {len(tasks)} pending task{'s' if len(tasks)>1 else ''}: {items_str}."
            else:
                answer = "You don't have any pending tasks right now."

            return {
                "answer": answer,
                "route": "DATABASE",
                "action": "VIEW",
                "tasks": tasks
            }

    return {
        "answer": f"I received your request: {query}",
        "route": "UNKNOWN"
    }

# ----------------- FASTAPI APPLICATION -----------------

app = FastAPI(
    title="Memora API",
    description="AI-powered personal knowledge and action assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    user_id: Optional[str] = "default"

class TaskCreate(BaseModel):
    task: str
    date: Optional[str] = None
    action_type: Optional[str] = "task"
    user_id: Optional[str] = "default"

class MemoryCreate(BaseModel):
    text: str
    memory_type: Optional[str] = "preference"
    source: Optional[str] = "user"
    user_id: Optional[str] = "default"

@app.get("/")
def root():
    return {
        "message": "Memora API is running!",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "chroma_count": memory_collection.count(),
        "model": MODEL_NAME
    }

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    try:
        response = memora_chat(req.query.strip(), user_id=req.user_id or "default")
        return response
    except Exception as e:
        print(f"Error handling chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks")
def list_tasks(user_id: Optional[str] = "default", status: Optional[str] = "pending"):
    return get_tasks(user_id=user_id, status=status)

@app.post("/api/tasks")
def create_task_endpoint(req: TaskCreate):
    norm_date = normalize_date(req.date) if req.date else None
    task_id = save_task(
        task=req.task,
        date=norm_date,
        action_type=req.action_type or "task",
        user_id=req.user_id or "default"
    )
    return {
        "success": True,
        "task_id": task_id,
        "task": {
            "id": task_id,
            "task": req.task,
            "date": norm_date,
            "action_type": req.action_type or "task",
            "status": "pending",
            "user_id": req.user_id or "default"
        }
    }

@app.patch("/api/tasks/{task_id}/complete")
def complete_task_endpoint(task_id: int):
    success = complete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found or already completed.")
    return {"success": True, "task_id": task_id, "message": "Task marked as completed."}

@app.delete("/api/tasks/{task_id}")
def delete_task_endpoint(task_id: int):
    success = delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"success": True, "task_id": task_id, "message": "Task deleted."}

@app.get("/api/memories")
def list_memories(user_id: Optional[str] = "default"):
    return get_all_memories(user_id=user_id)

@app.post("/api/memories")
def add_memory_endpoint(req: MemoryCreate):
    mem_id = f"mem_{int(datetime.datetime.now().timestamp() * 1000)}"
    msg = save_memory(
        memory_id=mem_id,
        memory=req.text,
        memory_type=req.memory_type or "preference",
        source=req.source or "user",
        user_id=req.user_id or "default"
    )
    return {"success": True, "memory_id": mem_id, "message": msg}

@app.get("/api/documents")
def list_documents():
    # Return document knowledge info
    data = memory_collection.get(
        where={"type": "document_chunk"},
        include=["metadatas"]
    )
    doc_sources = {}
    for m in data.get("metadatas", []):
        src = m.get("source", "Unknown")
        doc_sources[src] = doc_sources.get(src, 0) + 1
    
    docs_list = [
        {"name": src, "chunk_count": count, "type": "pdf" if src.endswith(".pdf") else "doc"}
        for src, count in doc_sources.items()
    ]
    return {
        "documents": docs_list,
        "total_chunks": sum(doc_sources.values())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("memora_backend:app", host="127.0.0.1", port=8000, reload=True)
