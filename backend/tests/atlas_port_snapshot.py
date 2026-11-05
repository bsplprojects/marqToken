# READ-ONLY Atlas snapshot of port accrual state (for cron idempotency check)
import os
from pymongo import MongoClient
db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])["merqon_database"]
s = db.settings.find_one({"_id": "global"}) or {}
print("port_last_accrual", s.get("port_last_accrual"))
print("daily_tx", db.transactions.count_documents({"type": "port_daily_earnings"}),
      "level_tx", db.transactions.count_documents({"type": "port_level_income"}))
for p in db.port_purchases.find({"status": "confirmed"}, {"accrued_days": 1, "accrual_start": 1, "earned_usd": 1, "principal_status": 1, "amount_usd": 1}):
    print(" ", p)
print("cron_runs", db.cron_runs.count_documents({}))
