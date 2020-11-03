#!/bin/bash

echo "Comenzando curl"

response=$(curl -X POST http://localhost/api/auth/signin -H 'Content-Type: application/json' -d '{"data":{"type": "users", "attributes":{"username":"name","email":"test_no@subject.cl", "password":"password", "confirmPassword":"password"}}}' | jq '.errors[0].error[0]' )

echo "Respuesta de Curl"
echo $response

if [[ $response == '"No user with email"' ]]
then
  echo "success"
  exit 0
else
  echo "failure"
  exit 1
fi
