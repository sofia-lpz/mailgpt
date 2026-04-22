import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

async function connectToDB() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
    });
}

export async function verifyPassword(username, password) {
    const user = await getUserByUsername(username);
    if (!user) {
        throw new Error('User not found');
    }
    const isMatch = await bcrypt.compare(password, user.contraseña);
    if (!isMatch) {
        throw new Error('Invalid password');
    }
    return user;
}

export async function getUserByUsername(username) {
    const conn = await connectToDB();
    const [rows] = await conn.execute(
        "SELECT * FROM usuarios WHERE username = ?",
        [username]
    );
    conn.end();
    return rows[0];
}

export async function register(username, password) {
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
        throw new Error('User already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const conn = await connectToDB();
    const [result] = await conn.execute(
        "INSERT INTO usuarios (username, contraseña) VALUES (?, ?)",
        [username, hashedPassword]
    );
    conn.end();
    return { id: result.insertId, username };
}

export async function getEmbeddings()
{
  let connection = null
  try
  {
    connection = await connectToDB()

    const query = `
SELECT *
FROM embeddings
    `;

    const [results, _] = await connection.query(query)

    console.log(`${results.length} rows returned`)
    return results
  }
  catch(error)
  {
    console.log(error)
  }
  finally
  {
    if(connection !== null)
    {
      connection.end()
      console.log('Connection closed successfuly')
    }
  }
}

export async function storeEmbedding(embedding, metadata, source) {
  let connection = null;
  try {
    connection = await connectToDB();
    const query = `
      INSERT INTO embeddings (vector, metadata, source)
      VALUES (?, ?, ?)
    `;
    const [results, _] = await connection.query(query, [
      JSON.stringify(embedding),
      JSON.stringify(metadata),
      source
    ]);
    console.log(`Embedding stored with ID ${results.insertId}`);
    return results.insertId;
  } catch (error) {
    console.log(error);
  } finally {
    if (connection !== null) {
      connection.end();
      console.log('Connection closed successfully');
    }
  }
}