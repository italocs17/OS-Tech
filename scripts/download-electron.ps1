$url = "https://github.com/electron/electron/releases/download/v41.7.1/electron-v41.7.1-win32-x64.zip"
$out = "C:\Users\Italo\Documents\Projetos IA\OS.Tech\electron\electron.zip"

Write-Host "Downloading Electron v41.7.1 for Windows x64..."
Write-Host "URL: $url"
Write-Host "Output: $out"

try {
    $wc = New-Object System.Net.WebClient
    $wc.DownloadFile($url, $out)
    Write-Host "Download complete!"
    Write-Host "File size: $((Get-Item $out).Length) bytes"
} catch {
    Write-Host "Error: $_"
    exit 1
}
