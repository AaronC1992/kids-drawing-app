param(
  [string]$ManifestPath = "../manifest.json",
  [string]$Part = "patch"
)

if(!(Test-Path $ManifestPath)){ Write-Error "Manifest not found at $ManifestPath"; exit 1 }

$json = Get-Content $ManifestPath -Raw | ConvertFrom-Json
if(-not $json.version){ $json | Add-Member -NotePropertyName version -NotePropertyValue "1.0.0" }

$parts = $json.version.Split('.')
if($parts.Length -ne 3){ $parts = @(1,0,0) }
switch($Part){
  'major' { $parts[0] = [int]$parts[0] + 1; $parts[1]=0; $parts[2]=0 }
  'minor' { $parts[1] = [int]$parts[1] + 1; $parts[2]=0 }
  default { $parts[2] = [int]$parts[2] + 1 }
}
$newVersion = ($parts -join '.')
$json.version = $newVersion
$json | ConvertTo-Json -Depth 10 | Set-Content $ManifestPath
Write-Host "Updated manifest version to $newVersion"
