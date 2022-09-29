import express from 'express';
import mysql from 'mysql2/promise'
import bodyParser from 'body-parser'
import dbConfig from './db.config.js';

const app = express()
const port = 3000
const connection = await mysql.createConnection(dbConfig)

app.use(bodyParser.json())

app.post('/api/getTableData', async (req, res) => {
  const tableName = req.body.tableName
  let page = req.body.currentPage ?? 1
  const pageRows = req.body.pageRows
  let filterStatement = req.body.filterStatement
  const sortField = req.body.sortField
  const sortOrder = req.body.sortOrder

  let query = `SELECT * FROM ${tableName}`

  if (filterStatement != '') {
    let arrFilterStatement = filterStatement.split(' ')
    if (arrFilterStatement[0] === 'date') {
      filterStatement = `${arrFilterStatement[0]} ${arrFilterStatement[1]} '${arrFilterStatement[2].slice(1, arrFilterStatement[2].length - 1).split('.').reverse().join('-')}'`
    }
    query = `${query} WHERE ${filterStatement}`;
  }

  if (sortField) {
    query = `${query} ORDER BY ${sortField} ${sortOrder}`;
  }

  const rowsCount = await connection.execute(`SELECT COUNT(1) as cnt FROM (${query}) as qcnt`);
  const totalRows = rowsCount[0][0].cnt;

  let totalPages = Math.ceil(totalRows / pageRows);
  if (page > totalPages) page = totalPages;
  if (pageRows < 0) pageRows = 0;
  let offsetRow = (pageRows * page) - pageRows;
  if (offsetRow < 0) offsetRow = 0;
  query += ` LIMIT ${pageRows} OFFSET ${offsetRow}`;

  try {
    let [rows, fields] = await connection.execute(query)
    rows.forEach((row) => {
      row.date = row.date.toISOString().substring(0, 10).split('-').reverse().join('.')
      row.distance = row.distance.toFixed(1)
    })
    
    let tableFields = fields.map((field) => field.name)
    res.status(200).send({rows, tableFields, totalPages})
  } catch(error) {
    console.log(error)
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});