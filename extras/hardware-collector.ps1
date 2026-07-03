try {
    if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
        Exit
    }

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$form = New-Object System.Windows.Forms.Form
$form.Text = "OS.Tech - Coletor de Hardware"
$form.Size = New-Object System.Drawing.Size(720, 600)
$form.StartPosition = "CenterScreen"
$form.MinimumSize = New-Object System.Drawing.Size(600, 450)
$form.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Get-Process -Id $pid).MainModule.FileName)

$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "OS.Tech - Coletor de Hardware"
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$titleLabel.Size = New-Object System.Drawing.Size(680, 30)
$titleLabel.Location = New-Object System.Drawing.Point(20, 15)
$titleLabel.ForeColor = [System.Drawing.Color]::FromArgb(30, 58, 138)

$subtitleLabel = New-Object System.Windows.Forms.Label
$subtitleLabel.Text = "Preencha a etiqueta do equipamento e clique em Identificar Hardware"
$subtitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$subtitleLabel.Size = New-Object System.Drawing.Size(680, 20)
$subtitleLabel.Location = New-Object System.Drawing.Point(20, 48)
$subtitleLabel.ForeColor = [System.Drawing.Color]::Gray

$tagLabel = New-Object System.Windows.Forms.Label
$tagLabel.Text = "Qual a etiqueta do equipamento?"
$tagLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$tagLabel.Size = New-Object System.Drawing.Size(300, 25)
$tagLabel.Location = New-Object System.Drawing.Point(20, 85)

$tagTextBox = New-Object System.Windows.Forms.TextBox
$tagTextBox.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$tagTextBox.Size = New-Object System.Drawing.Size(200, 30)
$tagTextBox.Location = New-Object System.Drawing.Point(20, 115)
$tagTextBox.CharacterCasing = "Upper"
$tagTextBox.MaxLength = 10

$identifyBtn = New-Object System.Windows.Forms.Button
$identifyBtn.Text = "Identificar Hardware"
$identifyBtn.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$identifyBtn.Size = New-Object System.Drawing.Size(200, 40)
$identifyBtn.Location = New-Object System.Drawing.Point(240, 110)
$identifyBtn.Enabled = $false
$identifyBtn.BackColor = [System.Drawing.Color]::FromArgb(30, 58, 138)
$identifyBtn.ForeColor = [System.Drawing.Color]::White
$identifyBtn.FlatStyle = "Flat"
$identifyBtn.Cursor = "Hand"

$logBox = New-Object System.Windows.Forms.RichTextBox
$logBox.Font = New-Object System.Drawing.Font("Consolas", 9)
$logBox.Size = New-Object System.Drawing.Size(668, 300)
$logBox.Location = New-Object System.Drawing.Point(20, 170)
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::FromArgb(245, 247, 250)
$logBox.WordWrap = $false

$saveBtn = New-Object System.Windows.Forms.Button
$saveBtn.Text = "Salvar Arquivo"
$saveBtn.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$saveBtn.Size = New-Object System.Drawing.Size(200, 40)
$saveBtn.Location = New-Object System.Drawing.Point(20, 490)
$saveBtn.Enabled = $false
$saveBtn.BackColor = [System.Drawing.Color]::FromArgb(22, 163, 74)
$saveBtn.ForeColor = [System.Drawing.Color]::White
$saveBtn.FlatStyle = "Flat"
$saveBtn.Cursor = "Hand"

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "Aguardando etiqueta..."
$statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$statusLabel.Size = New-Object System.Drawing.Size(680, 20)
$statusLabel.Location = New-Object System.Drawing.Point(240, 498)
$statusLabel.ForeColor = [System.Drawing.Color]::Gray

$form.Controls.AddRange(@(
    $titleLabel, $subtitleLabel, $tagLabel, $tagTextBox,
    $identifyBtn, $logBox, $saveBtn, $statusLabel
))

$collectedData = ""
$outputFilePath = ""

function Write-Log {
    param([string]$Text, [string]$Color = "Black")
    $logBox.SelectionStart = $logBox.TextLength
    $logBox.SelectionLength = 0
    $logBox.SelectionColor = switch ($Color) {
        "Green" { [System.Drawing.Color]::FromArgb(22, 163, 74) }
        "Red" { [System.Drawing.Color]::FromArgb(220, 38, 38) }
        "Blue" { [System.Drawing.Color]::FromArgb(30, 58, 138) }
        "Gray" { [System.Drawing.Color]::Gray }
        default { [System.Drawing.Color]::Black }
    }
    $logBox.AppendText($Text + "`r`n")
    $logBox.SelectionColor = [System.Drawing.Color]::Black
    $form.Refresh()
}

function Format-Bytes {
    param([double]$Bytes)
    if ($Bytes -ge 1TB) { return [math]::Round($Bytes / 1TB, 2).ToString() + " TB" }
    if ($Bytes -ge 1GB) { return [math]::Round($Bytes / 1GB, 2).ToString() + " GB" }
    if ($Bytes -ge 1MB) { return [math]::Round($Bytes / 1MB, 2).ToString() + " MB" }
    return [math]::Round($Bytes / 1KB, 2).ToString() + " KB"
}

function Get-WindowsInfo {
    Write-Log "  >> Coletando dados do Sistema Operacional..." "Blue"
    $os = Get-CimInstance Win32_OperatingSystem
    $installDate = "Não disponível"
    if ($os.InstallDate) {
        try {
            $installDate = [System.Management.ManagementDateTimeConverter]::ToDateTime($os.InstallDate).ToString("dd/MM/yyyy HH:mm:ss")
        } catch {
            $installDate = $os.InstallDate.ToString()
        }
    }

    return @"
---- SISTEMA OPERACIONAL -----------------------------------
ID de Instalação : $($os.SerialNumber)
Versao           : $($os.Caption)
Build            : $($os.BuildNumber)
Arquitetura      : $($os.OSArchitecture)
Instalação       : $installDate

"@
}

function Get-CpuInfo {
    Write-Log "  >> Coletando dados do Processador..." "Blue"
    $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
    return @"
---- PROCESSADOR -------------------------------------------
ID               : $($cpu.ProcessorId)
Marca            : $($cpu.Manufacturer)
Modelo           : $($cpu.Name.Trim())
Núcleos          : $($cpu.NumberOfCores)
Threads          : $($cpu.NumberOfLogicalProcessors)
Frequência       : $([math]::Round($cpu.MaxClockSpeed / 1000, 2)) GHz

"@
}

function Get-RamInfo {
    Write-Log "  >> Coletando dados da Memória RAM..." "Blue"
    $ram = Get-CimInstance Win32_PhysicalMemory
    $totalGB = [math]::Round(($ram | Measure-Object -Property Capacity -Sum).Sum / 1GB, 2)
    $slotsTotal = 0
    try {
        $slotsTotal = (Get-CimInstance Win32_PhysicalMemoryArray).MemoryDevices
    } catch { $slotsTotal = $ram.Count }

    $output = @"
---- MEMÓRIA RAM -------------------------------------------
Total: $totalGB GB ($($ram.Count) slots ocupados de $slotsTotal)

"@
    for ($i = 0; $i -lt $ram.Count; $i++) {
        $sizeGB = [math]::Round($ram[$i].Capacity / 1GB, 0)
        $id = if ($ram[$i].PartNumber -and $ram[$i].PartNumber.Trim() -notmatch '^[0\s]+$') { $ram[$i].PartNumber.Trim() } else { "Não identificado" }
        $output += "  Slot $($i+1): $sizeGB GB"
        if ($ram[$i].Speed) { $output += " $($ram[$i].Speed) MHz" }
        $output += " - ID: $id`n"
    }
    $output += "`n"
    return $output
}

function Get-DiskInfo {
    Write-Log "  >> Coletando dados dos Discos..." "Blue"
    $output = @"
---- DISCOS -------------------------------------------------

"@
    $found = $false
    $disks = $null

    # --- Método 1: Win32_DiskDrive (discos físicos) ---
    if (-not $found) {
        Write-Log "  Método 1: Win32_DiskDrive..." "Gray"
        try {
            $disks = Get-CimInstance Win32_DiskDrive
            if ($disks -and ($disks.Count -gt 0 -or $disks)) {
                $found = $true
                foreach ($disk in $disks) {
                    $sizeGB = if ($disk.Size) { [math]::Round($disk.Size / 1GB, 0) } else { 0 }
                    $serial = if ($disk.SerialNumber) { $disk.SerialNumber.Trim() } else { "Não disponível" }
                    $model = if ($disk.Model) { $disk.Model.Trim() } else { "Não disponível" }
                    $output += "  Disco $([array]::IndexOf($disks, $disk)) : $model`n"
                    $output += "  Tamanho : $sizeGB GB`n"
                    $output += "  Serial  : $serial`n"
                    $output += "`n"
                }
            }
        } catch { Write-Log "  (falhou)" "Red" }
    }

    # --- Método 2: Win32_LogicalDisk (volumes) ---
    if (-not $found) {
        Write-Log "  Método 2: Win32_LogicalDisk..." "Gray"
        try {
            $disks = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
            if ($disks -and ($disks.Count -gt 0 -or $disks)) {
                $found = $true
                foreach ($disk in $disks) {
                    $sizeGB = if ($disk.Size) { [math]::Round($disk.Size / 1GB, 0) } else { 0 }
                    $output += "  Volume $($disk.DeviceID)`n"
                    $output += "  Tamanho : $sizeGB GB`n"
                    $output += "  Rótulo : $($disk.VolumeName)`n"
                    $output += "  Sistema de Arquivos : $($disk.FileSystem)`n"
                    $output += "`n"
                }
            }
        } catch { Write-Log "  (falhou)" "Red" }
    }

    # --- Método 3: Get-Disk (Storage module) ---
    if (-not $found) {
        Write-Log "  Método 3: Get-Disk (Storage)..." "Gray"
        try {
            $disks = Get-Disk -ErrorAction Stop
            if ($disks -and ($disks.Count -gt 0 -or $disks)) {
                $found = $true
                foreach ($disk in $disks) {
                    $sizeBytes = if ($disk.Size) { $disk.Size } else { 0 }
                    $sizeGB = [math]::Round($sizeBytes / 1GB, 0)
                    $serial = if ($disk.SerialNumber) { $disk.SerialNumber.Trim() } else { "Não disponível" }
                    $friendly = if ($disk.FriendlyName) { $disk.FriendlyName.Trim() } else { "Não disponível" }
                    $output += "  Disco $($disk.Number) : $friendly`n"
                    $output += "  Tamanho : $sizeGB GB`n"
                    $output += "  Serial  : $serial`n"
                    $output += "`n"
                }
            }
        } catch { Write-Log "  (falhou)" "Red" }
    }

    # --- Método 4: Get-PnpDevice ---
    if (-not $found) {
        Write-Log "  Método 4: Get-PnpDevice..." "Gray"
        try {
            $disks = Get-PnpDevice -Class DiskDrive -Status OK
            if ($disks -and ($disks.Count -gt 0 -or $disks)) {
                $found = $true
                foreach ($device in $disks) {
                    $output += "  Disco : $($device.FriendlyName)`n"
                    $output += "  ID    : $($device.InstanceId)`n`n"
                }
            }
        } catch { Write-Log "  (falhou)" "Red" }
    }

    if (-not $found) {
        $output += "  Disco não identificado`n`n"
    }
    return $output
}

function Get-MotherboardInfo {
    Write-Log "  >> Coletando dados da Placa-mãe e BIOS..." "Blue"
    $mb = Get-CimInstance Win32_BaseBoard
    $bios = Get-CimInstance Win32_BIOS
    return @"
---- PLACA-MAE ---------------------------------------------
Fabricante : $($mb.Manufacturer)
Modelo     : $($mb.Product)
Nº Série   : $($mb.SerialNumber)
BIOS       : $($bios.SMBIOSBIOSVersion) ($($bios.Manufacturer))

"@
}

function Get-NetworkInfo {
    Write-Log "  >> Coletando dados da Rede..." "Blue"
    $adapters = Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true }
    $output = @"
---- REDE ---------------------------------------------------

"@
    if (-not $adapters) {
        $output += "  Nenhum adaptador de rede habilitado encontrado.`n"
    } else {
        foreach ($adapter in $adapters) {
            $mac = if ($adapter.MACAddress) { $adapter.MACAddress } else { "Não disponível" }
            $desc = if ($adapter.Description) { $adapter.Description.Trim() } else { "Não disponível" }
            $output += "  $desc`n"
            $output += "  MAC : $mac`n"
            $output += "`n"
        }
    }
    return $output
}

function Build-Output {
    param([string]$Tag)
    $timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
    $output = ""
    $output += "=" * 60 + "`n"
    $output += "  COLETA DE HARDWARE - OS.Tech`n"
    $output += "=" * 60 + "`n"
    $output += "`n"
    $output += "  Etiqueta : $Tag`n"
    $output += "  Data     : $timestamp`n"
    $output += "  Nome do computador : $env:COMPUTERNAME`n"
    $output += "`n"
    $output += "-" * 60 + "`n`n"

    $output += Get-WindowsInfo
    $output += Get-CpuInfo
    $output += Get-RamInfo
    $output += Get-DiskInfo
    $output += Get-MotherboardInfo
    $output += Get-NetworkInfo
    $output += "=" * 60 + "`n"
    $output += "  Fim da coleta - OS.Tech`n"
    $output += "=" * 60 + "`n"

    return $output
}

function Save-Output {
    param([string]$Content, [string]$Tag)
    $timestamp = Get-Date -Format "ddMMyy_HHmmss"
    $filename = "${Tag}_${timestamp}.txt"
    $filePath = Join-Path $scriptDir $filename
    try {
        $Content | Out-File -FilePath $filePath -Encoding utf8
        return $filePath
    } catch {
        throw "Erro ao salvar arquivo: $_"
    }
}

$tagTextBox.Add_TextChanged({
    $identifyBtn.Enabled = ($tagTextBox.Text.Trim().Length -ge 1)
})

$identifyBtn.Add_Click({
    $tag = $tagTextBox.Text.Trim().ToUpper()
    if ($tag.Length -eq 0) {
        [System.Windows.Forms.MessageBox]::Show("Informe a etiqueta do equipamento.", "Atenção", "OK", "Warning")
        return
    }

    $identifyBtn.Enabled = $false
    $tagTextBox.Enabled = $false
    $saveBtn.Enabled = $false
    $logBox.Clear()
    $statusLabel.Text = "Coletando dados..."
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(30, 58, 138)

    Write-Log "OS.Tech - Coletor de Hardware v1.0" "Blue"
    Write-Log "============================================" "Blue"
    Write-Log "Etiqueta: $tag" "Blue"
    Write-Log "Iniciando coleta em: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" "Gray"
    Write-Log ""

    try {
        Write-Log "[1/6] Sistema Operacional..."
        $osText = Get-WindowsInfo
        Write-Log "  OK" "Green"
        $form.Refresh()
        Start-Sleep -Milliseconds 100

        Write-Log "[2/6] Processador..."
        $cpuText = Get-CpuInfo
        Write-Log "  OK" "Green"
        $form.Refresh()
        Start-Sleep -Milliseconds 100

        Write-Log "[3/6] Memória RAM..."
        $ramText = Get-RamInfo
        Write-Log "  OK" "Green"
        $form.Refresh()
        Start-Sleep -Milliseconds 100

        Write-Log "[4/6] Discos..."
        $diskText = Get-DiskInfo
        Write-Log "  OK" "Green"
        $form.Refresh()
        Start-Sleep -Milliseconds 100

        Write-Log "[5/6] Placa-mãe e BIOS..."
        $mbText = Get-MotherboardInfo
        Write-Log "  OK" "Green"
        $form.Refresh()
        Start-Sleep -Milliseconds 100

        Write-Log "[6/6] Rede..."
        $netText = Get-NetworkInfo
        Write-Log "  OK" "Green"

        Write-Log ""
        Write-Log "Compilando dados..." "Blue"

        $script:collectedData = Build-Output -Tag $tag

        $logBox.Clear()
        $logBox.AppendText($script:collectedData)

        Write-Log ""
        Write-Log "Coleta concluída com sucesso!" "Green"
        $statusLabel.Text = "Coleta concluída. Revise os dados e clique em Salvar."
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(22, 163, 74)
        $saveBtn.Enabled = $true
    } catch {
        Write-Log ""
        Write-Log "ERRO: $($_.Exception.Message)" "Red"
        $statusLabel.Text = "Erro durante a coleta."
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
        $identifyBtn.Enabled = $true
        $tagTextBox.Enabled = $true
    }
})

$saveBtn.Add_Click({
    $tag = $tagTextBox.Text.Trim().ToUpper()
    $saveBtn.Enabled = $false
    $statusLabel.Text = "Salvando arquivo..."
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(30, 58, 138)

    try {
        $script:outputFilePath = Save-Output -Content $script:collectedData -Tag $tag
        Write-Log ""
        Write-Log "Arquivo salvo:" "Green"
        Write-Log "  $script:outputFilePath" "Blue"

        $result = [System.Windows.Forms.MessageBox]::Show(
            "Arquivo salvo em:`n$script:outputFilePath`n`nDeseja abrir a pasta?",
            "Sucesso",
            "YesNo",
            "Information"
        )
        if ($result -eq "Yes") {
            $folderPath = Split-Path -Parent $script:outputFilePath
            Start-Process explorer.exe -ArgumentList "/select,`"$script:outputFilePath`""
        }

        $statusLabel.Text = "Arquivo salvo com sucesso!"
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(22, 163, 74)
        $saveBtn.Enabled = $true
    } catch {
        Write-Log ""
        Write-Log "ERRO ao salvar: $($_.Exception.Message)" "Red"
        $statusLabel.Text = "Erro ao salvar arquivo."
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
        $saveBtn.Enabled = $true
    }
})

$form.Add_Shown({
    $tagTextBox.Focus()
})

[void]$form.ShowDialog()
} catch {
    [System.Windows.Forms.MessageBox]::Show(
        "Erro ao iniciar o coletor:`n`n$($_.Exception.Message)",
        "Erro",
        "OK",
        "Error"
    )
} finally {
    $form.Dispose()
}
