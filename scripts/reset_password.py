#!/usr/bin/env python3
"""CLI utility to reset the TiTaN admin password and clear all login lockouts.

Usage:
    python3 scripts/reset_password.py [new_password] [username]

Examples:
    python3 scripts/reset_password.py
    python3 scripts/reset_password.py MyNewPass
    python3 scripts/reset_password.py MyNewPass custom_admin
"""
import os
import sys

# Ensure repository root is in python path
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if REPO not in sys.path:
    sys.path.insert(0, REPO)

from app import db, security, config


def main():
    new_password = sys.argv[1] if len(sys.argv) > 1 else "TiTaN"
    new_username = sys.argv[2] if len(sys.argv) > 2 else None

    print("=" * 55)
    print(" TiTaN Admin Password Reset Tool")
    print("=" * 55)

    admin = db.get_admin()
    if admin:
        username = new_username or admin["username"]
        print(f"Existing admin account found: '{admin['username']}'")
    else:
        username = new_username or os.environ.get("TITAN_ADMIN_USER", "TiTaN")
        print(f"No admin account found. Creating new admin: '{username}'")

    hp = security.hash_password(new_password)
    db.set_admin(username, hp["hash"], hp["salt"])
    db.set_meta("auth_is_default", "1" if new_password == "TiTaN" else "0")

    # Clear all login brute-force lockouts from database
    with db._lock:
        c = db._connect()
        c.execute("DELETE FROM meta WHERE key LIKE 'login_attempts:%'")
        c.commit()

    print()
    print(" [OK] Password reset successfully!")
    print(f"   -> Username : {username}")
    print(f"   -> Password : {new_password}")
    print("   -> All login attempts and IP lockouts cleared.")
    print("=" * 55)
    print(" You can now log into your TiTaN panel.")
    print("=" * 55)


if __name__ == "__main__":
    main()
