$outputFile = "C:\Users\Italo\Documents\Projetos IA\OS.Tech\release\package-info.txt"
$dir = "C:\Users\Italo\Documents\Projetos IA\OS.Tech\release\OS.Tech-win32-x64"

$files = Get-ChildItem $dir -Recurse -File
$totalSize = ($files | Measure-Object -Property Length -Sum).Sum
$fileCount = $files.Count

$output = @"
=== OS.Tech Package Info ===
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Total files: $fileCount
Total size: $([math]::Round($totalSize / 1MB, 2)) MB

=== Files ===
"@

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace($dir, "").TrimStart("\")
    $sizeMB = [math]::Round($file.Length / 1MB, 2)
    $output += "`n  $relativePath ($sizeMB MB)"
}

$output | Out-File -FilePath $outputFile -Encoding UTF8
Write-Host "Package info saved to $outputFile"
