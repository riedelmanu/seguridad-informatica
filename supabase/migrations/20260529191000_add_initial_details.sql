-- =============================================================
-- Migración: Cargar descripción (detail) inicial para cada alumno
-- Las descripciones se almacenan en texto plano.
-- =============================================================
SET search_path TO public, extensions;

UPDATE students SET detail = 'Estudiante de Ingeniería en Sistemas. Destacado en programación de algoritmos complejos y análisis de complejidad.' WHERE email = 'juan.perez@example.com';
UPDATE students SET detail = 'Estudiante de Ingeniería Electrónica. Ayudante de cátedra de Física II con interés en sistemas de IoT.' WHERE email = 'maria.gomez@example.com';
UPDATE students SET detail = 'Estudiante de Licenciatura en Computación. Participante activo en torneos nacionales de robótica móvil.' WHERE email = 'carlos.lopez@example.com';
UPDATE students SET detail = 'Estudiante de Ingeniería en Sistemas. Interesada en desarrollo frontend adaptativo y accesibilidad web.' WHERE email = 'ana.martinez@example.com';
UPDATE students SET detail = 'Estudiante de Ingeniería Electrónica. Promedio destacado en automatización industrial y lógica digital.' WHERE email = 'luis.fernandez@example.com';
UPDATE students SET detail = 'Estudiante de Doctorado en Computación. Beca interna de investigación sobre modelos generativos.' WHERE email = 'sofia.ramirez@example.com';
UPDATE students SET detail = 'Estudiante de Ingeniería en Sistemas. Apasionado por las metodologías ágiles de desarrollo de software.' WHERE email = 'diego.torres@example.com';
UPDATE students SET detail = 'Estudiante de Licenciatura en Computación. Especialización académica en seguridad perimetral de redes.' WHERE email = 'valentina.ruiz@example.com';
UPDATE students SET detail = 'Estudiante de Ingeniería en Sistemas. Colaborador en el centro de estudiantes y tutor de alumnos ingresantes.' WHERE email = 'pedro.sanchez@example.com';
UPDATE students SET detail = 'Estudiante de Bioingeniería. Ganadora de mención especial por software de visualización de resonancias magnéticas.' WHERE email = 'lucia.herrera@example.com';
UPDATE students SET detail = 'Estudiante de Ingeniería Electrónica. Proyecto final enfocado en microcontroladores de ultra bajo consumo.' WHERE email = 'miguel.castro@example.com';
UPDATE students SET detail = 'Estudiante de Ingeniería en Sistemas. Interés académico en bases de datos a escala global y cloud native.' WHERE email = 'camila.ortiz@example.com';
UPDATE students SET detail = 'Estudiante de Licenciatura en Computación. Proyecto de tesis sobre protocolos criptográficos seguros post-cuánticos.' WHERE email = 'jorge.diaz@example.com';
UPDATE students SET detail = 'Estudiante de Ingeniería en Sistemas. Desarrolladora fullstack con conocimientos de arquitecturas serverless.' WHERE email = 'paula.morales@example.com';
UPDATE students SET detail = 'Estudiante de Ingeniería Electrónica. Interés en filtros digitales y procesamiento de señales biomédicas.' WHERE email = 'andres.vega@example.com';
