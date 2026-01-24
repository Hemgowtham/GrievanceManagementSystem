import os
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def reset_database():
    print("Wiping Neon Database...")
    with connection.cursor() as cursor:
        # This is a PostgreSQL specific command to drop everything
        cursor.execute("DROP SCHEMA public CASCADE;")
        cursor.execute("CREATE SCHEMA public;")
    print("Database wiped clean!")

if __name__ == "__main__":
    reset_database()