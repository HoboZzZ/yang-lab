$ErrorActionPreference = 'Stop'
$localHugo = Join-Path $PSScriptRoot '../../work/tools/hugo/hugo.exe'
$installedHugo = Get-Command hugo -ErrorAction SilentlyContinue
if ($installedHugo) {
    $hugoExecutable = $installedHugo.Source
} elseif (Test-Path -LiteralPath $localHugo) {
    $hugoExecutable = (Resolve-Path -LiteralPath $localHugo).Path
} else {
    throw 'Install Hugo Extended 0.160.0 or newer, then run this script again. See README.md.'
}
Write-Host 'Live preview: http://localhost:1313/ — press Ctrl+C to stop.'
& $hugoExecutable server --buildDrafts --source $PSScriptRoot --bind 127.0.0.1 --port 1313 --baseURL 'http://localhost:1313/' --disableFastRender
