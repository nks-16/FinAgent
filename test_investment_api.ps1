# Test Investment Recommendations API

Write-Host "Testing Investment Recommendations API..." -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/api/recommendations/health" -Method Get
    Write-Host "✓ Health Check: $($health | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health Check Failed: $_" -ForegroundColor Red
}

# Test 2: Get Personalized Recommendations
Write-Host "`n2. Testing Personalized Recommendations..." -ForegroundColor Yellow
try {
    $body = @{
        age = 30
        monthlyIncome = 5000.0
        investmentExperience = "intermediate"
        timeHorizon = "medium"
    } | ConvertTo-Json

    $recommendations = Invoke-RestMethod -Uri "http://localhost:8080/api/recommendations/personalized" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✓ Recommendations Received:" -ForegroundColor Green
    Write-Host ($recommendations | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "✗ Recommendations Failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}

# Test 3: Get Risk Profile
Write-Host "`n3. Testing Risk Profile..." -ForegroundColor Yellow
try {
    $body = @{
        age = 30
        monthlyIncome = 5000.0
        investmentExperience = "intermediate"
        timeHorizon = "medium"
    } | ConvertTo-Json

    $riskProfile = Invoke-RestMethod -Uri "http://localhost:8080/api/recommendations/risk-profile" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✓ Risk Profile Received:" -ForegroundColor Green
    Write-Host ($riskProfile | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "✗ Risk Profile Failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host "`nAPI Testing Complete!" -ForegroundColor Cyan
