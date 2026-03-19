import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Get the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
# Set the database path relative to the script directory
db_path = os.path.abspath(os.path.join(script_dir, "chroma_db"))

# Set persistence directory via environment variables BEFORE importing app
os.environ["CHROMA_PERSIST_DIRECTORY"] = db_path
os.environ["IS_PERSISTENT"] = "TRUE"
os.environ["CHROMA_SERVER_CORS_ALLOW_ORIGINS"] = '["*"]'

# Import is checked at runtime by uvicorn, but we can verify it exists
try:
    from chromadb.app import app
except ImportError:
    print("Error: chromadb or its dependencies (fastapi, uvicorn) are not installed correctly.")
    print("Please run: pip install chromadb fastapi uvicorn opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation opentelemetry-instrumentation-fastapi")
    sys.exit(1)

@app.get("/")
async def root():
    """Health check endpoint to confirm Chroma is running and provide info."""
    try:
        import chromadb
        client = chromadb.PersistentClient(path=db_path)
        collections = client.list_collections()
        col_info = []
        for c in collections:
            col_info.append({"name": c.name, "count": c.count()})
            
        return JSONResponse({
            "status": "Chroma DB is running",
            "database_location": db_path,
            "collections_count": len(collections),
            "collections": col_info
        })
    except Exception as e:
        return JSONResponse({
            "status": "error",
            "message": str(e)
        }, status_code=500)

if __name__ == "__main__":
    print(f"🚀 Starting ChromaDB Server on port 8000")
    print(f"📁 Database location: {db_path}")
    
    try:
        # Check collections on startup using PersistentClient
        import chromadb
        client = chromadb.PersistentClient(path=db_path)
        collections = client.list_collections()
        print(f"📦 Found {len(collections)} collections: {[c.name for c in collections]}")
        
        # Using uvicorn directly is more robust than the CLI run function
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    except Exception as e:
        print(f"❌ Failed to start ChromaDB: {e}")
