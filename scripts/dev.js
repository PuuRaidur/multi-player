import concurrently from 'concurrently';

concurrently([
  {
    name: 'server',
    command: `cd server && npm run start`,
    prefixColor: 'blue'
  },
  {
    name: 'client',
    command: `cd client && npm run dev`,
    prefixColor: 'green'
  },
]);