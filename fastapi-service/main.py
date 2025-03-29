import os
import json
import httpx
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging (minimal logging for green software practices)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        # Use file handler with rotation to minimize storage (green practice)
        logging.FileHandler("api.log", mode="a", encoding="utf-8"),
    ]
)
logger = logging.getLogger("fastapi-service")

# Initialize FastAPI app
app = FastAPI(
    title="Green E-commerce Recommendations and Chat API",
    description="API for eco-friendly product recommendations and sustainable shopping assistant",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama API URL (local)
OLLAMA_API_URL = os.environ.get("OLLAMA_API_URL", "http://localhost:11434/api")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama2")

# -----------------------------------------------------------------------------
# Pydantic Models
# -----------------------------------------------------------------------------

class Product(BaseModel):
    id: str
    name: str
    price: float
    description: Optional[str] = None
    category: str
    image: Optional[str] = None
    carbonFootprint: Optional[float] = 0
    sustainabilityScore: Optional[int] = 50
    recycledMaterials: Optional[bool] = False
    purchaseCount: Optional[int] = 0

class ProductList(BaseModel):
    products: List[Product]

class RecommendationRequest(BaseModel):
    userId: Optional[str] = None
    productId: Optional[str] = None
    category: Optional[str] = None
    sustainableOnly: Optional[bool] = False
    limit: Optional[int] = 5

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    userId: Optional[str] = None
    stream: Optional[bool] = False
    
class ChatResponse(BaseModel):
    response: str
    sustainabilityTips: Optional[List[str]] = None
    recommendedProducts: Optional[List[str]] = None

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------

async def call_ollama(prompt: str, system_prompt: str = None) -> str:
    """Call Ollama API with energy-efficient parameters (green practice)"""
    try:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_API_URL}/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    # Green practice: Use efficient parameters to reduce computation
                    "options": {
                        "temperature": 0.7,
                        "top_k": 40,
                        "top_p": 0.9,
                        "num_predict": 256,  # Limit token generation
                    }
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Ollama API error: {response.text}")
                return "Sorry, I'm having trouble processing your request right now."
            
            result = response.json()
            return result["message"]["content"]
    except Exception as e:
        logger.error(f"Error calling Ollama: {str(e)}")
        return "Sorry, I couldn't connect to the AI service. Please try again later."

# Mock product database (in production, would fetch from MongoDB)
SAMPLE_PRODUCTS = [
    {
        "id": "1",
        "name": "Eco-friendly Laptop",
        "price": 1200,
        "description": "Energy-efficient laptop made with recycled materials",
        "category": "Electronics",
        "image": "laptop.jpg",
        "carbonFootprint": 80,
        "sustainabilityScore": 85,
        "recycledMaterials": True,
        "purchaseCount": 24
    },
    {
        "id": "2",
        "name": "Organic Cotton T-Shirt",
        "price": 25,
        "description": "Sustainably sourced organic cotton t-shirt",
        "category": "Clothing",
        "image": "tshirt.jpg",
        "carbonFootprint": 5,
        "sustainabilityScore": 90,
        "recycledMaterials": False,
        "purchaseCount": 150
    },
    {
        "id": "3",
        "name": "Recycled Paper Notebook",
        "price": 12,
        "description": "100% recycled paper notebook",
        "category": "Office",
        "image": "notebook.jpg",
        "carbonFootprint": 2,
        "sustainabilityScore": 95,
        "recycledMaterials": True,
        "purchaseCount": 89
    },
    {
        "id": "4",
        "name": "Solar Power Bank",
        "price": 45,
        "description": "Portable power bank with solar charging capabilities",
        "category": "Electronics",
        "image": "powerbank.jpg",
        "carbonFootprint": 10,
        "sustainabilityScore": 80,
        "recycledMaterials": False,
        "purchaseCount": 67
    },
    {
        "id": "5",
        "name": "Bamboo Toothbrush",
        "price": 5,
        "description": "Biodegradable toothbrush with bamboo handle",
        "category": "Health",
        "image": "toothbrush.jpg",
        "carbonFootprint": 1,
        "sustainabilityScore": 98,
        "recycledMaterials": True,
        "purchaseCount": 215
    }
]

def get_products(category: str = None, sustainable_only: bool = False) -> List[Dict]:
    """Get filtered products (mock function)"""
    filtered = SAMPLE_PRODUCTS
    
    if category:
        filtered = [p for p in filtered if p["category"].lower() == category.lower()]
    
    if sustainable_only:
        filtered = [p for p in filtered if p["sustainabilityScore"] >= 70]
    
    return filtered

def get_product_by_id(product_id: str) -> Optional[Dict]:
    """Get product by ID (mock function)"""
    for product in SAMPLE_PRODUCTS:
        if product["id"] == product_id:
            return product
    return None

# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Green E-commerce Recommendations and Chat API is running",
        "version": "1.0.0"
    }

@app.post("/api/recommendations", response_model=ProductList)
async def get_recommendations(request: RecommendationRequest):
    """
    Get eco-friendly product recommendations based on user behavior or product
    """
    logger.info(f"Recommendation request: {request}")
    
    try:
        # Filter products based on request
        filtered_products = get_products(
            category=request.category,
            sustainable_only=request.sustainableOnly
        )
        
        # If specific product ID is provided, get similar products
        if request.productId:
            target_product = get_product_by_id(request.productId)
            if target_product:
                # Simple mock recommendation logic - same category products
                same_category = [
                    p for p in filtered_products 
                    if p["category"] == target_product["category"] and p["id"] != target_product["id"]
                ]
                
                # Sort by sustainability score (green practice: promote sustainable products)
                same_category.sort(key=lambda x: x["sustainabilityScore"], reverse=True)
                
                filtered_products = same_category
        
        # Sort by purchase count as a simple popularity metric
        filtered_products.sort(key=lambda x: x["purchaseCount"], reverse=True)
        
        # Limit results
        limited_products = filtered_products[:request.limit]
        
        # Log energy efficiency metrics (green practice: monitor resource usage)
        logger.info(f"Recommendation processing: filtered from {len(SAMPLE_PRODUCTS)} to {len(limited_products)} products")
        
        return {"products": limited_products}
    
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating recommendations")

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    """
    Chat with the sustainable shopping assistant powered by Ollama
    """
    # Construct the system prompt focused on sustainable shopping
    system_prompt = """
    You are an eco-friendly shopping assistant for a green e-commerce platform.
    Your role is to help users make sustainable purchasing decisions and understand the environmental impact of products.
    Provide specific, actionable advice about sustainable products and green living.
    Always mention carbon footprint considerations when relevant.
    Keep your responses concise but informative, as this saves computational resources (a green practice).
    """
    
    # Extract the user's message
    user_message = request.messages[-1].content if request.messages else ""
    
    try:
        # Call Ollama for the chat response
        ai_response = await call_ollama(user_message, system_prompt)
        
        # Extract potential sustainability tips (simple approach)
        sustainability_tips = []
        for line in ai_response.split('\n'):
            if any(keyword in line.lower() for keyword in ["sustainable", "eco", "green", "carbon", "footprint", "environment"]):
                if len(line) > 15 and line not in sustainability_tips:  # Avoid short fragments
                    sustainability_tips.append(line.strip())
        
        # Extract any product recommendations from the message (simplified approach)
        product_recommendations = []
        for product in SAMPLE_PRODUCTS:
            if product["name"].lower() in ai_response.lower():
                product_recommendations.append(product["id"])
        
        # Log minimal information (green practice: reduce log storage)
        logger.info(f"Chat request processed, response length: {len(ai_response)} chars")
        
        return {
            "response": ai_response,
            "sustainabilityTips": sustainability_tips[:3],  # Limit to top 3
            "recommendedProducts": product_recommendations[:2]  # Limit to top 2
        }
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing chat request")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    # Green practice: Minimal response to save bandwidth
    return {"status": "ok"}

# Start server
if __name__ == "__main__":
    import uvicorn
    
    # Green practice: Optimize server workers based on available cores
    # while avoiding excessive resource consumption
    workers = int(os.environ.get("API_WORKERS", "1"))
    
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        workers=workers,
        log_level="error"  # Green practice: Minimal logging
    )