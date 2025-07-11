#!/usr/bin/env python3
"""
Database Backup Script for GatePassPro
Run this before deployment to backup your production data
"""

import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path

def backup_database():
    """Create a backup of the database"""
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Get database configuration
    db_name = os.getenv('DB_NAME', 'gatepasspro_db')
    db_user = os.getenv('DB_USER', 'root')
    db_password = os.getenv('DB_PASSWORD', '')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '3306')
    
    # Create backup directory
    backup_dir = Path('backups')
    backup_dir.mkdir(exist_ok=True)
    
    # Generate backup filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"gatepasspro_backup_{timestamp}.sql"
    backup_path = backup_dir / backup_filename
    
    # Build mysqldump command
    if db_password:
        cmd = [
            'mysqldump',
            f'--host={db_host}',
            f'--port={db_port}',
            f'--user={db_user}',
            f'--password={db_password}',
            '--single-transaction',
            '--routines',
            '--triggers',
            db_name
        ]
    else:
        cmd = [
            'mysqldump',
            f'--host={db_host}',
            f'--port={db_port}',
            f'--user={db_user}',
            '--single-transaction',
            '--routines',
            '--triggers',
            db_name
        ]
    
    try:
        print(f"Creating backup: {backup_path}")
        
        # Run mysqldump
        with open(backup_path, 'w') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
        
        if result.returncode == 0:
            print(f"✅ Backup created successfully: {backup_path}")
            print(f"📊 Backup size: {backup_path.stat().st_size / 1024:.2f} KB")
            
            # Create a compressed version
            import gzip
            compressed_path = backup_path.with_suffix('.sql.gz')
            with open(backup_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    f_out.writelines(f_in)
            
            print(f"🗜️  Compressed backup: {compressed_path}")
            print(f"📊 Compressed size: {compressed_path.stat().st_size / 1024:.2f} KB")
            
            # Clean up uncompressed file
            backup_path.unlink()
            print(f"🧹 Removed uncompressed backup file")
            
            return compressed_path
            
        else:
            print(f"❌ Backup failed: {result.stderr}")
            return None
            
    except FileNotFoundError:
        print("❌ mysqldump not found. Please install MySQL client tools.")
        return None
    except Exception as e:
        print(f"❌ Backup failed with error: {e}")
        return None

def restore_database(backup_path):
    """Restore database from backup"""
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Get database configuration
    db_name = os.getenv('DB_NAME', 'gatepasspro_db')
    db_user = os.getenv('DB_USER', 'root')
    db_password = os.getenv('DB_PASSWORD', '')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '3306')
    
    if not Path(backup_path).exists():
        print(f"❌ Backup file not found: {backup_path}")
        return False
    
    # Build mysql command
    if db_password:
        cmd = [
            'mysql',
            f'--host={db_host}',
            f'--port={db_port}',
            f'--user={db_user}',
            f'--password={db_password}',
            db_name
        ]
    else:
        cmd = [
            'mysql',
            f'--host={db_host}',
            f'--port={db_port}',
            f'--user={db_user}',
            db_name
        ]
    
    try:
        print(f"Restoring from backup: {backup_path}")
        
        # Handle compressed files
        if backup_path.endswith('.gz'):
            import gzip
            with gzip.open(backup_path, 'rt') as f:
                result = subprocess.run(cmd, stdin=f, stderr=subprocess.PIPE, text=True)
        else:
            with open(backup_path, 'r') as f:
                result = subprocess.run(cmd, stdin=f, stderr=subprocess.PIPE, text=True)
        
        if result.returncode == 0:
            print("✅ Database restored successfully")
            return True
        else:
            print(f"❌ Restore failed: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ mysql not found. Please install MySQL client tools.")
        return False
    except Exception as e:
        print(f"❌ Restore failed with error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "restore":
        if len(sys.argv) > 2:
            restore_database(sys.argv[2])
        else:
            print("Usage: python backup_database.py restore <backup_file>")
    else:
        backup_database() 