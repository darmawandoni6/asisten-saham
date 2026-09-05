from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Holding, PriceHistory, get_cash_balance
from services.data_fetcher import fetch_and_store_stock_data, normalize_ticker
from services.technical import get_latest_indicators
from services.portfolio_engine import evaluate_holding_status
import pandas as pd

router = APIRouter(prefix="/api/v1", tags=["Stocks & Dashboard"])

@router.get("/dashboard")
def get_dashboard_data(db: Session = Depends(get_db)):
    holdings = db.query(Holding).all()
    cash_balance = get_cash_balance(db)
    
    if not holdings:
        return {
            "summary": {
                "totalEquity": 0,
                "totalCost": 0,
                "floatingPnl": 0,
                "floatingPnlPct": 0.0,
                "cashBalance": round(cash_balance),
                "totalPortfolioEquity": round(cash_balance),
                "totalLots": 0,
                "actionCounts": {"sellCutLoss": 0, "takeProfit": 0, "holdMonitor": 0, "trailingStopWarning": 0, "recoveryMode": 0}
            },
            "holdings": []
        }

    evaluated_cards = []
    total_equity = 0
    total_cost = 0
    total_lots = 0
    counts = {"sellCutLoss": 0, "takeProfit": 0, "holdMonitor": 0, "trailingStopWarning": 0, "recoveryMode": 0, "averagingReview": 0}

    for h in holdings:
        # Get latest price history
        latest = db.query(PriceHistory).filter(PriceHistory.ticker == h.ticker).order_by(PriceHistory.date.desc()).first()
        
        candle = {
            "close": latest.close if latest else h.avg_price,
            "open": latest.open if latest else h.avg_price,
            "ma20": latest.ma20 if latest else h.avg_price,
            "ma50": latest.ma50 if latest else h.avg_price,
            "rsi": latest.rsi if latest else 50.0
        }
        
        card = evaluate_holding_status(h, candle, db)
        evaluated_cards.append(card)

        # Totals
        cost = card["avgPrice"] * card["shares"]
        equity = card["currentPrice"] * card["shares"]
        total_cost += cost
        total_equity += equity
        total_lots += card["lot"]

        st = card["actionStatus"]
        if st == "SELL_CUT_LOSS": counts["sellCutLoss"] += 1
        elif st == "TAKE_PROFIT": counts["takeProfit"] += 1
        elif st == "TRAILING_STOP_WARNING": counts["trailingStopWarning"] += 1
        elif st == "RECOVERY_MODE": counts["recoveryMode"] += 1
        elif st == "AVERAGING_REVIEW": counts["averagingReview"] += 1
        else: counts["holdMonitor"] += 1


    floating_pnl = total_equity - total_cost
    floating_pnl_pct = (floating_pnl / total_cost * 100) if total_cost > 0 else 0
    total_portfolio_equity = total_equity + cash_balance

    return {
        "summary": {
            "totalEquity": round(total_equity),
            "totalCost": round(total_cost),
            "floatingPnl": round(floating_pnl),
            "floatingPnlPct": round(floating_pnl_pct, 2),
            "cashBalance": round(cash_balance),
            "totalPortfolioEquity": round(total_portfolio_equity),
            "totalLots": total_lots,
            "actionCounts": counts
        },
        "holdings": evaluated_cards
    }


@router.get("/stocks/{ticker}/chart")
def get_stock_chart(ticker: str, db: Session = Depends(get_db)):
    ticker = normalize_ticker(ticker)
    records = db.query(PriceHistory).filter(PriceHistory.ticker == ticker).order_by(PriceHistory.date.asc()).all()

    # If DB is empty for this stock, fetch from yfinance
    if not records:
        fetch_and_store_stock_data(ticker, db, period="6mo")
        records = db.query(PriceHistory).filter(PriceHistory.ticker == ticker).order_by(PriceHistory.date.asc()).all()

    candles = [{
        "time": str(r.date),
        "open": r.open,
        "high": r.high,
        "low": r.low,
        "close": r.close,
        "volume": r.volume,
        "ma20": r.ma20,
        "ma50": r.ma50,
        "rsi": r.rsi
    } for r in records]

    return {"ticker": ticker, "candles": candles}

@router.post("/stocks/fetch/{ticker}")
def manual_fetch(ticker: str, db: Session = Depends(get_db)):
    ticker = normalize_ticker(ticker)
    df = fetch_and_store_stock_data(ticker, db, period="6mo")
    return {"status": "success", "ticker": ticker, "rows_fetched": len(df)}

@router.post("/stocks/fetch-all")
def fetch_all(db: Session = Depends(get_db)):
    holdings = db.query(Holding).all()
    results = {}
    for h in holdings:
        df = fetch_and_store_stock_data(h.ticker, db, period="6mo")
        results[h.ticker] = len(df)
    return {"status": "success", "fetched": results}
