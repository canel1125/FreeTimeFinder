@echo off
echo =====================================================
echo       TEST DE MEJORAS EN HORARIOS OCUPADOS
echo =====================================================
echo.
echo Este script verificara las mejoras implementadas:
echo 1. Seleccion de mas de 20 bloques
echo 2. Manejo correcto del horario 23:30
echo 3. Feedback visual mejorado
echo 4. Performance optimizada
echo.

echo Iniciando contenedores Docker...
docker-compose up -d

echo.
echo Esperando que los servicios se inicien...
timeout /t 10 /nobreak >nul

echo.
echo =====================================================
echo                INSTRUCCIONES DE PRUEBA
echo =====================================================
echo.
echo 1. Abrir navegador en: http://localhost:3000
echo 2. Registrarse/Iniciar sesion
echo 3. Ir a "My Busy Times"
echo.
echo PRUEBAS A REALIZAR:
echo.
echo [PRUEBA 1] Seleccionar exactamente el slot 23:30
echo   - Debe crear bloque 23:30-23:59 correctamente
echo   - Sin errores en consola del navegador
echo.
echo [PRUEBA 2] Seleccionar 25-30 bloques
echo   - Ver advertencia "Medium selection"
echo   - Creacion exitosa con mensaje detallado
echo.
echo [PRUEBA 3] Seleccionar 60-70 bloques
echo   - Ver advertencia "Large selection - consider breaking..."
echo   - Procesamiento rapido y exitoso
echo.
echo [PRUEBA 4] Seleccionar 110+ bloques
echo   - Ver advertencia roja "Very large selection"
echo   - Aun debe funcionar correctamente
echo.
echo [PRUEBA 5] Intentar seleccionar 160+ bloques
echo   - Debe mostrar error preventivo
echo   - No enviar request al servidor
echo.
echo =====================================================
echo              COMO VERIFICAR EL EXITO
echo =====================================================
echo.
echo 1. Los horarios se crean sin errores
echo 2. El feedback visual es claro y progresivo
echo 3. Los bloques 23:30 aparecen como 23:30-23:59
echo 4. Las selecciones grandes se procesan rapidamente
echo 5. Hay limite preventivo en 150+ bloques
echo.
echo Presiona Ctrl+C para detener el test cuando termines
echo.
pause
echo.
echo Deteniendo contenedores...
docker-compose down
