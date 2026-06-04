param([string]$BaseUrl = "http://localhost:5050")

$ErrorActionPreference = "Stop"

function Assert-Status([string]$Name, [string]$Url) {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -ne 200) {
        throw "$Name failed with HTTP $($response.StatusCode)"
    }
    Write-Host "[OK] $Name"
}

Assert-Status "API service catalog" "$BaseUrl/api/dichvu"
Assert-Status "Swagger document" "$BaseUrl/swagger/v1/swagger.json"
Write-Host "PetHealth smoke test completed."
