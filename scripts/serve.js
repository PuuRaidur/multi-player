import concurrently from 'concurrently';

const port = process.env.SNAKE_PORT || '80';

concurrently([
  {
    name: 'server',
    command: `cd server && npm run start`,
    prefixColor: 'blue'
  },
  {
    name: 'client',
    command: `cd client && npm run build && npx serve -s dist -l ${port}`,
    prefixColor: 'green'
  },
]);