import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from django.db import connection

# Check the actual database schema
with connection.cursor() as cursor:
    cursor.execute("DESCRIBE core_visitlog")
    columns = cursor.fetchall()
    print("=== core_visitlog table columns ===")
    for column in columns:
        print(f"Column: {column[0]}, Type: {column[1]}, Null: {column[2]}, Key: {column[3]}, Default: {column[4]}, Extra: {column[5]}")

# Also check the VisitLog model fields
from core.models import VisitLog
print("\n=== VisitLog model fields ===")
for field in VisitLog._meta.fields:
    print(f"Field: {field.name}, Type: {field.__class__.__name__}") 