# ENVFILE TEMPLATE
## .env
```
DB_USERNAME=<databaseusername>
DB_PASSWORD=<databaseuserpassword>
DB_NAME=<databasename>
DB_HOST=<database instance ip>
JWT_SECRET=<secret hash>
HASH_ID=<secret hash>
AWS_ACCES_KEY=<mailer acces>
AWS_SECRET_KEY=<aws secret key>
REDIS_IP=<redis instance ip>
REDIS_PORT=<redis port>
```

## pg-init-scripts/database.env
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_MULTIPLE_DATABASES=<databasename>,<databaseusername>,<databaseuserpassword>
```

# Para semantic versioning

Se debe ejecutar (sin docker):
`yarn add --save-dev @commitlint/config-conventional @commitlint/cli`

Cada commit debe contener un type (qué tipo de cambio se ejecuta) y un subject (descripción del cambio).

## Opciones de type:

fix — to indicate a bug fix (PATCH) ex . v0.0.1

feat — to indicate a new feature (MINOR) ex. v0.1.0

chore — for updates that do not require a version bump (.gitignore, comments, etc.)

docs — for updates to the documentation

BREAKING CHANGE — regardless of type, indicates a Major release (MAJOR) ex. v1.0.0

Ejemplo:

`git commit -m "fix: Fixed bug on foo"`
