$ErrorActionPreference = "Stop"

$vswhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"

if (-not (Test-Path $vswhere)) {
	throw "vswhere.exe was not found. Install Visual Studio Build Tools with the C++ workload."
}

$vsPath = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath

if (-not $vsPath) {
	throw "Visual Studio C++ Build Tools were not found."
}

$vsDevCmd = Join-Path $vsPath "Common7\Tools\VsDevCmd.bat"
$cargoBin = Join-Path $env:USERPROFILE ".cargo\bin"
$env:Path = "$cargoBin;$env:Path"

$buildCommand = "call `"$vsDevCmd`" -arch=x64 -host_arch=x64 && corepack pnpm tauri build && corepack pnpm exec tsx scripts/copyExe.ts"
cmd.exe /d /s /c $buildCommand

if ($LASTEXITCODE -ne 0) {
	exit $LASTEXITCODE
}
