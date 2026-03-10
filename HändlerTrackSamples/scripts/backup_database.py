import os
import shutil
import zipfile
from datetime import datetime
from pathlib import Path

def backup_database():
    print("Starting database backup...")
    
    # Get current timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)
    
    # Define backup paths
    backup_path = backup_dir / f"backup_{timestamp}.zip"
    
    # Create backup
    with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add database files (assuming MySQL data directory)
        # Note: This is a simplified example, actual MySQL backup requires mysqldump
        # For demonstration, we'll backup the project directory
        for root, dirs, files in os.walk('.'):
            for file in files:
                if file.endswith(('.py', '.sql', '.json', '.txt', '.md')):
                    file_path = Path(root) / file
                    zipf.write(file_path, arcname=file_path.relative_to('.'))
    
    print(f"Backup completed: {backup_path}")
    
    # Keep only last 7 backups
    keep_last = 7
    backups = sorted(backup_dir.glob("backup_*.zip"))
    if len(backups) > keep_last:
        for old_backup in backups[:-keep_last]:
            old_backup.unlink()
    print("Backup cleanup completed.")

def schedule_backup():
    print("Scheduling automatic backups...")
    # This would be set up using Windows Task Scheduler
    # For now, we'll just run it once
    backup_database()

if __name__ == "__main__":
    schedule_backup()