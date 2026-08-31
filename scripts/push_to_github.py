import os
import sys
import dulwich.porcelain as porcelain
from dulwich.repo import Repo

def push_to_github():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir) if os.path.basename(script_dir) == "scripts" else script_dir
    repo = Repo(root_dir)
    
    remote_url = "https://github.com/SK999CodingWorld/ibvap-123321.git"
    print("=" * 65)
    print(f"  Pushing IBVAP Project to: {remote_url}")
    print("=" * 65)
    
    token = input("\nEnter your GitHub Personal Access Token (PAT) or press Enter for public push: ").strip()
    if token:
        auth_url = f"https://{token}@github.com/SK999CodingWorld/ibvap-123321.git"
    else:
        auth_url = remote_url

    try:
        print("\n[Uploading] Pushing branch 'main' to GitHub...")
        porcelain.push(repo, auth_url, "refs/heads/main:refs/heads/main", force=True)
        print("\n" + "=" * 65)
        print("  SUCCESSFULLY UPLOADED TO GITHUB!")
        print("  View Repository: https://github.com/SK999CodingWorld/ibvap-123321")
        print("=" * 65)
    except Exception as e:
        print(f"\n[Push Notice] {e}")
        print("\nTips:")
        print("1. If authentication failed, generate a classic token with 'repo' scope at:")
        print("   https://github.com/settings/tokens")
        print("2. Or upload directly via browser drag-and-drop at:")
        print("   https://github.com/SK999CodingWorld/ibvap-123321/upload")

if __name__ == "__main__":
    push_to_github()
