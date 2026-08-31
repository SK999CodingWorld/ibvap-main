import os
import sys
import shutil
import dulwich.porcelain as porcelain
from dulwich.repo import Repo

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"[Git Python] Working in: {root_dir}")
    
    # 1. Initialize or load repository
    git_dir = os.path.join(root_dir, ".git")
    if not os.path.exists(git_dir):
        print("[Git Python] Initializing repository...")
        repo = Repo.init(root_dir)
    else:
        repo = Repo(root_dir)
        
    print("[Git Python] Staging all files...")
    # Add all files adhering to .gitignore
    porcelain.add(repo, ".")
    
    print("[Git Python] Creating commit...")
    try:
        commit_id = porcelain.commit(
            repo,
            message=b"IBVAP - Intelligent Border Video Analytics Platform SIH 2026 Complete Release",
            author=b"SK999CodingWorld <user@ibvap.local>",
            committer=b"SK999CodingWorld <user@ibvap.local>"
        )
        print(f"[Git Python] Committed successfully: {commit_id.decode('ascii') if isinstance(commit_id, bytes) else commit_id}")
    except Exception as e:
        print(f"[Git Python] Commit note: {e}")

    remote_url = "https://github.com/SK999CodingWorld/ibvap-123321.git"
    print(f"\n[Git Python] Repository is fully prepared and committed locally.")
    print(f"Target remote: {remote_url}")

if __name__ == "__main__":
    main()
