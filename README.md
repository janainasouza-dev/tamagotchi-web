# 🐣 Tamagotchi Web

Um Tamagotchi para jogar no navegador. Frontend em **HTML, CSS e JavaScript puros**; backend em **Node.js + Express + SQLite**.

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org) 18 ou superior.

```bash
cd backend
npm install
npm start
```

Depois abra **http://localhost:3001** no navegador.

> Não abra o `index.html` direto pelo arquivo: ele precisa ser servido pelo backend.

Para desenvolver com reinício automático: `npm run dev`.

## Como o jogo funciona

| Status | Cai por hora | Ação que recupera |
|---|---|---|
| 🍖 Saciedade | −5 | 🍎 Alimentar: +30 |
| 😊 Felicidade | −3 | 🎮 Brincar: +25 (gasta 10 de energia) |
| ⚡ Energia | −2 | 😴 Dormir: +40 |

- Os status continuam caindo **mesmo com o navegador fechado**: o servidor calcula o tempo passado a cada consulta.
- Com energia abaixo de 10, o pet está cansado demais para brincar.
- O emoji e a animação mudam conforme o humor do pet.
- O pet fica salvo no navegador (`localStorage`) pelo id, e no servidor (SQLite).

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/test` | Testa se o backend está no ar |
| POST | `/api/pet` | Cria um pet. Corpo: `{ "name": "Bibo" }` |
| GET | `/api/pet/:id` | Busca o pet com os status atualizados |
| POST | `/api/pet/:id/feed` | Alimenta |
| POST | `/api/pet/:id/play` | Brinca |
| POST | `/api/pet/:id/sleep` | Dorme |

## Estrutura

```
tamagotchi-web/
├── .gitignore
├── README.md
└── backend/
    ├── package.json
    ├── server.js        # rotas da API + serve o frontend
    ├── database.js      # SQLite e regras do jogo (decaimento e ações)
    └── public/
        ├── index.html
        ├── style.css
        └── app.js
```

## Ideias para o futuro

- Pet que fica doente ou "morre" se for negligenciado
- Idade e evolução
- Mais ações (banho, remédio) e mini-games
- Vários pets por usuário
