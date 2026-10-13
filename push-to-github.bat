@echo off
echo ========================================================
echo Pushing Report Maker to GitHub (https://github.com/vikashbhushan189/report-maker)
echo ========================================================
git push -u origin main
if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Code pushed to GitHub successfully!
) else (
    echo.
    echo [NOTICE] If the repository does not exist yet on GitHub, please create it first at:
    echo https://github.com/new with name "report-maker"
    echo Then run this script again!
)
pause
