# ======================================================================
#   IBVAP - Intelligent Border Video Analytics Platform (SIH 2026)
#   Automated GitHub Upload & Sync PowerShell Script
# ======================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   IBVAP - Automated GitHub Upload Script" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

# Verify git presence
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    Write-Host "`n[ERROR] Git was not detected on your system PATH." -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Or use GitHub Desktop: https://desktop.github.com/" -ForegroundColor Yellow
    Exit
}

# 1. Initialize if needed
if (-not (Test-Path ".git")) {
    Write-Host "`n[1/4] Initializing new Git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# 2. Add files
Write-Host "`n[2/4] Staging files for commit..." -ForegroundColor Yellow
git add .

# 3. Commit
Write-Host "`n[3/4] Creating commit..." -ForegroundColor Yellow
git commit -m "IBVAP - Complete AI Video Analytics Platform (ANPR, Face Re-ID, Behavioral Rules, Heatmap & Forensic Vault)"

# 4. Prompt for URL
Write-Host ""
$repoUrl = Read-Host "Enter your GitHub Repository URL (e.g. https://github.com/username/ibvap.git)"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "`n[INFO] Changes committed locally. To push to GitHub later, run:" -ForegroundColor Cyan
    Write-Host "  git remote add origin <YOUR_GITHUB_REPO_URL>"
    Write-Host "  git push -u origin main"
    Exit
}

Write-Host "`n[4/4] Pushing to GitHub repository ($repoUrl)..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin $repoUrl
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n======================================================================" -ForegroundColor Green
    Write-Host "   SUCCESSFULLY PUSHED TO GITHUB!" -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Green
} else {
    Write-Host "`n[NOTE] If authentication is required, sign in via browser when prompted or check repo permissions." -ForegroundColor Yellow
}
