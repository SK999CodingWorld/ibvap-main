import os
import shutil
import dulwich.porcelain as porcelain
from dulwich.repo import Repo

def clean_and_commit():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    git_dir = os.path.join(root_dir, ".git")
    
    # 1. Reset .git for a fresh, clean, lightweight commit
    if os.path.exists(git_dir):
        try:
            shutil.rmtree(git_dir)
            print("[Clean Git] Reset existing .git folder.")
        except Exception as e:
            print(f"[Clean Git] Notice resetting .git: {e}")
            
    print("[Clean Git] Initializing fresh repository...")
    repo = Repo.init(root_dir)
    
    # 2. Add files respecting the strict .gitignore
    print("[Clean Git] Staging clean source files...")
    porcelain.add(repo, ".")
    
    # 3. Create initial clean commit
    commit_id = porcelain.commit(
        repo,
        message=b"IBVAP - Intelligent Border Video Analytics Platform (SIH 2026 Production Source Release)",
        author=b"SK999CodingWorld <user@ibvap.local>",
        committer=b"SK999CodingWorld <user@ibvap.local>"
    )
    
    # Calculate .git size
    git_size_bytes = sum(
        os.path.getsize(os.path.join(dirpath, filename))
        for dirpath, _, filenames in os.walk(git_dir)
        for filename in filenames
    )
    git_size_mb = git_size_bytes / (1024 * 1024)
    
    print("\n" + "=" * 65)
    print("  REPOSITORY CLEANED & COMMITTED SUCCESSFULLY!")
    print(f"  Commit ID: {commit_id.decode('ascii') if isinstance(commit_id, bytes) else commit_id}")
    print(f"  Total Clean Git Repository Size: {git_size_mb:.2f} MB")
    print("=" * 65)

if __name__ == "__main__":
    clean_and_commit()
