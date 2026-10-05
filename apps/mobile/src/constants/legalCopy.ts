/** Textos legales orientados a marketplace de chofer de remplazo (Perú). */

export const TERMS_OF_USE = {
  title: "Términos de Uso",
  body: `Última actualización: agosto 2026.

Estos Términos regulan el uso de la aplicación Hercom, plataforma que conecta a personas que necesitan un chofer de remplazo (pasajeros / titulares del vehículo) con conductores independientes disponibles para conducir el vehículo del usuario.

1. Naturaleza del servicio
Hercom no es una empresa de transporte público ni de taxi. Actúa como intermediario tecnológico. El servicio de conducción lo presta el chofer a título independiente. El vehículo lo aporta el pasajero o titular.

2. Cuentas y elegibilidad
Debes ser mayor de edad y proporcionar información veraz. El acceso mediante Google no te convierte automáticamente en chofer habilitado: para ofertar servicios como chofer debes completar el perfil y requisitos que Hercom exija (documentos, licencia vigente, datos de cobro, etc.).

3. Solicitudes, ofertas y pagos entre partes
El pasajero publica una solicitud y puede aceptar ofertas de choferes. El anticipo u otros pagos entre pasajero y chofer se realizan según lo indicado en la app; Hercom puede cobrar una comisión de intermediación al chofer según las condiciones publicadas.

4. Conducta y seguridad
Está prohibido el uso fraudulento, el acoso, la falsificación de documentos o cualquier actividad ilícita. Debes cumplir las normas de tránsito y las leyes aplicables en Perú. El código de seguridad y las verificaciones en la app son medidas de seguridad; no sustituyen el sentido común ni la diligencia de las partes.

5. Cancelaciones y responsabilidad
Hercom no garantiza disponibilidad permanente de choferes ni resultados de un viaje concreto. En la medida permitida por la ley, Hercom no responde por daños derivados de la relación entre pasajero y chofer, del estado del vehículo o de incidentes en la vía, sin perjuicio de las obligaciones legales que no puedan excluirse.

6. Modificaciones
Podemos actualizar estos Términos. El uso continuado de la app tras la publicación implica aceptación de los cambios.

7. Contacto
Para consultas sobre estos Términos, usa el canal de soporte indicado en la app.`,
};

export const PRIVACY_POLICY = {
  title: "Política de Privacidad",
  body: `Última actualización: agosto 2026.

Esta Política describe cómo Hercom trata datos personales en el marco de su app de chofer de remplazo en Perú.

1. Responsable
Hercom opera la aplicación y trata los datos necesarios para prestar el servicio de intermediación.

2. Datos que podemos tratar
- Identificación y contacto (nombre, correo vía Google, teléfono si lo registras).
- Datos de perfil de chofer (DNI, licencia, documentos, datos de cobro: Yape, Plin, cuentas bancarias).
- Datos de ubicación y direcciones cuando usas GPS, Places o defines origen/destino.
- Datos de viajes, ofertas, anticipos, códigos de seguridad y comunicaciones en la app.
- Datos técnicos del dispositivo necesarios para el funcionamiento y la seguridad.

3. Finalidades
- Crear y gestionar tu cuenta.
- Conectar pasajeros y choferes, gestionar solicitudes, ofertas y estados del servicio.
- Facilitar el anticipo y la comisión de plataforma.
- Seguridad, prevención de fraude y soporte.
- Mejorar el servicio y cumplir obligaciones legales.

4. Base y compartición
Tratamos datos para ejecutar el contrato de uso de la plataforma y, cuando corresponda, por interés legítimo o consentimiento. Podemos compartir datos necesarios con la otra parte del viaje (p. ej. datos de cobro del chofer para el anticipo), con proveedores tecnológicos (auth, mapas, hosting) y con autoridades cuando la ley lo exija.

5. Conservación y seguridad
Conservamos los datos el tiempo necesario para las finalidades indicadas y obligaciones legales. Aplicamos medidas razonables de seguridad; ningún sistema es 100 % invulnerable.

6. Tus derechos
Puedes solicitar acceso, rectificación, actualización u oposición al tratamiento conforme a la normativa peruana de protección de datos, a través del soporte de la app.

7. Ubicación y permisos
La ubicación se solicita para funciones concretas (origen, navegación, ayuda). Puedes denegar o revocar permisos desde el sistema del teléfono; algunas funciones dejarán de estar disponibles.

8. Cambios
Podemos actualizar esta Política. La versión vigente estará disponible en la app.`,
};

/** Autorización que el chofer firma digitalmente al postular (Ley 29733). */
export const DRIVER_PERSONAL_DATA_CONSENT = {
  version: "2026-10",
  checkboxLabel:
    "Firmo digitalmente y autorizo a Hercom el tratamiento de mis datos personales para evaluar mi registro como chofer.",
  fullText: `Autorización de tratamiento de datos personales — Chofer

Al marcar la casilla de consentimiento en el formulario de alta, el postulante otorga su firma digital y autoriza a Hercom a tratar sus datos personales, de acuerdo con la Ley N.° 29733, Ley de Protección de Datos Personales, y su reglamento.

Datos que autorizo entregar y tratar
- Identidad: DNI, nombres y apellidos, sexo y fecha de nacimiento (declarados por el postulante; Hercom los verifica con RENIEC).
- Documentos de conducción y laborales: brevete, fotos o PDF del documento, CUL y récord de conductor.
- Datos de contacto y de operación: correo, teléfono, zona de trabajo y, si corresponde, datos de cobro.

Finalidad
Evaluar mi postulación como chofer de remplazo, verificar identidad y documentos, crear y mantener el perfil si soy aceptado, prevenir fraude y cumplir obligaciones legales.

Conservación
Los datos se conservan mientras dure la evaluación, la relación con la plataforma y los plazos legales aplicables.

Declaración
Declaro que la información y los documentos que entrego son verdaderos y me corresponden. Entiendo que esta casilla equivale a mi firma digital de autorización y que, sin ella, Hercom no puede recibir ni evaluar mi solicitud.

Puedo ejercer mis derechos de acceso, rectificación, cancelación y oposición a través del soporte de la app.`,
};
