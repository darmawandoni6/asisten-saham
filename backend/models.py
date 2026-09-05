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

class RecoveryChatLog(Base):
    __tablename__ = "recovery_chat_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticker = Column(String, nullable=False, index=True)
    scenario_id = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False) # 'user' or 'assistant'
    message = Column(Text, nullable=False)
    source = Column(String, nullable=True) # 'gemini' or 'rule_based'
    session_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserSetting(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

def get_cash_balance(db) -> float:
    """Retrieve the cash balance (RDN) from user_settings, default to 168755.0 if not set."""
    try:
        setting = db.query(UserSetting).filter(UserSetting.key == "cash_balance").first()
        if setting and setting.value:
            return float(setting.value)
    except Exception:
        pass
    return 168755.0

def set_cash_balance(db, amount: float) -> float:
    """Save or update the cash balance in user_settings."""
    setting = db.query(UserSetting).filter(UserSetting.key == "cash_balance").first()
    if setting:
        setting.value = str(round(float(amount)))
    else:
        setting = UserSetting(key="cash_balance", value=str(round(float(amount))))
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return float(setting.value)
