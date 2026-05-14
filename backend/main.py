from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

app = FastAPI(title="ServiceDesk Lite API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

tickets_db: dict = {}
counter = [6]

def next_id():
    val = counter[0]
    counter[0] += 1
    return f"INC{val:04d}"

SEED = [
    {"id": "INC0001", "title": "VPN not connecting", "category": "IT Support", "priority": "High", "status": "In Progress", "assignee": "Alice M.", "created": "2025-05-10", "desc": "Unable to connect to VPN from home network since yesterday."},
    {"id": "INC0002", "title": "Request new laptop", "category": "IT Support", "priority": "Medium", "status": "Open", "assignee": "Unassigned", "created": "2025-05-11", "desc": "Current laptop is 5 years old and running slow."},
    {"id": "INC0003", "title": "AC not working in Room 204", "category": "Facilities", "priority": "Critical", "status": "Open", "assignee": "Bob T.", "created": "2025-05-12", "desc": "Air conditioning unit is completely offline. Room temp over 85F."},
    {"id": "INC0004", "title": "Payroll discrepancy for April", "category": "Finance", "priority": "High", "status": "Pending", "assignee": "Carol P.", "created": "2025-05-09", "desc": "Overtime hours not reflected in April paycheck."},
    {"id": "INC0005", "title": "Phishing email report", "category": "Security", "priority": "Critical", "status": "Resolved", "assignee": "Dana K.", "created": "2025-05-08", "desc": "Received suspicious email asking for credentials."},
]
for t in SEED:
    tickets_db[t["id"]] = t

VALID_PRIORITIES = {"Low", "Medium", "High", "Critical"}
VALID_STATUSES   = {"Open", "In Progress", "Pending", "Resolved", "Closed"}
VALID_CATEGORIES = {"IT Support", "HR", "Facilities", "Finance", "Security"}

class TicketCreate(BaseModel):
    title: str
    category: str
    priority: str
    desc: str
    assignee: Optional[str] = "Unassigned"

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assignee: Optional[str] = None
    desc: Optional[str] = None

@app.get("/")
def root():
    return {"message": "ServiceDesk Lite API", "docs": "/docs"}

@app.get("/tickets", response_model=List[dict])
def list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    result = list(tickets_db.values())
    if status:
        result = [t for t in result if t["status"] == status]
    if priority:
        result = [t for t in result if t["priority"] == priority]
    if category:
        result = [t for t in result if t["category"] == category]
    if search:
        q = search.lower()
        result = [t for t in result if q in t["title"].lower() or q in t["id"].lower()]
    return sorted(result, key=lambda t: t["created"], reverse=True)

@app.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str):
    t = tickets_db.get(ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return t

@app.post("/tickets", status_code=201)
def create_ticket(body: TicketCreate):
    if body.priority not in VALID_PRIORITIES:
        raise HTTPException(400, f"Invalid priority.")
    if body.category not in VALID_CATEGORIES:
        raise HTTPException(400, f"Invalid category.")
    tid = next_id()
    ticket = {
        "id": tid,
        "title": body.title.strip(),
        "category": body.category,
        "priority": body.priority,
        "status": "Open",
        "assignee": body.assignee,
        "created": str(date.today()),
        "desc": body.desc.strip(),
    }
    tickets_db[tid] = ticket
    return ticket

@app.patch("/tickets/{ticket_id}")
def update_ticket(ticket_id: str, body: TicketUpdate):
    t = tickets_db.get(ticket_id)
    if not t:
        raise HTTPException(404, "Ticket not found")
    updates = body.model_dump(exclude_none=True)
    if "status" in updates and updates["status"] not in VALID_STATUSES:
        raise HTTPException(400, "Invalid status.")
    if "priority" in updates and updates["priority"] not in VALID_PRIORITIES:
        raise HTTPException(400, "Invalid priority.")
    t.update(updates)
    return t

@app.delete("/tickets/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: str):
    if ticket_id not in tickets_db:
        raise HTTPException(404, "Ticket not found")
    del tickets_db[ticket_id]

@app.get("/stats")
def stats():
    all_t = list(tickets_db.values())
    by_status   = {s: sum(1 for t in all_t if t["status"]   == s) for s in VALID_STATUSES}
    by_priority = {p: sum(1 for t in all_t if t["priority"] == p) for p in VALID_PRIORITIES}
    by_category = {c: sum(1 for t in all_t if t["category"] == c) for c in VALID_CATEGORIES}
    return {"total": len(all_t), "by_status": by_status, "by_priority": by_priority, "by_category": by_category}