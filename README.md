# IIC2173 - Entrega 1 - Levantando clusters hechos por estudiantes de arquitectura de sistemas de software

## Método de acceso
El método de acceso elegido fue mediante ssh utilizando una clave, en específico, el archivo ```allsshinstance.pem```, mediante el comando ```ssh -i "allsshinstance.pem" ubuntu@<ipv4 instancia>```.

## Logrado
## Mínimo
#### Backend
- Se envía un mensaje y se registra la fecha, hora y día en que fue enviado, en tiempo real.
- Se exponen endpoints HTTP
- Se implemento loadBalancer utilizando una imagen AMI y AutoScalingGroup, sin embargo, no se implmentó el header (se implmentó pero no funciona)
- El backend tiene dominio .tk.
- El dominio esta asegurado por SSL utilizando la certificación de AWS, y se redirige de http a https (tanto el frontend como el backend se implemento este aspecto).
#### Frontend
- Se utilizo CDN para exponer todo el frontend, por lo que no es necesario correr una instancia aparte. Para lograrlo se impmento CloudFront con S3.
- El frontend se implmentó utilizando una aplicación full React (React + React Router + Axios).
- El frontend hace llamadas a los endpoints HTTP expuestos en el backend.

## Sección variable
#### Caché
- Para implementar caché se levanto un servicio de Redis en una instancia aparte.
- Tanto en local como el producción se conecta directamente a dicha base de datos.
- Un caso de uso fue almacenar los últimos 10 mensajes de la sala, entregarlos rápidamente en el frontend, y luego hacer el resto del request. Para esta metodología se implmento FIFO.
- El otro caso de uso fue guardar en cache y enviar las salas actuales, con un periodo de expiración para este caché.

## No logrado
- Tener un header con información del servidor, si bien se implemento y en teoría funciona, al utilizar loadBalancer este no funciona.
