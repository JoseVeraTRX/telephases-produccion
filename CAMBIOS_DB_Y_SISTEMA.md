# 📊 CAMBIOS EN BASE DE DATOS Y SISTEMA DE USUARIOS - TELEPHASES

## 🗄️ **ESTRUCTURA ACTUAL DE LA BASE DE DATOS**

### **Tablas Principales:**

#### 1. **Tabla `usuario`**
```sql
CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primer_nombre VARCHAR(50) NOT NULL,
    segundo_nombre VARCHAR(50),
    primer_apellido VARCHAR(50) NOT NULL,
    segundo_apellido VARCHAR(50),
    numero_documento VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    genero CHAR(1) CHECK (genero IN ('M', 'F', 'O')),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rol_id INTEGER NOT NULL DEFAULT 2, -- 1=Admin, 2=Paciente
    activo BOOLEAN DEFAULT TRUE
);
```

#### 2. **Tabla `tipo_examen`**
```sql
CREATE TABLE tipo_examen (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    unidad VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE
);
```

#### 3. **Tabla `examen`**
```sql
CREATE TABLE examen (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuario(id),
    tipo_examen_id INTEGER NOT NULL REFERENCES tipo_examen(id),
    titulo VARCHAR(100) NOT NULL,
    valor VARCHAR(50) NOT NULL,
    unidad VARCHAR(20),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observaciones TEXT,
    datos_adicionales JSONB,
    activo BOOLEAN DEFAULT TRUE,
    estado_salud_id INTEGER REFERENCES estado_salud(id)
);
```

#### 4. **Tabla `estado_salud`** (NUEVA)
```sql
CREATE TABLE estado_salud (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    emoji VARCHAR(10),
    color VARCHAR(7),
    descripcion TEXT,
    nivel_urgencia INTEGER NOT NULL
);
```

#### 5. **Tabla `rango_referencia`** (NUEVA)
```sql
CREATE TABLE rango_referencia (
    id SERIAL PRIMARY KEY,
    tipo_examen_id INTEGER NOT NULL REFERENCES tipo_examen(id),
    estado_salud_id INTEGER NOT NULL REFERENCES estado_salud(id),
    valor_minimo DECIMAL(10,2),
    valor_maximo DECIMAL(10,2),
    unidad VARCHAR(20),
    orden INTEGER NOT NULL
);
```

## 🔄 **SISTEMA DE USUARIOS Y ROLES**

### **Tipos de Usuario:**
- **Admin (rol_id = 1)**: Puede registrar pacientes y realizar exámenes para cualquier paciente
- **Paciente (rol_id = 2)**: Usuario regular que puede tener exámenes asociados

### **Flujo de Autenticación:**
1. **Login Admin**: `camilo.rendonvi@amigo.edu.co` / `123456789`
2. **Dashboard Admin**: 3 opciones principales
3. **Registro de Pacientes**: Crea nuevos usuarios con rol_id = 2
4. **Exámenes**: Se asocian al paciente seleccionado, no al admin

## 📝 **SISTEMA DE LOGS Y AUDITORÍA**

### **Logs de Usuario (Paciente):**
```sql
-- Ejemplo de cómo se guardan los exámenes de un paciente
INSERT INTO examen (
    usuario_id,           -- ID del PACIENTE (no del admin)
    tipo_examen_id,       -- Tipo de examen (TEMPERATURE, BLOOD_PRESSURE, etc.)
    titulo,               -- "Temperatura", "Presión Arterial", etc.
    valor,                -- "36.5", "120/80", "98", etc.
    unidad,               -- "°C", "mmHg", "%", etc.
    observaciones,        -- Comentarios adicionales
    datos_adicionales,    -- JSON con datos específicos del dispositivo
    estado_salud_id       -- Estado calculado automáticamente
) VALUES (
    '9d638945-76f9-4e30-8a6a-464eedddbb5d',  -- ID del paciente
    1,                    -- ID del tipo de examen
    'Temperatura',
    '36.5',
    '°C',
    'Medición automática',
    '{"temperatura": 36.5, "metodo": "BLE_automatico"}',
    1                     -- Estado "NORMAL"
);
```

### **Datos Adicionales por Tipo de Examen:**

#### **Temperatura:**
```json
{
    "temperatura": 36.5,
    "metodo": "BLE_automatico",
    "timestamp": 1753748030987
}
```

#### **Presión Arterial:**
```json
{
    "sistolica": 120,
    "diastolica": 80,
    "pulso": 72,
    "metodo": "BLE_automatico",
    "timestamp": 1753748030987
}
```

#### **Oxímetro:**
```json
{
    "spo2": 98,
    "frecuencia_cardiaca": 73,
    "pi": 8.0,
    "metodo": "BLE_automatico",
    "timestamp": 1753748030987
}
```

#### **Glucosa:**
```json
{
    "glucosa": 120,
    "fecha_medicion": "29/07/2025 19:13",
    "numero_registro": 1,
    "dia": 29,
    "mes": 7,
    "año": 2025,
    "hora": 19,
    "minuto": 13,
    "metodo": "BLE_automatico",
    "timestamp": 1753748030987
}
```

## 🎯 **SISTEMA DE ESTADOS DE SALUD**

### **Estados Predefinidos:**
```sql
INSERT INTO estado_salud VALUES
(1, 'NORMAL', 'Normal', '✅', '#4CAF50', 'Valores dentro del rango normal', 1),
(2, 'PRECAUCION_LEVE', 'Precaución Leve', '⚠️', '#FF9800', 'Valores ligeramente fuera del rango', 2),
(3, 'PRECAUCION_MODERADA', 'Precaución Moderada', '🔶', '#FF5722', 'Valores moderadamente fuera del rango', 3),
(4, 'CRITICO', 'Crítico', '🚨', '#F44336', 'Valores críticos que requieren atención inmediata', 4);
```

### **Rangos de Referencia:**
```sql
-- Temperatura
INSERT INTO rango_referencia VALUES (1, 1, 1, 36.0, 37.5, '°C', 1);  -- Normal
INSERT INTO rango_referencia VALUES (2, 1, 2, 37.6, 38.0, '°C', 2);  -- Precaución Leve
INSERT INTO rango_referencia VALUES (3, 1, 3, 38.1, 39.0, '°C', 3);  -- Precaución Moderada
INSERT INTO rango_referencia VALUES (4, 1, 4, 39.1, 50.0, '°C', 4);  -- Crítico

-- Presión Arterial (Sistólica)
INSERT INTO rango_referencia VALUES (5, 2, 1, 90, 120, 'mmHg', 1);   -- Normal
INSERT INTO rango_referencia VALUES (6, 2, 2, 121, 140, 'mmHg', 2);  -- Precaución Leve
INSERT INTO rango_referencia VALUES (7, 2, 3, 141, 160, 'mmHg', 3);  -- Precaución Moderada
INSERT INTO rango_referencia VALUES (8, 2, 4, 161, 300, 'mmHg', 4);  -- Crítico

-- Oxímetro
INSERT INTO rango_referencia VALUES (9, 3, 1, 95, 100, '%', 1);      -- Normal
INSERT INTO rango_referencia VALUES (10, 3, 2, 90, 94, '%', 2);     -- Precaución Leve
INSERT INTO rango_referencia VALUES (11, 3, 3, 85, 89, '%', 3);     -- Precaución Moderada
INSERT INTO rango_referencia VALUES (12, 3, 4, 0, 84, '%', 4);      -- Crítico
```

## 🔧 **FUNCIONES Y TRIGGERS AUTOMÁTICOS**

### **Función para Calcular Estado:**
```sql
CREATE OR REPLACE FUNCTION calcular_estado_examen(
    p_tipo_examen_nombre VARCHAR,
    p_valor DECIMAL
) RETURNS INTEGER AS $$
DECLARE
    v_estado_id INTEGER;
BEGIN
    SELECT rr.estado_salud_id INTO v_estado_id
    FROM rango_referencia rr
    JOIN tipo_examen te ON rr.tipo_examen_id = te.id
    JOIN estado_salud es ON rr.estado_salud_id = es.id
    WHERE te.nombre = p_tipo_examen_nombre
    AND p_valor BETWEEN rr.valor_minimo AND rr.valor_maximo
    ORDER BY es.nivel_urgencia ASC
    LIMIT 1;
    
    RETURN COALESCE(v_estado_id, 1); -- Default a NORMAL si no encuentra
END;
$$ LANGUAGE plpgsql;
```

### **Trigger Automático:**
```sql
CREATE OR REPLACE FUNCTION actualizar_estado_examen() RETURNS TRIGGER AS $$
DECLARE
    v_tipo_examen_nombre VARCHAR;
    v_valor_decimal DECIMAL;
BEGIN
    -- Obtener nombre del tipo de examen
    SELECT nombre INTO v_tipo_examen_nombre
    FROM tipo_examen WHERE id = NEW.tipo_examen_id;
    
    -- Parsear valor según el tipo de examen
    CASE v_tipo_examen_nombre
        WHEN 'BLOOD_PRESSURE', 'BLOOD_PRESSURE_SYSTOLIC', 'BLOOD_PRESSURE_DIASTOLIC' THEN
            v_valor_decimal := CAST(SPLIT_PART(NEW.valor, '/', 1) AS DECIMAL);
        ELSE
            BEGIN
                v_valor_decimal := CAST(NEW.valor AS DECIMAL);
            EXCEPTION
                WHEN OTHERS THEN
                    v_valor_decimal := 0;
            END;
    END CASE;
    
    -- Calcular y asignar estado
    NEW.estado_salud_id := calcular_estado_examen(v_tipo_examen_nombre, v_valor_decimal);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_estado
    BEFORE INSERT OR UPDATE ON examen
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_estado_examen();
```

## 📊 **VISTA PARA CONSULTAS SIMPLIFICADAS**

```sql
CREATE VIEW examen_con_estado AS
SELECT 
    e.id,
    e.titulo,
    e.valor,
    e.unidad,
    e.fecha_creacion,
    e.observaciones,
    te.nombre as tipo_examen_nombre,
    te.descripcion as tipo_examen_descripcion,
    e.datos_adicionales,
    es.codigo as estado_codigo,
    es.nombre as estado_nombre,
    es.emoji as estado_emoji,
    es.color as estado_color,
    es.descripcion as estado_descripcion,
    es.nivel_urgencia as estado_nivel_urgencia
FROM examen e
INNER JOIN tipo_examen te ON e.tipo_examen_id = te.id
LEFT JOIN estado_salud es ON e.estado_salud_id = es.id
WHERE e.activo = TRUE;
```

## 🔍 **CONSULTAS ÚTILES**

### **Ver todos los pacientes:**
```sql
SELECT id, primer_nombre, primer_apellido, numero_documento, email, fecha_registro
FROM usuario 
WHERE rol_id = 2 
ORDER BY fecha_registro DESC;
```

### **Ver exámenes de un paciente específico:**
```sql
SELECT * FROM examen_con_estado 
WHERE usuario_id = '9d638945-76f9-4e30-8a6a-464eedddbb5d'
ORDER BY fecha_creacion DESC;
```

### **Ver estadísticas de estados de salud:**
```sql
SELECT 
    es.nombre as estado,
    es.emoji,
    COUNT(*) as cantidad
FROM examen e
JOIN estado_salud es ON e.estado_salud_id = es.id
GROUP BY es.id, es.nombre, es.emoji
ORDER BY es.nivel_urgencia;
```

## 🚀 **CÓMO FUNCIONA EL SISTEMA COMPLETO**

### **1. Registro de Paciente:**
- Admin crea paciente → Se inserta en `usuario` con `rol_id = 2`
- Se genera un `id` UUID único para el paciente

### **2. Realización de Examen:**
- Admin selecciona paciente → Se pasa `patientId` a la pantalla de examen
- Dispositivo BLE toma medición → Se procesa en Android
- Se envía al backend con `patientId` → Se guarda en `examen` con `usuario_id = patientId`
- Trigger automático calcula estado → Se asigna `estado_salud_id`

### **3. Consulta de Exámenes:**
- Admin puede ver exámenes de cualquier paciente
- Paciente solo ve sus propios exámenes (futuro)
- Se usa la vista `examen_con_estado` para obtener información completa

### **4. Estados Automáticos:**
- Cada examen se evalúa automáticamente según rangos predefinidos
- Se asigna color, emoji y nivel de urgencia
- Permite identificar rápidamente valores anormales

---

**Fecha de actualización:** 29 de Julio, 2025  
**Versión del sistema:** 2.0  
**Estado:** Producción en VPS (198.46.189.221:3001) 