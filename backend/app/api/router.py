from fastapi import APIRouter
from app.api import auth, datasets, dashboard, analytics, ml, bill, recommendations, settings

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(datasets.router)
api_router.include_router(dashboard.router)
api_router.include_router(analytics.router)
api_router.include_router(ml.router)
api_router.include_router(bill.router)
api_router.include_router(recommendations.router)
api_router.include_router(settings.router)

