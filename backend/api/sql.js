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
    const isMatch = await bcrypt.compare(password, user.password);
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
        "INSERT INTO usuarios (username, password) VALUES (?, ?)",
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



//dashboard functions

export async function getEmailsReceived(timeframe) {
    let connection = null;
    try {
        connection = await connectToDB();
        const query = `
            SELECT COUNT(*) AS count
            FROM emails
            WHERE received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const [results, _] = await connection.query(query, [timeframe]);
        return results[0].count;
    } catch (error) {
        console.log(error);
    } finally {
        if (connection !== null) {
            connection.end();
            console.log('Connection closed successfully');
        }
    }
}

export async function getEmailsAnswered(timeframe) {
    let connection = null;
    try {
        connection = await connectToDB();
        const query = `
            SELECT COUNT(*) AS count
            FROM emails
            WHERE answered_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const [results, _] = await connection.query(query, [timeframe]);
        return results[0].count;
    } catch (error) {
        console.log(error);
    } finally {
        if (connection !== null) {
            connection.end();
            console.log('Connection closed successfully');
        }
    }
}

export async function getPendingEmails() {
    let connection = null;
    try {
        connection = await connectToDB();
        const query = `
            SELECT COUNT(*) AS count
            FROM emails
            WHERE answered_at IS NULL
        `;
        const [results, _] = await connection.query(query);
        return results[0].count;
    } catch (error) {
        console.log(error);
    } finally {
        if (connection !== null) {
            connection.end();
            console.log('Connection closed successfully');
        }
    }
}

export async function getAvgResponseTime() {
    let connection = null;
    try {
        connection = await connectToDB();
        const query = `
            SELECT AVG(TIMESTAMPDIFF(SECOND, received_at, answered_at)) AS avg_time
            FROM emails
            WHERE answered_at IS NOT NULL
        `;
        const [results, _] = await connection.query(query);
        return results[0].avg_time;
    } catch (error) {
        console.log(error);
    } finally {
        if (connection !== null) {
            connection.end();
            console.log('Connection closed successfully');
        }
    }
}

export async function getMedianResponseTime() {
    let connection = null;
    try {
        connection = await connectToDB();
        const query = `
            SELECT TIMESTAMPDIFF(SECOND, received_at, answered_at) AS response_time
            FROM emails
            WHERE answered_at IS NOT NULL
            ORDER BY response_time
        `;
        const [results, _] = await connection.query(query);
        const times = results.map(row => row.response_time);
        const mid = Math.floor(times.length / 2);
        return times.length % 2 !== 0 ? times[mid] : (times[mid - 1] + times[mid]) / 2;
    } catch (error) {
        console.log(error);
    } finally {
        if (connection !== null) {
            connection.end();
            console.log('Connection closed successfully');
        }
    }
}

export async function getVolumeTrend() {
    let connection = null;
    try {
        connection = await connectToDB();
        const query = `
            SELECT DATE(received_at) AS date, COUNT(*) AS count
            FROM emails
            GROUP BY DATE(received_at)
            ORDER BY date
        `;
        const [results, _] = await connection.query(query);
        return results.map(row => ({ date: row.date, count: row.count }));
    } catch (error) {
        console.log(error);
    } finally {
        if (connection !== null) {
            connection.end();
            console.log('Connection closed successfully');
        }
    }
}

export async function getResponseRateTrend() {
    let connection = null;
    try {
        connection = await connectToDB();
        const query = `
            SELECT DATE(received_at) AS date,
                   COUNT(*) AS total,
                   SUM(CASE WHEN answered_at IS NOT NULL THEN 1 ELSE 0 END) AS answered
            FROM emails 
            GROUP BY DATE(received_at)
            ORDER BY date
        `;
        const [results, _] = await connection.query(query);
        return results.map(row => ({
            date: row.date,
            response_rate: row.total > 0 ? (row.answered / row.total) * 100 : 0
        }));
    } catch (error) {
        console.log(error);
    } finally {
        if (connection !== null) {
            connection.end();
            console.log('Connection closed successfully');
        }
    }
} 

export async function getBusiestHours() {
    let connection = null;
    try {
        connection = await connectToDB();
        const query = `
            SELECT HOUR(received_at) AS hour, COUNT(*) AS count
            FROM emails
            GROUP BY HOUR(received_at)
            ORDER BY count DESC
            LIMIT 3
        `;
        const [results, _] = await connection.query(query);
        return results.map(row => ({ hour: row.hour, count: row.count }));
    } catch (error) {
        console.log(error);
    } finally {
        if (connection !== null) {
            connection.end();
            console.log('Connection closed successfully');
        }
    }
}