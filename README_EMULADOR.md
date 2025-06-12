<!-- omit from toc -->
# 📱 Guía de Configuración para Emulador Android

> [!WARNING] Importante
> Esta guía está diseñada para configurar y ejecutar la aplicación **Graph News Mobile** en un emulador Android en sistemas Windows.

<!-- omit from toc -->
## 📋 Tabla de Contenidos

- [🔧 Requisitos Previos](#-requisitos-previos)
  - [Hardware Mínimo](#hardware-mínimo)
  - [Software Requerido](#software-requerido)
- [🚀 Instalación de Herramientas](#-instalación-de-herramientas)
  - [1. Instalación de Node.js](#1-instalación-de-nodejs)
  - [2. Instalación de Git](#2-instalación-de-git)
  - [3. Instalación de Android Studio](#3-instalación-de-android-studio)
  - [4. Configuración de Variables de Entorno](#4-configuración-de-variables-de-entorno)
  - [5. Instalación de Expo CLI](#5-instalación-de-expo-cli)
  - [6. Instalación de Docker Desktop](#6-instalación-de-docker-desktop)
- [📥 Clonación de Repositorios](#-clonación-de-repositorios)
  - [Backend (Graph News API)](#backend-graph-news-api)
  - [Frontend Mobile (Esta aplicación)](#frontend-mobile-esta-aplicación)
- [⚙️ Configuración del Backend](#️-configuración-del-backend)
- [📱 Configuración del Frontend Mobile](#-configuración-del-frontend-mobile)
- [🔧 Configuración del Emulador Android](#-configuración-del-emulador-android)
  - [Crear un Virtual Device (AVD)](#crear-un-virtual-device-avd)
  - [Configuración Recomendada del AVD](#configuración-recomendada-del-avd)
- [🚀 Ejecución de la Aplicación](#-ejecución-de-la-aplicación)
  - [Paso 1: Iniciar el Backend](#paso-1-iniciar-el-backend)
  - [Paso 2: Iniciar el Emulador](#paso-2-iniciar-el-emulador)
  - [Paso 3: Ejecutar la Aplicación Mobile](#paso-3-ejecutar-la-aplicación-mobile)

## 🔧 Requisitos Previos

### Hardware Mínimo

| Componente         | Requisito Mínimo       | Recomendado            |
| ------------------ | ---------------------- | ---------------------- |
| **RAM**            | 8 GB                   | 16 GB o más            |
| **Almacenamiento** | 10 GB libres           | 20 GB o más            |
| **Procesador**     | Intel i3 / AMD Ryzen 3 | Intel i5 / AMD Ryzen 5 |
| **Virtualización** | Habilitada en BIOS     | Habilitada en BIOS     |

### Software Requerido

- ✅ **Windows 10/11** (64-bit)
- ✅ **Virtualización habilitada** en BIOS
- ✅ **Conexión a Internet** estable

---

## 🚀 Instalación de Herramientas

### 1. Instalación de Node.js

> [!NOTE] Se requiere Node.js versión 18 o superior,

1. **Descargar Node.js:**
   - Visita [nodejs.org](https://nodejs.org/)
   - Descarga la versión **LTS** (Long Term Support)

2. **Instalar Node.js:**
   - Ejecuta el instalador descargado
   - Sigue las instrucciones del asistente
   - ✅ Asegúrate de marcar "Add to PATH"

3. **Verificar instalación:**
   ```powershell
   node --version
   npm --version
   ```

### 2. Instalación de Git

1. **Descargar Git:**
   - Visita [git-scm.com](https://git-scm.com/)
   - Descarga Git para Windows

2. **Instalar Git:**
   - Ejecuta el instalador
   - Mantén las configuraciones por defecto
   - ✅ Selecciona "Git from the command line and also from 3rd-party software"

3. **Verificar instalación:**
   ```powershell
   git --version
   ```

### 3. Instalación de Android Studio

> [!IMPORTANT] Importante
> Android Studio es esencial para el desarrollo Android, ya que proporciona el SDK y emuladores.

1. **Descargar Android Studio:**
   - Visita [developer.android.com/studio](https://developer.android.com/studio)
   - Descarga la versión más reciente

2. **Instalar Android Studio:**
   - Ejecuta el instalador y manten la configuración por defecto.
   - Durante la instalación, asegúrate de seleccionar el tipo de instalación como `custom` y seleccionar las siguientes opciones:
     - ✅ **Android SDK**
     - ✅ **Android SDK Platform**
     - ✅ **Android Virtual Device**
     - ✅ **Performance (Android Emulator hypervisor driver)**
     - ✅ **Android Virtual Device**
   - Acepta los terminos y condiciones y presiona `Finish`.

3. **Configuración inicial:**
   - Abre Android Studio
   - Completa el asistente de configuración inicial
   - Descarga los componentes adicionales requeridos

4. **Instalar SDK adicionales:**

Usualmente ya viene por defecto pero para verificar que efectivamente están instaladas realiza lo siguiente:

   - Ve a **Customize** > **All settings** > **Languages & Frameworks** > **Android SDK**
   - En la pestaña **SDK Platforms**, instala **al menos una** de las siguientes versiones:
     - ✅ **Android 15 (API Level 35)** - *Recomendado (más reciente)*
     - ✅ **Android 14 (API Level 34)** - *Alternativa compatible*
   - En la pestaña **SDK Tools**, verifica que estén instalados:
     - ✅ **Android SDK Build-Tools**
     - ✅ **Android Emulator**
     - ✅ **Android SDK Platform-Tools**

### 4. Configuración de Variables de Entorno

> [!TIP] 
> Configurar variables de entorno ayuda mucho para que las herramientas se comuniquen correctamente.

1. **Encontrar la ruta del SDK:**
   - En Android Studio: **File** > **Settings** > **Android SDK**
   - Copia la ruta de **Android SDK Location** (generalmente: `C:\Users\[Usuario]\AppData\Local\Android\Sdk`)

2. **Configurar variables de entorno:**
   - Presiona `Win + R`, escribe `sysdm.cpl` y presiona Enter
   - Ve a la pestaña **Opciones Avanzadas** > **Variables de entorno**
   - En **Variables del sistema**, haz clic en **Nuevo**:

   **Variable 1:**
   ```
   Nombre: ANDROID_HOME
   Valor: C:\Users\[TuUsuario]\AppData\Local\Android\Sdk
   ```

   **Variable 2:**
   ```
   Nombre: ANDROID_SDK_ROOT
   Valor: C:\Users\[TuUsuario]\AppData\Local\Android\Sdk
   ```

3. **Actualizar PATH:**
   - En la sección **"Variables del sistema"** (parte inferior), busca la variable **Path**
   - Selecciona **Path** y haz clic en **Editar**
   - Haz clic en **Nuevo** para cada una de las siguientes rutas:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\emulator
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```

4. **Verificar configuración:**
   - **Reinicia tu computadora**
   - Abre PowerShell y ejecuta:
   ```powershell
   adb version
   emulator -version
   ```

### 5. Instalación de Expo CLI

```powershell
npm install -g @expo/cli
```

**Verificar instalación:**
```powershell
expo --version
```

### 6. Instalación de Docker Desktop

> [!NOTE] Nota
> Docker es sumamente importante y necesario para ejecutar el backend de la aplicación.

1. **Descargar Docker Desktop:**
   - Visita [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
   - Descarga Docker Desktop para Windows

2. **Instalar Docker Desktop:**
   - Ejecuta el instalador
   - ✅ Habilita "Use WSL 2 instead of Hyper-V"
   - Reinicia tu computadora

3. **Configurar Docker:**
   - Abre Docker Desktop
   - Completa la configuración inicial
   - Asegúrate de que esté ejecutándose (ícono en la bandeja del sistema)

4. **Verificar instalación:**
   ```powershell
   docker --version
   docker-compose --version
   ```

---

## 📥 Clonación de Repositorios

> [!IMPORTANT] Importante
> Necesitas ambos repositorios (backend y frontend) para que la aplicación funcione completamente.

### Backend (Graph News API)

Crea un nuevo directorio en `C:\Projects\` (puede ser en la ruta de tu prefencia, la ruta propuesta es meramente de ejemplo) y sobre este, clona los respositorios como a continuación se a continuación:

```powershell
# Clonar repositorio del backend
git clone https://github.com/IrminDev/graph-news.git
```

### Frontend Mobile (Esta aplicación)

```powershell
# Clonar repositorio del frontend para mobile
git clone https://github.com/IrminDev/graph-news-mobile.git
```

**Estructura final de directorios:**
```
C:\Projects\
├── graph-news\          # Backend (API + Docker)
│   ├── docker-compose.yml
│   ├── graph-news-backend\
│   └── graph-news-frontend\
└── graph-news-mobile\   # Frontend Mobile (React Native)
    ├── package.json
    ├── App.js
    └── src\
```

---

## ⚙️ Configuración del Backend

1. **Navegar al directorio del backend:**
   ```powershell
   cd C:\Projects\graph-news
   ```

2. **Verificar el archivo docker-compose.yml:**
   - Asegúrate de que exista el archivo `docker-compose.yml`
   - Los servicios necesarios son:
     - ✅ **db** (PostgreSQL)
     - ✅ **neo4j** (Base de datos de grafos)
     - ✅ **graph-news-service** (API Backend)

3. **Construir y levantar los servicios:**
   ```powershell
   # Construir las imágenes
   docker-compose build

   # Levantar solo los servicios necesarios
   docker-compose up db neo4j graph-news-service
   ```

4. **Verificar que los servicios estén ejecutándose:**
   ```powershell
   docker-compose ps
   ```

   **Salida esperada:**
   ```
   NAME                   STATUS          PORTS
   db                     Up              0.0.0.0:5432->5432/tcp
   neo4j                  Up              0.0.0.0:7474->7474/tcp, 0.0.0.0:7687->7687/tcp
   graph-news-backend     Up              0.0.0.0:8080->8080/tcp
   ```

---

## 📱 Configuración del Frontend Mobile

1. **Navegar al directorio del proyecto mobile:**
   ```powershell
   cd C:\Projects\graph-news-mobile
   ```

2. **Instalar dependencias:**
   ```powershell
   npm install
   ```

3. **Configurar variables de entorno en la apliación:**
   
   Encontrar tu IP local:
   ```powershell
   ipconfig | findstr IPv4
   ```
   
   Editar el archivo `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://[TU_IP_LOCAL]:8080
   ```
   
   **Ejemplo:**
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8080
   ```

4. **Verificar configuración de servicios:**
   - Abre `src/services/auth.service.js`
   - Asegúrate de que use la variable de entorno correctamente:
   ```javascript
   const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.182:8080";
   ```

---

## 🔧 Configuración del Emulador Android

### Crear un Virtual Device (AVD)

1. **Abrir AVD Manager:**
   - Abre Android Studio
   - Ve a la opción en la barra lateral izquierda **Projects** y selecciona **More Actions** > **Virtual Device Manager**
   - Haz clic en **Create Virtual Device** (icono de `+`)

2. **Seleccionar dispositivo:**
   - Categoría: **Phone**
   - Dispositivo recomendado: **Pixel 7** o **Pixel 6**
   - Haz clic en **Next**

3. **Seleccionar imagen del sistema:**
   - Pestaña: **Services** selecciona **Google play store**
   - Sistema recomendado de API: **Android 15 (API Level 35)** o **Android 14 (API Level 34)**
   - Haz clic en **Download** si no está instalado

4. **Configurar AVD:**
   - **AVD Name:** `Pixel_7_API_35` (o similar, según la versión seleccionada)
   - Haz clic en **Additional Settings**

### Configuración Recomendada del AVD

- En algunas ocaciones no permite modificar los valores por defecto. En ese caso, dejar los que están por defecto. Sin embargo, si es posible modificarlos, esta es la configuración para el AVD recomendada

| Configuración        | Valor Recomendado   | Descripción                  |
| -------------------- | ------------------- | ---------------------------- |
| **RAM**              | 4096 MB             | Memoria RAM para el emulador |
| **VM Heap**          | 256 MB              | Memoria heap de la VM        |
| **Internal Storage** | 4 GB                | Almacenamiento interno       |
| **SD Card**          | 1 GB                | Tarjeta SD virtual           |
| **Graphics**         | Hardware - GLES 2.0 | Aceleración gráfica          |
| **Multi-Core CPU**   | 4 cores             | Núcleos de CPU               |

5. **Crear y verificar:**
   - Haz clic en **Finish**
   - El AVD aparecerá en la lista
   - Haz clic en el botón **Play** para probarlo

---

## 🚀 Ejecución de la Aplicación

### Paso 1: Iniciar el Backend

```powershell
# Navegar al directorio del backend
cd C:\Projects\graph-news

# Levantar los servicios
docker-compose up db neo4j graph-news-service
```

**Verificar que los servicios estén ejecutándose:**
- ✅ PostgreSQL: `http://localhost:5432`
- ✅ Neo4j Browser: `http://localhost:7474`
- ✅ API Backend: `http://localhost:8080`

### Paso 2: Iniciar el Emulador

**Opción A: Desde Android Studio**
1. Abre Android Studio
2. Ve a la opción en la barra lateral izquierda **Projects** y selecciona **More Actions** > **Virtual Device Manager**
3. Haz clic en **Play** en tu AVD

**Opción B: Desde línea de comandos**
```powershell
# Listar AVDs disponibles
emulator -list-avds

# Iniciar un AVD específico (ajusta el nombre según tu configuración)
emulator @Pixel_7_API_35
```

**Verificar que el emulador esté listo:**
- El emulador debe mostrar la pantalla de inicio de Android
- Puede tardar 2-3 minutos en cargar completamente

### Paso 3: Ejecutar la Aplicación Mobile

```powershell
# Navegar al directorio del proyecto mobile
cd C:\Projects\graph-news-mobile

# Iniciar Expo en modo desarrollo
npm start

# Seleccionar la opción a
a
```
**Salida Esperada:**
```powershell
› Using Expo Go
› Press s │ switch to development build

› Press a │ open Android
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› shift+m │ more tools
› Press o │ open project code in your editor

› Press ? │ show all commands

Logs for your project will appear below. Press Ctrl+C to exit.
› Opening on Android...
› Opening exp://10.100.94.161:8081 on Pixel_7_API_35
› Press ? │ show all commands
Android Bundled 4226ms index.js (1485 modules)
```