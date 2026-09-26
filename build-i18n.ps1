$enc = [System.Text.Encoding]::UTF8
$ru = [System.IO.File]::ReadAllText("$PSScriptRoot\i18n\ru.json", $enc) | ConvertFrom-Json
$en = [System.IO.File]::ReadAllText("$PSScriptRoot\i18n\en.json", $enc) | ConvertFrom-Json
$js = "window.I18N = window.I18N || {};" + [char]13 + [char]10 +
      "window.I18N.ru = " + ($ru | ConvertTo-Json -Depth 10) + ";" + [char]13 + [char]10 +
      "window.I18N.en = " + ($en | ConvertTo-Json -Depth 10) + ";"
[System.IO.File]::WriteAllText("$PSScriptRoot\i18n\i18n.js", $js, (New-Object System.Text.UTF8Encoding $false))
Write-Host "i18n.js rebuilt"