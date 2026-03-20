# Manual de Usuario - PIRIPI SANTA FE

Bienvenido al sistema automatizado de gestión para talleres mecánicos y gomerías. A continuación se detallan todas las funciones principales de la plataforma.

## 1. Módulo "Dashboard" (Panel Principal)
**Objetivo:** Dar un vistazo rápido a la salud del negocio.
- **Acciones:**
  - Visualizar el ingreso total del día.
  - Ver el resumen de OTs finalizadas.
  - Ver alertas de "bajo stock" en los productos de inventario.

## 2. Módulo "Órdenes de Trabajo" (OTs)
**Objetivo:** Crear y administrar los trabajos grandes de mecánica y gomería.
- **Acciones:**
  - **Nueva OT:** Asigna un cliente, un vehículo, su kilometraje de ingreso y el box en el cual se trabajará. Se puede estimar un costo de mano de obra y agregar repuestos desde el inventario.
  - **Actualizar Estado:** Cambia de "Pendiente" a "En Box", "Finalizado", "Cobrado" o "Cancelado". Al cobrar una OT, pasa directo a la Caja del día.

## 3. Módulo "Trabajos del Día" (Vista Mecánico)
**Objetivo:** Que el operario o mecánico vea sus tareas asignadas fácilmente.
- **Acciones:**
  - Fichar el inicio y fin de una OT cronometrando el tiempo de trabajo.
  - Ver todos los detalles de los vehículos en reparación.

## 4. Módulo "Clientes & Vehículos"
**Objetivo:** Gestión completa del padrón de clientes.
- **Acciones:**
  - Agregar nuevo cliente con nombre, DNI, y teléfono.
  - Vincular uno o más vehículos a dicho cliente incluyendo chapa (patente), color, año y kms actuales.

## 5. Módulo "Inventario / Stock"
**Objetivo:** Mantener la mercadería centralizada y valorizada.
- **Acciones:**
  - Agregar productos por CÓDIGO DE BARRAS, asignarle marca, distribuidor, y precios (costo y venta).
  - Manejo de dos tipos de stock: **UNIT** (Unidades, ej. Llantas) y **VOLUME** (Líquidos medidos en mililitros, ej. Aceite de 200L).
  - Escaneo veloz mediante lector digital o cámara.

## 6. Módulo "Caja del Día"
**Objetivo:** Administrar los ingresos físicos y virtuales del taller.
- **Acciones:**
  - Agrega movimientos de ingreso y egreso de efectivo libres.
  - El sistema suma y resta automáticamente según se cobran OTs o servicios rápidos (Punto de Venta/Gomería Express).
  - **Cierre de Caja:** Al terminar el turno, finaliza el balance indicando el monto esperado contra el monto real físico, marcando la diferencia.

## 7. Módulo "Auditoría" (Exclusivo Programadores/Admin)
**Objetivo:** Control total sobre el sistema, su uso, y su flujo de datos.
- **Acciones:**
  - **Registro de Movimientos:** Un historial inalterable que acusa fecha, hora, usuario y acción específica para cada registro creado, actualizado o borrado en el sistema.
  - **Mapa de Calor:** Expresa mediante un ranking visual en qué partes de la plataforma hacen más clicks los empleados, ayudando a detectar fallas de diseño, botones ignorados, o rutinas recargadas.

---
*Para soporte técnico, contactar con el proveedor de software.*
