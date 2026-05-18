# Stop admin backend by killing process on port 4000.
$processes = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($processId in $processes) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Write-Output "Admin backend stopped."
} else {
    Write-Output "Admin backend is not running."
}
