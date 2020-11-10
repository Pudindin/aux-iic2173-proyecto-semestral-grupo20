# IIC2173 - Entrega 3

![](https://travis-ci.org/Pudindin/aux-iic2173-proyecto-semestral-grupo20.svg?branch=master)

## Consideraciones generales
Documentación...

La api se puede encontrar en [open-chat-api.tk](https://open-chat-api.tk).

El frontend se puede encontrar en [open-chat.ml](https://open-chat.ml).

El backend corre en instancias EC2 con un ELB y AutoScalingGroup.

La base de datos se encuentra en DRS.

El caché está en Elasticaché con Redis.

El frontend está almacenado en un bucket de S3 y se consume desde un CDN.


## Método de acceso
El método de acceso elegido fue mediante ssh utilizando una clave, en específico, el archivo ```allsshinstance.pem``` para las instancias de backend y base de datos.

Para acceder al backend con ssh:

`ssh -i "allsshinstance.pem" ubuntu@ec2-18-217-26-21.us-east-2.compute.amazonaws.com`.


## Requisitos

### Parte mínima

#### Autenticación

##### RF1: logrado
Se utiliza GoogleAuth

##### RF2: logrado
Se implementa OAuth mediante la API de GoogleAuth

##### RF3: logrado


##### RF4 (opcional): no implementado

#### CI/CD

##### RF1: logrado
El flujo se encuentra [aquí](https://github.com/IIC3745-2020-2/grupo07/blob/master/docs/FlujoCICD.png) y se utiliza commitlint y standard-version para semantic versioning

##### RF2: logrado
Se utiliza travis.

##### RF3: logrado
Se implementan 3 tests, que se encuentran en `scripts/tests/`

##### RF4: logrado
Para las variables de entorno en la EC2, estas se almacenan en un archivo .env almacenado en una AMI.

#### Documentación

##### RF1: logrado
Se encuentra [aquí](https://github.com/IIC3745-2020-2/grupo07/blob/master/docs/ComponentesAppE2.png)

##### RF2: logrado
Se encuentra [aquí](https://github.com/IIC3745-2020-2/grupo07/blob/master/docs/FlujoApp.png)

##### RF3: logrado
Se encuentra [aquí](https://github.com/IIC3745-2020-2/grupo07/blob/master/docs/FlujoCICD.png)


### Sección variable

#### CRUD admin

##### RF1: logrado

##### RF2: logrado

##### RF3: logrado


#### CSS/JS injection

##### RF1: logrado

##### RF2: logrado

##### RF3: logrado
