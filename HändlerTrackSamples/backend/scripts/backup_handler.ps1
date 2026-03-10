# ============================================================================
# Händler TrackSamples - Script de Backup Automático
# ============================================================================
# Este script realiza backups de la base de datos MySQL y los certificados CoA
# Puede ejecutarse manualmente o programado con Tareas Programadas de Windows
#
# Uso:
#   .\backup_handler.ps1 -BackupType daily
#   .\backup_handler.ps1 -BackupType weekly
#   .\backup_handler.ps1 -BackupType monthly
#
# Programación recomendada:
#   Daily:  18:00 (todos los días)
#   Weekly: 02:00 (domingos)
#   Monthly: 03:00 (primer domingo del mes)
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("daily", "weekly", "monthly")]
    [string]$BackupType = "daily",
    
    [Parameter(Mandatory=$false)]
    [string]$MySqlHost = "127.0.0.1",
    
    [Parameter(Mandatory=$false)]
    [int]$MySqlPort = 3306,
    
    [Parameter(Mandatory=$false)]
    [string]$MySqlUser = "handler_user",
    
    [Parameter(Mandatory=$false)]
    [SecureString]$MySqlPassword = "",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "handler_tracksamples",
    
    [Parameter(Mandatory=$false)]
    [string]$BackupDrive = "D:",
    
    [Parameter(Mandatory=$false)]
    [string]$CoASourcePath = "C:\Handler\Certificados",
    
    [Parameter(Mandatory=$false)]
    [string]$CloudSyncPath = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Compress,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Configuración de logging
$LogFile = "$PSScriptRoot\..\logs\backup.log"
$ErrorLogFile = "$PSScriptRoot\..\logs\backup_errors.log"

# Convertir SecureString a texto plano para mysqldump
$plainPassword = ""
if ($MySqlPassword) {
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($MySqlPassword)
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

function Write-Log {
    param([string]$Message, [switch]$IsError)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    
    if ($IsError) {
        Write-Host $logMessage -ForegroundColor Red
        Add-Content -Path $ErrorLogFile -Value $logMessage
    } else {
        Write-Host $logMessage -ForegroundColor Green
        Add-Content -Path $LogFile -Value $logMessage
    }
}

function Test-MySqlConnection {
    Write-Log "Verificando conexión a MySQL..."
    
    $mysqlBin = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\x64\mysql.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    
    if (-not $mysqlBin) {
        Write-Log "MySQL no encontrado en rutas estándar" -IsError
        return $false
    }
    
    $testQuery = "$mysqlBin -h$MySqlHost -P$MySqlPort -u$MySqlUser"
    if ($plainPassword) {
        $testQuery += " -p$plainPassword"
    }
    $testQuery += " -e 'SELECT 1;' $DatabaseName 2>&1"
    
    try {
        # Test MySQL connection - result is discarded
        Invoke-Expression $testQuery | Out-Null
        Write-Log "Conexión a MySQL exitosa"
        return $true
    } catch {
        Write-Log "Error de conexión a MySQL: $_" -IsError
        return $false
    }
}

function Get-MySqlDumpPath {
    $paths = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\x64\mysqldump.exe"
    )
    
    foreach ($path in $paths) {
        if (Test-Path $path) {
            return $path
        }
    }
    
    return $null
}

function New-DatabaseBackup {
    param([string]$OutputPath)
    
    Write-Log "Creando backup de base de datos..."
    
    $mysqldump = Get-MySqlDumpPath
    if (-not $mysqldump) {
        Write-Log "mysqldump.exe no encontrado" -IsError
        return $false
    }
    
    $dumpCommand = "`"$mysqldump`" -h$MySqlHost -P$MySqlPort -u$MySqlUser"
    if ($plainPassword) {
        $dumpCommand += " -p$plainPassword"
    }
    $dumpCommand += " --single-transaction --quick --lock-tables=false"
    $dumpCommand += " $DatabaseName"
    
    try {
        # Create database dump - output is saved to file
        Invoke-Expression "$dumpCommand 2>&1" | Out-File -FilePath $OutputPath -Encoding UTF8
        Write-Log "Backup de base de datos completado: $OutputPath"
        return $true
    } catch {
        Write-Log "Error al crear backup de BD: $_" -IsError
        return $false
    }
}

function Copy-CoAFiles {
    param([string]$OutputPath)
    
    Write-Log "Copiando certificados CoA..."
    
    if (-not (Test-Path $CoASourcePath)) {
        Write-Log "Carpeta de certificados no encontrada: $CoASourcePath - Omitiendo"
        return $true
    }
    
    $coBackupPath = Join-Path $OutputPath "certificados"
    New-Item -ItemType Directory -Path $coBackupPath -Force | Out-Null
    
    try {
        Copy-Item -Path "$COASourcePath\*" -Destination $coBackupPath -Recurse -Force -ErrorAction SilentlyContinue
        $fileCount = (Get-ChildItem $coBackupPath -Recurse -File).Count
        Write-Log "Certificados copiados: $fileCount archivos"
        return $true
    } catch {
        Write-Log "Error al copiar certificados: $_" -IsError
        return $false
    }
}

function Compress-Backup {
    param(
        [string]$SourcePath,
        [string]$ZipPath
    )
    
    Write-Log "Comprimiendo backup..."
    
    try {
        if (Test-Path $ZipPath) {
            Remove-Item $ZipPath -Force
        }
        
        Compress-Archive -Path $SourcePath -DestinationPath $ZipPath -CompressionLevel Optimal -Force
        
        $zipSize = (Get-Item $ZipPath).Length / 1MB
        Write-Log "Backup comprimido: $ZipPath ($( [math]::Round($zipSize, 2) ) MB)"
        
        return $true
    } catch {
        Write-Log "Error al comprimir: $_" -IsError
        return $false
    }
}

function Remove-OldBackups {
    param(
        [string]$BackupRoot,
        [int]$RetentionDays
    )
    
    Write-Log "Limpiando backups antiguos (retensión: $RetentionDays días)..."
    
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $oldBackups = Get-ChildItem -Path $BackupRoot -Filter "*.zip" -ErrorAction SilentlyContinue | 
                  Where-Object { $_.LastWriteTime -lt $cutoffDate }
    
    $count = 0
    foreach ($backup in $oldBackups) {
        try {
            Remove-Item -Path $backup.FullName -Force
            Write-Log "Eliminado: $($backup.Name)"
            $count++
        } catch {
            Write-Log "No se pudo eliminar: $($backup.Name)" -IsError
        }
    }
    
    Write-Log "Backups eliminados: $count"
}

function Sync-ToCloud {
    param([string]$ZipPath)
    
    if (-not $CloudSyncPath) {
        Write-Log "Sincronización con nube no configurada"
        return $true
    }
    
    if (-not (Test-Path $CloudSyncPath)) {
        Write-Log "Carpeta de nube no encontrada: $CloudSyncPath - Omitiendo sincronización"
        return $true
    }
    
    Write-Log "Sincronizando con la nube..."
    
    try {
        $cloudFileName = Split-Path $ZipPath -Leaf
        $cloudDestination = Join-Path $CloudSyncPath $cloudFileName
        
        Copy-Item -Path $ZipPath -Destination $cloudDestination -Force
        
        $cloudSize = (Get-Item $cloudDestination).Length / 1MB
        Write-Log "Sincronizado a la nube: $( [math]::Round($cloudSize, 2) ) MB"
        
        return $true
    } catch {
        Write-Log "Error al sincronizar con la nube: $_" -IsError
        return $false
    }
}

function Get-RetentionDays {
    switch ($BackupType) {
        "daily"   { return 7 }
        "weekly"  { return 28 }
        "monthly" { return 365 }
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Log "=========================================="
Write-Log "Händler TrackSamples - Inicio de Backup"
Write-Log "Tipo de backup: $BackupType"
Write-Log "=========================================="

# Validar que el directorio de backup existe
if (-not (Test-Path $BackupDrive)) {
    Write-Log "Unidad de backup no encontrada: $BackupDrive" -IsError
    exit 1
}

# Crear estructura de directorios
$backupRoot = Join-Path $BackupDrive "HandlerBackups\$BackupType"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

# Generar nombre de archivo con timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "handler_${BackupType}_$timestamp"
$backupPath = Join-Path $backupRoot $backupName
$zipPath = "$backupRoot\$backupName.zip"

# Crear directorio de trabajo
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

# Ejecutar backup
$success = $true

# 1. Backup de base de datos
$dbBackupPath = Join-Path $backupPath "database.sql"
if (-not (New-DatabaseBackup -OutputPath $dbBackupPath)) {
    $success = $false
}

# 2. Copiar certificados CoA
if (-not (Copy-CoAFiles -OutputPath $backupPath)) {
    $success = $false
}

# 3. Crear archivo de metadata
$metadataPath = Join-Path $backupPath "backup_info.txt"
$metadata = @"
Händler TrackSamples - Información de Backup
=============================================
Tipo: $BackupType
Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Base de datos: $DatabaseName
Host MySQL: $MySqlHost`:$MySqlPort
"@
Set-Content -Path $metadataPath -Value $metadata

# 4. Comprimir backup
if ($Compress -or $true) {
    if (-not (Compress-Backup -SourcePath $backupPath -ZipPath $zipPath)) {
        $success = $false
    }
    
    # Limpiar directorio temporal
    if (Test-Path $backupPath) {
        Remove-Item -Path $backupPath -Recurse -Force
    }
}

# 5. Sincronizar con nube (solo mensual)
if ($BackupType -eq "monthly" -and $CloudSyncPath) {
    Sync-ToCloud -ZipPath $zipPath
}

# 6. Limpiar backups antiguos
$retention = Get-RetentionDays
Remove-OldBackups -BackupRoot $backupRoot -RetentionDays $retention

# Resultado final
Write-Log "=========================================="
if ($success) {
    Write-Log "BACKUP COMPLETADO EXITOSAMENTE"
    Write-Log "Ubicación: $zipPath"
    
    # Enviar notificación por email (opcional - requiere configuración SMTP)
    # Send-MailMessage -To "admin@handler.com" -Subject "Backup Handler $BackupType completado" ...
    
    exit 0
} else {
    Write-Log "BACKUP COMPLETADO CON ERRORES" -IsError
    exit 1
}
