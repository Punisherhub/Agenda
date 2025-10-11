from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT unnest(enum_range(NULL::statusagendamento))::text"))
    values = [row[0] for row in result]
    print("Valores aceitos no ENUM statusagendamento:")
    for v in values:
        print(f"  - {v}")
