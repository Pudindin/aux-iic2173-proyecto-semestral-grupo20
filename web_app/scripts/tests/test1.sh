#!/bin/bash

sudo apt-get install jq

echo "Comenzando curl, probando signup correcto"

response=$(curl -X POST http://localhost/api/auth/signup -H 'Content-Type: application/json' -d '{"data":{"type": "users", "attributes":{"username":"name","email":"test1@subject.cl", "password":"password", "confirmPassword":"password"}}}' | jq '.data.attributes.email' )

echo "Respuesta de Curl"
echo $response

if [ $response == '"test1@subject.cl"' ]
then
  echo "success"
  exit 0
else
  echo "failure"
  exit 1
fi
