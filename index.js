const pg = require('pg')
const express = require('express')
const client = new pg.Client(process.env.DATABASE_URL || 'postgresql://localhost:5432/flavors')
const app = express()

app.use(express.json())
app.use(require('morgan')('dev'))

app.get('/', (req, res) => {
  res.send('Welcome to the Flavors API!');
});

app.get('/api/flavors', async (req, res, next) => {
  try{
    const SQL = `SELECT * from flavors ORDER BY id ASC`
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (error) {
    next(error)
  }
})
app.get('/api/flavors/:id', async (req, res, next) => {
  try{
    const SQL = `
      SELECT * from flavors
      WHERE id=$1
      `

    const response = await client.query(SQL, [req.params.id])
    res.send(response.rows)
  } catch (error) {
    next(error)
  }
})
app.post('/api/flavors', async (req, res, next) => {
  try{
    const SQL = `
      INSERT INTO flavors(name)
      VALUES ($1)
      RETURNING *
    `
    const response = await client.query(SQL, [req.body.name])
    res.send(response.rows[0])
  } catch (error) {
    next(error)
  }
})
app.put('/api/flavors/:id', async (req, res, next) => {
  try{
    const SQL = `
      UPDATE flavors
      SET name=$1, is_favorite=$2, updated_at=now()
      WHERE id=$3 RETURNING *
    `
    const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id])
    res.send(response.rows[0])
  } catch (error) {
    next(error)
  }
})
app.delete('/api/flavors/:id', async (req, res, next) => {
  try{
    const SQL = `
      DELETE from flavors
      WHERE id=$1
    `
    const response = await client.query(SQL, [req.params.id])
    res.sendStatus(204)
  } catch (error) {
    next(error)
  }
})

const init = async () => {
  await client.connect()
  console.log('connected to database')

  let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      is_favorite BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `
  await client.query(SQL)
  console.log('tables created')

  SQL = `
    INSERT INTO flavors(name, is_favorite) VALUES('Half Baked', false);
    INSERT INTO flavors(name, is_favorite) VALUES('The Tonight Dough', true);
    INSERT INTO flavors(name, is_favorite) VALUES('Lets Dough Buffalo', false);
    INSERT INTO flavors(name, is_favorite) VALUES('Panda Paws', false);
    INSERT INTO flavors(name, is_favorite) VALUES('Red Velvet', false);
  `
  await client.query(SQL)
  console.log('data seeded')

  const port = process.env.PORT || 3000
  app.listen(port, () => console.log(`listening on port ${port}`))
}
init()