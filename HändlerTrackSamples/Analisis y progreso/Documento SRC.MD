# DOCUMENTO DE ESPECIFICACIÓN DE REQUISITOS DE SOFTWARE (SRS)
## Proyecto: Händler TrackSamples
**Versión:** 2.0 (Arquitectura Dinámica y Flujos Avanzados)
**Tipo de Sistema:** WMS (Warehouse Management System) Inteligente
**Arquitectura:** Cliente (Electron/React) - Servidor (FastAPI/Python)

---

## 1. INTRODUCCIÓN

### 1.1 Propósito
El propósito de este documento es definir de manera exhaustiva los requisitos funcionales, no funcionales, reglas de negocio y flujos de trabajo (workflows) críticos para el sistema **Händler TrackSamples**. El sistema automatiza el control de inventarios, la gestión espacial dinámica y la mitigación de riesgos químicos en los laboratorios de Handler S.A.S.

### 1.2 Alcance del Proyecto
El software gestionará el ciclo de vida completo de las muestras, desde su ingreso físico (con capacidad de dosificación/subdivisión), ubicación inteligente basada en compatibilidad química y dimensiones dinámicas (ancho x fondo), hasta su despacho estratégico priorizando fechas de vencimiento. 

### 1.3 Glosario y Acrónimos
* **WMS:** Warehouse Management System (Sistema de Gestión de Almacenes).
* **SGA / GHS:** Sistema Globalmente Armonizado de Clasificación de Productos Químicos.
* **FEFO:** *First Expire, First Out* (Primero en Vencer, Primero en Salir). Estrategia de despacho logístico.
* **Dosificación:** Proceso de dividir una muestra "Bulk" o matriz en múltiples sub-muestras individuales con códigos QR únicos.
* **CoA:** Certificado de Análisis (Documento PDF del proveedor).
* **Swap / Algoritmo de Reorganización Mínima:** Lógica de intercambio de ubicaciones usando muestras inertes para resolver conflictos de espacio por incompatibilidad.

---

## 2. MODELO FÍSICO Y GESTIÓN ESPACIAL (CONFIGURACIÓN DE ANAQUELES)

El sistema debe soportar una infraestructura base de **14 Anaqueles en total**, distribuidos por Línea Comercial e integrados fuertemente con los proveedores específicos.

### 2.1 Distribución Base de Anaqueles
| Línea Comercial | Total | Distribución por Proveedor / Uso Específico |
| :--- | :---: | :--- |
| **Cosmética** | 5 | 3 asignados a **BASF** <br> 1 asignado a **JRS** <br> 1 asignado a **THOR** |
| **Industria** | 3 | 1 asignado a **BASF** <br> 1 asignado a **BASF & THOR** (Mixto) <br> 1 asignado como **BULK** (Muestras grandes pendientes de dispensar) |
| **Farmacéutica** | 6 | 2 asignados a **JRF** <br> 1 asignado a **SUDEEP & GIVAUDAN** (Mixto) <br> 2 asignados a **BASF** <br> 1 asignado a **MEGGLE** |

### 2.2 Configuración Dinámica del Espacio (Grid System)
* **Gestión de Anaqueles:** El sistema debe permitir crear, editar y eliminar anaqueles. **Restricción Crítica:** La eliminación de un anaquel requiere autenticación de Administrador y que el anaquel esté comprobablemente vacío (0 muestras activas).
* **Redimensionamiento de Hileras/Espacios:** El responsable del área debe poder agregar o quitar columnas/filas a la cuadrícula de un anaquel. **Restricción:** No se puede reducir el tamaño de una cuadrícula (ej. pasar de 13 a 10 columnas) si las celdas a eliminar contienen muestras activas.
* **Volumetría Dinámica de Muestras:** Por defecto, una muestra ocupa `1x1` (1 espacio de ancho x 1 espacio de fondo). El sistema debe permitir la configuración de productos que ocupen dimensiones extendidas como `2x1` (2 de ancho x 1 de fondo), `2x2`, etc. La altura física del frasco es ignorada por el sistema lógico de coordenadas, priorizando la planta base (vista superior).

---

## 3. ESTRUCTURA DE MÓDULOS DEL SISTEMA

### Módulo 1: Gestión de Muestras
Centro de control principal que inicia con una vista panorámica (Dashboard general) de los 14 anaqueles.
* CRUD completo de muestras con restricciones lógicas de eliminación (Soft Delete o validación de stock cero).
* **Sub-Módulo 1.1: Control de Compatibilidad.** Motor lógico en el backend que verifica las reglas químicas (Matriz SGA) en segundo plano. Si detecta conflictos espaciales, bloquea la acción, lanza alertas visuales y propone soluciones ejecutando el algoritmo de *Reorganización Mínima*.

### Módulo 2: Movimientos
Módulo operativo fundamental, dividido en dos acciones que alteran el stock real:
* **Entradas (Ingresos):** Registro de mercancía, proceso de dosificación, generación e impresión de códigos QR y ubicación guiada.
* **Despachos (Salidas):** Búsqueda estratégica de productos, consumo de inventario y gestión documental (impresión del Certificado CoA).

### Módulo 3: Alertas Inteligentes
Sistema automatizado que funciona en segundo plano (Background tasks/CRON) para notificar sobre:
1. Stock bajo de productos (según umbrales definidos).
2. Muestras próximas a vencer (Alertas tempranas configurables, ej. 30, 60 o 90 días).
3. Optimización de espacio (Notificaciones al administrador sobre hileras vacías con altas compatibilidades disponibles).

---

## 4. MODELO DE DATOS DE LA MUESTRA (DICCIONARIO DE DATOS)

El sistema impone una regla estricta de estandarización general: **Toda medición de cantidad y volumen de inventario se realiza exclusivamente en Gramos (g).**

| Entidad Lógica | Datos Exigidos (Requisitos Mínimos para el Registro) |
| :--- | :--- |
| **Datos de Negocio** | 1. Nombre del Producto <br> 2. Lote (String alfanumérico asignado por el proveedor) <br> 3. Cantidad en gramos (Decimal, Ej. 25.0) <br> 4. Proveedor (BASF, THOR, JRS, etc.) <br> 5. Línea Comercial (Cosmética, Farma, Industria) <br> 6. Fechas (Manufactura y Vencimiento - Selección manual) |
| **Datos Operativos / Software** | 1. Clase de Peligro SGA (Inflamable, Corrosivo, Oxidante, Tóxico, Inerte, etc.) <br> 2. Dimensiones Físicas del Empaque (Ej. 1x1, 2x1) <br> 3. Código QR (Hash/UUID único generado por el sistema) <br> 4. Ruta del Archivo CoA (Local path del sistema de archivos) |

---

## 5. FLUJOS DE TRABAJO CRÍTICOS (CASOS DE USO DETALLADOS)

Estos flujos definen el comportamiento algorítmico del software en el día a día.

### CU-01: Ingreso de Producto y Dosificación (Workflow de Entrada)
**Objetivo:** Ingresar una matriz de producto, subdividirla si es necesario, etiquetarla y almacenarla en una ubicación segura.

1. **Inicio:** El usuario accede a la vista *Movimientos -> Entradas*.
2. **Registro de Datos Base:** El usuario digita Nombre, Proveedor, Lote, Fechas y selecciona la Clase de Peligro.
3. **Proceso de Dosificación:** * El sistema interactúa preguntando si es un ingreso directo (Bulk) o si requiere dosificación.
   * *Ejemplo Práctico:* Ingresan 100 gramos de la muestra matriz "Cetiol". El usuario indica una dosificación de `4` unidades. El sistema asume/calcula que cada sub-muestra es de `25 gramos`.
   * En la base de datos, el sistema crea internamente 4 registros "hijos" independientes vinculados al lote padre.
4. **Generación de Etiquetas:** El sistema procesa la solicitud y envía a la impresora térmica 4 etiquetas con Códigos QR **ÚNICOS** para identificar cada frasco hijo individualmente.
5. **Gestión Documental (CoA):** El sistema autogenera y sugiere la ruta de red del PDF basándose en el Proveedor, Producto y Lote (Ej. `C:\Certificados\BASF\Cetiol\1234.pdf`). Si la ruta autogenerada no existe o es incorrecta, se habilita un botón nativo "Explorar" para que el usuario seleccione el directorio correcto.
6. **Organización Inteligente (Enrutamiento Espacial):**
   * El sistema filtra los 14 anaqueles por **Línea Comercial** y **Proveedor** (Ej. Busca exclusivamente los 3 anaqueles de Cosmética asignados a BASF).
   * Dentro de los anaqueles válidos, evalúa los espacios (hileras) disponibles que puedan contener la dimensión del frasco (`1x1` o `2x1`).
   * El motor de compatibilidad química (SGA) evalúa a los vecinos adyacentes (izquierda y derecha).
   * El sistema retorna visualmente la ubicación óptima (Ej. *Anaquel BASF Cosmética 1, Nivel 4, Hilera 8*). 
   * El usuario confirma en el software que el guardado físico ha sido completado.

### CU-02: Despacho Estratégico (Workflow de Salida FEFO)
**Objetivo:** Retirar y consumir una muestra del inventario garantizando la rotación del producto más antiguo para evitar caducidades.

1. **Inicio:** El usuario accede a la vista *Movimientos -> Despachos*.
2. **Búsqueda:** El usuario utiliza la barra de búsqueda digitando el Nombre del producto o el Lote, o directamente escaneando el código QR con una pistola lectora.
3. **Sugerencia Estratégica (Lógica FEFO):** Si la búsqueda es manual, el sistema despliega en una tabla todas las muestras disponibles (incluyendo las creadas por dosificación). 
   * *Regla de Negocio FEFO:* El software resalta con un indicador visual prioritario (ej. color verde/icono de estrella) los frascos que están **más próximos a su fecha de vencimiento**, obligando moral y procedimentalmente al operador a elegir esas unidades primero.
4. **Selección:** El usuario selecciona el producto a despachar en el sistema.
5. **Impresión de Despacho:** El sistema genera y envía a imprimir una "Etiqueta de Despacho" física.
6. **Emisión de Certificado (CoA):** Inmediatamente después, el software recupera el `path` del certificado asociado al lote, y abre el documento PDF (o lo envía a la cola de impresión documental) para acompañar la muestra saliente.
7. **Cierre de Transacción:** Se descuentan los gramos totales despachados, el registro individual pasa a estado "Despachado/Agotado", y si era el último frasco en esa hilera, el sistema libera y limpia la celda en el anaquel virtual.

---

## 6. REQUISITOS NO FUNCIONALES ESPECÍFICOS (RNF)

* **RNF-1 (Integridad Matemática de Dosificación):** Durante el proceso de dosificación (CU-01), el backend debe validar que la multiplicación matemática de `(Unidades dosificadas * Gramos por unidad)` jamás exceda la cantidad total original declarada en el bulk.
* **RNF-2 (Escalabilidad de Proveedores/Anaqueles):** El mapeo de Anaqueles a Proveedores no debe estar "quemado" (Hardcoded) en el código fuente. Debe gestionarse mediante una tabla relacional (`anaquel_proveedor`) para que futuros cambios comerciales no requieran una actualización del código del sistema.
* **RNF-3 (Interacción con Sistema de Archivos):** La aplicación cliente en Electron debe configurarse con los permisos de nodo (`nodeIntegration` o `preload` scripts seguros) necesarios para leer el sistema de archivos local de Windows, permitiendo abrir el cuadro de diálogo de selección de archivos y leer los PDFs locales de la unidad (ej. `C:\Certificados\...`).
* **RNF-4 (Previsualización de Cuadrícula):** Cualquier modificación estructural en las dimensiones de un anaquel (Módulo 2.2) debe renderizarse como una "Vista Previa" (Preview 2D) en la interfaz de usuario antes de permitirle al administrador aplicar el cambio destructivo (Commit) a la base de datos MySQL.