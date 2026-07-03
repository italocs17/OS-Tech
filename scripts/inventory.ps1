# OS.Tech - Script de Captura de Inventario Tecnico
# Coleta informacoes de hardware e software do sistema

param(
    [string]$OutputPath = ""
)

$ErrorActionPreference = "SilentlyContinue"

function Get-SystemInfo {
    $result = @{
        sistema_operacional = @{}
        processador = @{}
        memoria_ram = @{}
        discos = @()
        rede = @()
        placa_mae = @{}
        placa_de_video = @{}
        fonte = @{}
        gabinete = @{}
        programas_instalados = @()
        impressoras = @()
        data_captura = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }

    # Sistema Operacional
    try {
        $os = Get-CimInstance Win32_OperatingSystem
        $result.sistema_operacional = @{
            nome = $os.Caption
            versao = $os.Version
            build = $os.BuildNumber
            arquitetura = $os.OSArchitecture
            serial = $os.SerialNumber
        }
    } catch {
        $result.sistema_operacional = @{ erro = $_.Exception.Message }
    }

    # Processador
    try {
        $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
        $result.processador = @{
            modelo = $cpu.Name
            nucleos = $cpu.NumberOfCores
            threads = $cpu.NumberOfLogicalProcessors
            frequencia_ghz = [math]::Round($cpu.MaxClockSpeed / 1000, 2)
            socket = $cpu.SocketDesignation
        }
    } catch {
        $result.processador = @{ erro = $_.Exception.Message }
    }

    # Memoria RAM
    try {
        $ram = Get-CimInstance Win32_PhysicalMemory
        $totalGB = [math]::Round(($ram | Measure-Object -Property Capacity -Sum).Sum / 1GB, 2)
        $result.memoria_ram = @{
            total_gb = $totalGB
            tipo = $ram[0].SMBIOSMemoryType
            velocidade_mhz = $ram[0].Speed
            slots_usados = $ram.Count
            slots_total = (Get-CimInstance Win32_PhysicalMemoryArray).MemoryDevices
        }
    } catch {
        $result.memoria_ram = @{ erro = $_.Exception.Message }
    }

    # Discos
    try {
        $disks = Get-CimInstance Win32_DiskDrive
        foreach ($disk in $disks) {
            $diskInfo = @{
                modelo = $disk.Model
                tipo = if ($disk.InterfaceType -eq "USB") { "USB" } else { "Interno" }
                capacidade_gb = [math]::Round($disk.Size / 1GB, 2)
                serial = $disk.SerialNumber
                saude = "OK"
            }

            # Verificar saude do disco (SMART)
            try {
                $smart = Get-CimInstance -Namespace root\wmi -ClassName Win32_DiskDriveStatusError
                if ($smart) {
                    $diskInfo.saude = "Atencao"
                }
            } catch { }

            $result.discos += $diskInfo
        }
    } catch {
        $result.discos = @{ erro = $_.Exception.Message }
    }

    # Rede
    try {
        $adapters = Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true }
        foreach ($adapter in $adapters) {
            $result.rede += @{
                nome = $adapter.Description
                ip_local = ($adapter.IPAddress | Select-Object -First 1)
                mac_address = $adapter.MACAddress
                tipo_conexao = if ($adapter.Description -match "Wi-Fi|Wireless") { "Wi-Fi" } else { "Ethernet" }
            }
        }
    } catch {
        $result.rede = @{ erro = $_.Exception.Message }
    }

    # Plmae
    try {
        $motherboard = Get-CimInstance Win32_BaseBoard
        $result.placa_mae = @{
            fabricante = $motherboard.Manufacturer
            modelo = $motherboard.Product
            serial = $motherboard.SerialNumber
        }
    } catch {
        $result.placa_mae = @{ erro = $_.Exception.Message }
    }

    # Placa de video
    try {
        $gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1
        $result.placa_de_video = @{
            modelo = $gpu.Name
            vram_gb = [math]::Round($gpu.AdapterRAM / 1GB, 2)
            driver = $gpu.DriverVersion
        }
    } catch {
        $result.placa_de_video = @{ erro = $_.Exception.Message }
    }

    # Programas instalados
    try {
        $programs = Get-ItemProperty "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*" -ErrorAction SilentlyContinue |
            Where-Object { $_.DisplayName -and $_.Publisher }

        foreach ($prog in $programs | Select-Object -First 100) {
            $result.programas_instalados += @{
                nome = $prog.DisplayName
                versao = $prog.DisplayVersion
                fabricante = $prog.Publisher
            }
        }
    } catch {
        $result.programas_instalados = @{ erro = $_.Exception.Message }
    }

    # Impressoras
    try {
        $printers = Get-CimInstance Win32_Printer
        foreach ($printer in $printers) {
            $result.impressoras += @{
                nome = $printer.Name
                driver = $printer.DriverName
                porta = $printer.PortName
                padrao = $printer.Default
            }
        }
    } catch {
        $result.impressoras = @{ erro = $_.Exception.Message }
    }

    return $result
}

# Executar coleta
$inventory = Get-SystemInfo

# Saida
if ($OutputPath) {
    $inventory | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputPath -Encoding UTF8
    Write-Host "Inventario salvo em: $OutputPath"
} else {
    $inventory | ConvertTo-Json -Depth 10
}
