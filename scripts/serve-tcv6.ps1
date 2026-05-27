param(
  [Parameter(Mandatory = $true)]
  [string]$Root,
  [int]$Port = 8787
)

$ErrorActionPreference = "Stop"
$rootPath = (Resolve-Path -LiteralPath $Root).Path

$mimeMap = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif" = "image/gif"
  ".svg" = "image/svg+xml"
  ".ico" = "image/x-icon"
  ".woff" = "font/woff"
  ".woff2" = "font/woff2"
  ".ttf" = "font/ttf"
  ".xlsx" = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

function Send-HttpResponse {
  param(
    [Parameter(Mandatory = $true)]
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$ContentType,
    [byte[]]$BodyBytes
  )

  $header = "HTTP/1.1 $StatusCode $StatusText`r`n"
  $header += "Content-Type: $ContentType`r`n"
  $header += "Content-Length: $($BodyBytes.Length)`r`n"
  $header += "Connection: close`r`n"
  $header += "`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($BodyBytes.Length -gt 0) {
    $Stream.Write($BodyBytes, 0, $BodyBytes.Length)
  }
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()

      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        Send-HttpResponse -Stream $stream -StatusCode 400 -StatusText "Bad Request" -ContentType "text/plain; charset=utf-8" -BodyBytes ([System.Text.Encoding]::UTF8.GetBytes("Bad Request"))
        continue
      }

      while ($true) {
        $line = $reader.ReadLine()
        if ($null -eq $line -or $line -eq "") {
          break
        }
      }

      $parts = $requestLine.Split(" ")
      if ($parts.Length -lt 2) {
        Send-HttpResponse -Stream $stream -StatusCode 400 -StatusText "Bad Request" -ContentType "text/plain; charset=utf-8" -BodyBytes ([System.Text.Encoding]::UTF8.GetBytes("Bad Request"))
        continue
      }

      $method = $parts[0].ToUpperInvariant()
      $rawPath = $parts[1]
      if ($method -ne "GET") {
        Send-HttpResponse -Stream $stream -StatusCode 405 -StatusText "Method Not Allowed" -ContentType "text/plain; charset=utf-8" -BodyBytes ([System.Text.Encoding]::UTF8.GetBytes("Method Not Allowed"))
        continue
      }

      $pathOnly = $rawPath.Split("?")[0]
      $requestPath = [System.Uri]::UnescapeDataString($pathOnly)
      if ([string]::IsNullOrWhiteSpace($requestPath) -or $requestPath -eq "/") {
        $requestPath = "/index.html"
      }

      $requestPath = $requestPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
      $candidate = Join-Path $rootPath $requestPath
      if (Test-Path -LiteralPath $candidate -PathType Container) {
        $candidate = Join-Path $candidate "index.html"
      }

      $fullPath = [System.IO.Path]::GetFullPath($candidate)
      $isInsideRoot = $fullPath.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)

      if (-not $isInsideRoot -or -not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        Send-HttpResponse -Stream $stream -StatusCode 404 -StatusText "Not Found" -ContentType "text/plain; charset=utf-8" -BodyBytes ([System.Text.Encoding]::UTF8.GetBytes("Not Found"))
        continue
      }

      $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
      $contentType = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($fullPath)
      Send-HttpResponse -Stream $stream -StatusCode 200 -StatusText "OK" -ContentType $contentType -BodyBytes $bytes
    } catch {
      try {
        if ($null -ne $stream) {
          Send-HttpResponse -Stream $stream -StatusCode 500 -StatusText "Internal Server Error" -ContentType "text/plain; charset=utf-8" -BodyBytes ([System.Text.Encoding]::UTF8.GetBytes("Internal Server Error"))
        }
      } catch {
        # ignore secondary errors
      }
    } finally {
      if ($null -ne $client) {
        $client.Close()
      }
      if ($null -ne $reader) {
        $reader.Dispose()
      }
      if ($null -ne $stream) {
        $stream.Dispose()
      }
      $client = $null
      $reader = $null
      $stream = $null
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
