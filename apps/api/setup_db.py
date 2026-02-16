#!/usr/bin/env python3
"""
Database setup script - checks if database exists and creates it if needed.
Run this before starting the application.
"""

import os
import sys
from dotenv import load_dotenv
import psycopg
from psycopg import sql

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/icalorie"
)


def parse_database_url(url: str) -> dict:
    """Parse database URL into components."""
    # Remove the driver prefix if present
    if "postgresql+psycopg://" in url:
        url = url.replace("postgresql+psycopg://", "postgresql://")
    elif "postgresql://" not in url:
        url = f"postgresql://{url}"

    # Simple parsing (you could use urllib.parse for more robust parsing)
    # Format: postgresql://user:password@host:port/database
    url = url.replace("postgresql://", "")

    if "@" in url:
        auth, rest = url.split("@", 1)
        if ":" in auth:
            user, password = auth.split(":", 1)
        else:
            user, password = auth, ""
    else:
        user, password = "postgres", "postgres"
        rest = url

    if "/" in rest:
        host_port, database = rest.split("/", 1)
    else:
        host_port, database = rest, "icalorie"

    if ":" in host_port:
        host, port = host_port.split(":", 1)
    else:
        host, port = host_port, "5432"

    return {
        "user": user,
        "password": password,
        "host": host,
        "port": int(port),
        "database": database,
    }


def database_exists(conn, db_name: str) -> bool:
    """Check if database exists."""
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        return cur.fetchone() is not None


def create_database(db_config: dict):
    """Create database if it doesn't exist."""
    db_name = db_config["database"]

    # Connect to default 'postgres' database to check/create our database
    conn_params = {
        "user": db_config["user"],
        "password": db_config["password"],
        "host": db_config["host"],
        "port": db_config["port"],
        "dbname": "postgres",  # Connect to default database
    }

    try:
        with psycopg.connect(**conn_params, autocommit=True) as conn:
            if database_exists(conn, db_name):
                print(f"✅ Database '{db_name}' already exists")
                return True

            print(f"📦 Creating database '{db_name}'...")
            with conn.cursor() as cur:
                cur.execute(
                    sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name))
                )
            print(f"✅ Database '{db_name}' created successfully")
            return True

    except psycopg.OperationalError as e:
        print(f"❌ Error connecting to PostgreSQL: {e}")
        print("\nMake sure PostgreSQL is running:")
        print("  brew services start postgresql")
        return False
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False


def main():
    print("=" * 60)
    print("iCalorie Database Setup")
    print("=" * 60)

    db_config = parse_database_url(DATABASE_URL)
    print(f"Database: {db_config['database']}")
    print(f"Host: {db_config['host']}:{db_config['port']}")
    print(f"User: {db_config['user']}")
    print()

    if create_database(db_config):
        print("\n✅ Database setup complete!")
        print("\nNext steps:")
        print("  1. Run migrations: alembic upgrade head")
        print("  2. Start the API: uvicorn app.main:app --reload")
        return 0
    else:
        print("\n❌ Database setup failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
