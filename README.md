# Servicio Backend de SnapMsg

## Tabla de Contenidos
- [Introducción](#introducción)
- [Aspectos más Desafiantes](#aspectos-más-desafiantes)
- [Prerrequisitos](#prerrequisitos)
- [Biblioteca de Pruebas](#biblioteca-de-pruebas)
- [Comandos de Docker](#comandos-de-docker)
  - [Construir la Imagen Docker](#construir-la-imagen-docker)
  - [Ejecutar la Base de Datos](#ejecutar-la-base-de-datos)
  - [Ejecutar la Imagen del Servicio](#ejecutar-la-imagen-del-servicio)
- [Mejoras](#mejoras)

## Introducción
Este proyecto implementa un servicio backend para SnapMsg, una plataforma para crear y compartir mensajes cortos. El servicio proporciona una API RESTlike para publicar y recuperar snaps, con persistencia de datos en MongoDB y manejo de errores siguiendo el estándar RFC 7807.

## Aspectos más Desafiantes
Trabajar con mongodb y los tests e2e porque nunca lo había hecho antes.

MongoDB decidí usarlo para explorar esta nueva tecnología y pensando en que el tp grupal va a ser twitter entonces se adapta mejor una base no relacional, de mongo lo que más me costó fue el uso de los Modelos.

Con respecto a los tests e2e me llevó bastante tiempo porque me costó mockear el modelo de mongo y hacer que los test pasen. Estoy más acostumbrada a hacer tests unitarios.

## Prerrequisitos
- Node.js v18.x o posterior
- npm v9.x o posterior
- Docker v20.x o posterior
- Docker Compose v1.29.x o posterior

## Biblioteca de Pruebas
Este proyecto utiliza Jest para las pruebas. Puede encontrar la documentación de Jest aquí: [Documentación de Jest](https://jestjs.io/)
También se utilizó supertest para los test de integración. Puede encontrar la documentación de supertest aquí: [Documentación de supertest](https://github.com/ladjs/supertest#readme)

## Comandos de Docker

### Construir la Imagen Docker
```
docker build -t snapmsg-backend .
```

### Uso con Docker Compose

#### Levantar la app y la base de datos
```
docker-compose up --build -d
```

#### Ejecutar solo la Base de Datos
```
docker-compose up -d mongodb
```

## Desarrollo en local

```
npm i
npm run dev
```
Dentro del npm run dev se levanta la base de datos con docker-compose y se ejecuta el servicio con nodemon en nuestro host.

## Ejecutar los tests
```
npm run test
```
Al igual que en el desarrollo en local, se levanta la base de datos con docker-compose y se ejecutan los tests.

## Proceso de pensamiento

Empecé con node.js y TS porque es lo que más conozco y me siento más cómoda. Luego decidí usar express porque es un framework que ya he usado y me resulta fácil de usar.
Para la base de datos decidí usar mongo por lo explicado anteriormente.
Para la app empecé con una estructura básica de routes y controllers solamente, luego pensé en agregar la capa de servicios y repositorios para separar responsabilidades, pero al ser una app tan pequeña decidí saltarme los servicios y llamar directamente a los repositorios desde los controllers (esto se que no es lo mejor pero para esta app tan pequeña me pareció suficiente).

En cuanto a docker fuí directamente con docker-compose para levantar la base de datos y la app juntas.


## Mejoras
- Agregar tests unitarios
- Agregar servicios para separar responsabilidades
