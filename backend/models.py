from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, UniqueConstraint
from sqlalchemy.sql import func
from database import Base

class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticker = Column(String, nullable=False, index=True)
    avg_price = Column(Float, nullable=False)
    lot = Column(Integer, nullable=False)
    target_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    buy_reason = Column(Text, nullable=True)
    sector = Column(String, nullable=True)
    trailing_stop_pct = Column(Float, default=7.0)
    high_watermark = Column(Float, nullable=True)
    jenis = Column(String, default='trading', nullable=False)  # 'trading' atau 'investasi'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticker = Column(String, nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)
    ma20 = Column(Float, nullable=True)
    ma50 = Column(Float, nullable=True)
    ma200 = Column(Float, nullable=True)
    rsi = Column(Float, nullable=True)
    support = Column(Float, nullable=True)
    resistance = Column(Float, nullable=True)

    __table_args__ = (UniqueConstraint('ticker', 'date', name='uix_ticker_date'),)

class TradeLog(Base):
    __tablename__ = "trade_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticker = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)  # BUY, SELL, TRIM, CUT_LOSS, AVG_DOWN
    price = Column(Float, nullable=False)
    lot = Column(Integer, nullable=False)
    realized_pnl = Column(Float, nullable=True)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticker = Column(String, nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    recommendation = Column(String, nullable=False) # HOLD, SELL, BUY, CUT_LOSS, TRIM, AVG_DOWN
    analysis_text = Column(Text, nullable=False)
    raw_data_snapshot = Column(Text, nullable=True) # JSON representation
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint('ticker', 'date', name='uix_analysis_ticker_date'),)

class ScreenerResult(Base):
    __tablename__ = "screener_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    ticker = Column(String, nullable=False, index=True)
    strategy = Column(String, nullable=False) # oversold, breakout, value, custom
    score = Column(Float, nullable=True)
    details = Column(Text, nullable=True) # JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())
