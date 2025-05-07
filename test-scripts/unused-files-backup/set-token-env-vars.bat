@echo off
echo Setting token environment variables...

set /p ADMIN_STAFF_TOKEN=</Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/admin_staff-token.txt
echo ADMIN_STAFF_TOKEN set
set /p PHYSICIAN_TOKEN=</Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/physician-token.txt
echo PHYSICIAN_TOKEN set
set /p ADMIN_REFERRING_TOKEN=</Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/admin_referring-token.txt
echo ADMIN_REFERRING_TOKEN set
set /p SUPER_ADMIN_TOKEN=</Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/super_admin-token.txt
echo SUPER_ADMIN_TOKEN set
set /p ADMIN_RADIOLOGY_TOKEN=</Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/admin_radiology-token.txt
echo ADMIN_RADIOLOGY_TOKEN set
set /p SCHEDULER_TOKEN=</Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/scheduler-token.txt
echo SCHEDULER_TOKEN set
set /p RADIOLOGIST_TOKEN=</Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/radiologist-token.txt
echo RADIOLOGIST_TOKEN set

echo All token environment variables set successfully.
