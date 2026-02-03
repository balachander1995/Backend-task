# Test signup with the newly added full_name column
$signupResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/trpc/[trpc]/auth/signup" -Method POST -ContentType "application/json" -Body @"
{
  "username": "testuser123",
  "password": "testpass123",
  "fullName": "Test User"
}
"@ -UseBasicParsing -ErrorAction SilentlyContinue

if ($signupResponse) {
  Write-Host "Signup response status:" $signupResponse.StatusCode
  Write-Host "Response:"
  $signupResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} else {
  Write-Host "Signup request failed or timed out"
}
