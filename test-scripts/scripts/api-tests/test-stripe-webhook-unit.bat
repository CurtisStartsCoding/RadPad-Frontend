@echo off
REM Run unit tests for Stripe webhook handlers

echo ===================================================
echo Stripe Webhook Unit Tests
echo ===================================================
echo.

REM Run the tests using Jest
npx jest tests/unit/webhook-handlers.test.js --verbose

echo.
echo ===================================================
echo Unit Tests Completed
echo ===================================================

pause