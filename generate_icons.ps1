Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

function Generate-Icon([int]$size, [string]$filename) {
    $path = Join-Path $iconsDir $filename
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Fundo circular vermelho
    $brushBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(239, 68, 68))
    $g.FillEllipse($brushBg, 1, 1, $size - 2, $size - 2)

    # Triangulo Play centralizado
    $brushPlay = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $cx = [float]($size / 2.0)
    $cy = [float]($size / 2.0)
    $r = [float]($size * 0.28)

    $p1 = New-Object System.Drawing.PointF(($cx - $r * 0.6), ($cy - $r * 0.9))
    $p2 = New-Object System.Drawing.PointF(($cx + $r * 1.0), $cy)
    $p3 = New-Object System.Drawing.PointF(($cx - $r * 0.6), ($cy + $r * 0.9))

    $g.FillPolygon($brushPlay, [System.Drawing.PointF[]]@($p1, $p2, $p3))

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Criado $path"
}

Generate-Icon 16 "icon16.png"
Generate-Icon 48 "icon48.png"
Generate-Icon 128 "icon128.png"
Write-Host "Ícones gerados com sucesso!"
