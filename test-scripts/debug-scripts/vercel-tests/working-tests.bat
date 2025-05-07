@echo off
echo ===== Running Working API Tests (Part 1) =====

REM Store the absolute path to the project root directory
set "PROJECT_ROOT=%~dp0..\..\"
echo Project root directory: %PROJECT_ROOT%

REM Generate tokens using absolute path
echo Generating fresh tokens for all roles...
call node "%PROJECT_ROOT%scripts\utilities\generate-all-role-tokens.js"

REM Set environment variables for tokens
echo.
echo Setting environment variables for tokens...
if exist "%PROJECT_ROOT%tokens\admin_referring-token.txt" (
    set /p ADMIN_REFERRING_TOKEN=<"%PROJECT_ROOT%tokens\admin_referring-token.txt"
    set ADMIN_TOKEN=%ADMIN_REFERRING_TOKEN%
    echo Admin Referring Token loaded successfully.
) else (
    echo Error: Admin Referring Token file not found.
    exit /b 1
)

if exist "%PROJECT_ROOT%tokens\admin_radiology-token.txt" (
    set /p ADMIN_RADIOLOGY_TOKEN=<"%PROJECT_ROOT%tokens\admin_radiology-token.txt"
    echo Admin Radiology Token loaded successfully.
) else (
    echo Error: Admin Radiology Token file not found.
    exit /b 1
)

if exist "%PROJECT_ROOT%tokens\admin_staff-token.txt" (
    set /p ADMIN_STAFF_TOKEN=<"%PROJECT_ROOT%tokens\admin_staff-token.txt"
    echo Admin Staff Token loaded successfully.
) else (
    echo Error: Admin Staff Token file not found.
    exit /b 1
)

if exist "%PROJECT_ROOT%tokens\physician-token.txt" (
    set /p PHYSICIAN_TOKEN=<"%PROJECT_ROOT%tokens\physician-token.txt"
    echo Physician Token loaded successfully.
) else (
    echo Error: Physician Token file not found.
    exit /b 1
)

REM Set API URL environment variable
set API_URL=https://api.radorderpad.com
echo API URL set to: %API_URL%

REM Run individual tests using absolute paths
echo.
echo Running Connection Requests Tests...
call "%PROJECT_ROOT%debug-scripts\vercel-tests\test-connection-requests.bat"

echo.
echo Running Admin Order Queue Tests...
call "%PROJECT_ROOT%debug-scripts\vercel-tests\test-admin-order-queue.bat"

echo.
echo Running Admin Paste Summary Tests...
call "%PROJECT_ROOT%debug-scripts\vercel-tests\test-admin-paste-summary.bat"

echo.
echo Running Accept Invitation Tests...
call "%PROJECT_ROOT%debug-scripts\vercel-tests\test-accept-invitation.bat"

echo.
echo Running User Invite Tests...
call "%PROJECT_ROOT%debug-scripts\vercel-tests\test-user-invite.bat"

echo.
echo Running Uploads Presigned URL Tests...
call "%PROJECT_ROOT%debug-scripts\vercel-tests\test-uploads-presigned-url.bat"

echo.
echo Running Uploads Confirm Tests...
call "%PROJECT_ROOT%debug-scripts\vercel-tests\test-uploads-confirm.bat"

echo.
echo Running Get Download URL Tests...
call "%PROJECT_ROOT%debug-scripts\vercel-tests\test-get-download-url.bat"

echo.
echo Running Get Credit Balance Tests...
call "%PROJECT_ROOT%debug-scripts\vercel-tests\test-get-credit-balance.bat"

echo.
echo Running Get Credit Usage Tests...
call "%PROJECT_ROOT%debug-scripts\vercel-tests\test-get-credit-usage.bat"

echo.
echo Running Register Tests...
call "%PROJECT_ROOT%debug-scripts\vercel-tests\test-register.bat"

echo.
echo Running Get User Me Tests...
call "%PROJECT_ROOT%debug-scripts\vercel-tests\test-get-user-me.bat"

echo.
echo ===== All Working Tests (Part 1) Complete =====