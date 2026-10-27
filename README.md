Instalação usando npm:
npm install hono@latest @hono/node-server@latest @hono/zod-validator@latest zod@latest
npm install -D typescript@latest tsx@latest @types/node@latest


Site para registrar uma chave de api, somente email e nome do usuário, cadastrado rapido:
https://newsapi.org/register

puxada de 'NEWS_API_KEY' no .env


Execução:
npm start 

Cadastrado de usuário:
curl -i -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Fulano","email":"fulano@email.com","password":"12345678"}'

Logando:
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fulano@email.com","password":"12345678"}'


Salvando o token em uma variavel:
(No fish)
set TOKEN (curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fulano@email.com","password":"12345678"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')

  echo $TOKEN

(Bash)
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fulano@email.com","password":"12345678"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')

echo $TOKEN


Retornando preferências:
curl http://localhost:3000/preferences \
  -H "Authorization: Bearer $TOKEN"

Mudando preferências:
curl -X PUT http://localhost:3000/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"science","country":"us"}'


Consultando noticias:
curl http://localhost:3000/news \
  -H "Authorization: Bearer $TOKEN"

